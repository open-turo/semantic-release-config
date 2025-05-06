/**
 * Semantic release configuration. Supports main and version branch releases
 *
 * The release notes will include all the commits and not just the commits that trigger a release.
 */

export = {
  branches: ["main", "master", "+([0-9])?(.{+([0-9]),x}).x"],
  plugins: [
    "@semantic-release/commit-analyzer",
    // We want to use the angular preset, but we want to include all commits in the changelog
    // See https://github.com/semantic-release/release-notes-generator/issues/77
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { hidden: false, section: "Build System", type: "build" },
            { hidden: false, section: "Miscellaneous", type: "chore" },
            { hidden: false, section: "Continuous Integration", type: "ci" },
            { hidden: false, section: "Documentation", type: "docs" },
            { hidden: false, section: "Features", type: "feat" },
            { hidden: false, section: "Bug Fixes", type: "fix" },
            {
              hidden: false,
              section: "Performance Improvements",
              type: "perf",
            },
            { hidden: false, section: "Code Refactoring", type: "refactor" },
            { hidden: false, section: "Styles", type: "style" },
            { hidden: false, section: "Tests", type: "test" },
          ],
        },
        writerOpts: {
          commitsSort: ["subject", "scope"],
        },
      },
    ],
    [
      "@semantic-release/github",
      {
        failComment: false,
        failTitle: false,
        labels: false,
        releasedLabels: false,
        successComment: false,
      },
    ],
    [
      "@semantic-release/exec",
      {
        failCmd:
          "[ -x ./script/semantic-release-fail ] && ./script/semantic-release-fail '${nextRelease.version}' || true",
        publishCmd:
          "[ -x ./script/semantic-release-publish ] && ./script/semantic-release-publish '${nextRelease.version}' || true",
        successCmd:
          "[ -x ./script/semantic-release-success ] && ./script/semantic-release-success '${nextRelease.version}' || true",
      },
    ],
  ],
} as const;
