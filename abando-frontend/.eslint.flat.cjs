/* eslint-disable @typescript-eslint/no-require-imports */
const ts = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const nextPlugin = require("@next/eslint-plugin-next");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  // What NOT to lint
  { ignores: ["node_modules/**", ".next/**", "backup-*/**", "**/*.bak.*"] },

  // Allow CommonJS + require() in config and cjs utilities
  {
    files: [".eslint.flat.cjs", "**/*.cjs"],
    languageOptions: { sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },

  // TypeScript / TSX
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: false,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      "@next/next": nextPlugin,
    },
    rules: {
      // reasonable defaults, keep this tight but not painful
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off", // you can turn back on later per-file
    },
  },

  // JavaScript helpers / scripts
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    plugins: { "@next/next": nextPlugin },
    rules: {},
  },

  // Next.js rules only where it makes sense (app + components)
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: {
      "@next/next/no-html-link-for-pages": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
{
  /* img-allowlist */
  files: [
    "src/components/ImageCard.tsx",
    "src/components/NavbarV2.tsx",
    "src/app/dashboard/Client.tsx"
  ],
  rules: {
    "@next/next/no-img-element": "off"
  }
  /* /img-allowlist */
},
{
  /* img-allowlist */
  files: [
    "src/components/ImageCard.tsx",
    "src/components/NavbarV2.tsx",
    "src/app/dashboard/Client.tsx"
  ],
  rules: {
    "@next/next/no-img-element": "off"
  }
  /* /img-allowlist */
},
];
