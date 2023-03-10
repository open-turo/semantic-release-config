import openapi from "~/openapi";

describe("openapi", () => {
  test("adds gradle-semantic-release-plugin, semantic-release/git, and semantic-release-openapi plugins", () => {
    const gradlePlugin = openapi.plugins[3];
    const openApiPlugin = openapi.plugins[4];
    const semanticReleasePlugin = openapi.plugins[5];
    expect(gradlePlugin).toMatchSnapshot();
    expect(openApiPlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });
});
