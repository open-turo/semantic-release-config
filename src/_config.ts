// We have a set of plugins that ideally should run after every other plugin to guarantee that things like publishing to NPM
// already happen before these plugins run
export const pluginsThatGoAtTheEnd = new Set([
  "@semantic-release/exec",
  "semantic-release-fotingo",
]);
