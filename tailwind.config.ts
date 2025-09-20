/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        input: "#e5e7eb",
        ring: "#3b82f6",
      },
    },
  },
  plugins: [],
};
