module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {"@next/next/no-html-link-for-pages": ""error"", "@typescript-eslint/no-explicit-any": ""warn"", "@typescript-eslint/no-unused-vars": ["warn",{"argsIgnorePattern":"^_"}], "argsIgnorePattern": ""^_" ", "no-undef": "error", "react/jsx-no-undef": "error"}]
  },
  ignorePatterns: [".next/**","node_modules/**","dist/**","**/*.d.ts"]
};
