import template = require("lodash.template");

import config from "~/index";

describe("Branches", () => {
  const prereleasesToTest: string[] = [];
  beforeAll(() => {
    // This date is the time of writing this test (2022-12-15 01:47PM PST)
    jest.useFakeTimers().setSystemTime(1_671_140_834_629);
    for (const branchConfig of config.branches) {
      if (
        typeof branchConfig === "object" &&
        "prerelease" in branchConfig &&
        typeof branchConfig.prerelease === "string"
      ) {
        prereleasesToTest.push(branchConfig.prerelease);
      }
    }
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test.each([
    "f/test",
    "f/project-1234_test_that_semantic_release_works",
    "c/this_is_a_branch_that_does_not-follow-any-convention-223434",
  ])(
    "generates the right prerelease names for Turo custom branches: %s",
    (branch) => {
      for (const prerelease of prereleasesToTest) {
        expect(template(prerelease)({ name: branch })).toMatchSnapshot();
      }
    }
  );
});
