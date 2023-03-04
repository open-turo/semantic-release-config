import { createPreset, semanticReleaseGit } from "~/_config";

/**
 * Semantic release configuration for NPM projects. It extends the default configuration by publishing to NPM
 * and creating a Pull Request with version updates in files like package.json
 */
export = createPreset([
  [
    "@semantic-release/npm",
    {
      tarballDir: "pack",
    },
  ],
  semanticReleaseGit([
    "package.json",
    "package-lock.json",
    "README.md",
    "yarn.lock",
  ]),
]);
