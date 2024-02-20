describe("npm", () => {
  afterEach(() => {
    delete process.env.GITHUB_REF;
  });

  test("adds npm and semantic-release/git plugins", async () => {
    const npm = await import("~/npm");
    expect(npm.plugins).toHaveLength(6);
    const npmPlugin = npm.plugins[3];
    const semanticReleasePlugin = npm.plugins[4];
    expect(npmPlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });

  test.each(["ref/heads/test", "ref/pulls/1/merge"])(
    "does not add npm and semantic-release/git plugins when not running on a default branch",
    async (branch) => {
      process.env.GITHUB_REF = branch;
      const npm = await import("~/npm");
      expect(npm.plugins).toHaveLength(5);
    },
  );
});
