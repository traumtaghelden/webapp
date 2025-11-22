/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'touch': { 'raw': '(hover: none)' },
        'mouse': { 'raw': '(hover: hover)' },
      },
      spacing: {
        'safe-top': 'var(--safe-area-inset-top)',
        'safe-right': 'var(--safe-area-inset-right)',
        'safe-bottom': 'var(--safe-area-inset-bottom)',
        'safe-left': 'var(--safe-area-inset-left)',
        'bottom-nav': 'var(--bottom-nav-height)',
        'header': 'var(--header-height)',
      },
      minHeight: {
        'touch': 'var(--touch-target-min)',
        'screen-safe': 'calc(100vh - var(--safe-area-inset-top) - var(--safe-area-inset-bottom))',
      },
      minWidth: {
        'touch': 'var(--touch-target-min)',
      },
      maxHeight: {
        'modal-mobile': 'calc(100vh - 32px)',
        'modal-content': 'calc(100vh - 180px)',
      },
      transitionDuration: {
        '400': '400ms',
      },
      zIndex: {
        'modal': '1000',
        'modal-backdrop': '999',
        'mobile-nav': '900',
        'header': '800',
        'fab': '700',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
