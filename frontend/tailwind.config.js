/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#161F1B',        // near-black pine, primary text
        paper: '#F5F3EE',      // warm off-white background
        moss: {
          DEFAULT: '#2F6F52',
          dark: '#1F4D38',
          light: '#E4EFE8',
        },
        ochre: {
          DEFAULT: '#E1A63C',
          dark: '#B7822A',
          light: '#FBEFD9',
        },
        clay: '#C1512F',       // reserved for destructive / urgent actions only
        slate: {
          50: '#F6F7F7',
          200: '#DDE1DF',
          400: '#8B948F',
          600: '#4B5650',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '14px',
      },
    },
  },
  plugins: [],
};
