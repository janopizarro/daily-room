/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-nunito)", "sans-serif"],
      },
    },
  },
  experimental: {
    optimizeUniversalDefaults: true, // ← Esto previene oklch()
  },
  plugins: [],
};
