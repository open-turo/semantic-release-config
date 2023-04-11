import {
  createPreset,
  semanticReleaseGit,
  SemanticReleasePlugin,
} from "~/_config";

const openApiSpecGlob = "spec/**/*.yaml";

const semanticReleaseOpenApi = (
  apiSpecFiles: string[]
): SemanticReleasePlugin => {
  return [
    "@aensley/semantic-release-openapi",
    {
      apiSpecFiles,
    },
  ];
};

/**
 * Semantic release configuration preset for OpenAPI projects. It adds the gradle-semantic-release-plugin,
 * the semantic-release-openapi plugin, and ensures that the gradle.properties file and swagger spec gets committed
 */
export = createPreset([
  // Ideally we would be able to use some sort of composite preset since OpenAPI doesn't necessarily mean gradle.
  // But we use the OpenAPI gradle plugin to generate specs and gradle to publish artifacts so this plugin needs to be defined here.
  "gradle-semantic-release-plugin",
  semanticReleaseOpenApi([openApiSpecGlob]),
  semanticReleaseGit(["gradle.properties", "README.md", openApiSpecGlob]),
]);
