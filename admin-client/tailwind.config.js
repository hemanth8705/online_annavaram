/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          dark: '#E55A2B',
          light: '#FF8A5C'
        },
        secondary: {
          DEFAULT: '#FFA500',
          dark: '#E69500',
          light: '#FFB733'
        },
        accent: '#FFD700',
        dark: '#2C3E50',
        light: '#ECF0F1'
      }
    },
  },
  plugins: [],
}
