/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6fe',
          100: '#dde9fc',
          200: '#c2d9fa',
          300: '#9bc0f6',
          400: '#6ea0f0',
          500: '#346de0', // Primary #346DE0
          600: '#2553d0',
          700: '#1e42a8',
          800: '#1b3888',
          900: '#1b316b',
        }
      },
      fontFamily: {
        sans: ['Onest', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
