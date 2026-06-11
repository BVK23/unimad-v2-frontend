/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./constants/**/*.{js,ts}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f6fe",
          100: "#dde9fc",
          200: "#c2d9fa",
          300: "#9bc0f6",
          400: "#6ea0f0",
          500: "#346de0", // Primary #346DE0
          600: "#2553d0",
          700: "#1e42a8",
          800: "#1b3888",
          900: "#1b316b",
        },
      },
      fontFamily: {
        sans: ["Onest", "sans-serif"],
      },
      keyframes: {
        "cta-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(37, 83, 208, 0.45), 0 4px 14px rgba(37, 83, 208, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 36px rgba(37, 83, 208, 0.75), 0 4px 22px rgba(37, 83, 208, 0.45)",
          },
        },
      },
      animation: {
        "cta-glow": "cta-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
