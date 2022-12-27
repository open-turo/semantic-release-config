import config from "./";

/**
 * Semantic release configuration for NPM projects. It extends the default configuration by publishing to NPM
 * and creating a Pull Request with version updates in files like package.json
 */
export = {
  ...config,
  plugins: [
    ...config.plugins,
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
  ],
};
