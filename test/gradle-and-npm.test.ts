import { execSync } from "node:child_process";
import { describe, expect, test, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

describe("gradle-and-npm", () => {
  test("adds gradle-semantic-release-plugin, semantic-release/npm, and semantic-release/git plugins", async () => {
    vi.mocked(execSync).mockImplementation(() => "");
    const { default: gradleAndNpm } = await import("~/gradle-and-npm");
    const gradlePlugin = gradleAndNpm.plugins[4];
    const npmPlugin = gradleAndNpm.plugins[5];
    const openApiPlugin = gradleAndNpm.plugins[6];
    const semanticReleasePlugin = gradleAndNpm.plugins[7];
    expect(gradlePlugin).toMatchSnapshot();
    expect(npmPlugin).toMatchSnapshot();
    expect(openApiPlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });
});
