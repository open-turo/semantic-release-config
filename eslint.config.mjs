import openTuroTypescriptConfig from "@open-turo/eslint-config-typescript";

// eslint-disable-next-line import/no-default-export
export default openTuroTypescriptConfig({
  allowModules: ["lodash"],
  ignores: ["lib", "reports", "jest.config.ts"],
});
