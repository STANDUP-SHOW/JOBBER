/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111114',        // near-black, primary text
        paper: '#F4F5F7',      // light gray app background
        moss: {
          DEFAULT: '#0B66FF',  // primary accent blue
          dark: '#084ECC',
          light: '#E7F0FF',
        },
        ochre: {
          DEFAULT: '#FFB020',  // secondary accent (warnings, highlights)
          dark: '#C87F00',
          light: '#FFF3DC',
        },
        clay: '#E63950',       // reserved for destructive / urgent actions only
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
        mono: ['"IBM Plex Mono"', 'monospace'],
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
