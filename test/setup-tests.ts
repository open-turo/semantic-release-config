// eslint-disable-next-line import/no-extraneous-dependencies
import { afterEach, beforeEach, vi } from "vitest";

const originalEnvironment = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = {
    ...originalEnvironment,
    GITHUB_REF: "refs/head/main",
  };
});

afterEach(() => {
  process.env = originalEnvironment;
  vi.resetModules();
  vi.restoreAllMocks();
});
