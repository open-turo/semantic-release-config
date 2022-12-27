const config = {
  coverageDirectory: "reports/coverage",
  coverageReporters: ["lcov", "html"],
  moduleNameMapper: {
    "~/*": ["./src/*"],
    "~test/*": ["./test/*"],
  },
  preset: "ts-jest",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        compiler: "ttypescript",
      },
    ],
  },
  roots: ["<rootDir>/test", "<rootDir>/src"],
};

export default config;
