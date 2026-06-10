import type { FilterId, FrameId } from "./types";

export interface FilterInfo {
  id: FilterId;
  label: string;
  emoji: string;
  /** CSS filter string — used for live preview and canvas compositing */
  css: string;
  className: string;
}

export const FILTERS: FilterInfo[] = [
  { id: "none", label: "Natural", emoji: "🌿", css: "none", className: "filter-none-x" },
  {
    id: "korean-beauty",
    label: "Korean Beauty",
    emoji: "🌷",
    css: "brightness(1.08) contrast(0.92) saturate(1.05) hue-rotate(-4deg)",
    className: "filter-korean-beauty"
  },
  {
    id: "soft-skin",
    label: "Soft Skin",
    emoji: "🍑",
    css: "brightness(1.1) contrast(0.85) saturate(0.92) blur(0.4px)",
    className: "filter-soft-skin"
  },
  {
    id: "dreamy-glow",
    label: "Dreamy Glow",
    emoji: "🌙",
    css: "brightness(1.12) contrast(0.88) saturate(1.15) sepia(0.08)",
    className: "filter-dreamy-glow"
  },
  {
    id: "fairy-glow",
    label: "Fairy Glow",
    emoji: "🧚",
    css: "brightness(1.15) contrast(0.82) saturate(1.2) hue-rotate(8deg)",
    className: "filter-fairy-glow"
  },
  {
    id: "vintage-film",
    label: "Vintage Film",
    emoji: "🎞️",
    css: "sepia(0.38) contrast(1.05) brightness(0.98) saturate(0.85)",
    className: "filter-vintage-film"
  },
  {
    id: "kawaii-pink",
    label: "Kawaii Pink",
    emoji: "🎀",
    css: "brightness(1.08) saturate(1.25) hue-rotate(-12deg) contrast(0.93)",
    className: "filter-kawaii-pink"
  },
  {
    id: "anime-style",
    label: "Anime Style",
    emoji: "✨",
    css: "contrast(1.25) saturate(1.55) brightness(1.05)",
    className: "filter-anime-style"
  }
];

export const filterById = (id: FilterId) => FILTERS.find((f) => f.id === id) ?? FILTERS[0];

export interface FrameInfo {
  id: FrameId;
  label: string;
  /** strip background color */
  bg: string;
  /** text color for the caption area */
  text: string;
  swatchClass: string;
}

export const FRAMES: FrameInfo[] = [
  { id: "cream", label: "Cream", bg: "#fff8f0", text: "#6b5b53", swatchClass: "bg-cream-100" },
  { id: "pink", label: "Baby Pink", bg: "#ffe1ee", text: "#a45a7c", swatchClass: "bg-blossom-200" },
  { id: "mint", label: "Mint", bg: "#dff2da", text: "#5c7f53", swatchClass: "bg-mint-200" },
  { id: "lavender", label: "Lavender", bg: "#ece3ff", text: "#71619e", swatchClass: "bg-lav-200" },
  { id: "sky", label: "Sky", bg: "#ddf0fe", text: "#4f7a99", swatchClass: "bg-skyy-200" },
  { id: "night", label: "Starry Night", bg: "#3b3650", text: "#f6effc", swatchClass: "bg-[#3b3650]" }
];

export const frameById = (id: FrameId) => FRAMES.find((f) => f.id === id) ?? FRAMES[0];
