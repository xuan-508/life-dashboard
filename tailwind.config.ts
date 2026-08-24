import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FDF7FF",
        ink: "#4B1D6B",
        "ink-soft": "#7C5A8D",
        "ink-faint": "#B9A4C7",
        "ink-border": "#EADCF6",
        accent: {
          DEFAULT: "#D946EF",
          light: "#F0ABFC",
          dark: "#A21CAF",
          bg: "#FAE8FF",
          bg2: "#F5D0FE",
        },
        surface: "#FFFFFF",
        "surface-2": "#F9F5FB",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(124, 58, 237, 0.10)",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "label": ["11px", { letterSpacing: "0.08em", lineHeight: "1.2" }],
        "stat": ["28px", { lineHeight: "1.1", fontWeight: "600" }],
        "stat-sm": ["18px", { lineHeight: "1.2", fontWeight: "500" }],
      },
      borderRadius: {
        "card": "16px",
        "xl-card": "20px",
        "sm-clean": "8px",
      },
    },
  },
  plugins: [],
};

export default config;
