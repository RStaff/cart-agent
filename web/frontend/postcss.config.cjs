/**
 * PostCSS config (CJS) — hardened for Vite + Tailwind.
 * Tailwind's PostCSS plugin moved to @tailwindcss/postcss.
 */
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
