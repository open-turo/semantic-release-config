import npm from "~/openapi";

describe("openapi", () => {
  test("adds gradle-semantic-release-plugin, semantic-release/git, and semantic-release-openapi plugins", () => {
    const gradlePlugin = npm.plugins[3];
    const openApiPlugin = npm.plugins[4];
    const semanticReleasePlugin = npm.plugins[5];
    expect(gradlePlugin).toMatchSnapshot();
    expect(openApiPlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });
});
