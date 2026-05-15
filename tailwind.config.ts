import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#071014",
        panel: "#0d181d",
        panelSoft: "#122127",
        line: "#24363d",
        lime: "#78d64b",
        danger: "#f05252",
        caution: "#f5c542",
        cyan: "#44c7d8"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(68,199,216,.16), 0 18px 60px rgba(0,0,0,.34)"
      }
    }
  },
  plugins: []
};

export default config;
