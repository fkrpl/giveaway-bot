/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          purple: '#a855f7',
          'purple-light': '#c084fc',
          'purple-dark': '#7c3aed',
          fuchsia: '#d946ef',
        },
      },
      animation: {
        'glow': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
