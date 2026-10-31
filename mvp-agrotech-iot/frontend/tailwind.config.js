/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        field: {
          50: '#f1f7ed',
          100: '#e1eed9',
          500: '#5e8d49',
          700: '#355b35',
          900: '#1e392b',
        },
      },
    },
  },
  plugins: [],
}
