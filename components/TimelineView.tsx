"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import MochiDino from "./MochiDino";
import { MOCHI_LINES } from "@/lib/mochi";
import { categoryById } from "@/lib/categories";
import { loadMemories } from "@/lib/storage";
import type { Memory } from "@/lib/types";

interface MonthGroup {
  key: string;
  label: string;
  memories: Memory[];
}

export default function TimelineView() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMemories(loadMemories());
    setReady(true);
  }, []);

  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>();
    for (const m of memories) {
      const d = new Date(m.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          memories: []
        });
      }
      map.get(key)!.memories.push(m);
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [memories]);

  if (!ready) {
    return (
      <p className="py-20 text-center font-display text-xl text-cocoaSoft">{MOCHI_LINES.loading}</p>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <h1 className="font-display text-4xl">
          Memory <span className="title-gradient">Timeline</span> 🌸
        </h1>
        <p className="max-w-md text-sm text-cocoaSoft">
          Your story, blooming month by month.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-10">
          <MochiDino pose="curious" size={200} message={MOCHI_LINES.emptyState} />
          <Link href="/photobooth" className="btn-candy">
            📸 Save A Memory
          </Link>
        </div>
      ) : (
        <div className="relative mx-auto max-w-3xl">
          {/* the stem */}
          <span
            aria-hidden
            className="absolute left-5 top-0 h-full w-1 rounded-full bg-gradient-to-b from-blossom-200 via-lav-200 to-skyy-200 sm:left-1/2 sm:-translate-x-1/2"
          />
          <div className="space-y-12">
            {groups.map((g, gi) => (
              <div key={g.key} className="relative pl-14 sm:pl-0">
                <div className="sm:flex sm:justify-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    className="absolute left-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blossom-200 text-[11px] shadow-bubble sm:left-1/2 sm:-translate-x-1/2"
                  >
                    🌸
                  </motion.span>
                  <p className="chip relative z-10 mb-5 font-display sm:mb-6">{g.label}</p>
                </div>
                <div className="flex flex-wrap justify-start gap-5 sm:justify-center">
                  {g.memories.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ delay: Math.min(i * 0.07, 0.3) }}
                      className="w-36"
                      style={{ transform: `rotate(${(((i + gi) % 5) - 2) * 1.6}deg)` }}
                    >
                      <div className="overflow-hidden rounded-xl border-4 border-white shadow-plush transition-transform hover:-translate-y-1 hover:scale-[1.03]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.stripDataUrl} alt={m.title} className="w-full" />
                      </div>
                      <p className="mt-1.5 truncate text-center text-xs font-semibold text-cocoa">
                        {categoryById(m.category).emoji} {m.title}
                      </p>
                      <p className="text-center text-[10px] text-cocoaSoft">
                        {new Date(m.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-col items-center gap-2">
            <MochiDino pose="happy" size={120} float message="Look how far we've come! 🥹" />
          </div>
        </div>
      )}
    </div>
  );
}
