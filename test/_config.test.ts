import template = require("lodash.template");
import { SemanticReleasePlugin } from "~/_config";

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
      expect(preset.plugins[npm.plugins.length - 1][0]).toBe(
        "@semantic-release/exec",
      );
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
});
