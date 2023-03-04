import npm from "~/gradle";

describe("gradle", () => {
  test("adds gradle-semantic-release-plugin and semantic-release/git plugins", () => {
    const gradlePlugin = npm.plugins[3];
    const semanticReleasePlugin = npm.plugins[4];
    expect(gradlePlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });
});
