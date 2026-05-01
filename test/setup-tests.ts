// eslint-disable-next-line import/no-extraneous-dependencies
import { afterEach, beforeEach, vi } from "vitest";

let originalGithubReference: string | undefined;

beforeEach(() => {
  vi.resetModules();
  originalGithubReference = process.env.GITHUB_REF;
  process.env.GITHUB_REF = "refs/head/main";
});

afterEach(() => {
  if (originalGithubReference === undefined) {
    delete process.env.GITHUB_REF;
  } else {
    process.env.GITHUB_REF = originalGithubReference;
  }
  vi.resetModules();
  vi.restoreAllMocks();
});
