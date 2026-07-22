import type { VerifyConditionsContext } from "semantic-release";

import { template } from "lodash";
import { execSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createPluginIfFilesExist,
  type SemanticReleasePlugin,
} from "~/_config";

interface GitPluginConfig {
  assets: string[];
  message: string;
}

function isGitPluginConfig(object: unknown): object is GitPluginConfig {
  return (
    typeof object === "object" &&
    object !== null &&
    "assets" in object &&
    "message" in object
  );
}

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

describe("config", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let config: typeof import("~/_config");

  beforeEach(async () => {
    config = await import("~/_config");
  });

  describe("createPreset", () => {
    let preset: { plugins: SemanticReleasePlugin[] };
    beforeEach(() => {
      preset = config.createPreset(["a", "b"]);
    });
    test("creates a preset including the default config", () => {
      expect(preset).toMatchSnapshot();
    });

    test("@semantic-release/exec is the last plugin", async () => {
      const { default: npm } = await import("~/npm");
      const lastPlugin = npm.plugins.at(-1);
      expect(Array.isArray(lastPlugin) && lastPlugin[0]).toBe(
        "@semantic-release/exec",
      );
    });
  });

  describe("restoreGithubReferenceForNpmProvenance", () => {
    afterEach(() => {
      delete process.env.GITHUB_REF_VALUE;
    });

    test("restores GITHUB_REF from GITHUB_REF_VALUE so npm provenance matches the OIDC-attested ref", () => {
      process.env.GITHUB_REF_VALUE = "refs/pull/273/merge";
      const context: Partial<VerifyConditionsContext> = {
        env: { GITHUB_REF: "refs/heads/feat/some-branch" },
      };

      config.restoreGithubReferenceForNpmProvenance.verifyConditions(
        {},
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        context as VerifyConditionsContext,
      );

      expect(context.env?.GITHUB_REF).toBe("refs/pull/273/merge");
    });

    test("leaves GITHUB_REF untouched when GITHUB_REF_VALUE is not set", () => {
      const context: Partial<VerifyConditionsContext> = {
        env: { GITHUB_REF: "refs/heads/main" },
      };

      config.restoreGithubReferenceForNpmProvenance.verifyConditions(
        {},
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        context as VerifyConditionsContext,
      );

      expect(context.env?.GITHUB_REF).toBe("refs/heads/main");
    });
  });

  describe("semanticReleaseGit", () => {
    test.each(["next", undefined])(
      "semantic-release/@git generates the right commit message for channel %s",
      (channel) => {
        const assets = ["a"];
        const gitPlugin = config.semanticReleaseGit(assets);
        const pluginConfig =
          gitPlugin &&
          Array.isArray(gitPlugin) &&
          isGitPluginConfig(gitPlugin[1])
            ? gitPlugin[1]
            : {
                assets: [],
                message: "",
              };

        expect(pluginConfig.assets).toBe(assets);
        expect(
          template(pluginConfig.message || "")({
            nextRelease: {
              channel: channel,
              notes: "This is a test release",
              version: "test",
            },
          }),
        ).toMatchSnapshot();
      },
    );
  });

  describe("createPluginIfFilesExist", () => {
    beforeEach(() => {
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === "string" && cmd.includes("package.json")) {
          throw new Error("fatal: Not a valid object name HEAD:package.json");
        }
        return "";
      });
    });

    test("returns undefined if the repo doesn't contain the file", () => {
      expect(createPluginIfFilesExist(["package.json"], "a")).toBeUndefined();
    });

    test("returns the plugin if the repo contains any of the files", () => {
      expect(createPluginIfFilesExist(["package.json", "yarn.lock"], "a")).toBe(
        "a",
      );
    });
  });
});
