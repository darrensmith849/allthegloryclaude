import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        colour: {
          bg: "rgb(var(--colour-bg-rgb) / <alpha-value>)",
          fg: "rgb(var(--colour-fg-rgb) / <alpha-value>)",
          accent: "rgb(var(--colour-accent-rgb) / <alpha-value>)",
          surface: "rgb(var(--colour-surface-rgb) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
