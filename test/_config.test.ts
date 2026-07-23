import { template } from "lodash";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, test, vi } from "vitest";

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

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
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
    // These tests run inside real CI, which sets GITHUB_EVENT_NAME/GITHUB_EVENT_PATH/etc. on the
    // ambient process.env for its own pull_request-triggered run. Clear them before every test (not
    // just after) so that ambient state never leaks into a test that doesn't set them itself.
    beforeEach(() => {
      delete process.env.GITHUB_REF_VALUE;
      delete process.env.GITHUB_REF;
      delete process.env.GITHUB_EVENT_NAME;
      delete process.env.GITHUB_EVENT_PATH;
      delete process.env.GITHUB_REPOSITORY;
      delete process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_SHA;
      vi.mocked(readFileSync).mockReset();
      vi.stubGlobal("fetch", vi.fn());
    });

    test("restores process.env.GITHUB_REF from GITHUB_REF_VALUE so npm provenance matches the OIDC-attested ref", () => {
      process.env.GITHUB_REF = "refs/heads/feat/some-branch";
      process.env.GITHUB_REF_VALUE = "refs/pull/273/merge";

      config.restoreGithubReferenceForNpmProvenance.verifyConditions?.();

      expect(process.env.GITHUB_REF).toBe("refs/pull/273/merge");
    });

    test("leaves process.env.GITHUB_REF untouched when GITHUB_REF_VALUE is not set", () => {
      process.env.GITHUB_REF = "refs/heads/main";

      config.restoreGithubReferenceForNpmProvenance.verifyConditions?.();

      expect(process.env.GITHUB_REF).toBe("refs/heads/main");
    });

    test("restores process.env.GITHUB_SHA from the PR's live merge_commit_sha so npm provenance matches the OIDC-attested digest", async () => {
      process.env.GITHUB_EVENT_NAME = "pull_request";
      // eslint-disable-next-line sonarjs/publicly-writable-directories -- readFileSync is mocked, no real I/O
      process.env.GITHUB_EVENT_PATH = "/tmp/event.json";
      process.env.GITHUB_REPOSITORY = "open-turo/semantic-release-config";
      process.env.GITHUB_TOKEN = "test-token";
      process.env.GITHUB_SHA = "450b7abf1022e1998c74ee414b594b612ffcc2eb";
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ pull_request: { number: 273 } }),
      );
      // eslint-disable-next-line n/no-unsupported-features/node-builtins, @typescript-eslint/consistent-type-assertions -- fetch is always available here (see src/_config.ts); Response is large, only json() matters for this mock
      vi.mocked(fetch).mockResolvedValue({
        json: () =>
          Promise.resolve({
            merge_commit_sha: "8eba7d0bfce68135b79e23a20cd68759d66ecfdf",
          }),
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
      } as Response);

      await config.restoreGithubReferenceForNpmProvenance.publish?.();

      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      expect(fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/open-turo/semantic-release-config/pulls/273",
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- vitest's expect.objectContaining() typing is any
          headers: expect.objectContaining({
            authorization: "Bearer test-token",
          }),
        }),
      );
      expect(process.env.GITHUB_SHA).toBe(
        "8eba7d0bfce68135b79e23a20cd68759d66ecfdf",
      );
    });

    test("leaves process.env.GITHUB_SHA untouched when the event is not a pull_request", async () => {
      process.env.GITHUB_EVENT_NAME = "push";
      process.env.GITHUB_SHA = "450b7abf1022e1998c74ee414b594b612ffcc2eb";

      await config.restoreGithubReferenceForNpmProvenance.publish?.();

      expect(process.env.GITHUB_SHA).toBe(
        "450b7abf1022e1998c74ee414b594b612ffcc2eb",
      );
      expect(readFileSync).not.toHaveBeenCalled();
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      expect(fetch).not.toHaveBeenCalled();
    });

    test("leaves process.env.GITHUB_SHA untouched when the GitHub API call fails", async () => {
      process.env.GITHUB_EVENT_NAME = "pull_request";
      // eslint-disable-next-line sonarjs/publicly-writable-directories -- readFileSync is mocked, no real I/O
      process.env.GITHUB_EVENT_PATH = "/tmp/event.json";
      process.env.GITHUB_REPOSITORY = "open-turo/semantic-release-config";
      process.env.GITHUB_TOKEN = "test-token";
      process.env.GITHUB_SHA = "450b7abf1022e1998c74ee414b594b612ffcc2eb";
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ pull_request: { number: 273 } }),
      );
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      vi.mocked(fetch).mockRejectedValue(new Error("network error"));

      await config.restoreGithubReferenceForNpmProvenance.publish?.();

      expect(process.env.GITHUB_SHA).toBe(
        "450b7abf1022e1998c74ee414b594b612ffcc2eb",
      );
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
