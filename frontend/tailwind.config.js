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
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        bg: {
          primary: '#06130c',
          secondary: '#091b11',
          card: '#0e2619',
          elevated: '#133321',
        },
        brand: {
          green: '#22c55e',
          'green-dim': '#16a34a',
          'green-glow': '#4ade80',
          leaf: '#10b981',
          lime: '#84cc16',
          earth: '#92400e',
          harvest: '#f59e0b',
        },
        status: {
          low: '#22c55e',
          medium: '#f59e0b',
          high: '#ef4444',
          outbreak: '#8b5cf6',
          resolved: '#10b981',
          investigating: '#f59e0b',
        },
        border: {
          subtle: 'rgba(34,197,94,0.08)',
          DEFAULT: 'rgba(34,197,94,0.15)',
          strong: 'rgba(74,222,128,0.25)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
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
