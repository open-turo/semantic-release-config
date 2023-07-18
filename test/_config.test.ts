import {
  createPreset,
  semanticReleaseGit,
  SemanticReleasePlugin,
} from "~/_config";
import npm from "~/npm";
import template = require("lodash.template");

describe("config", () => {
  describe("createPreset", () => {
    let preset: { plugins: SemanticReleasePlugin[] };
    beforeEach(() => {
      preset = createPreset(["a", "b"]);
    });
    test("creates a preset including the default config", () => {
      expect(preset).toMatchSnapshot();
    });

    test("@semantic-release/exec is the last plugin", () => {
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
        const gitPlugin = semanticReleaseGit(assets);
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
