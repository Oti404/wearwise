/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#5A2D82", foreground: "#FFFFFF" },
        secondary: { DEFAULT: "#F4C542", foreground: "#5A2D82" },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
