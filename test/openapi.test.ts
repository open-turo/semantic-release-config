describe("openapi", () => {
  test("adds gradle-semantic-release-plugin, semantic-release/git, and semantic-release-openapi plugins", async () => {
    const openapi = await import("~/openapi");
    const gradlePlugin = openapi.plugins[3];
    const openApiPlugin = openapi.plugins[4];
    const semanticReleasePlugin = openapi.plugins[5];
    expect(gradlePlugin).toMatchSnapshot();
    expect(openApiPlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });
});
