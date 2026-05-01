import openTuroTypescriptConfig from "@open-turo/eslint-config-typescript";

// eslint-disable-next-line import/no-default-export
export default openTuroTypescriptConfig({
  allowModules: ["lodash", "vitest"],
  ignores: ["lib", "reports", "vitest.config.ts"],
  testFramework: "vitest",
});
