import { execSync } from "node:child_process";

jest.mock("node:child_process", () => ({
  execSync: jest.fn(),
}));

describe("openapi", () => {
  test("adds gradle-semantic-release-plugin, semantic-release/npm, semantic-release/git, and semantic-release-openapi plugins", async () => {
    jest.mocked(execSync).mockImplementation(() => "");
    const openapi = await import("~/openapi");
    const gradlePlugin = openapi.plugins[3];
    const npmPlugin = openapi.plugins[4];
    const openApiPlugin = openapi.plugins[5];
    const semanticReleasePlugin = openapi.plugins[6];
    expect(gradlePlugin).toMatchSnapshot();
    expect(npmPlugin).toMatchSnapshot();
    expect(openApiPlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });
});
