const originalEnvironment = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnvironment,
    GITHUB_REF: "refs/head/main",
  };
});

afterEach(() => {
  process.env = originalEnvironment;
  jest.resetModules();
  jest.restoreAllMocks();
});
