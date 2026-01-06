import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";

/**
 * Integration tests that validate semantic-release configurations by actually running
 * semantic-release programmatically with each preset.
 * There are some plugins that need to talk to NPM and other services. We are not testing that, as it would be testing
 * the plugins we use, and this is just a simple test to ensure correctness of our semantic-release config
 */

// eslint-disable-next-line unicorn/prefer-module
const PROJECT_ROOT = path.join(__dirname, "..");

/**
 * Captured output from semantic-release execution
 */
interface CapturedOutput {
  stderr: string;
  stdout: string;
}

interface SemanticReleaseConfig {
  branches: Array<{ [key: string]: unknown; name: string } | string>;
  plugins: Array<[string, Record<string, unknown>] | string>;
}

type SemanticReleaseFunction = (
  options: Record<string, unknown>,
  config: Record<string, unknown>,
) => Promise<SemanticReleaseResult>;

type SemanticReleaseResult =
  | {
      commits: Array<{
        [key: string]: unknown;
        message: string;
      }>;
      lastRelease: {
        channels: string[];
        gitHead: string;
        gitTag: string;
        name: string;
        version: string;
      };
      nextRelease: {
        [key: string]: unknown;
        channel?: null | string;
        notes?: string;
        type: string;
        version: string;
      };
      releases: Array<{ [key: string]: unknown }>;
    }
  | false;

interface TestRepoOptions {
  files?: Record<string, string>;
  initialCommitMessage?: string;
}

/**
 * Lazy-loaded semantic-release function
 * Using dynamic import to handle ES module in CommonJS context
 */
let semanticReleaseFunction: SemanticReleaseFunction | undefined;

/**
 * Add a commit to the test repository
 */
function addCommit(
  repoPath: string,
  message: string,
  files?: Record<string, string>,
): void {
  if (files) {
    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(repoPath, filename);
      const dirname = path.dirname(filePath);
      if (dirname !== repoPath) {
        mkdirSync(dirname, { recursive: true });
      }
      writeFileSync(filePath, content);
    }
  }
  execGitCommand("git add .", repoPath);
  execGitCommand(`git commit --allow-empty -m "${message}"`, repoPath);
}

/**
 * Creates a passthrough stream that captures output to a string array
 */
function createCaptureStream(): { output: string[] } & PassThrough {
  const output: string[] = [];
  const stream = new PassThrough();

  // Attach output array to stream using Object.defineProperty to satisfy TypeScript
  Object.defineProperty(stream, "output", {
    value: output,
    writable: false,
  });

  stream.on("data", (chunk: Buffer) => {
    output.push(chunk.toString());
  });

  // Type assertion needed because we dynamically added the output property
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return stream as { output: string[] } & PassThrough;
}

/**
 * Create a temporary Git repository with initial setup
 */
function createTestRepo(options: TestRepoOptions = {}): string {
  const temporaryDirectory = mkdtempSync(
    path.join(tmpdir(), "semantic-release-test-"),
  );

  // Initialize Git repository
  execGitCommand("git init", temporaryDirectory);
  execGitCommand('git config user.name "Test User"', temporaryDirectory);
  execGitCommand(
    'git config user.email "test@example.com"',
    temporaryDirectory,
  );

  // Create initial files
  const initialFiles = options.files || { "README.md": "# Test Repository" };
  for (const [filename, content] of Object.entries(initialFiles)) {
    const filePath = path.join(temporaryDirectory, filename);
    const dirname = path.dirname(filePath);
    if (dirname !== temporaryDirectory) {
      mkdirSync(dirname, { recursive: true });
    }
    writeFileSync(filePath, content);
  }

  // Create initial commit
  execGitCommand("git add .", temporaryDirectory);
  const commitMessage = options.initialCommitMessage || "chore: initial commit";
  execGitCommand(`git commit -m "${commitMessage}"`, temporaryDirectory);

  // Create main branch and switch to it
  execGitCommand("git branch -M main", temporaryDirectory);

  // Create an initial tag to establish version history
  execGitCommand("git tag v0.0.0", temporaryDirectory);

  return temporaryDirectory;
}

/**
 * Execute git command safely in test environment
 */
function execGitCommand(command: string, cwd: string): void {
  // eslint-disable-next-line sonarjs/os-command -- Safe git commands in test environment with controlled inputs
  execSync(command, {
    cwd,
    env: { ...process.env, PATH: process.env.PATH },
    stdio: "ignore",
  });
}

/**
 * Filter out CLI-dependent plugins that cannot be integration-tested.
 */
function filterProblematicPluginsForTest(
  config: SemanticReleaseConfig,
): SemanticReleaseConfig {
  const problematicPlugins = new Set([
    "@semantic-release/github", // Uses git ls-remote (Git protocol)
    "@semantic-release/npm", // Runs npm whoami CLI command
    "gradle-semantic-release-plugin", // Requires Gradle wrapper and CLI
  ]);

  return {
    ...config,
    plugins: config.plugins.filter((plugin) => {
      const pluginName = typeof plugin === "string" ? plugin : plugin[0];
      return !problematicPlugins.has(pluginName);
    }),
  };
}

async function getSemanticRelease(): Promise<SemanticReleaseFunction> {
  if (!semanticReleaseFunction) {
    // Dynamic import for ES module compatibility
    // We can't directly call await import because jest throws an error
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-implied-eval
    const dynamicImport = new Function(
      "specifier",
      "return import(specifier)",
    ) as (specifier: string) => Promise<{ default: SemanticReleaseFunction }>;

    const semanticReleaseModule = await dynamicImport("semantic-release");
    semanticReleaseFunction = semanticReleaseModule.default;
  }
  return semanticReleaseFunction;
}

/**
 * Load a semantic-release configuration preset
 * For presets that use conditional plugins (like gradle-and-npm), files must exist in the CWD
 */
function loadConfig(preset: string, cwd?: string): SemanticReleaseConfig {
  const configPath = preset
    ? path.join(PROJECT_ROOT, "lib", `${preset}.js`)
    : path.join(PROJECT_ROOT, "lib", "index.js");

  // eslint-disable-next-line unicorn/prefer-module
  delete require.cache[require.resolve(configPath)];

  // Change to the specified directory if provided
  const originalCwd = process.cwd();
  if (cwd) {
    process.chdir(cwd);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-require-imports, unicorn/prefer-module
    return require(configPath) as SemanticReleaseConfig;
  } finally {
    if (cwd) {
      process.chdir(originalCwd);
    }
  }
}

/**
 * Run semantic-release programmatically in dry-run mode
 *
 * Note: Some plugins are filtered out for test execution due to CLI dependencies.
 * See filterProblematicPluginsForTest() documentation for details.
 */
async function runSemanticRelease(
  repoPath: string,
  config: SemanticReleaseConfig,
): Promise<{
  output: CapturedOutput;
  result: SemanticReleaseResult;
}> {
  const stdout = createCaptureStream();
  const stderr = createCaptureStream();

  const semanticRelease = await getSemanticRelease();
  const testConfig = filterProblematicPluginsForTest(config);

  const originalCwd = process.cwd();
  process.chdir(repoPath);
  try {
    const result = await semanticRelease(
      {
        branches: testConfig.branches,
        ci: false,
        dryRun: true,
        plugins: testConfig.plugins,
        repositoryUrl: `file://${repoPath}`,
      },
      {
        env: {
          CI: "true",
        },
        // Type assertions needed to convert custom PassThrough to NodeJS.WriteStream
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        stderr: stderr as unknown as NodeJS.WriteStream,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        stdout: stdout as unknown as NodeJS.WriteStream,
      },
    );

    return {
      output: {
        stderr: stderr.output.join(""),
        stdout: stdout.output.join(""),
      },
      result,
    };
  } catch (error) {
    throw new Error(
      `Semantic release failed: ${error}\nstdout: ${stdout.output.join("")}\nstderr: ${stderr.output.join("")}`,
    );
  } finally {
    process.chdir(originalCwd);
  }
}

describe("Integration Tests - Semantic Release Execution", () => {
  // Increase timeout for integration tests as they involve Git operations and semantic-release execution
  jest.setTimeout(30_000);

  test.each(["", "gradle", "gradle-and-npm", "npm", "openapi"])(
    "runs successfully with core semantic-release functionality with preset %s",
    async (preset) => {
      const repoDirectory = createTestRepo({
        files: {
          "build.gradle": 'plugins { id "java" }',
          "gradle.properties": "version=0.0.0",
          "package.json": JSON.stringify({
            name: "test-package",
            version: "0.0.0",
          }),
        },
      });
      const apiPath = path.join(repoDirectory, "spec", "api");
      mkdirSync(apiPath, { recursive: true });
      writeFileSync(
        path.join(apiPath, "api.yaml"),
        `openapi: 3.0.0
info:
  title: Test API
  version: 0.0.0
paths: {}`,
      );
      const message = "fix: add open api spec";
      addCommit(repoDirectory, message);

      const config = loadConfig(preset);
      const { result } = await runSemanticRelease(repoDirectory, config);

      expect(result).not.toBe(false);
      // Assert that result is truthy before accessing properties
      expect(result).toBeTruthy();
      if (!result) {
        throw new Error("Expected result to be truthy");
      }

      expect(result.nextRelease.type).toBe("patch");
      expect(result.nextRelease.version).toBe("0.0.1");
      expect(result.commits).toHaveLength(1);
      expect(result.commits[0].message).toContain(message);
      expect(result.nextRelease.notes).toBeDefined();
      expect(result.nextRelease.notes?.length).toBeGreaterThan(0);
    },
  );
});
