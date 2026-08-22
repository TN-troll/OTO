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
          50: '#fdf8f3',
          100: '#faeede',
          200: '#f4d8b8',
          300: '#ecbc8a',
          400: '#d4885a',
          500: '#c97b4a',
          600: '#b06538',
          700: '#8f4e2b',
          800: '#6e3c22',
          900: '#4d2a18',
        },
        brand: {
          DEFAULT: '#0a1628',
          light: '#132238',
          dark: '#050d1a',
          accent: '#c97b4a',
        },
        surface: {
          50: '#f8f9fc',
          100: '#f1f3f8',
          200: '#e2e6ef',
          300: '#c9cfdc',
          400: '#8e99ad',
          500: '#64718a',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#080e1f',
        },
        // Glass surface system — translucent layers
        glass: {
          light: 'rgba(255, 255, 255, 0.60)',
          lighter: 'rgba(255, 255, 255, 0.80)',
          dark: 'rgba(10, 22, 40, 0.70)',
          darker: 'rgba(8, 14, 31, 0.85)',
          border: 'rgba(255, 255, 255, 0.15)',
          borderDark: 'rgba(201, 123, 74, 0.12)',
        },
        // Vibrancy tints — colored glass
        vibrancy: {
          blue: 'rgba(30, 64, 175, 0.12)',
          purple: 'rgba(139, 92, 246, 0.08)',
          accent: 'rgba(201, 123, 74, 0.12)',
          copper: 'rgba(201, 123, 74, 0.08)',
        },
        // Solid accents for interactive elements
        accent: {
          DEFAULT: '#c97b4a',
          hover: '#b06538',
          gold: '#c97b4a',
          goldMuted: 'rgba(201, 123, 74, 0.15)',
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
        glow: '0 0 20px rgba(201, 123, 74, 0.15)',
        'glow-gold': '0 0 20px rgba(201, 123, 74, 0.25)',
        'glass-glow': '0 0 12px rgba(var(--color-accent-rgb), 0.3)',
      },
      borderRadius: {
        card: '20px',
        button: '12px',
        badge: '100px',
        modal: '24px',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0a1628 0%, #132238 50%, #0f1d30 100%)',
        'gradient-gold': 'linear-gradient(135deg, #c97b4a 0%, #e8a67a 50%, #c97b4a 100%)',
        'gradient-card': 'linear-gradient(180deg, transparent 0%, rgb(10 22 40 / 0.7) 100%)',
      },
      backgroundColor: {
        'glass-light': 'rgba(255, 255, 255, 0.72)',
        'glass-dark': 'rgba(10, 22, 40, 0.72)',
      },
      borderColor: {
        'glass-border': 'rgba(255, 255, 255, 0.18)',
      },
      minWidth: {
        touch: '44px',
      },
      minHeight: {
        touch: '44px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snappy: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        expo: 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-up': 'fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'spring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'stagger-1': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.04s both',
        'stagger-2': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both',
        'stagger-3': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both',
        'stagger-4': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both',
        'stagger-5': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.20s both',
        'stagger-6': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.24s both',
        'blur-in': 'blurIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'reveal': 'reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        spring: {
          '0%': { transform: 'scale(0.95)' },
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(201, 123, 74, 0.2)' },
          '50%': { boxShadow: '0 0 24px rgba(201, 123, 74, 0.4)' },
        },
        blurIn: {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.97)', filter: 'blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
      },
    },
  },
  plugins: [],
};
