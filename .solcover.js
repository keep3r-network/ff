module.exports = {
  skipFiles: ['for-test', 'legacy', 'interfaces', 'external'],
  mocha: {
    forbidOnly: true,
    grep: '@skip-on-coverage',
    invert: true,
  },
};
