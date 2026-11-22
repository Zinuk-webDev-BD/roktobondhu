import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1D2326",
        slate: "#5B6770",
        paper: "#F6F7F5",
        line: "#DDE1DE",
        blood: { DEFAULT: "#B3202A", dark: "#8E1821", soft: "#F6E3E4" },
        ok: "#2F6B4F",
      },
      fontFamily: { sans: ["var(--font-bn)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;