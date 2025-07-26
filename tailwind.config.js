/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0e2625',
          light: '#1a3635',
          dark: '#081a19',
        },
        secondary: {
          DEFAULT: '#309b47',
          light: '#4ade80',
          dark: '#166534',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};