import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        af: {
          pink: "#E91E8C",
          "pink-dark": "#C01876",
          "pink-light": "#FCE4F0",
          navy: "#1a1a2e",
          "navy-light": "#2a2a4a",
          orange: "#FF6B35",
          "orange-light": "#FFE5DC",
          gray: "#F5F5F7",
          "gray-dark": "#8E8E93",
        },
      },
      fontFamily: {
        sans: ["var(--font-kanit)", "var(--font-inter)", "system-ui", "sans-serif"],
        kanit: ["var(--font-kanit)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        "af-card": "0 4px 16px -4px rgba(233, 30, 140, 0.08)",
        "af-hover": "0 8px 24px -6px rgba(233, 30, 140, 0.18)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
