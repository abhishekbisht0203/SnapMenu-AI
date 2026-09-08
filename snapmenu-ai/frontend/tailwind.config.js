/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './owner.html', './customer.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Clash Display"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0f172a',
          soft: '#1e293b',
          muted: '#475569',
        },
        brand: {
          DEFAULT: '#0f766e',
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#134e4a',
        },
        ember: {
          DEFAULT: '#f97316',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 12px 32px -12px rgba(15, 23, 42, 0.14)',
        glow: '0 8px 32px -8px rgba(249, 115, 22, 0.45)',
      },
      backgroundImage: {
        'brand-radial': 'radial-gradient(120% 120% at 0% 0%, #134e4a 0%, #0f766e 45%, #0d9488 100%)',
        mesh: 'radial-gradient(80% 80% at 20% 0%, rgba(20,184,166,0.18), transparent), radial-gradient(60% 60% at 100% 20%, rgba(249,115,22,0.16), transparent)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
