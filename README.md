# semantic-release-config

Turo configuration for [semantic-release](https://github.com/semantic-release/semantic-release)

## Install

Via NPM:

```shell
npm install --save-dev semantic-release @open-turo/semantic-release-config
```

Or yarn:

```shell
yarn add --dev semantic-release @open-turo/semantic-release-config
```

## Presets

- Default. Include all changes in the release notes. Allow next releases from branches that start with f/, b/ or c/
  and run [semantic-release-fotingo](https://github.com/tagoro9/semantic-release-fotingo).
- NPM. All the default configuration in addition to publishing packages to NPM and updates assets like package.json

## Usage

The shareable config can be configured in the [semantic-release configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "extends": "@open-turo/semantic-release-config"
}
```

If you are not using the default preset, you have to specify its name too:

```json
{
  "extends": "@open-turo/semantic-release-config/lib/npm"
}
```

See more details about how shareable configurations can be created in [here](https://semantic-release.gitbook.io/semantic-release/usage/shareable-configurations).

### Configuration

This plugin requires no configuration, but certain environment variables need to be present in order for some
of the plugins to work correctly.

#### Default

- `GITHUB_TOKEN`. A GitHub token so the Github release can be created
- Fotingo. Refer to [semantic-release-fotingo](https://github.com/tagoro9/semantic-release-fotingo) to see how to
  properly configure it.

#### NPM

- `GITHUB_TOKEN`. When a new release is published, this plugin will try to commit and push into the released branch.
  Ensure that the user that is running the release has push rights and can bypass branch
  protection rules (see [here](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/managing-a-branch-protection-rule))
- `NPM_TOKEN`. A NPM token so the package can be published to NPM (a `.npmrc` file with extra configuration can also be used)

## Development

Install [pre-commit](https://pre-commit.com/) and the commit hooks:

```shell
pre-commit install
pre-commit install --hook-type commit-msg
```

## Get Help

Please review Issues, post new Issues against this repository as needed.

## Contributions

Please see [here](https://github.com/open-turo/contributions) for guidelines on how to contribute to this project.
