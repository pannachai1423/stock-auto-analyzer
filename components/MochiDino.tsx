"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MOCHI_ART, type MochiPose } from "@/lib/mochi";

interface MochiDinoProps {
  pose?: MochiPose;
  /** rendered width in px */
  size?: number;
  /** speech bubble text (omit to hide) */
  message?: string;
  /** float gently up and down */
  float?: boolean;
  /** follow the cursor with a soft parallax tilt */
  interactive?: boolean;
  className?: string;
  priority?: boolean;
}

interface BurstHeart {
  id: number;
  dx: number;
  emoji: string;
}

/**
 * The official Mochi Dino — always rendered from the real brand artwork.
 * He floats, breathes, blinks, leans toward the cursor, and does a happy
 * jump (with a burst of hearts) when tapped.
 */
export default function MochiDino({
  pose = "hero",
  size = 300,
  message,
  float = true,
  interactive = true,
  className = "",
  priority = false
}: MochiDinoProps) {
  const [tapPose, setTapPose] = useState<MochiPose | null>(null);
  const [jumping, setJumping] = useState(false);
  const [hearts, setHearts] = useState<BurstHeart[]>([]);
  const heartId = useRef(0);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 14 });
  const sy = useSpring(my, { stiffness: 60, damping: 14 });
  const rotate = useTransform(sx, [-1, 1], [-5, 5]);
  const tx = useTransform(sx, [-1, 1], [-10, 10]);
  const ty = useTransform(sy, [-1, 1], [-6, 6]);

  useEffect(() => {
    if (!interactive) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [interactive, mx, my]);

  const happyJump = useCallback(() => {
    if (jumping) return;
    setJumping(true);
    setTapPose("excited");
    const burst: BurstHeart[] = Array.from({ length: 6 }, (_, i) => ({
      id: heartId.current++,
      dx: (i - 2.5) * 26 + (Math.random() * 14 - 7),
      emoji: ["💖", "💕", "✨", "🌸", "💗", "⭐"][i]
    }));
    setHearts((h) => [...h, ...burst]);
    window.setTimeout(() => setJumping(false), 700);
    window.setTimeout(() => setTapPose(null), 1500);
    window.setTimeout(
      () => setHearts((h) => h.filter((x) => !burst.some((b) => b.id === x.id))),
      1300
    );
  }, [jumping]);

  const shownPose = tapPose ?? pose;
  const art = MOCHI_ART[shownPose];
  const showEyelids = shownPose === "hero";

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="relative z-10 mb-3 max-w-[260px] rounded-3xl glass-strong px-5 py-3 text-center font-display text-base text-cocoa shadow-bubble"
        >
          {message}
          <span
            className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm bg-white/75 border-b border-r border-white/80"
            aria-hidden
          />
        </motion.div>
      )}

      <motion.button
        type="button"
        aria-label="Say hi to Mochi Dino"
        onClick={happyJump}
        style={interactive ? { rotate, x: tx, y: ty } : undefined}
        animate={jumping ? { y: [0, -34, 0, -12, 0] } : undefined}
        transition={jumping ? { duration: 0.7, times: [0, 0.35, 0.65, 0.82, 1] } : undefined}
        className={`relative cursor-pointer border-0 bg-transparent p-0 outline-none ${
          float && !jumping ? "animate-floaty" : ""
        }`}
      >
        <span className="block animate-breathe">
          <Image
            src={art}
            alt="Mochi Dino, the Dear Memory mascot"
            width={size}
            height={Math.round(size * 1.24)}
            priority={priority}
            className="pointer-events-none select-none drop-shadow-[0_18px_28px_rgba(132,189,120,0.35)]"
            draggable={false}
          />
          {showEyelids && (
            <>
              {/* eyelids positioned over the raster eyes so Mochi can blink */}
              <span
                aria-hidden
                className="mochi-eyelid absolute rounded-[50%] bg-[#d5deb0]"
                style={{ left: "39.9%", top: "30.2%", width: "12.4%", height: "12.4%" }}
              />
              <span
                aria-hidden
                className="mochi-eyelid absolute rounded-[50%] bg-[#e4ecbf]"
                style={{ left: "72.8%", top: "26.6%", width: "10.6%", height: "12.4%" }}
              />
            </>
          )}
        </span>

        {/* heart burst on tap */}
        {hearts.map((h) => (
          <motion.span
            key={h.id}
            initial={{ opacity: 0, y: 0, x: h.dx, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], y: -90 - Math.abs(h.dx) * 0.4, scale: 1.1 }}
            transition={{ duration: 1.15, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-6 text-2xl"
            aria-hidden
          >
            {h.emoji}
          </motion.span>
        ))}
      </motion.button>

      {/* soft plush shadow */}
      <span
        aria-hidden
        className="mt-[-10px] h-4 rounded-full bg-mint-500/20 blur-md"
        style={{ width: size * 0.55 }}
      />
    </div>
  );
}
