import type { CategoryId } from "./types";

export interface CategoryInfo {
  id: CategoryId;
  emoji: string;
  label: string;
  blurb: string;
  pastel: string; // tailwind classes for the card surface
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "love",
    emoji: "💕",
    label: "With Someone I Love",
    blurb: "Every heartbeat, kept safe forever.",
    pastel: "from-blossom-100 to-blossom-200"
  },
  {
    id: "best-friends",
    emoji: "👯",
    label: "Best Friend Memories",
    blurb: "The laughs nobody else would get.",
    pastel: "from-lav-100 to-lav-200"
  },
  {
    id: "birthday",
    emoji: "🎂",
    label: "Birthday Memories",
    blurb: "Candles, wishes, and cake-smudged smiles.",
    pastel: "from-cream-100 to-cream-200"
  },
  {
    id: "graduation",
    emoji: "🎓",
    label: "Graduation Memories",
    blurb: "The day everything you worked for bloomed.",
    pastel: "from-skyy-100 to-skyy-200"
  },
  {
    id: "family",
    emoji: "👨‍👩‍👧",
    label: "Family Memories",
    blurb: "Home is a feeling, not a place.",
    pastel: "from-mint-100 to-mint-200"
  },
  {
    id: "travel",
    emoji: "✈️",
    label: "Travel Memories",
    blurb: "Little adventures, big feelings.",
    pastel: "from-skyy-100 to-lav-100"
  },
  {
    id: "everyday",
    emoji: "🌸",
    label: "Everyday Moments",
    blurb: "Ordinary days are secretly the best ones.",
    pastel: "from-blossom-50 to-cream-200"
  },
  {
    id: "before-everything-changes",
    emoji: "💌",
    label: "Before Everything Changes",
    blurb: "Hold this moment a little tighter.",
    pastel: "from-lav-100 to-blossom-100"
  }
];

export const categoryById = (id: CategoryId) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[6];
