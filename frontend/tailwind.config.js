/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0f1e',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#0f172a',
          900: '#0a0f1e',
          950: '#030712',
        }
      },
      fontFamily: {
        sans: [
          'Noto Sans Devanagari',
          'Noto Sans Bengali',
          'Noto Sans Tamil',
          'Noto Sans Telugu',
          'Noto Sans Kannada',
          'Noto Sans Gujarati',
          'Noto Sans Malayalam',
          'Noto Sans Gurmukhi',
          'Noto Sans Oriya',
          'Inter',
          'Noto Sans',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
}
