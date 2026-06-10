"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import MochiDino from "./MochiDino";
import { mochiToast } from "./MochiToaster";
import { MOCHI_LINES } from "@/lib/mochi";
import { CATEGORIES, categoryById } from "@/lib/categories";
import {
  ACHIEVEMENTS,
  deleteMemory,
  loadAchievements,
  loadMemories,
  updateMemory
} from "@/lib/storage";
import type { CategoryId, Memory } from "@/lib/types";

export default function ScrapbookView() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [ready, setReady] = useState(false);
  const [chapter, setChapter] = useState<CategoryId | "all">("all");
  const [open, setOpen] = useState<Memory | null>(null);
  const [note, setNote] = useState("");
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMemories(loadMemories());
    setUnlocked(new Set(loadAchievements().map((a) => a.id)));
    setReady(true);
  }, []);

  const shown = useMemo(
    () => (chapter === "all" ? memories : memories.filter((m) => m.category === chapter)),
    [memories, chapter]
  );

  const chapters = useMemo(() => {
    const used = new Set(memories.map((m) => m.category));
    return CATEGORIES.filter((c) => used.has(c.id));
  }, [memories]);

  const openMemory = (m: Memory) => {
    setOpen(m);
    setNote(m.note);
  };

  const saveNote = () => {
    if (!open) return;
    updateMemory(open.id, { note });
    setMemories(loadMemories());
    mochiToast("Note saved!", "Future you will love reading this.", "💌");
  };

  const remove = (m: Memory) => {
    if (!window.confirm("Let this memory go? Mochi will miss it… 🥺")) return;
    deleteMemory(m.id);
    setMemories(loadMemories());
    setOpen(null);
  };

  const download = (m: Memory) => {
    const a = document.createElement("a");
    a.href = m.stripDataUrl;
    a.download = `dear-memory-${m.title.replace(/\s+/g, "-").toLowerCase()}.jpg`;
    a.click();
  };

  if (!ready) {
    return (
      <p className="py-20 text-center font-display text-xl text-cocoaSoft">{MOCHI_LINES.loading}</p>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <h1 className="font-display text-4xl">
          Your <span className="title-gradient">Scrapbook</span> 📖
        </h1>
        <p className="max-w-md text-sm text-cocoaSoft">
          A treasured diary of every moment you decided to keep.
        </p>
      </div>

      {memories.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-10">
          <MochiDino pose="curious" size={200} message={MOCHI_LINES.emptyState} />
          <Link href="/photobooth" className="btn-candy">
            📸 Save A Memory
          </Link>
        </div>
      ) : (
        <>
          {/* chapter tabs */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setChapter("all")}
              className={`chip transition-all hover:scale-105 ${
                chapter === "all" ? "!bg-blossom-200/90 !text-[#a45a7c]" : ""
              }`}
            >
              🌈 All ({memories.length})
            </button>
            {chapters.map((c) => (
              <button
                key={c.id}
                onClick={() => setChapter(c.id)}
                className={`chip transition-all hover:scale-105 ${
                  chapter === c.id ? "!bg-blossom-200/90 !text-[#a45a7c]" : ""
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* memory grid */}
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((m, i) => (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                onClick={() => openMemory(m)}
                className="group text-left"
                style={{ transform: `rotate(${((i % 5) - 2) * 1.2}deg)` }}
              >
                <div className="overflow-hidden rounded-2xl border-4 border-white shadow-plush transition-all duration-200 group-hover:-translate-y-1.5 group-hover:shadow-plushLg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.stripDataUrl} alt={m.title} className="w-full" />
                </div>
                <p className="mt-2 truncate text-center font-display text-sm text-cocoa">
                  {categoryById(m.category).emoji} {m.title}
                </p>
                <p className="text-center text-[11px] text-cocoaSoft">
                  {new Date(m.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </p>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {/* achievements shelf */}
      <section className="mt-14">
        <h2 className="text-center font-display text-2xl">Mochi&apos;s little prizes 🏆</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.has(a.id);
            return (
              <div
                key={a.id}
                className={`plush-card p-4 text-center transition-all ${
                  got ? "" : "opacity-45 grayscale"
                }`}
              >
                <span className="text-2xl">{a.emoji}</span>
                <p className="mt-1 font-display text-sm">{a.label}</p>
                <p className="text-[11px] text-cocoaSoft">{got ? a.description : "Still waiting… ✨"}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* detail modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/30 p-4 backdrop-blur-sm"
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-squish p-6 shadow-plushLg"
            >
              <div className="flex flex-col gap-6 sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={open.stripDataUrl}
                  alt={open.title}
                  className="mx-auto w-[200px] shrink-0 self-start rounded-2xl border-4 border-white shadow-plush"
                />
                <div className="flex-1">
                  <p className="chip text-xs">{categoryById(open.category).emoji} {categoryById(open.category).label}</p>
                  <h3 className="mt-3 font-display text-2xl">{open.title}</h3>
                  <p className="text-xs text-cocoaSoft">
                    {new Date(open.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                  <label className="mt-4 block font-display text-sm">A note for future you 💌</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 600))}
                    rows={5}
                    placeholder="What made this moment special?"
                    className="mt-1.5 w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm outline-none placeholder:text-cocoaSoft/60 focus:ring-2 focus:ring-blossom-300"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={saveNote} className="btn-candy !px-5 !py-2 !text-sm">
                      💌 Save note
                    </button>
                    <button onClick={() => download(open)} className="btn-cloud !px-5 !py-2 !text-sm">
                      ⬇️ Download
                    </button>
                    <button
                      onClick={() => remove(open)}
                      className="btn-cloud !px-5 !py-2 !text-sm hover:!bg-blossom-100"
                    >
                      🥀 Let go
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
