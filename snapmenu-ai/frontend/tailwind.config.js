/** @type {import('tailwindcss').Config} */
const withAlpha = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './owner.html', './customer.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: withAlpha('--c-bg'),
        surface: withAlpha('--c-surface'),
        'surface-2': withAlpha('--c-surface-2'),
        'surface-3': withAlpha('--c-surface-3'),
        line: withAlpha('--c-line'),
        'line-strong': withAlpha('--c-line-strong'),
        content: {
          DEFAULT: withAlpha('--c-text'),
          muted: withAlpha('--c-text-muted'),
          subtle: withAlpha('--c-text-subtle'),
        },
        brand: {
          DEFAULT: withAlpha('--c-brand'),
          fg: withAlpha('--c-brand-fg'),
          soft: withAlpha('--c-brand-soft'),
        },
        accent: {
          DEFAULT: withAlpha('--c-accent'),
          fg: withAlpha('--c-accent-fg'),
          soft: withAlpha('--c-accent-soft'),
        },
        success: { DEFAULT: withAlpha('--c-success'), soft: withAlpha('--c-success-soft') },
        warning: { DEFAULT: withAlpha('--c-warning'), soft: withAlpha('--c-warning-soft') },
        danger: { DEFAULT: withAlpha('--c-danger'), soft: withAlpha('--c-danger-soft') },
        info: { DEFAULT: withAlpha('--c-info'), soft: withAlpha('--c-info-soft') },
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(var(--c-shadow) / 0.06)',
        sm: '0 1px 3px rgb(var(--c-shadow) / 0.08), 0 1px 2px -1px rgb(var(--c-shadow) / 0.06)',
        md: '0 4px 12px -2px rgb(var(--c-shadow) / 0.10), 0 2px 6px -2px rgb(var(--c-shadow) / 0.06)',
        lg: '0 12px 32px -8px rgb(var(--c-shadow) / 0.16), 0 4px 12px -4px rgb(var(--c-shadow) / 0.08)',
        pop: '0 16px 48px -12px rgb(var(--c-shadow) / 0.28)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-left': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out both',
        'fade-up': 'fade-up .25s ease-out both',
        'scale-in': 'scale-in .16s ease-out both',
        'slide-up': 'slide-up .28s cubic-bezier(0.32,0.72,0,1) both',
        'slide-left': 'slide-left .28s cubic-bezier(0.32,0.72,0,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'toast-in': 'toast-in .2s ease-out both',
      },
    },
  },
  plugins: [],
};
