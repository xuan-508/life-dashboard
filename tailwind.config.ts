import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)",
        "ink-faint": "rgb(var(--ink-faint) / <alpha-value>)",
        "ink-border": "rgb(var(--ink-border) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          light: "rgb(var(--accent-light) / <alpha-value>)",
          dark: "rgb(var(--accent-dark) / <alpha-value>)",
          bg: "rgb(var(--accent-bg) / <alpha-value>)",
          bg2: "rgb(var(--accent-bg2) / <alpha-value>)",
        },
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(var(--shadow-color) / 0.12)",
        panel: "0 10px 40px rgba(var(--shadow-color) / 0.18)",
        float: "0 2px 8px rgba(var(--shadow-color) / 0.10)",
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
