import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF9F6",
        ink: "#1A1A1A",
        "ink-soft": "#555555",
        "ink-faint": "#999999",
        "ink-border": "#E5E2DA",
        accent: {
          DEFAULT: "#3B9D4A",
          light: "#5BC06A",
          dark: "#2A7A36",
          bg: "#EAF5EC",
          bg2: "#D4ECDA",
        },
        surface: "#FFFFFF",
        "surface-2": "#F3F1EB",
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
        "card": "12px",
        "sm-clean": "6px",
      },
    },
  },
  plugins: [],
};

export default config;
