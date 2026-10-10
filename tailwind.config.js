/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#166534',
        deep: '#064E3B',
        fresh: '#22C55E',
        mint: '#F0FDF4',
        cream: '#FAFAF7',
        gold: '#FACC15',
        ink: '#172B20',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(23,43,32,0.04), 0 8px 24px -8px rgba(22,101,52,0.12)',
        lift: '0 2px 4px rgba(23,43,32,0.05), 0 18px 36px -12px rgba(22,101,52,0.22)',
      },
      keyframes: {
        scan: {
          '0%': { top: '4%' },
          '100%': { top: '92%' },
        },
      },
      animation: {
        scan: 'scan 2.2s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};
