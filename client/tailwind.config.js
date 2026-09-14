/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        restoza: {
          burgundy: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            500: '#e11d48',
            600: '#be123c',
            700: '#9f1239',
            800: '#881337',
            900: '#4c0519',
            950: '#28000b',
          },
          gold: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
          dark: {
            800: '#1e1e24',
            900: '#141419',
            950: '#0c0c0f',
          }
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.35)',
        'glow-burgundy': '0 0 25px -5px rgba(159, 18, 57, 0.4)',
        'thermal': '0 4px 20px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
