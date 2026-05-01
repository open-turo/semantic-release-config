import { createPreset, semanticReleaseGit } from "~/_config";

/**
 * Semantic release configuration preset for Gradle projects. It adds the gradle-semantic-release-plugin and
 * ensures that the gradle.properties file gets committed
 */
// eslint-disable-next-line import/no-default-export
export default createPreset([
  "gradle-semantic-release-plugin",
  semanticReleaseGit(["gradle.properties", "README.md"], true),
]);
