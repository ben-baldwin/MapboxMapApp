/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
    fontFamily: {
      body: ["Roboto Slab"]
    }
  },
  plugins: [
    require('tailwind-scrollbar')
  ],
}