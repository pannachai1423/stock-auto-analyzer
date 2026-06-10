"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

export interface MochiToast {
  id: number;
  title: string;
  body?: string;
  emoji?: string;
}

let toastId = 0;

/** Fire a cute toast from anywhere on the client. */
export function mochiToast(title: string, body?: string, emoji = "💖") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<MochiToast>("mochi-toast", {
      detail: { id: ++toastId, title, body, emoji }
    })
  );
}

export default function MochiToaster() {
  const [toasts, setToasts] = useState<MochiToast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const toast = (e as CustomEvent<MochiToast>).detail;
      setToasts((t) => [...t, toast]);
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== toast.id));
      }, 4200);
    };
    window.addEventListener("mochi-toast", onToast);
    return () => window.removeEventListener("mochi-toast", onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex w-[min(380px,92vw)] -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 28, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="glass-strong flex items-center gap-3 rounded-3xl px-4 py-3 shadow-plushLg"
          >
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white bg-cream-100">
              <Image src="/mochi/mochi-face.png" alt="" fill sizes="44px" className="object-cover" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-base leading-tight text-cocoa">
                {t.emoji} {t.title}
              </p>
              {t.body && <p className="truncate text-xs text-cocoaSoft">{t.body}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
