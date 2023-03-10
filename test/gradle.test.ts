import gradle from "~/gradle";

describe("gradle", () => {
  test("adds gradle-semantic-release-plugin and semantic-release/git plugins", () => {
    const gradlePlugin = gradle.plugins[3];
    const semanticReleasePlugin = gradle.plugins[4];
    expect(gradlePlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });
});
