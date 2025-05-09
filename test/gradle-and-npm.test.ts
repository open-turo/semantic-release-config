import { execSync } from "node:child_process";

jest.mock("node:child_process", () => ({
  execSync: jest.fn(),
}));

describe("gradle-and-npm", () => {
  test("adds gradle-semantic-release-plugin, semantic-release/npm, and semantic-release/git plugins", async () => {
    (execSync as jest.Mock).mockImplementation(() => {});
    const openapi = await import("~/gradle-and-npm");
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
