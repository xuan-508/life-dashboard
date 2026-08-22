import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F4F6F8",
        ink: "#1F2937",
        "ink-soft": "#4B5563",
        "ink-faint": "#9CA3AF",
        "ink-border": "#E5E7EB",
        accent: {
          DEFAULT: "#14B8A6",
          light: "#2DD4BF",
          dark: "#0D9488",
          bg: "#CCFBF1",
          bg2: "#99F6E4",
        },
        surface: "#FFFFFF",
        "surface-2": "#F3F4F6",
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
