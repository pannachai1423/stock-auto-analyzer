export type FilterId =
  | "none"
  | "korean-beauty"
  | "soft-skin"
  | "peach-cream"
  | "milk-tea"
  | "dreamy-glow"
  | "fairy-glow"
  | "kawaii-pink"
  | "cool-girl"
  | "y2k-flash"
  | "vintage-film"
  | "mono-film"
  | "bunny-film"
  | "studio-mood"
  | "flashback"
  | "cozy-glow"
  | "anime-style";

export type FrameId =
  | "cream"
  | "pink"
  | "mint"
  | "lavender"
  | "sky"
  | "night"
  | "mochi-party"
  | "hearts"
  | "stars"
  | "keep-close"
  | "tiny-love"
  | "bunny-shoot"
  | "furry-room"
  | "tartan"
  | "xmas"
  | "heart-frame"
  | "pink-stripe";

export type CategoryId =
  | "love"
  | "best-friends"
  | "birthday"
  | "graduation"
  | "family"
  | "travel"
  | "everyday"
  | "before-everything-changes";

export interface PlacedSticker {
  id: string;
  /** key into the sticker catalog (emoji or mochi pose) */
  sticker: string;
  /** position as fraction of strip width/height (0..1) */
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface Memory {
  id: string;
  createdAt: number;
  title: string;
  note: string;
  category: CategoryId;
  layout: 4 | 6;
  /** photo arrangement — vertical strip or 2-column grid (old memories default to strip) */
  layoutStyle?: "strip" | "grid";
  filter: FilterId;
  frame: FrameId;
  /** final composited photo strip as data URL */
  stripDataUrl: string;
}

export interface TimeCapsule {
  id: string;
  createdAt: number;
  opensAt: number;
  message: string;
  from: string;
  opened: boolean;
  memoryId?: string;
}

export interface AchievementState {
  id: string;
  unlockedAt: number;
}
