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
 * @param requireCI to controll when commit requires ci check
 */
export function semanticReleaseGit(
  assets: string[],
  requireCI = false,
): SemanticReleasePlugin | undefined {
  const message = requireCI
    ? "ci(release): ${nextRelease.version}\n\n${nextRelease.notes}"
    : "ci(release): ${nextRelease.version} <% nextRelease.channel !== 'next' ? print('[skip ci]') : print('') %>\n\n${nextRelease.notes}";

  // Split refs/heads/branch-name to branch-name. I running in a pull request, then we don't care
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
