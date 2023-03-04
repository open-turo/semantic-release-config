import baseConfig from "~/index";

type SemanticReleasePlugin =
  | readonly [string, Record<string, unknown>]
  | string;

// We have a set of plugins that ideally should run after every other plugin to guarantee that things like publishing to NPM
// already happen before these plugins run
export const pluginsThatGoAtTheEnd = new Set([
  "@semantic-release/exec",
  "semantic-release-fotingo",
]);

/**
 * Return the configuration for the @semantic-release/git plugin to commit
 * changes in the specified assets
 * @param assets List of assets to commit
 */
export function semanticReleaseGit(assets: string[]): SemanticReleasePlugin {
  return [
    "@semantic-release/git",
    {
      assets,
      message:
        "ci(release): ${nextRelease.version} <% nextRelease.channel !== 'next' ? print('[skip ci]') : print('') %>\n\n${nextRelease.notes}",
    },
  ];
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
export function createPreset(plugins: SemanticReleasePlugin[]) {
  return {
    ...baseConfig,
    plugins: [
      ...baseConfig.plugins.filter(
        (p) => !pluginsThatGoAtTheEnd.has(getPluginName(p))
      ),
      ...plugins,
      ...baseConfig.plugins.filter((p) =>
        pluginsThatGoAtTheEnd.has(getPluginName(p))
      ),
    ],
  };
}
