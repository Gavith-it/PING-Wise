import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A3E9E',
          light: '#2E5BC7',
          dark: '#0F2A7A',
          lighter: '#E6EDFF',
          darker: '#0A1F5C'
        },
        medical: {
          green: '#10b981',
          'green-light': '#34d399',
          'green-dark': '#059669',
          'green-lighter': '#d1fae5',
          teal: '#14b8a6',
          emerald: '#10b981'
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'toast-slide': 'toastSlide 0.3s ease-out'
      },
      keyframes: {
        slideIn: {
          'from': { transform: 'translateX(100%)' },
          'to': { transform: 'translateX(0)' }
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        toastSlide: {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
export default config

