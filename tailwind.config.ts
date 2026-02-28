import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Bruddle Design System
        "bru-purple": "#AE7AFF",
        "bru-purple-hover": "#9B5FF5",
        "bru-black": "#000000",
        "bru-cream": "#FAF4F0",
        "bru-surface": "#FEFCFA",
        "bru-yellow": "#FAE8A4",
        "bru-pink": "#E99898",
        "bru-mint": "#98E9AB",
        "bru-grey": "#5F646D",
        // Semantic
        "bru-success": "#98E9AB",
        "bru-error": "#E99898",
        "bru-warning": "#FAE8A4",
        "bru-info": "#AE7AFF",
      },
      fontFamily: {
        visby: ["Visby", "Roboto Flex", "sans-serif"],
      },
      borderWidth: {
        bru: "2px",
      },
      boxShadow: {
        "bru-sm": "3px 3px 0 0 rgba(0,0,0,1)",
        "bru-md": "4px 4px 0 0 rgba(0,0,0,1)",
        "bru-lg": "6px 6px 0 0 rgba(0,0,0,1)",
      },
      borderRadius: {
        "bru-sm": "4px",
        "bru-md": "6px",
        "bru-lg": "8px",
      },
    },
  },
  plugins: [],
};
export default config;
