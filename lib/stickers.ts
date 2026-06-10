/**
 * Sticker catalog for the decoration editor.
 * Emoji stickers render as text; "mochi:" stickers render the official
 * Mochi Dino artwork (never redrawn, always the real asset).
 */
export interface StickerDef {
  key: string;
  kind: "emoji" | "mochi";
  /** emoji char, or public path for mochi art */
  value: string;
  label: string;
}

export const STICKERS: StickerDef[] = [
  { key: "heart", kind: "emoji", value: "💖", label: "Heart" },
  { key: "hearts", kind: "emoji", value: "💕", label: "Two Hearts" },
  { key: "star", kind: "emoji", value: "⭐", label: "Star" },
  { key: "sparkle", kind: "emoji", value: "✨", label: "Sparkles" },
  { key: "bow", kind: "emoji", value: "🎀", label: "Bow" },
  { key: "flower", kind: "emoji", value: "🌸", label: "Blossom" },
  { key: "tulip", kind: "emoji", value: "🌷", label: "Tulip" },
  { key: "cloud", kind: "emoji", value: "☁️", label: "Cloud" },
  { key: "rainbow", kind: "emoji", value: "🌈", label: "Rainbow" },
  { key: "letter", kind: "emoji", value: "💌", label: "Love Letter" },
  { key: "cherry", kind: "emoji", value: "🍒", label: "Cherries" },
  { key: "strawberry", kind: "emoji", value: "🍓", label: "Strawberry" },
  { key: "mochi-happy", kind: "mochi", value: "/mochi/mochi-happy.png", label: "Mochi Happy" },
  { key: "mochi-excited", kind: "mochi", value: "/mochi/mochi-excited.png", label: "Mochi Excited" },
  { key: "mochi-waving", kind: "mochi", value: "/mochi/mochi-waving.png", label: "Mochi Waving" },
  { key: "mochi-curious", kind: "mochi", value: "/mochi/mochi-curious.png", label: "Mochi Curious" }
];

export const stickerByKey = (key: string) => STICKERS.find((s) => s.key === key);
