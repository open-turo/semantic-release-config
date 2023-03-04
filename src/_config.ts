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
export function semanticReleaseGit(assets: string[]) {
  return [
    "@semantic-release/git",
    {
      assets,
      message:
        "ci(release): ${nextRelease.version} <% nextRelease.channel !== 'next' ? print('[skip ci]') : print('') %>\n\n${nextRelease.notes}",
    },
  ];
}
