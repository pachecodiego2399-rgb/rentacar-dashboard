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
        brand: {
          primary: "var(--color-primary)",
          secondary: "var(--color-secondary)",
          accent: "var(--color-accent)",
          forest: "var(--color-forest)",
        },
        // Sistema visual del panel (mismo lenguaje que la landing de la
        // oferta): navy casi negro, un solo acento azul, verde solo para lo
        // positivo, rojo solo para lo urgente.
        n: {
          bg: "#070b14",
          side: "#0a1020",
          card: "#0f1729",
          card2: "#131d33",
          hover: "#17223b",
          line: "rgba(148,171,214,0.13)",
          line2: "rgba(148,171,214,0.22)",
          fg: "#eaf0fc",
          muted: "#8c97b3",
          faint: "#5c6684",
          acc: "#4c7eff",
          acc2: "#7fc1ff",
          ok: "#34d399",
          warn: "#f5b454",
          bad: "#f87171",
          night: "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
