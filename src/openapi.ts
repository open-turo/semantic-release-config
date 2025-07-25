import {
  createPluginIfFilesExist,
  createPreset,
  semanticReleaseGit,
  type SemanticReleasePlugin,
} from "~/_config";

const openApiSpecGlob = "spec/**/*.yaml";

const semanticReleaseOpenApi = (
  apiSpecFiles: string[],
): SemanticReleasePlugin => {
  return [
    "semantic-release-openapi",
    {
      apiSpecFiles,
    },
  ];
};

/**
 * Semantic release configuration preset for OpenAPI projects. It adds the semantic-release-openapi plugin,
 * and conditionally the npm and gradle plugins based on the presence of relevant files.
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
  semanticReleaseOpenApi([openApiSpecGlob]),
  semanticReleaseGit([
    "README.md",
    "gradle.properties",
    "package-lock.json",
    "package.json",
    "yarn.lock",
    openApiSpecGlob,
  ]),
]);
