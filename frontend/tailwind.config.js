/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'monospace'],
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
          950: '#0a0a0a',
        },
        // Glass surface system — translucent layers
        glass: {
          light: 'rgba(255, 255, 255, 0.60)',
          lighter: 'rgba(255, 255, 255, 0.80)',
          dark: 'rgba(30, 30, 30, 0.60)',
          darker: 'rgba(20, 20, 20, 0.80)',
          border: 'rgba(255, 255, 255, 0.18)',
          borderDark: 'rgba(255, 255, 255, 0.08)',
        },
        // Vibrancy tints — colored glass
        vibrancy: {
          blue: 'rgba(0, 122, 255, 0.12)',
          purple: 'rgba(175, 82, 222, 0.10)',
          accent: 'rgba(212, 168, 83, 0.12)',
        },
        // Solid accents for interactive elements
        accent: {
          DEFAULT: '#007AFF',
          hover: '#0056CC',
          gold: '#D4A853',
          goldMuted: 'rgba(212, 168, 83, 0.15)',
        },
      },
      backdropBlur: {
        glass: '20px',
        'glass-lg': '40px',
        'glass-sm': '12px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 10px 40px -10px rgb(0 0 0 / 0.15), 0 4px 12px -4px rgb(0 0 0 / 0.08)',
        premium: '0 4px 20px -2px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
        'premium-lg': '0 20px 60px -15px rgb(0 0 0 / 0.15), 0 8px 24px -8px rgb(0 0 0 / 0.1)',
        // Apple Glass shadows
        glass: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-elevated': '0 20px 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        glow: '0 0 20px rgba(0, 122, 255, 0.15)',
        'glow-gold': '0 0 20px rgba(212, 168, 83, 0.2)',
      },
      borderRadius: {
        card: '20px',
        button: '12px',
        badge: '100px',
        modal: '24px',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gradient-gold': 'linear-gradient(135deg, #d4a853 0%, #f0d48a 50%, #d4a853 100%)',
        'gradient-card': 'linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 0.6) 100%)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snappy: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-up': 'fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'spring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        spring: {
          '0%': { transform: 'scale(0.9)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
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
