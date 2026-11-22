import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#E8ECEE",
        slate: "#9FACB4",
        paper: "#111820",
        surface: "#1A242C",
        raised: "#243039",
        line: "#34424D",
        blood: { DEFAULT: "#C62A36", dark: "#A31F2A", soft: "#2E1A1F", text: "#FF6B73" },
        ok: "#5FD39B",
        "ok-soft": "#12261D",
        warn: "#F2C660",
        "warn-soft": "#2B2210",
      },
      fontFamily: { sans: ["var(--font-bn)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;