import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class'], // Enable dark mode based on 'dark' class on html
  theme: {
    extend: {
      colors: {
        border: 'oklch(var(--border))',
        ring: 'oklch(var(--ring))',
        background: 'oklch(var(--background))',
        foreground: 'oklch(var(--foreground))',
        'secondary-background': 'oklch(var(--secondary-background))',
        main: 'oklch(var(--main))',
        'main-foreground': 'oklch(var(--main-foreground))',
        chart1: 'hsl(var(--chart-1))',
        chart2: 'hsl(var(--chart-2))',
        chart3: 'hsl(var(--chart-3))',
        chart4: 'hsl(var(--chart-4))',
        chart5: 'hsl(var(--chart-5))',
        'chart-active-dot': 'oklch(var(--chart-active-dot))',
      },
      boxShadow: {
        shadow: 'var(--shadow)',
      },
      borderRadius: {
        base: 'var(--radius-base)',
      },
      fontWeight: {
        base: 'var(--font-weight-base)',
        heading: 'var(--font-weight-heading)',
      },
    },
  },
  plugins: [],
};
export default config;