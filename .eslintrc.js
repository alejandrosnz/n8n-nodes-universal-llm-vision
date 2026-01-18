module.exports = {
  parser: '@typescript-eslint/parser',
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', '**/*.svg'],
};