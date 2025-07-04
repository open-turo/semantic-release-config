/**
 * A `.releaserc.json` cannot specify `/gradle` and `/npm` as separate plugins and run both.
 * This file allows us to run both behind `/gradleAndNpm`.
 */

import {
  createPluginIfFilesExist,
  createPreset,
  semanticReleaseGit,
} from "~/_config";

/**
 * Semantic release configuration preset for projects that release with Gradle and NPM.
 */
export = createPreset([
  createPluginIfFilesExist(
    ["build.gradle", "build.gradle.kts"],
    "gradle-semantic-release-plugin",
  ),
  createPluginIfFilesExist(
    ["package.json"],
    [
      "@semantic-release/npm",
      {
        tarballDir: "pack",
      },
    ],
  ),
  semanticReleaseGit([
    "README.md",
    "gradle.properties",
    "package-lock.json",
    "package.json",
    "yarn.lock",
  ]),
]);
