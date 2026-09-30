/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6f7ff',
          100: '#b3e8ff',
          200: '#80d8ff',
          300: '#4dc8ff',
          400: '#1ab8ff',
          500: '#00a8e8',
          600: '#0086ba',
          700: '#00648c',
          800: '#00425e',
          900: '#002030',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        surface: {
          900: '#0a0e1a',
          800: '#0f1421',
          700: '#141929',
          600: '#1a2035',
          500: '#1e2640',
          400: '#252d4a',
        },
        editor: {
          bg: '#0d1117',
          line: '#161b22',
          border: '#21262d',
          text: '#e6edf3',
          muted: '#7d8590',
          accent: '#388bfd',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
