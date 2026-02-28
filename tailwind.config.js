/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: ['class'], // Enable dark mode based on 'dark' class on html
  theme: {
    extend: {
      colors: {
        // Base Neo-brutalism colors
        'charcoal-black': '#282828',
        'purple-electric': '#631DED',
        'blazing-orange': '#FF6C01',
        'ivory-white': '#F2F2F2',

        // Neo-brutalism design system variables mapped to Tailwind colors
        'neo-background': 'var(--neo-background)',
        'neo-foreground': 'var(--neo-foreground)',
        'neo-accent': 'var(--neo-accent)',
        'neo-secondary': 'var(--neo-secondary)',
        'neo-border': 'var(--neo-border)',
      },
      borderRadius: {
        'neo': 'var(--neo-border-radius)',
      },
      borderWidth: {
        'neo': 'var(--neo-border-width)',
      },
      boxShadow: {
        'neo': 'var(--neo-shadow)',
        'neo-hover': 'var(--neo-shadow-hover)',
      },
    },
  },
  plugins: [],
}