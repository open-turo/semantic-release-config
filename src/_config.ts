import micromatch from "micromatch";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as process from "node:process";

import baseConfig from "~/index.js";

export type SemanticReleasePlugin =
  | InlineSemanticReleasePlugin
  | readonly [string, Record<string, unknown>]
  | string;

interface InlineSemanticReleasePlugin {
  publish?: () => Promise<void>;
  verifyConditions?: () => void;
}

interface PullRequestApiResponse {
  merge_commit_sha?: string;
}

interface PullRequestEventPayload {
  pull_request?: {
    number?: number;
  };
}

// We have a set of plugins that ideally should run after every other plugin to guarantee that things like publishing to NPM
// already happen before these plugins run
const pluginsThatGoAtTheEnd = new Set(["@semantic-release/exec"]);

/**
 * `open-turo/actions-release/semantic-release` overrides GITHUB_REF (to the PR's head branch name) and
 * GITHUB_SHA (to the PR's head commit) so semantic-release can match the branch against configured release
 * branches. npm trusted publishing (OIDC provenance) also reads both, but expects them to match what
 * GitHub's OIDC token attests to for pull_request-triggered runs: the merge ref (`refs/pull/<n>/merge`) and
 * the SHA of the ephemeral merge commit it currently points to - not the PR's head branch/commit. The
 * override therefore makes `npm publish` fail provenance verification for PR-triggered prereleases.
 *
 * The action exposes the un-overridden ref via GITHUB_REF_VALUE, so GITHUB_REF is restored eagerly in
 * verifyConditions - it's just a branch name, there's nothing to go stale.
 *
 * GITHUB_SHA is trickier: the action doesn't expose the original value, and GitHub recomputes
 * `refs/pull/<n>/merge` asynchronously, so any snapshot of it (e.g. the `pull_request.merge_commit_sha`
 * webhook payload at GITHUB_EVENT_PATH) can go stale between when it's read and when npm actually publishes,
 * especially right after a force-push. There's no way to eliminate that race entirely from here, only shrink
 * it: fetch the PR's *current* merge_commit_sha from the GitHub API as a `publish` hook - guaranteed (by
 * this plugin being first in the array) to run right before @semantic-release/npm's own publish, i.e. as
 * late as possible, after every other plugin's verifyConditions/analyzeCommits/verifyRelease/generateNotes/
 * prepare has already run.
 *
 * This mutates `process.env` directly rather than the `context.env` passed into the hook: semantic-release
 * deep-clones `context` for every plugin step (see `normalize.js`'s `validator`), so mutating `context.env`
 * only ever affects a throwaway copy and is invisible to every later step, including `@semantic-release/npm`'s
 * publish. `process.env` is the one thing that isn't cloned, and `context.env` starts out as that same
 * object, so writing here is what actually persists into later steps' clones.
 */
export const restoreGithubReferenceForNpmProvenance: InlineSemanticReleasePlugin =
  {
    async publish() {
      if (
        process.env.GITHUB_EVENT_NAME !== "pull_request" ||
        !process.env.GITHUB_EVENT_PATH ||
        !process.env.GITHUB_REPOSITORY ||
        !process.env.GITHUB_TOKEN
      ) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const event = JSON.parse(
        readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"),
      ) as PullRequestEventPayload;
      const prNumber = event.pull_request?.number;
      if (!prNumber) {
        return;
      }

      try {
        // This plugin only ever runs inside open-turo/actions-release/semantic-release, which pins
        // Node to 24.16.0 regardless of what a consuming package declares as its own engines.node
        // floor, so `fetch` is always available here even though it predates this package's floor.
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        const response = await fetch(
          `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${String(prNumber)}`,
          {
            headers: {
              accept: "application/vnd.github+json",
              authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            },
          },
        );
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const pr = (await response.json()) as PullRequestApiResponse;
        if (pr.merge_commit_sha) {
          process.env.GITHUB_SHA = pr.merge_commit_sha;
        }
      } catch {
        // Best effort: if the GitHub API is unreachable, leave GITHUB_SHA as-is rather than
        // failing the whole release over a provenance nicety.
      }
    },
    verifyConditions() {
      if (process.env.GITHUB_REF_VALUE) {
        process.env.GITHUB_REF = process.env.GITHUB_REF_VALUE;
      }
    },
  };

/**
 * Return the configuration for the @semantic-release/git plugin to commit
 * changes in the specified assets
 * @param assets List of assets to commit
 * @param requireCI to control when commit requires ci check
 */
export function semanticReleaseGit(
  assets: string[],
  requireCI = false,
): SemanticReleasePlugin | undefined {
  const message = requireCI
    ? "ci(release): ${nextRelease.version}\n\n${nextRelease.notes}"
    : "ci(release): ${nextRelease.version} <% nextRelease.channel !== 'next' ? print('[skip ci]') : print('') %>\n\n${nextRelease.notes}";

  // Split refs/heads/branch-name to branch-name. If running in a pull request, then we don't care
  const branch = process.env.GITHUB_REF?.split("/").pop();
  if (!branch || micromatch.isMatch(branch || "", baseConfig.branches)) {
    return [
      "@semantic-release/git",
      {
        assets,
        message,
      },
    ];
  }
  return undefined;
}

/**
 * Given a semantic release plugin config, return the plugin name
 * @param plugin Plugin config
 * @returns Plugin name
 */
const isPluginTuple = (
  plugin: SemanticReleasePlugin,
): plugin is readonly [string, Record<string, unknown>] =>
  Array.isArray(plugin);

const getPluginName = (plugin: SemanticReleasePlugin): string | undefined => {
  if (typeof plugin === "string") {
    return plugin;
  }
  return isPluginTuple(plugin) ? plugin[0] : undefined;
};

/**
 * Conditionally create a semantic release plugin if any of the specified files exist in the Git repository
 * @param files List of files to check
 * @param plugin Plugin to create
 */
export function createPluginIfFilesExist(
  files: string[],
  plugin: SemanticReleasePlugin,
): SemanticReleasePlugin | undefined {
  return files.some((file) => doesGitRepoContainFile(file))
    ? plugin
    : undefined;
}

/**
 * Create a preset that extends the default configuration ensuring that
 * plugins that need to stay at the end remain there
 * @param plugins List of plugin configs for the preset
 */
export function createPreset(
  plugins: Array<SemanticReleasePlugin | undefined>,
) {
  return {
    ...baseConfig,
    plugins: [
      restoreGithubReferenceForNpmProvenance,
      ...baseConfig.plugins.filter((p) => {
        const name = getPluginName(p);
        return name === undefined || !pluginsThatGoAtTheEnd.has(name);
      }),
      ...plugins.filter(
        (plugin): plugin is SemanticReleasePlugin => plugin !== undefined,
      ),
      ...baseConfig.plugins.filter((p) => {
        const name = getPluginName(p);
        return name !== undefined && pluginsThatGoAtTheEnd.has(name);
      }),
    ],
  };
}

/**
 * Check if a file is in the Git repository
 * @param filePath Path to the file
 * @param repoPath Path to the Git repository
 */
function doesGitRepoContainFile(filePath: string, repoPath = process.cwd()) {
  try {
    // eslint-disable-next-line sonarjs/os-command
    execSync(`git cat-file -e HEAD:${filePath}`, {
      cwd: repoPath,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}
