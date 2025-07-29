import { template } from "lodash";
import { execSync } from "node:child_process";

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

jest.mock("node:child_process", () => ({
  execSync: jest.fn(),
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
        const pluginConfig =
          gitPlugin && isGitPluginConfig(gitPlugin[1])
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
      jest.mocked(execSync).mockImplementation((cmd) => {
        if (String(cmd).includes("package.json")) {
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
