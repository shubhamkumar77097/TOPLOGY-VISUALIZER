module.exports = {
  testEnvironment: 'node',
  testTimeout: 20000,
  // Only run JS test files under tests/ to avoid parsing TypeScript and Playwright test files here
  testMatch: ['**/tests/**/*.test.js'],
};
