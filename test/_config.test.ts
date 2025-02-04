import { execSync } from "node:child_process";

import { template } from "lodash";

import {
  createPluginIfFilesExist,
  type SemanticReleasePlugin,
} from "~/_config";

jest.mock("node:child_process", () => ({
  execSync: jest.fn(),
}));

describe("config", () => {
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
      const npm = await import("~/npm");
      expect(npm.plugins.at(-1)![0]).toBe("@semantic-release/exec");
    });
  });

  describe("semanticReleaseGit", () => {
    test.each(["next", undefined])(
      "semantic-release/@git generates the right commit message for channel %s",
      (channel) => {
        const assets = ["a"];
        const gitPlugin = config.semanticReleaseGit(assets);
        const pluginConfig = ((gitPlugin && gitPlugin[1]) || {
          assets: [],
          message: "",
        }) as {
          assets: [];
          message: string;
        };
        expect(pluginConfig.assets).toBe(assets);
        expect(
          template(pluginConfig.message || "")({
            nextRelease: {
              version: "test",
              channel: channel,
              notes: "This is a test release",
            },
          }),
        ).toMatchSnapshot();
      },
    );
  });

  describe("createPluginIfFilesExist", () => {
    beforeEach(() => {
      (execSync as jest.Mock).mockImplementation((cmd) => {
        if (String(cmd).includes("package.json")) {
          throw new Error("fatal: Not a valid object name HEAD:package.json");
        }
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
