"use client";

import { useEffect, useState } from "react";

interface Drifter {
  id: number;
  emoji: string;
  left: number; // vw
  size: number; // px
  duration: number; // s
  delay: number; // s
  opacity: number;
}

const POOL = ["💖", "✨", "⭐", "🌸", "☁️", "💕", "🎀", "🌷", "💌", "🫧"];

/**
 * Full-screen layer of gently rising hearts, stars and sparkles.
 * Generated on the client only, so SSR markup stays deterministic.
 */
export default function FloatingBackground({ count = 16 }: { count?: number }) {
  const [drifters, setDrifters] = useState<Drifter[]>([]);

  useEffect(() => {
    setDrifters(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: POOL[i % POOL.length],
        left: Math.random() * 96,
        size: 14 + Math.random() * 18,
        duration: 16 + Math.random() * 18,
        delay: -Math.random() * 30,
        opacity: 0.25 + Math.random() * 0.35
      }))
    );
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {drifters.map((d) => (
        <span
          key={d.id}
          className="absolute"
          style={{
            left: `${d.left}vw`,
            fontSize: d.size,
            opacity: d.opacity,
            animation: `drift ${d.duration}s linear ${d.delay}s infinite`
          }}
        >
          {d.emoji}
        </span>
      ))}
      <style jsx>{`
        @keyframes drift {
          0% {
            transform: translateY(106vh) rotate(0deg);
          }
          100% {
            transform: translateY(-12vh) rotate(340deg);
          }
        }
      `}</style>
    </div>
  );
}
