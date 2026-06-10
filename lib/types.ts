export type FilterId =
  | "none"
  | "korean-beauty"
  | "soft-skin"
  | "dreamy-glow"
  | "fairy-glow"
  | "vintage-film"
  | "kawaii-pink"
  | "anime-style";

export type FrameId = "cream" | "pink" | "mint" | "lavender" | "sky" | "night";

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
