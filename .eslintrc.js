// .eslintrc.js
module.exports = {
  root: true,
  extends: ["next", "next/core-web-vitals", "plugin:tailwindcss/recommended"],
  plugins: ["tailwindcss"],
  rules: {
    "tailwindcss/no-custom-classname": "off",
  },
};
