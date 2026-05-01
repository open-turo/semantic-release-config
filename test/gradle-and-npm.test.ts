import { execSync } from "node:child_process";
import { describe, expect, test, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

describe("gradle-and-npm", () => {
  test("adds gradle-semantic-release-plugin, semantic-release/npm, and semantic-release/git plugins", async () => {
    vi.mocked(execSync).mockImplementation(() => "");
    const { default: gradleAndNpm } = await import("~/gradle-and-npm");
    const gradlePlugin = gradleAndNpm.plugins[3];
    const npmPlugin = gradleAndNpm.plugins[4];
    const openApiPlugin = gradleAndNpm.plugins[5];
    const semanticReleasePlugin = gradleAndNpm.plugins[6];
    expect(gradlePlugin).toMatchSnapshot();
    expect(npmPlugin).toMatchSnapshot();
    expect(openApiPlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });
});
