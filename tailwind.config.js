/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        rain: {
          safe: '#10b981',
          moderate: '#f59e0b',
          danger: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans Thai"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}