// .eslint.flat.cjs — minimal, flat ESLint v9 config
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
let nextPlugin = {};
try {
  // ok if not installed yet; if present we can still disable rules cleanly
  nextPlugin = require('@next/eslint-plugin-next');
} catch (_) {}

module.exports = [
  // Ignore build artifacts & backups
  {
    ignores: [
      '.next/**/*',
      'node_modules/**/*',
      'dist/**/*',
      'coverage/**/*',
      'backup-**',
      '**/*.bak.*',
      '**/*.tmp'
    ],
  },

  // App code (TS/JS/TSX/JSX)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      // Turn off rule that previously blocked you
      '@next/next/no-img-element': 'off',

      // Prefer TS plugin's rule; allow underscore to mark intentional unused
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' , caughtErrors: 'all', caughtErrorsIgnorePattern: '^_'}
      ],
    },
  },

  // Dev scripts where require()/commonjs is fine
  {
    files: ['scripts/**/*.{js,cjs,mjs,ts}', 'web/src/dev/**/*.{js,cjs,mjs}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
];
