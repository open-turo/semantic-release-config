import { execSync } from "node:child_process";
import * as process from "node:process";

import micromatch from "micromatch";

import baseConfig from "~/index";

export type SemanticReleasePlugin =
  | readonly [string, Record<string, unknown>]
  | string;

// We have a set of plugins that ideally should run after every other plugin to guarantee that things like publishing to NPM
// already happen before these plugins run
const pluginsThatGoAtTheEnd = new Set(["@semantic-release/exec"]);

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
const getPluginName = (plugin: SemanticReleasePlugin) => {
  if (typeof plugin === "string") {
    return plugin;
  }
  return plugin[0];
};

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
      ...baseConfig.plugins.filter(
        (p) => !pluginsThatGoAtTheEnd.has(getPluginName(p)),
      ),
      ...plugins.filter(
        (plugin): plugin is SemanticReleasePlugin => plugin !== undefined,
      ),
      ...baseConfig.plugins.filter((p) =>
        pluginsThatGoAtTheEnd.has(getPluginName(p)),
      ),
    ],
  };
}
