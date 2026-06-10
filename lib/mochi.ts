/** Mochi Dino's official voice — gentle, cheerful, a little clumsy, always supportive. */
export const MOCHI_LINES = {
  greeting: "Hi friend! 💖",
  welcomeBack: "Welcome back! I missed you! 💖",
  beforePhoto: "Let's make something beautiful today.",
  countdown: "3...2...1... Smileeee! 📸",
  afterPhoto: "These memories are so precious! ✨",
  loading: "Packing your memories... 💌",
  emptyState: "Let's create your first memory.",
  decorating: "Sprinkle a little magic on it! 🎀",
  saved: "Tucked safely into your scrapbook! 💌",
  capsuleSealed: "Sealed with love. Future you will smile! ⏳",
  capsuleWaiting: "Shhh... it's not time yet! 🤫",
  capsuleOpen: "A letter from the past, just for you! 💌",
  achievement: "Yay!! You did something wonderful! 🎉",
  encourage: [
    "You're doing great! ✨",
    "I love spending time with you! 💕",
    "Every moment with you sparkles!",
    "Hehe, you make me so happy!",
    "Let's collect happy memories together!"
  ]
} as const;

export const randomEncouragement = () =>
  MOCHI_LINES.encourage[Math.floor(Math.random() * MOCHI_LINES.encourage.length)];

export type MochiPose = "hero" | "happy" | "excited" | "waving" | "curious" | "illustrated";

export const MOCHI_ART: Record<MochiPose, string> = {
  hero: "/mochi/mochi-hero.png",
  happy: "/mochi/mochi-happy.png",
  excited: "/mochi/mochi-excited.png",
  waving: "/mochi/mochi-waving.png",
  curious: "/mochi/mochi-curious.png",
  illustrated: "/mochi/mochi-illustrated.png"
};
