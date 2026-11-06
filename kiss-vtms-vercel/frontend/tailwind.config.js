/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F6FF',
          100: '#E0EDFE',
          200: '#BAE6FD',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E3A8A', // Deep Navy Blue
          900: '#0F172A', // Slate Midnight
        },
        gold: {
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309'
        }
      }
    },
  },
  plugins: [],
}
