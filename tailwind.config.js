/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#ffffff',
        surface: '#f8fafc',
        card: '#ffffff',
        border: '#e2e8f0',
        accent: '#10b981',
        'accent-light': '#d1fae5',
        'accent-dark': '#059669',
        success: '#10b981',
        error: '#ef4444',
        muted: '#64748b',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
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
