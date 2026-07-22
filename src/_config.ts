import type { VerifyConditionsContext } from "semantic-release";

import micromatch from "micromatch";
import { execSync } from "node:child_process";
import * as process from "node:process";

import baseConfig from "~/index.js";

export type SemanticReleasePlugin =
  | InlineSemanticReleasePlugin
  | readonly [string, Record<string, unknown>]
  | string;

interface InlineSemanticReleasePlugin {
  verifyConditions: (
    pluginConfig: Record<string, unknown>,
    context: VerifyConditionsContext,
  ) => void;
}

// We have a set of plugins that ideally should run after every other plugin to guarantee that things like publishing to NPM
// already happen before these plugins run
const pluginsThatGoAtTheEnd = new Set(["@semantic-release/exec"]);

/**
 * `open-turo/actions-release/semantic-release` overrides GITHUB_REF to the PR's head branch name (instead of
 * the pull_request merge ref) so semantic-release can match the branch against configured release branches.
 * npm trusted publishing (OIDC provenance) also reads GITHUB_REF, but expects it to match what GitHub's OIDC
 * token attests to - the merge ref for pull_request-triggered runs - so the override makes `npm publish`
 * fail provenance verification for PR-triggered prereleases. The action exposes the un-overridden ref via
 * GITHUB_REF_VALUE; restore it before any plugin (e.g. @semantic-release/npm) publishes.
 */
export const restoreGithubReferenceForNpmProvenance: InlineSemanticReleasePlugin =
  {
    verifyConditions(_pluginConfig, context) {
      if (process.env.GITHUB_REF_VALUE) {
        context.env.GITHUB_REF = process.env.GITHUB_REF_VALUE;
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
