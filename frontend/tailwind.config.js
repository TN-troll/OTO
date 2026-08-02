/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#faf8f3',
          100: '#f5f0e6',
          200: '#ebe0cc',
          300: '#dbc8a3',
          400: '#d4a853',
          500: '#c9963d',
          600: '#b07e2f',
          700: '#8f6526',
          800: '#6e4e1f',
          900: '#4d3715',
        },
        brand: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
          dark: '#020617',
          accent: '#d4a853',
        },
        surface: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 10px 40px -10px rgb(0 0 0 / 0.15), 0 4px 12px -4px rgb(0 0 0 / 0.08)',
        premium: '0 4px 20px -2px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
        'premium-lg': '0 20px 60px -15px rgb(0 0 0 / 0.15), 0 8px 24px -8px rgb(0 0 0 / 0.1)',
        glow: '0 0 20px rgb(212 168 83 / 0.15)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gradient-gold': 'linear-gradient(135deg, #d4a853 0%, #f0d48a 50%, #d4a853 100%)',
        'gradient-card': 'linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 0.6) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
