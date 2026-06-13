import type { FilterId, FrameId } from "./types";

/** Film-style extras baked into the captured strip (and previewed live). */
export interface FilterFx {
  /** film grain opacity 0..1 */
  grain?: number;
  /** dark corner vignette opacity 0..1 */
  vignette?: number;
  /** soft bloom glow opacity 0..1 */
  glow?: number;
}

export interface FilterInfo {
  id: FilterId;
  emoji: string;
  /** CSS filter string — used for live preview and canvas compositing */
  css: string;
  className: string;
  fx?: FilterFx;
}

export const FILTERS: FilterInfo[] = [
  { id: "none", emoji: "🌿", css: "none", className: "filter-none-x" },
  {
    id: "korean-beauty",
    emoji: "🌷",
    css: "brightness(1.08) contrast(0.92) saturate(1.05) hue-rotate(-4deg)",
    className: "filter-korean-beauty"
  },
  {
    id: "soft-skin",
    emoji: "🫧",
    css: "brightness(1.1) contrast(0.85) saturate(0.92) blur(0.4px)",
    className: "filter-soft-skin"
  },
  {
    id: "peach-cream",
    emoji: "🍑",
    css: "brightness(1.09) contrast(0.9) saturate(1.12) hue-rotate(-9deg) sepia(0.07)",
    className: "filter-peach-cream",
    fx: { glow: 0.16 }
  },
  {
    id: "milk-tea",
    emoji: "🧋",
    css: "sepia(0.26) saturate(0.9) brightness(1.07) contrast(0.9)",
    className: "filter-milk-tea",
    fx: { grain: 0.08, vignette: 0.14 }
  },
  {
    id: "dreamy-glow",
    emoji: "🌙",
    css: "brightness(1.12) contrast(0.88) saturate(1.15) sepia(0.08)",
    className: "filter-dreamy-glow",
    fx: { glow: 0.3 }
  },
  {
    id: "fairy-glow",
    emoji: "🧚",
    css: "brightness(1.15) contrast(0.82) saturate(1.2) hue-rotate(8deg)",
    className: "filter-fairy-glow",
    fx: { glow: 0.42 }
  },
  {
    id: "kawaii-pink",
    emoji: "🎀",
    css: "brightness(1.08) saturate(1.25) hue-rotate(-12deg) contrast(0.93)",
    className: "filter-kawaii-pink",
    fx: { glow: 0.14 }
  },
  {
    id: "cool-girl",
    emoji: "🤍",
    css: "brightness(1.06) contrast(1.02) saturate(0.82) hue-rotate(10deg)",
    className: "filter-cool-girl"
  },
  {
    id: "y2k-flash",
    emoji: "📸",
    css: "brightness(1.16) contrast(1.18) saturate(1.08)",
    className: "filter-y2k-flash",
    fx: { vignette: 0.4, grain: 0.07 }
  },
  {
    id: "vintage-film",
    emoji: "🎞️",
    css: "sepia(0.38) contrast(1.05) brightness(0.98) saturate(0.85)",
    className: "filter-vintage-film",
    fx: { grain: 0.14, vignette: 0.26 }
  },
  {
    id: "mono-film",
    emoji: "🖤",
    css: "grayscale(1) contrast(1.08) brightness(1.06)",
    className: "filter-mono-film",
    fx: { grain: 0.16, vignette: 0.24 }
  },
  {
    id: "bunny-film",
    emoji: "🐰",
    css: "grayscale(1) contrast(1.32) brightness(1.04)",
    className: "filter-bunny-film",
    fx: { grain: 0.2, vignette: 0.2 }
  },
  {
    id: "studio-mood",
    emoji: "🎬",
    css: "brightness(0.93) contrast(1.2) saturate(0.74) hue-rotate(-6deg)",
    className: "filter-studio-mood",
    fx: { vignette: 0.46, grain: 0.1 }
  },
  {
    id: "flashback",
    emoji: "🤎",
    css: "grayscale(1) sepia(0.55) contrast(1.08) brightness(1.02) saturate(1.4)",
    className: "filter-flashback",
    fx: { grain: 0.16, vignette: 0.3 }
  },
  {
    id: "cozy-glow",
    emoji: "🧣",
    css: "brightness(1.1) contrast(0.94) saturate(1.18) sepia(0.12) hue-rotate(-6deg)",
    className: "filter-cozy-glow",
    fx: { glow: 0.24 }
  },
  {
    id: "anime-style",
    emoji: "✨",
    css: "contrast(1.25) saturate(1.55) brightness(1.05)",
    className: "filter-anime-style"
  }
];

export const filterById = (id: FilterId) => FILTERS.find((f) => f.id === id) ?? FILTERS[0];

/** Decorative frame design: patterned background, emoji border, label and Mochi art. */
export interface FrameDecor {
  /** emojis cycled along the top border */
  top: string[];
  /** emoji stamped in the corners */
  corner: string;
  /** path to official Mochi artwork shown bottom-right (never redrawn) */
  mochi?: string;
  /** background pattern drawn over the base color */
  pattern?: "gingham" | "dots" | "plaid" | "stripe";
  /** pattern ink color */
  patternColor?: string;
  /** secondary accent color (plaid thin lines) */
  patternColor2?: string;
  /** draw the emoji border around the whole perimeter, not just the top */
  border?: boolean;
  /** cute caption label shown above "Dear Memory" (e.g. "keep you close ♡") */
  label?: string;
  /** optional top label-bar text, booth-receipt style (e.g. "THE FURRY ROOM") */
  bar?: string;
}

export interface FrameInfo {
  id: FrameId;
  /** strip background color */
  bg: string;
  /** text color for the caption area */
  text: string;
  swatchClass: string;
  decor?: FrameDecor;
}

export const FRAMES: FrameInfo[] = [
  { id: "cream", bg: "#fff8f0", text: "#6b5b53", swatchClass: "bg-cream-100" },
  { id: "pink", bg: "#ffe1ee", text: "#a45a7c", swatchClass: "bg-blossom-200" },
  { id: "mint", bg: "#dff2da", text: "#5c7f53", swatchClass: "bg-mint-200" },
  { id: "lavender", bg: "#ece3ff", text: "#71619e", swatchClass: "bg-lav-200" },
  { id: "sky", bg: "#ddf0fe", text: "#4f7a99", swatchClass: "bg-skyy-200" },
  { id: "night", bg: "#3b3650", text: "#f6effc", swatchClass: "bg-[#3b3650]" },
  {
    id: "mochi-party",
    bg: "#e9f5e1",
    text: "#5c7f53",
    swatchClass: "bg-mint-100",
    decor: { top: ["💚", "🌸", "⭐"], corner: "🌷", mochi: "/mochi/mochi-excited.png" }
  },
  {
    id: "hearts",
    bg: "#ffe1ee",
    text: "#a45a7c",
    swatchClass: "bg-blossom-200",
    decor: { top: ["💖", "💕", "🎀"], corner: "💝", mochi: "/mochi/mochi-waving.png" }
  },
  {
    id: "stars",
    bg: "#3b3650",
    text: "#f6effc",
    swatchClass: "bg-[#3b3650]",
    decor: { top: ["⭐", "✨", "🌙"], corner: "✨", mochi: "/mochi/mochi-curious.png" }
  },
  {
    id: "keep-close",
    bg: "#e7f5e2",
    text: "#5c7f53",
    swatchClass: "bg-mint-100",
    decor: {
      top: ["💚", "🤍", "💚"],
      corner: "♡",
      mochi: "/mochi/mochi-happy.png",
      pattern: "gingham",
      patternColor: "rgba(132,189,120,0.28)",
      label: "keep you close ♡"
    }
  },
  {
    id: "tiny-love",
    bg: "#fff6f9",
    text: "#a45a7c",
    swatchClass: "bg-blossom-100",
    decor: {
      top: ["🎀", "💗", "🎀"],
      corner: "♥",
      mochi: "/mochi/mochi-waving.png",
      pattern: "dots",
      patternColor: "rgba(248,127,178,0.22)",
      label: "tiny love ·ᴗ·"
    }
  },
  {
    id: "bunny-shoot",
    bg: "#fbfbf7",
    text: "#6b5b53",
    swatchClass: "bg-cream-50",
    decor: {
      top: ["🐰", "🤍", "🐰"],
      corner: "✿",
      mochi: "/mochi/mochi-curious.png",
      label: "bunny shoot ·ᴥ·"
    }
  },
  {
    id: "furry-room",
    bg: "#23222b",
    text: "#f3eef7",
    swatchClass: "bg-[#23222b]",
    decor: {
      top: ["★", "✦", "★"],
      corner: "✦",
      mochi: "/mochi/mochi-excited.png",
      bar: "THE FURRY ROOM ✦ 4CUTS"
    }
  },
  {
    id: "tartan",
    bg: "#7a1f1f",
    text: "#ffe9d6",
    swatchClass: "bg-[#7a1f1f]",
    decor: {
      top: ["🤎", "🏴", "🤎"],
      corner: "✦",
      mochi: "/mochi/mochi-curious.png",
      pattern: "plaid",
      patternColor: "rgba(255,210,170,0.16)",
      patternColor2: "rgba(60,90,60,0.55)",
      label: "flashback ·ᴗ·"
    }
  },
  {
    id: "xmas",
    bg: "#e3f1de",
    text: "#4f7a3f",
    swatchClass: "bg-mint-100",
    decor: {
      top: ["🎄", "🎁", "🔔", "🍓", "⭐"],
      corner: "🎀",
      mochi: "/mochi/mochi-happy.png",
      pattern: "plaid",
      patternColor: "rgba(132,189,120,0.22)",
      patternColor2: "rgba(248,127,178,0.3)",
      border: true,
      label: "merry & cozy ❄"
    }
  },
  {
    id: "heart-frame",
    bg: "#fff1f5",
    text: "#c2415e",
    swatchClass: "bg-blossom-100",
    decor: {
      top: ["💗", "❤️", "💕"],
      corner: "♥",
      mochi: "/mochi/mochi-waving.png",
      border: true,
      label: "love you ♡"
    }
  },
  {
    id: "pink-stripe",
    bg: "#ffeaf2",
    text: "#a45a7c",
    swatchClass: "bg-blossom-100",
    decor: {
      top: ["🎀", "💗", "🎀"],
      corner: "♡",
      mochi: "/mochi/mochi-excited.png",
      pattern: "stripe",
      patternColor: "rgba(255,158,199,0.5)",
      label: "sweet ·ᴗ·"
    }
  }
];

export const frameById = (id: FrameId) => FRAMES.find((f) => f.id === id) ?? FRAMES[0];
