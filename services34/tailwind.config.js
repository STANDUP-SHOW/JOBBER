/** @type {import('tailwindcss').Config} */
// Placeholder brand palette (navy blue + golden yellow) — swap for the real
// Services 34 logo colors once supplied. Deliberately distinct shades from
// Jobber's own moss/ochre so the two brands never look identical even before
// the real logo lands.
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101828',
        paper: '#F5F6F8',
        brand: {
          DEFAULT: '#1E4FA3',
          dark: '#163B7A',
          light: '#E8EFFA',
        },
        accent: {
          DEFAULT: '#F5B400',
          dark: '#C28F00',
          light: '#FFF6DC',
        },
        clay: '#E63950',
        slate: {
          50: '#FAFAFB',
          200: '#E5E5EA',
          400: '#8E8E93',
          600: '#48484C',
        },
      },
      fontFamily: {
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '18px',
      },
    },
  },
  plugins: [],
};
