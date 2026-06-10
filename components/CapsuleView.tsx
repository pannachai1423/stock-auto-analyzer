"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MochiDino from "./MochiDino";
import { mochiToast } from "./MochiToaster";
import { useLang, type Dict } from "@/lib/i18n";
import {
  deleteCapsule,
  loadCapsules,
  newId,
  saveCapsule,
  unlockAchievement
} from "@/lib/storage";
import type { TimeCapsule } from "@/lib/types";

const DURATION_MS = [
  60 * 1000, // 1 minute, just to try
  182 * 24 * 3600 * 1000, // 6 months
  365 * 24 * 3600 * 1000, // 1 year
  5 * 365 * 24 * 3600 * 1000 // 5 years
];

function remainingLabel(opensAt: number, now: number, t: Dict): string {
  const ms = opensAt - now;
  if (ms <= 0) return t.capsule.ready;
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return t.capsule.minutesToGo(mins);
  const hours = Math.ceil(ms / 3600000);
  if (hours < 48) return t.capsule.hoursToGo(hours);
  const days = Math.ceil(ms / 86400000);
  if (days < 60) return t.capsule.daysToGo(days);
  const months = Math.round(days / 30.4);
  if (months < 24) return t.capsule.monthsToGo(months);
  return t.capsule.yearsToGo((days / 365).toFixed(1));
}

export default function CapsuleView() {
  const { t } = useLang();
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [message, setMessage] = useState("");
  const [from, setFrom] = useState("");
  const [durationIdx, setDurationIdx] = useState(1);
  const [reading, setReading] = useState<TimeCapsule | null>(null);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);

  useEffect(() => {
    setCapsules(loadCapsules());
    setReady(true);
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const seal = () => {
    if (!message.trim()) {
      mochiToast(t.capsule.emptyTitle, t.capsule.emptyBody, "💌");
      return;
    }
    const capsule: TimeCapsule = {
      id: newId(),
      createdAt: Date.now(),
      opensAt: Date.now() + DURATION_MS[durationIdx],
      message: message.trim(),
      from: from.trim() || t.capsule.fromDefault,
      opened: false
    };
    saveCapsule(capsule);
    setCapsules(loadCapsules());
    setMessage("");
    mochiToast(t.capsule.sealedToastTitle, t.capsule.sealedToastBody, "⏳");
    const ach = unlockAchievement("first-capsule");
    if (ach) {
      const tr = t.achievements["first-capsule"];
      mochiToast(tr.label, tr.description, ach.emoji);
    }
  };

  const openCapsule = (c: TimeCapsule) => {
    if (c.opensAt > now) {
      mochiToast(t.mochi.capsuleWaiting, remainingLabel(c.opensAt, now, t), "🤫");
      return;
    }
    setReading(c);
    setEnvelopeOpen(false);
    window.setTimeout(() => setEnvelopeOpen(true), 700);
    if (!c.opened) {
      saveCapsule({ ...c, opened: true });
      setCapsules(loadCapsules());
      const ach = unlockAchievement("capsule-opened");
      if (ach) {
        const tr = t.achievements["capsule-opened"];
        mochiToast(tr.label, tr.description, ach.emoji);
      }
    }
  };

  if (!ready) {
    return (
      <p className="py-20 text-center font-display text-xl text-cocoaSoft">{t.mochi.loading}</p>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <h1 className="font-display text-4xl">
          {t.capsule.title1}
          <span className="title-gradient">{t.capsule.titleHi}</span> ⏳
        </h1>
        <p className="max-w-md text-sm text-cocoaSoft">{t.capsule.sub}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* write & seal */}
        <div className="plush-card p-7">
          <div className="mb-4 flex items-center gap-3">
            <MochiDino pose="curious" size={80} float={false} interactive={false} />
            <p className="glass-strong rounded-3xl px-4 py-2 font-display text-sm shadow-bubble">
              {t.mochi.capsulePrompt}
            </p>
          </div>
          <label className="font-display text-sm">{t.capsule.letterLabel}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1200))}
            rows={6}
            placeholder={t.capsule.letterPh}
            className="mt-1.5 w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm outline-none placeholder:text-cocoaSoft/60 focus:ring-2 focus:ring-lav-300"
          />
          <label className="mt-4 block font-display text-sm">{t.capsule.fromLabel}</label>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value.slice(0, 40))}
            placeholder={t.capsule.fromPh}
            className="mt-1.5 w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm outline-none placeholder:text-cocoaSoft/60 focus:ring-2 focus:ring-lav-300"
          />
          <label className="mt-4 block font-display text-sm">{t.capsule.openIn}</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {t.capsule.durations.map((label, i) => (
              <button
                key={label}
                onClick={() => setDurationIdx(i)}
                className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                  durationIdx === i
                    ? "border-lav-400 bg-lav-100 text-[#71619e] shadow-plush scale-[1.02]"
                    : "border-white/70 bg-white/50 hover:bg-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={seal} className="btn-candy mt-6 w-full">
            {t.capsule.seal}
          </button>
        </div>

        {/* sealed capsules */}
        <div>
          <h2 className="mb-4 text-center font-display text-xl lg:text-left">
            {t.capsule.yourLetters} ({capsules.length})
          </h2>
          {capsules.length === 0 ? (
            <div className="plush-card flex flex-col items-center gap-3 p-8 text-center">
              <span className="text-4xl">🫙</span>
              <p className="text-sm text-cocoaSoft">{t.capsule.none}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {capsules.map((c) => {
                const openable = c.opensAt <= now;
                return (
                  <motion.div
                    key={c.id}
                    layout
                    className={`plush-card flex items-center gap-4 p-4 ${
                      openable ? "ring-2 ring-blossom-300" : ""
                    }`}
                  >
                    <span className={`text-3xl ${openable ? "animate-wiggle" : ""}`}>
                      {c.opened ? "💌" : openable ? "🎁" : "🔒"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm">
                        {t.capsule.fromWord} {c.from} ·{" "}
                        {new Date(c.createdAt).toLocaleDateString(t.dateLocale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </p>
                      <p className="text-xs text-cocoaSoft">
                        {c.opened ? t.capsule.openedHint : remainingLabel(c.opensAt, now, t)}
                      </p>
                    </div>
                    <button
                      onClick={() => openCapsule(c)}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105 ${
                        openable
                          ? "bg-gradient-to-r from-blossom-300 to-lav-300 text-white shadow-bubble"
                          : "bg-white/70 text-cocoaSoft"
                      }`}
                    >
                      {c.opened ? t.capsule.read : openable ? t.capsule.openNow : t.capsule.sealedBtn}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(t.capsule.deleteConfirm)) {
                          deleteCapsule(c.id);
                          setCapsules(loadCapsules());
                        }
                      }}
                      className="shrink-0 text-sm opacity-40 transition-opacity hover:opacity-100"
                      title={t.capsule.deleteTip}
                    >
                      🗑️
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* animated letter from the past */}
      <AnimatePresence>
        {reading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 p-4 backdrop-blur-sm"
            onClick={() => setReading(null)}
          >
            <motion.div
              initial={{ scale: 0.6, y: 60, rotate: -6 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              transition={{ type: "spring", stiffness: 160, damping: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg"
            >
              {/* envelope flap */}
              <motion.div
                initial={false}
                animate={envelopeOpen ? { rotateX: 180, y: -8 } : { rotateX: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformOrigin: "top center" }}
                className="absolute -top-1 left-0 right-0 z-10 mx-auto h-16 w-[92%] rounded-t-3xl bg-gradient-to-b from-blossom-200 to-blossom-300"
              />
              <motion.div
                initial={{ y: 0 }}
                animate={envelopeOpen ? { y: -26 } : {}}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="glass-strong relative z-20 rounded-squish p-8 shadow-plushLg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="chip text-xs">💌 {t.mochi.capsuleOpen}</p>
                  <button
                    onClick={() => setReading(null)}
                    className="rounded-full bg-white/80 px-3 py-1 text-sm shadow-plush transition-transform hover:scale-110"
                  >
                    ✕
                  </button>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={envelopeOpen ? { opacity: 1 } : {}}
                  transition={{ delay: 0.9, duration: 0.8 }}
                >
                  <p className="text-xs text-cocoaSoft">
                    {t.capsule.sealedOn}{" "}
                    {new Date(reading.createdAt).toLocaleDateString(t.dateLocale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                  <p className="mt-4 whitespace-pre-wrap font-body text-base leading-relaxed text-cocoa">
                    {reading.message}
                  </p>
                  <p className="mt-6 text-right font-display text-lg text-blossom-500">
                    — {reading.from} 💕
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
