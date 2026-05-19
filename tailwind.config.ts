import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#131410",
        surface: "#171814",
        "surface-dim": "#0e0f0b",
        "surface-container": "#20201c",
        "surface-container-low": "#1a1b17",
        "surface-container-high": "#2a2a26",
        "surface-container-highest": "#353530",
        primary: "#87d7ad",
        secondary: "#66dd8b",
        tertiary: "#a6d0bc",
        "primary-container": "#006241",
        "secondary-container": "#25a55a",
        "on-primary": "#003824",
        "on-surface": "#e5e2db",
        "on-surface-variant": "#bec9c0",
        outline: "#89938b",
        "outline-variant": "#3f4943",
        amber: "#f2c879"
      },
      fontFamily: {
        display: ["var(--font-sora)", "Sora", "sans-serif"],
        body: ["var(--font-manrope)", "Manrope", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"]
      },
      animation: {
        ambient: "ambient 60s linear infinite",
        float: "float 8s ease-in-out infinite",
        shimmer: "shimmer 4s ease-in-out infinite"
      },
      keyframes: {
        ambient: {
          from: { backgroundPosition: "50% 50%, 50% 50%" },
          to: { backgroundPosition: "350% 50%, 350% 50%" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-18px)" }
        },
        shimmer: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "0.95" }
        }
      },
      boxShadow: {
        glow: "0 0 28px rgba(135, 215, 173, 0.24)",
        "inner-glow": "inset 1px 1px 0 rgba(212, 255, 234, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
