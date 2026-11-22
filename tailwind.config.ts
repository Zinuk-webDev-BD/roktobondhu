import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#EAF0F7",
        slate: "#A9B6C9",
        paper: "#131A2B",
        surface: "rgba(24, 32, 52, 0.55)",
        raised: "rgba(38, 49, 76, 0.75)",
        line: "rgba(150, 170, 210, 0.22)",
        blood: { DEFAULT: "#D12F3C", dark: "#B02330", soft: "rgba(209, 47, 60, 0.16)", text: "#FF8A93" },
        ok: "#6EE7B7",
        "ok-soft": "rgba(110, 231, 183, 0.12)",
        warn: "#FBD27A",
        "warn-soft": "rgba(251, 210, 122, 0.12)",
      },
      fontFamily: { sans: ["var(--font-bn)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;