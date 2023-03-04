import { pluginsThatGoAtTheEnd } from "~/_config";

import config from "./";

/**
 * Given a semantic release plugin config, return the plugin name
 * @param p Plugin config
 * @returns Plugin name
 */
const getPluginName = (p: typeof config.plugins[number]) => {
  if (typeof p === "string") {
    return p;
  }
  return p[0];
};

/**
 * Semantic release configuration for NPM projects. It extends the default configuration by publishing to NPM
 * and creating a Pull Request with version updates in files like package.json
 */
export = {
  ...config,
  plugins: [
    ...config.plugins.filter(
      (p) => !pluginsThatGoAtTheEnd.has(getPluginName(p))
    ),
    [
      "@semantic-release/npm",
      {
        tarballDir: "pack",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "package-lock.json", "README.md", "yarn.lock"],
        message:
          "ci(release): ${nextRelease.version} <% nextRelease.channel !== 'next' ? print('[skip ci]') : print('') %>\n\n${nextRelease.notes}",
      },
    ],
    ...config.plugins.filter((p) =>
      pluginsThatGoAtTheEnd.has(getPluginName(p))
    ),
  ],
};
