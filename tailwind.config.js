/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FDFCFB',
        surface: '#F5F7F5',
        card: '#ffffff',
        border: '#E8ECE8',
        accent: '#D4AF37',
        'accent-light': '#F7CAC9',
        'accent-dark': '#8A9A8A',
        success: '#8A9A8A',
        error: '#E57373',
        muted: '#7A7A7A',
        sage: '#8A9A8A',
        lavender: '#E6E6FA',
        'rose-quartz': '#F7CAC9',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'card': '0 0 0 1px rgb(0 0 0 / 0.05), 0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 0 0 1px rgb(16 185 129 / 0.2), 0 10px 15px -3px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        DEFAULT: '16px',
        sm: '8px',
        xl: '24px',
      },
    },
  },
  plugins: [],
}
