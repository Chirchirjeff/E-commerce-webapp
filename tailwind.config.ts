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
    },
  },
  darkMode: 'class',
  plugins: [],
}
export default config
