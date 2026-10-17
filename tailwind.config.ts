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
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
        },
        // Light theme: Orange & Golden tones
        warm: {
          50: '#fef3f2',
          100: '#fde8e4',
          200: '#fbd5cc',
          300: '#f8b4a0',
          400: '#f48d74',
          500: '#ea6f54',
          600: '#d85c3c',
          700: '#b84423',
          800: '#9a3822',
          900: '#7f2f1e',
        },
        // Golden accent
        gold: {
          50: '#fffbf0',
          100: '#fef5e0',
          200: '#fde7c4',
          300: '#fcd596',
          400: '#fac056',
          500: '#f5a623',
          600: '#e89a1a',
          700: '#d98c15',
          800: '#b47413',
          900: '#935f11',
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
