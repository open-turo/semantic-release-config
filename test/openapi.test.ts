import { execSync } from "node:child_process";
import { describe, expect, test, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

describe("openapi", () => {
  test("adds gradle-semantic-release-plugin, semantic-release/npm, semantic-release/git, and semantic-release-openapi plugins", async () => {
    vi.mocked(execSync).mockImplementation(() => "");
    const { default: openapi } = await import("~/openapi");
    const gradlePlugin = openapi.plugins[4];
    const npmPlugin = openapi.plugins[5];
    const openApiPlugin = openapi.plugins[6];
    const semanticReleasePlugin = openapi.plugins[7];
    expect(gradlePlugin).toMatchSnapshot();
    expect(npmPlugin).toMatchSnapshot();
    expect(openApiPlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });
});
