import npm from "~/npm";

describe("npm", () => {
  test("adds npm and semantic-release/git plugins", () => {
    const npmPlugin = npm.plugins[3];
    const semanticReleasePlugin = npm.plugins[4];
    expect(npmPlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });
});
