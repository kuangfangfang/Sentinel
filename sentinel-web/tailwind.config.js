/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Calm, civic, trustworthy palette: deep navy + slate neutrals + a single blue accent (SRS 8.3).
      colors: {
        navy: {
          50: '#eef2f8',
          100: '#d6e0ee',
          200: '#aec1dd',
          300: '#7e9bc6',
          400: '#5175ab',
          500: '#365890',
          600: '#284674',
          700: '#1f3760',
          800: '#172a4c',
          900: '#0f1d38',
          950: '#0a1428',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
