/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#07060a',
          900: '#0b0a10',
          800: '#13111c',
          700: '#1b1828',
          600: '#262238',
        },
        ember: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          glow: '#ff6b00',
          gold: '#ffb703',
          plasma: '#ff3d00',
        },
        plasma: {
          cyan: '#00f5d4',
          violet: '#9d4edd',
          purple: '#7b2cbf',
          fuchsia: '#f72585',
        },
        glass: {
          surface: 'rgba(18, 16, 28, 0.65)',
          surfaceLight: 'rgba(255, 255, 255, 0.65)',
          border: 'rgba(255, 255, 255, 0.1)',
          borderEmber: 'rgba(255, 120, 30, 0.3)',
          highlight: 'rgba(255, 255, 255, 0.2)',
        }
      },
      boxShadow: {
        'glass-specular': 'inset 1px 1px 1px 0px rgba(255, 255, 255, 0.25), inset -1px -1px 2px 0px rgba(0, 0, 0, 0.6), 0 10px 30px -10px rgba(0, 0, 0, 0.7)',
        'glass-hover': 'inset 1px 1px 2px 0px rgba(255, 255, 255, 0.4), inset -1px -1px 2px 0px rgba(255, 107, 0, 0.3), 0 15px 35px -5px rgba(255, 85, 0, 0.25)',
        'ember-glow': '0 0 25px -3px rgba(255, 107, 0, 0.45)',
        'ember-glow-lg': '0 0 50px -5px rgba(255, 80, 0, 0.6)',
      },
      animation: {
        'ember-flicker': 'emberFlicker 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heat-wave': 'heatWave 4s ease-in-out infinite',
        'plasma-pulse': 'plasmaPulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        emberFlicker: {
          '0%, 100%': { opacity: '0.85', filter: 'brightness(1)' },
          '25%': { opacity: '1', filter: 'brightness(1.2) drop-shadow(0 0 8px #ff6b00)' },
          '50%': { opacity: '0.75', filter: 'brightness(0.95)' },
          '75%': { opacity: '0.95', filter: 'brightness(1.15) drop-shadow(0 0 12px #ff8c00)' },
        },
        heatWave: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-2px) scale(1.002)' },
        },
        plasmaPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
