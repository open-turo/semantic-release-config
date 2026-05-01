import { describe, expect, test, vi } from "vitest";

import type { SemanticReleasePlugin } from "~/_config";

describe("npm", () => {
  test("adds npm and semantic-release/git plugins", async () => {
    const { config: npm } = await import("~/npm");
    expect(npm.plugins).toHaveLength(6);
    const npmPlugin = npm.plugins[3];
    const semanticReleasePlugin = npm.plugins[4];
    expect(npmPlugin).toMatchSnapshot();
    expect(semanticReleasePlugin).toMatchSnapshot();
  });

  test.each(["ref/heads/test", "ref/pulls/1/merge"])(
    "does not add npm and semantic-release/git plugins when not running on a default branch (%s)",
    async (branch) => {
      vi.resetModules();
      vi.doMock("~/_config", async (importOriginal) => {
        const original = await importOriginal<Record<string, unknown>>();
        return {
          ...original,
          semanticReleaseGit: (): SemanticReleasePlugin | undefined =>
            undefined,
        };
      });
      process.env.GITHUB_REF = branch;
      const { config: npm } = await import("~/npm");
      expect(npm.plugins).toHaveLength(5);
      delete process.env.GITHUB_REF;
    },
  );
});
