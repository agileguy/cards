module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
    collectCoverageFrom: [
          'src/**/*.js',
          '!src/**/*.test.js',
          '!src/**/*.spec.js',
        ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
          global: {
                  branches: 75,
                  functions: 80,
                  lines: 80,
                  statements: 80,
          },
    },
    verbose: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
};
