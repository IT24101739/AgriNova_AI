/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f9f4',
          100: '#e1f2e6',
          500: '#22c55e',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        bg: {
          primary: '#080d1a',
          secondary: '#0d1528',
          card: '#111c35',
          elevated: '#162040',
        },
        brand: {
          green: '#22c55e',
          'green-dim': '#16a34a',
          'green-glow': '#4ade80',
        },
        status: {
          low: '#22c55e',
          medium: '#f59e0b',
          high: '#ef4444',
          outbreak: '#8b5cf6',
          resolved: '#3b82f6',
          investigating: '#f59e0b',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.20)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'ping-slow': 'ping 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
