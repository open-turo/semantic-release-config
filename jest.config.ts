const config = {
  coverageDirectory: "reports/coverage",
  coverageReporters: ["lcov", "html"],
  moduleNameMapper: {
    "~/(.*)": "<rootDir>/src/$1",
    "~test/*": ["./test/*"],
  },
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>test/setup-tests.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  roots: ["<rootDir>/test", "<rootDir>/src"],
};

export default config;
