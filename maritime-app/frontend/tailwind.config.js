/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        maritime: {
          blue:  '#1d4ed8',
          navy:  '#1e3a5f',
          light: '#dbeafe',
          dark:  '#1e293b',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};
