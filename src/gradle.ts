import { createPreset, semanticReleaseGit } from "~/_config";

/**
 * Semantic release configuration preset for Gradle projects. It adds the gradle-semantic-release-plugin and
 * ensures that the gradle.properties file gets committed
 */
export = createPreset([
  "gradle-semantic-release-plugin",
  semanticReleaseGit(["gradle.properties", "README.md"]),
]);
