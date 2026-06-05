/**
 * Shared ESLint configuration for Livraison TypeScript packages and services.
 *
 * Uses the classic (eslintrc) format to match the pinned ESLint 8 toolchain.
 * Type-aware rules are intentionally kept off here to avoid requiring a
 * per-package `project` setting; correctness is enforced by `tsc --noEmit`
 * (typecheck) in CI, while ESLint focuses on lint-level hygiene.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es2022: true,
    browser: true,
  },
  ignorePatterns: [
    'dist',
    '.next',
    'generated',
    'coverage',
    'node_modules',
    'storybook-static',
    '*.config.ts',
    '*.config.mjs',
    '*.config.js',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['**/*.spec.ts', '**/*.test.ts', '**/*.test.tsx', '**/seed.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
