import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  corePlugins: {
    preflight: false, // CRITICAL: Tailwind Preflight destroys DS base styles
  },
  theme: {
    extend: {
      colors: {
        // Doctor Project Design System
        "drp-purple": "#631DED",
        "drp-purple-hover": "#4A14B8",
        "drp-purple-active": "#8B4FF5",
        "drp-black": "#121212",
        "drp-orange": "#FF6C01",
        "drp-cream": "#F2F2F2",
        "drp-surface": "#F2F2F2",
        "drp-yellow": "#FAE8A4",
        "drp-pink": "#E99898",
        "drp-mint": "#98E9AB",
        "drp-grey": "#666666",
        "drp-charcoal": "#282828",
        // Semantic
        "drp-success": "#00AA00",
        "drp-error": "#FF4444",
        "drp-warning": "#FFAA00",
        "drp-info": "#0066FF",
      },
      fontFamily: {
        visby: ["Visby", "Roboto Flex", "sans-serif"],
      },
      borderWidth: {
        drp: "2px",
      },
      boxShadow: {
        "drp-xs": "2px 2px 0 0 rgba(0,0,0,1)",
        "drp-sm": "3px 3px 0 0 rgba(0,0,0,1)",
        "drp-md": "4px 4px 0 0 rgba(0,0,0,1)",
        "drp-lg": "6px 6px 0 0 rgba(0,0,0,1)",
        "drp-xl": "8px 8px 0 0 rgba(0,0,0,1)",
        "drp-hover": "6px 6px 0 0 #631DED",
      },
      borderRadius: {
        "drp-sm": "0",
        "drp-md": "0",
        "drp-lg": "0",
        "drp-none": "0",
      },
    },
  },
  plugins: [],
};
export default config;
