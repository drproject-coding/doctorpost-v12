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
        // Bruddle Design System v2
        "bru-purple": "#631DED",
        "bru-purple-hover": "#4A14B8",
        "bru-purple-active": "#8B4FF5",
        "bru-black": "#121212",
        "bru-orange": "#FF6C01",
        "bru-cream": "#F2F2F2",
        "bru-surface": "#F2F2F2",
        "bru-yellow": "#FAE8A4",
        "bru-pink": "#E99898",
        "bru-mint": "#98E9AB",
        "bru-grey": "#666666",
        "bru-charcoal": "#282828",
        // Semantic
        "bru-success": "#00AA00",
        "bru-error": "#FF4444",
        "bru-warning": "#FFAA00",
        "bru-info": "#0066FF",
      },
      fontFamily: {
        visby: ["Visby", "Roboto Flex", "sans-serif"],
      },
      borderWidth: {
        bru: "2px",
      },
      boxShadow: {
        "bru-xs": "2px 2px 0 0 rgba(0,0,0,1)",
        "bru-sm": "3px 3px 0 0 rgba(0,0,0,1)",
        "bru-md": "4px 4px 0 0 rgba(0,0,0,1)",
        "bru-lg": "6px 6px 0 0 rgba(0,0,0,1)",
        "bru-xl": "8px 8px 0 0 rgba(0,0,0,1)",
        "bru-hover": "6px 6px 0 0 #631DED",
      },
      borderRadius: {
        "bru-sm": "0",
        "bru-md": "0",
        "bru-lg": "0",
        "bru-none": "0",
      },
    },
  },
  plugins: [],
};
export default config;
