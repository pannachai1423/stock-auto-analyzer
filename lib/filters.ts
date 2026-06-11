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
    id: "anime-style",
    emoji: "✨",
    css: "contrast(1.25) saturate(1.55) brightness(1.05)",
    className: "filter-anime-style"
  }
];

export const filterById = (id: FilterId) => FILTERS.find((f) => f.id === id) ?? FILTERS[0];

/** Decorative frame design: emoji border + official Mochi art in the caption corner. */
export interface FrameDecor {
  /** emojis cycled along the top border */
  top: string[];
  /** emoji stamped in the corners */
  corner: string;
  /** path to official Mochi artwork shown bottom-right (never redrawn) */
  mochi?: string;
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
  }
];

export const frameById = (id: FrameId) => FRAMES.find((f) => f.id === id) ?? FRAMES[0];
