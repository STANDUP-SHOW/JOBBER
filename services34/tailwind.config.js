/** @type {import('tailwindcss').Config} */
// Brand palette from the real Services 34 logo (house + magnifying glass):
// "brand" is the piscine/master dark blue, the other 4 category tints live
// in lib/brand-context.jsx and are applied inline since they change per page.
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101828',
        paper: '#F5F6F8',
        brand: {
          DEFAULT: '#123E7A',
          dark: '#0C2C59',
          light: '#E5ECF6',
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
        // Bold rounded-geometric face matching the original logo's
        // "BRAND NAME" wordmark style — used only for the header wordmark.
        brand: ['"Poppins"', 'system-ui', 'sans-serif'],
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
