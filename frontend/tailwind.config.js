/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wolf: {
          light: "#d1d5db",
          DEFAULT: "#111827",
          accent: "#1d4ed8",
        },
      },
    },
  },
  plugins: [],
};
