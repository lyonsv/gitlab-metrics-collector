export default {
  testEnvironment: 'node',
  transform: {},
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/demo/**',
  ],
  coverageReporters: ['lcov', 'text'],
  testMatch: ['**/tests/**/*.test.js'],
};
