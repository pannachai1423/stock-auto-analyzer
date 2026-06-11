import type { Metadata } from "next";
import MemoryGameView from "@/components/MemoryGameView";

export const metadata: Metadata = {
  title: "Mini Game · Dear Memory 🎮",
  description: "Mochi Memory Match — a cozy card-matching game to play with friends, cheered on by Mochi Dino."
};

export default function GamePage() {
  return <MemoryGameView />;
}
