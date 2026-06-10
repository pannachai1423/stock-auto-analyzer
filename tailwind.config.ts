import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mint: {
          50: "#f2faf0",
          100: "#e3f5df",
          200: "#cdebc6",
          300: "#b5e0ab",
          400: "#9ed193",
          500: "#84bd78",
          600: "#699c5f"
        },
        blossom: {
          50: "#fff5f9",
          100: "#ffe8f1",
          200: "#ffd6e8",
          300: "#ffbcd9",
          400: "#ff9ec7",
          500: "#f87fb2"
        },
        cream: {
          50: "#fffdfa",
          100: "#fff8f0",
          200: "#fdf0e2",
          300: "#f8e4cf"
        },
        lav: {
          100: "#f1ecff",
          200: "#e6dbff",
          300: "#d4c2fb",
          400: "#bda5f2"
        },
        skyy: {
          100: "#e8f6ff",
          200: "#cdebff",
          300: "#aeddfb",
          400: "#8ccbf2"
        },
        cocoa: "#6b5b53",
        cocoaSoft: "#9a8a82"
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-display-thai)", "cursive"],
        body: ["var(--font-body)", "var(--font-body-thai)", "sans-serif"]
      },
      boxShadow: {
        plush: "0 10px 30px -8px rgba(187, 148, 132, 0.25)",
        plushLg: "0 24px 60px -16px rgba(187, 148, 132, 0.32)",
        bubble: "0 8px 24px -6px rgba(248, 127, 178, 0.28)"
      },
      borderRadius: {
        squish: "2rem"
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" }
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.025)" }
        },
        twinkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.15)" }
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" }
        },
        pop: {
          "0%": { transform: "scale(0)" },
          "70%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" }
        }
      },
      animation: {
        floaty: "floaty 5s ease-in-out infinite",
        breathe: "breathe 4s ease-in-out infinite",
        twinkle: "twinkle 2.6s ease-in-out infinite",
        wiggle: "wiggle 2.4s ease-in-out infinite",
        pop: "pop .45s cubic-bezier(.2,1.4,.4,1) both"
      }
    }
  },
  plugins: []
};

export default config;
