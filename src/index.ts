/**
 * Semantic release configuration. Support beta
 * releases for branches that follow our branch naming convention (branches that start with f/, b/ or c/)
 *
 * If there are tickets referenced in the branch name (in the format <PROJECT>-<TICKET_NUMBER>, only this part of the name
 * will be used for the prerelease name. Otherwise, a sanitized version of the branch name
 * will be used.
 *
 * For any of the prereleases, the current date will be appended. This will guarantee that even if a branch gets rebased
 * and force pushed, we get unique prerelease names.
 *
 * The release notes will include all the commits and not just the commits that trigger a release.
 */
export = {
  branches: [
    "main",
    "+([0-9])?(.{+([0-9]),x}).x",
    {
      name: "(f|b|c)/*",
      channel: "next",
      prerelease:
        "beta-${(/^[a-zA-Z]+-[0-9]+/.exec(name.substr(2)) || [name.replace(/[_/.]/g, '-')])[0]}-${Date.now()}",
    },
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    // We want to use the angular preset, but we want to include all commits in the changelog
    // See https://github.com/semantic-release/release-notes-generator/issues/77
    [
      "@semantic-release/release-notes-generator",
      {
        parserOpts: {
          noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"],
        },
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "build", section: "Build System", hidden: false },
            { type: "chore", section: "Miscellaneous", hidden: false },
            { type: "ci", section: "Continuous Integration", hidden: false },
            { type: "docs", section: "Documentation", hidden: false },
            { type: "feat", section: "Features", hidden: false },
            { type: "fix", section: "Bug Fixes", hidden: false },
            {
              type: "perf",
              section: "Performance Improvements",
              hidden: false,
            },
            { type: "refactor", section: "Code Refactoring", hidden: false },
            { type: "style", section: "Styles", hidden: false },
            { type: "test", section: "Tests", hidden: false },
          ],
        },
        writerOpts: {
          commitsSort: ["subject", "scope"],
        },
      },
    ],
    "@semantic-release/github",
    "semantic-release-fotingo",
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
