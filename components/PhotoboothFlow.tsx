"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import MochiDino from "./MochiDino";
import { mochiToast } from "./MochiToaster";
import { MOCHI_LINES } from "@/lib/mochi";
import { FILTERS, FRAMES, filterById, frameById } from "@/lib/filters";
import { CATEGORIES } from "@/lib/categories";
import { STICKERS, stickerByKey } from "@/lib/stickers";
import { composeStrip, captureFrame, STRIP, stripHeight } from "@/lib/strip";
import { loadMemories, saveMemory, newId, unlockAchievement } from "@/lib/storage";
import type { CategoryId, FilterId, FrameId, Memory, PlacedSticker } from "@/lib/types";

type Stage = "setup" | "capture" | "decorate" | "done";

const COUNTDOWN_SECONDS = 3;

/** pastel placeholder frames so the booth still works without a camera */
function demoFrame(index: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;
  const palettes = [
    ["#ffe8f1", "#e6dbff"],
    ["#e3f5df", "#cdebff"],
    ["#fff8f0", "#ffd6e8"],
    ["#e6dbff", "#cdebc6"],
    ["#cdebff", "#ffe8f1"],
    ["#ffd6e8", "#e3f5df"]
  ];
  const [a, b] = palettes[index % palettes.length];
  const g = ctx.createLinearGradient(0, 0, 640, 480);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 480);
  ctx.font = "120px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(["💖", "✨", "🌸", "🎀", "⭐", "💌"][index % 6], 320, 240);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function PhotoboothFlow() {
  const params = useSearchParams();
  const initialCategory = (params.get("category") as CategoryId) || "everyday";

  const [stage, setStage] = useState<Stage>("setup");
  const [layout, setLayout] = useState<4 | 6>(4);
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [filter, setFilter] = useState<FilterId>("korean-beauty");
  const [frame, setFrame] = useState<FrameId>("cream");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashing, setFlashing] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [finalStrip, setFinalStrip] = useState<string | null>(null);
  const [savedMemory, setSavedMemory] = useState<Memory | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const triedFilters = useRef<Set<FilterId>>(new Set());

  const filterInfo = filterById(filter);
  const frameInfo = frameById(frame);
  const mirrored = facing === "user";

  /* ---------------- camera ---------------- */

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (mode: "user" | "environment") => {
      stopCamera();
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setDemoMode(false);
      } catch {
        setCameraError(
          "Mochi couldn't find your camera 🥺 You can allow camera access and retry, or play in demo mode!"
        );
      }
    },
    [stopCamera]
  );

  useEffect(() => {
    if (stage === "capture" && !demoMode) startCamera(facing);
    if (stage !== "capture") stopCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, facing, demoMode]);

  /* ---------------- capture flow ---------------- */

  const snapOne = useCallback((): string => {
    if (demoMode || !videoRef.current || !streamRef.current) {
      return demoFrame(Math.floor(Math.random() * 6));
    }
    return captureFrame(videoRef.current, mirrored);
  }, [demoMode, mirrored]);

  const runCountdown = useCallback(
    () =>
      new Promise<void>((resolve) => {
        let n = COUNTDOWN_SECONDS;
        setCountdown(n);
        const tick = window.setInterval(() => {
          n -= 1;
          if (n <= 0) {
            window.clearInterval(tick);
            setCountdown(null);
            resolve();
          } else {
            setCountdown(n);
          }
        }, 900);
      }),
    []
  );

  const shootSequence = useCallback(
    async (slots: number[]) => {
      setShooting(true);
      for (const slot of slots) {
        await runCountdown();
        setFlashing(true);
        const shot = snapOne();
        window.setTimeout(() => setFlashing(false), 500);
        setPhotos((prev) => {
          const next = [...prev];
          next[slot] = shot;
          return next;
        });
        await new Promise((r) => window.setTimeout(r, 650));
      }
      setShooting(false);
      setRetakeIndex(null);
    },
    [runCountdown, snapOne]
  );

  const startShoot = useCallback(() => {
    triedFilters.current.add(filter);
    setPhotos(Array(layout).fill(""));
    shootSequence(Array.from({ length: layout }, (_, i) => i));
  }, [filter, layout, shootSequence]);

  const retake = useCallback(
    (i: number) => {
      if (shooting) return;
      setRetakeIndex(i);
      shootSequence([i]);
    },
    [shooting, shootSequence]
  );

  const allCaptured = photos.length === layout && photos.every(Boolean);

  /* ---------------- decorate ---------------- */

  const stripW = STRIP.width;
  const stripH = useMemo(() => Math.round(stripHeight(layout)), [layout]);
  const stripBox = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; ox: number; oy: number } | null>(null);

  const addSticker = (key: string) => {
    const placed: PlacedSticker = {
      id: newId(),
      sticker: key,
      x: 0.25 + Math.random() * 0.5,
      y: 0.08 + Math.random() * 0.12,
      scale: 1,
      rotation: Math.round(Math.random() * 24 - 12)
    };
    setStickers((s) => [...s, placed]);
    setSelectedSticker(placed.id);
    if (stickers.length + 1 >= 5) {
      const ach = unlockAchievement("decorator");
      if (ach) mochiToast(ach.label, ach.description, ach.emoji);
    }
  };

  const onStickerPointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSticker(id);
    const st = stickers.find((s) => s.id === id);
    if (!st) return;
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, ox: st.x, oy: st.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onStickerPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const box = stripBox.current;
    if (!drag || !box) return;
    const rect = box.getBoundingClientRect();
    const nx = drag.ox + (e.clientX - drag.startX) / rect.width;
    const ny = drag.oy + (e.clientY - drag.startY) / rect.height;
    setStickers((all) =>
      all.map((s) =>
        s.id === drag.id
          ? { ...s, x: Math.min(0.98, Math.max(0.02, nx)), y: Math.min(0.98, Math.max(0.02, ny)) }
          : s
      )
    );
  };

  const onStickerPointerUp = () => {
    dragRef.current = null;
  };

  const tweakSelected = (patch: (s: PlacedSticker) => Partial<PlacedSticker>) => {
    if (!selectedSticker) return;
    setStickers((all) => all.map((s) => (s.id === selectedSticker ? { ...s, ...patch(s) } : s)));
  };

  const removeSelected = () => {
    if (!selectedSticker) return;
    setStickers((all) => all.filter((s) => s.id !== selectedSticker));
    setSelectedSticker(null);
  };

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  /* ---------------- save ---------------- */

  const finishAndSave = async () => {
    setSaving(true);
    try {
      const strip = await composeStrip({
        photos,
        layout,
        filter,
        frame,
        stickers,
        title: title.trim(),
        dateLabel
      });
      const memory: Memory = {
        id: newId(),
        createdAt: Date.now(),
        title: title.trim() || "A precious moment",
        note: "",
        category,
        layout,
        filter,
        frame,
        stripDataUrl: strip
      };
      const ok = saveMemory(memory);
      setFinalStrip(strip);
      setSavedMemory(ok ? memory : null);
      setStage("done");
      if (ok) {
        const count = loadMemories().length;
        const firsts: Array<[number, string]> = [
          [1, "first-memory"],
          [5, "five-memories"],
          [10, "ten-memories"]
        ];
        for (const [n, id] of firsts) {
          if (count >= n) {
            const ach = unlockAchievement(id);
            if (ach) mochiToast(ach.label, ach.description, ach.emoji);
          }
        }
        if (triedFilters.current.size >= FILTERS.length) {
          const ach = unlockAchievement("all-filters");
          if (ach) mochiToast(ach.label, ach.description, ach.emoji);
        }
      } else {
        mochiToast(
          "Scrapbook is full!",
          "The strip is ready to download, but Mochi couldn't store it. Try deleting old memories.",
          "🥺"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const download = () => {
    if (!finalStrip) return;
    const a = document.createElement("a");
    a.href = finalStrip;
    a.download = `dear-memory-${new Date().toISOString().slice(0, 10)}.jpg`;
    a.click();
  };

  /* ================= render ================= */

  const photoW = stripW - STRIP.pad * 2;
  const photoH = photoW * STRIP.photoRatio;
  const previewScale = 320 / stripW;

  return (
    <div className="pb-8">
      <AnimatePresence mode="wait">
        {/* ------------------------------------------------ setup */}
        {stage === "setup" && (
          <motion.section
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-8 py-6"
          >
            <MochiDino pose="waving" size={170} message={MOCHI_LINES.beforePhoto} float />
            <h1 className="text-center font-display text-3xl sm:text-4xl">
              The <span className="title-gradient">Photobooth</span> 📸
            </h1>

            <div className="plush-card w-full max-w-2xl p-7">
              <h2 className="font-display text-lg">1 · How many photos?</h2>
              <div className="mt-3 flex gap-3">
                {([4, 6] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setLayout(n)}
                    className={`flex-1 rounded-3xl border-2 px-4 py-4 font-display text-lg transition-all ${
                      layout === n
                        ? "border-blossom-400 bg-blossom-100 text-[#a45a7c] shadow-bubble scale-[1.02]"
                        : "border-white/70 bg-white/50 hover:bg-white/80"
                    }`}
                  >
                    {n === 4 ? "🎞️ 4-photo strip" : "✨ 6-photo strip"}
                  </button>
                ))}
              </div>

              <h2 className="mt-6 font-display text-lg">2 · What kind of moment?</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`rounded-2xl border px-2 py-2.5 text-xs font-semibold leading-tight transition-all ${
                      category === c.id
                        ? "border-mint-400 bg-mint-100 text-mint-600 shadow-plush scale-[1.03]"
                        : "border-white/70 bg-white/50 hover:bg-white/80"
                    }`}
                  >
                    <span className="mr-1">{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>

              <button onClick={() => setStage("capture")} className="btn-candy mt-7 w-full">
                Open the booth 💖
              </button>
            </div>
          </motion.section>
        )}

        {/* ------------------------------------------------ capture */}
        {stage === "capture" && (
          <motion.section
            key="capture"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-6 py-4"
          >
            <div className="flex items-center gap-4">
              <MochiDino
                pose={shooting ? "excited" : "happy"}
                size={92}
                float={false}
                interactive={false}
              />
              <p className="glass-strong max-w-xs rounded-3xl px-4 py-2.5 font-display text-sm shadow-bubble">
                {shooting
                  ? MOCHI_LINES.countdown
                  : allCaptured
                    ? MOCHI_LINES.afterPhoto
                    : retakeIndex !== null
                      ? "One more try — you got this! 🌟"
                      : "Pick a dreamy filter, then press the pink button!"}
              </p>
            </div>

            {/* camera stage */}
            <div className="relative w-full max-w-xl overflow-hidden rounded-squish border-4 border-white bg-[#2e2a3a] shadow-plushLg">
              <div className="relative aspect-[4/3]">
                {!demoMode ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`h-full w-full object-cover ${filterInfo.className} ${
                      mirrored ? "-scale-x-100" : ""
                    }`}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-lav-200 via-blossom-100 to-skyy-200">
                    <span className="text-5xl">🪄</span>
                    <p className="font-display text-cocoa">Demo mode — pretend you look adorable (you do)</p>
                  </div>
                )}

                {cameraError && !demoMode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-cream-100/95 p-6 text-center">
                    <Image src="/mochi/mochi-curious.png" alt="" width={110} height={130} />
                    <p className="max-w-sm text-sm text-cocoa">{cameraError}</p>
                    <div className="flex gap-3">
                      <button onClick={() => startCamera(facing)} className="btn-cloud !px-5 !py-2 !text-sm">
                        🔁 Retry camera
                      </button>
                      <button onClick={() => setDemoMode(true)} className="btn-candy !px-5 !py-2 !text-sm">
                        🪄 Demo mode
                      </button>
                    </div>
                  </div>
                )}

                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                    <motion.span
                      key={countdown}
                      initial={{ scale: 2.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="font-display text-8xl text-white drop-shadow-[0_4px_18px_rgba(248,127,178,0.8)]"
                    >
                      {countdown}
                    </motion.span>
                  </div>
                )}
                {flashing && <div className="flash absolute inset-0 bg-white" />}
              </div>
            </div>

            {/* filter carousel */}
            <div className="w-full max-w-xl">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFilter(f.id);
                      triedFilters.current.add(f.id);
                    }}
                    className={`shrink-0 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                      filter === f.id
                        ? "border-blossom-400 bg-blossom-100 text-[#a45a7c] shadow-bubble"
                        : "border-white/70 bg-white/60 hover:bg-white/90"
                    }`}
                  >
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
                disabled={shooting || demoMode}
                className="btn-cloud !px-5 !py-2.5 !text-sm disabled:opacity-40"
              >
                🔄 Flip camera
              </button>
              <button
                onClick={startShoot}
                disabled={shooting || (!demoMode && !!cameraError)}
                className="btn-candy !px-9 disabled:opacity-50"
              >
                {shooting ? "Smileeee! 📸" : allCaptured ? "📸 Shoot again" : "📸 Start"}
              </button>
              {allCaptured && !shooting && (
                <button onClick={() => setStage("decorate")} className="btn-candy !bg-none !px-6"
                  style={{ background: "linear-gradient(135deg,#9ed193,#84bd78)" }}>
                  Decorate → 🎀
                </button>
              )}
            </div>

            {/* captured thumbnails */}
            <div className="flex flex-wrap justify-center gap-2.5">
              {Array.from({ length: layout }, (_, i) => (
                <button
                  key={i}
                  onClick={() => photos[i] && retake(i)}
                  title={photos[i] ? "Tap to retake this one" : "Waiting…"}
                  className={`relative h-20 w-[6.66rem] overflow-hidden rounded-xl border-2 transition-all ${
                    retakeIndex === i
                      ? "border-blossom-400 ring-2 ring-blossom-300"
                      : photos[i]
                        ? "border-white hover:scale-105"
                        : "border-dashed border-cocoaSoft/40 bg-white/40"
                  }`}
                >
                  {photos[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photos[i]}
                      alt={`Photo ${i + 1}`}
                      className={`h-full w-full object-cover ${filterInfo.className}`}
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-lg opacity-40">💗</span>
                  )}
                </button>
              ))}
            </div>
            {allCaptured && (
              <p className="text-xs text-cocoaSoft">Tap any photo to retake it ✨</p>
            )}
          </motion.section>
        )}

        {/* ------------------------------------------------ decorate */}
        {stage === "decorate" && (
          <motion.section
            key="decorate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-start gap-8 py-4 lg:flex-row lg:justify-center"
          >
            {/* strip preview / editor */}
            <div className="mx-auto shrink-0">
              <div
                ref={stripBox}
                onPointerDown={() => setSelectedSticker(null)}
                className="relative select-none overflow-hidden rounded-2xl shadow-plushLg"
                style={{
                  width: stripW * previewScale,
                  height: stripH * previewScale,
                  background: frameInfo.bg
                }}
              >
                {photos.slice(0, layout).map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={p}
                    alt=""
                    draggable={false}
                    className={`absolute object-cover ${filterInfo.className}`}
                    style={{
                      left: STRIP.pad * previewScale,
                      top: (STRIP.pad + i * (photoH + STRIP.gap)) * previewScale,
                      width: photoW * previewScale,
                      height: photoH * previewScale,
                      borderRadius: 10
                    }}
                  />
                ))}
                <div
                  className="absolute inset-x-0 text-center"
                  style={{ bottom: 30 * previewScale, color: frameInfo.text }}
                >
                  <p className="font-display" style={{ fontSize: 15 }}>
                    Dear Memory
                  </p>
                  <p style={{ fontSize: 9, opacity: 0.85 }}>
                    {title ? `${title}  ·  ${dateLabel}` : dateLabel}
                  </p>
                </div>

                {stickers.map((s) => {
                  const def = stickerByKey(s.sticker);
                  if (!def) return null;
                  const size = 52 * s.scale * previewScale;
                  return (
                    <div
                      key={s.id}
                      onPointerDown={(e) => onStickerPointerDown(e, s.id)}
                      onPointerMove={onStickerPointerMove}
                      onPointerUp={onStickerPointerUp}
                      className={`absolute cursor-grab touch-none active:cursor-grabbing ${
                        selectedSticker === s.id ? "rounded-lg ring-2 ring-blossom-400/80" : ""
                      }`}
                      style={{
                        left: s.x * stripW * previewScale,
                        top: s.y * stripH * previewScale,
                        transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`
                      }}
                    >
                      {def.kind === "emoji" ? (
                        <span style={{ fontSize: size, lineHeight: 1 }}>{def.value}</span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={def.value} alt={def.label} draggable={false} style={{ width: size }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* tools */}
            <div className="w-full max-w-md space-y-5">
              <div className="flex items-center gap-3">
                <MochiDino pose="happy" size={76} float={false} interactive={false} />
                <p className="glass-strong rounded-3xl px-4 py-2 font-display text-sm shadow-bubble">
                  {MOCHI_LINES.decorating}
                </p>
              </div>

              <div className="plush-card p-5">
                <h3 className="font-display text-base">Give it a name 💌</h3>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 40))}
                  placeholder="our little adventure…"
                  className="mt-2 w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm outline-none placeholder:text-cocoaSoft/60 focus:ring-2 focus:ring-blossom-300"
                />
              </div>

              <div className="plush-card p-5">
                <h3 className="font-display text-base">Frame color 🖼️</h3>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {FRAMES.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFrame(f.id)}
                      title={f.label}
                      className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${f.swatchClass} ${
                        frame === f.id ? "border-cocoa scale-110" : "border-white"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="plush-card p-5">
                <h3 className="font-display text-base">Stickers 🎀</h3>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {STICKERS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => addSticker(s.key)}
                      title={s.label}
                      className="flex h-12 items-center justify-center rounded-2xl bg-white/70 text-2xl transition-transform hover:scale-110 hover:bg-white"
                    >
                      {s.kind === "emoji" ? (
                        s.value
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.value} alt={s.label} className="h-9 w-auto" />
                      )}
                    </button>
                  ))}
                </div>

                {selectedSticker && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white/70 p-2.5">
                    <span className="text-xs font-semibold text-cocoaSoft">Selected:</span>
                    {[
                      ["➖", () => tweakSelected((s) => ({ scale: Math.max(0.5, s.scale - 0.15) }))],
                      ["➕", () => tweakSelected((s) => ({ scale: Math.min(3, s.scale + 0.15) }))],
                      ["↪️", () => tweakSelected((s) => ({ rotation: s.rotation + 15 }))],
                      ["↩️", () => tweakSelected((s) => ({ rotation: s.rotation - 15 }))]
                    ].map(([label, fn], i) => (
                      <button
                        key={i}
                        onClick={fn as () => void}
                        className="rounded-xl bg-white px-2.5 py-1.5 text-sm shadow-plush transition-transform hover:scale-110"
                      >
                        {label as string}
                      </button>
                    ))}
                    <button
                      onClick={removeSelected}
                      className="rounded-xl bg-blossom-100 px-2.5 py-1.5 text-sm shadow-plush transition-transform hover:scale-110"
                    >
                      🗑️
                    </button>
                  </div>
                )}
                <p className="mt-3 text-xs text-cocoaSoft">
                  Tap a sticker to add it, then drag it anywhere on your strip ✨
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStage("capture")} className="btn-cloud flex-1 !text-base">
                  ← Back
                </button>
                <button onClick={finishAndSave} disabled={saving} className="btn-candy flex-1 !text-base">
                  {saving ? MOCHI_LINES.loading : "Keep it forever 💖"}
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* ------------------------------------------------ done */}
        {stage === "done" && finalStrip && (
          <motion.section
            key="done"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 py-6"
          >
            <MochiDino pose="excited" size={150} message={MOCHI_LINES.afterPhoto} />
            <h2 className="text-center font-display text-3xl">
              {savedMemory ? "Tucked into your scrapbook! 💌" : "Your strip is ready! 💌"}
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src={finalStrip}
              alt="Your finished photo strip"
              initial={{ rotate: -4 }}
              animate={{ rotate: [-4, 3, -2, 0] }}
              transition={{ duration: 1 }}
              className="w-[260px] rounded-2xl border-4 border-white shadow-plushLg"
            />
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={download} className="btn-candy">
                ⬇️ Download
              </button>
              <Link href="/scrapbook" className="btn-cloud">
                📖 Open scrapbook
              </Link>
              <button
                onClick={() => {
                  setPhotos([]);
                  setStickers([]);
                  setTitle("");
                  setFinalStrip(null);
                  setStage("setup");
                }}
                className="btn-cloud"
              >
                ✨ New memory
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
