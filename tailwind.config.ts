import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Quza brand purple — shared by every Quza app (seller, admin, mobile).
        primary: {
          50: '#f7f5ff',
          100: '#efeaff',
          200: '#e0d7ff',
          300: '#c9b8fe',
          400: '#ab8ffb',
          500: '#8f66f5',
          600: '#7847e8',
          700: '#6535cc',
          800: '#542da6',
          900: '#462884',
          950: '#2a1657',
        },
        // Orchid companion — gradient ends and highlight chips next to the purple.
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fire-flicker': {
          '0%, 100%': { transform: 'scaleY(1) rotate(-2deg)' },
          '50%': { transform: 'scaleY(1.08) rotate(2deg)' },
        },
        'badge-pop': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'shimmer': 'shimmer 2.5s linear infinite',
        'fire-flicker': 'fire-flicker 0.9s ease-in-out infinite',
        'badge-pop': 'badge-pop 0.4s ease-out both',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
export default config
