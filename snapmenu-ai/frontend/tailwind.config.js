/** @type {import('tailwindcss').Config} */
export default {
  content: ['./owner.html', './customer.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#111827', accent: '#f97316' },
      },
    },
  },
  plugins: [],
};
