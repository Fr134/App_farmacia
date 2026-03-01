import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0B0F19",
        "bg-card": "#111827",
        "border-card": "#1E293B",
        "accent-blue": "#3B82F6",
        "accent-green": "#10B981",
        "accent-red": "#EF4444",
        "accent-amber": "#F59E0B",
        "accent-purple": "#8B5CF6",
        "accent-cyan": "#06B6D4",
        "text-primary": "#F1F5F9",
        "text-muted": "#94A3B8",
        "text-dim": "#64748B",
      },
      borderRadius: {
        card: "16px",
        btn: "8px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse-slow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
