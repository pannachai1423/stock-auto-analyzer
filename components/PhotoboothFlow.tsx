"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import MochiDino from "./MochiDino";
import { mochiToast } from "./MochiToaster";
import { useLang } from "@/lib/i18n";
import { FILTERS, FRAMES, filterById, frameById, type FilterFx, type FrameDecor } from "@/lib/filters";
import { CATEGORIES } from "@/lib/categories";
import { STICKERS, stickerByKey } from "@/lib/stickers";
import {
  composeStrip,
  captureFrame,
  getStripGeometry,
  type LayoutStyle,
  type StripGeometry
} from "@/lib/strip";
import type { BeautyLevel } from "@/lib/beauty";
import { composeGif } from "@/lib/gif";
import { shareImage } from "@/lib/share";
import { sfx, isMuted, setMuted } from "@/lib/sounds";
import { loadMemories, saveMemory, newId, unlockAchievement } from "@/lib/storage";
import type { CategoryId, FilterId, FrameId, Memory, PlacedSticker } from "@/lib/types";

type Stage = "setup" | "capture" | "select" | "decorate" | "done";

const COUNTDOWN_SECONDS = 3;
/** like the real booths: always take extra shots, then pick favorites */
const SHOT_COUNT = 8;

interface LayoutOption {
  id: string;
  count: 4 | 6;
  style: LayoutStyle;
}

const LAYOUTS: LayoutOption[] = [
  { id: "strip4", count: 4, style: "strip" },
  { id: "grid4", count: 4, style: "grid" },
  { id: "grid6", count: 6, style: "grid" }
];

const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)' opacity='0.65'/%3E%3C/svg%3E\")";

/** live approximation of the film extras baked into the final strip */
function FxOverlay({ fx, rounded }: { fx?: FilterFx; rounded?: number }) {
  if (!fx) return null;
  const radius = rounded ?? 0;
  return (
    <>
      {fx.vignette && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: radius,
            background: `radial-gradient(ellipse at center, rgba(30,16,26,0) 52%, rgba(30,16,26,${fx.vignette}) 100%)`
          }}
        />
      )}
      {fx.grain && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: radius,
            backgroundImage: GRAIN_URI,
            opacity: fx.grain,
            mixBlendMode: "overlay"
          }}
        />
      )}
      {fx.glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: radius,
            background: `radial-gradient(ellipse at center, rgba(255,250,240,${fx.glow * 0.4}) 0%, rgba(255,250,240,0) 65%)`,
            mixBlendMode: "screen"
          }}
        />
      )}
    </>
  );
}

/** CSS background that mirrors the canvas gingham / dots / plaid / stripe pattern */
function patternStyle(decor: FrameDecor | undefined, scale: number): React.CSSProperties {
  if (!decor?.pattern) return {};
  const ink = decor.patternColor ?? "rgba(0,0,0,0.15)";
  const ink2 = decor.patternColor2 ?? ink;
  if (decor.pattern === "gingham") {
    const cell = 22 * scale;
    return {
      backgroundImage: `repeating-linear-gradient(90deg, ${ink} 0 ${cell}px, transparent ${cell}px ${cell * 2}px), repeating-linear-gradient(0deg, ${ink} 0 ${cell}px, transparent ${cell}px ${cell * 2}px)`
    };
  }
  if (decor.pattern === "plaid") {
    const cell = 40 * scale;
    const line = 3 * scale;
    return {
      backgroundImage: `repeating-linear-gradient(90deg, ${ink} 0 ${cell}px, transparent ${cell}px ${cell * 2}px), repeating-linear-gradient(0deg, ${ink} 0 ${cell}px, transparent ${cell}px ${cell * 2}px), repeating-linear-gradient(90deg, ${ink2} 0 ${line}px, transparent ${line}px ${cell}px), repeating-linear-gradient(0deg, ${ink2} 0 ${line}px, transparent ${line}px ${cell}px)`
    };
  }
  if (decor.pattern === "stripe") {
    const cell = 26 * scale;
    return {
      backgroundImage: `repeating-linear-gradient(90deg, ${ink} 0 ${cell}px, transparent ${cell}px ${cell * 2}px)`
    };
  }
  const gap = 26 * scale;
  return {
    backgroundImage: `radial-gradient(${ink} ${1.8 * scale}px, transparent ${1.9 * scale}px)`,
    backgroundSize: `${gap}px ${gap}px`
  };
}

/** live preview of a designed frame (border, bar, corners, official Mochi art) */
function FrameDecorOverlay({
  decor,
  geo,
  scale
}: {
  decor?: FrameDecor;
  geo: StripGeometry;
  scale: number;
}) {
  if (!decor) return null;
  const tops: { x: number; e: string }[] = [];
  let i = 0;
  for (let x = geo.pad + 10; x <= geo.width - geo.pad - 10; x += 52) {
    tops.push({ x, e: decor.top[i % decor.top.length] });
    i++;
  }
  // full-perimeter border positions (when decor.border)
  const perim: { x: number; y: number; e: string }[] = [];
  if (decor.border) {
    let k = 0;
    const step = 34;
    for (let x = geo.pad - 6; x <= geo.width - geo.pad + 6; x += step) {
      perim.push({ x, y: 8, e: decor.top[k % decor.top.length] });
      perim.push({ x, y: geo.captionY - 10, e: decor.top[(k + 1) % decor.top.length] });
      k++;
    }
    k = 0;
    for (let y = 30; y <= geo.captionY - 24; y += step) {
      perim.push({ x: 10, y, e: decor.top[k % decor.top.length] });
      perim.push({ x: geo.width - 10, y, e: decor.top[(k + 1) % decor.top.length] });
      k++;
    }
  }
  const corner = (x: number, y: number, key: string) => (
    <span
      key={key}
      aria-hidden
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: x * scale, top: y * scale, fontSize: 16 * scale, color: decor.patternColor }}
    >
      {decor.corner}
    </span>
  );
  return (
    <>
      {decor.bar ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-body font-bold tracking-wide"
          style={{ top: 13 * scale, fontSize: 12 * scale, color: decor.patternColor }}
        >
          {decor.bar}
        </span>
      ) : decor.border ? (
        perim.map((pt, idx) => (
          <span
            key={idx}
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pt.x * scale, top: pt.y * scale, fontSize: 15 * scale }}
          >
            {pt.e}
          </span>
        ))
      ) : (
        tops.map((tp, idx) => (
          <span
            key={idx}
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: tp.x * scale, top: 13 * scale, fontSize: 14 * scale }}
          >
            {tp.e}
          </span>
        ))
      )}
      {corner(13, 13, "tl")}
      {corner(geo.width - 13, 13, "tr")}
      {corner(13, geo.height - 14, "bl")}
      {!decor.mochi && corner(geo.width - 13, geo.height - 14, "br")}
      {decor.mochi && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={decor.mochi}
          alt=""
          draggable={false}
          className="pointer-events-none absolute"
          style={{
            height: 64 * scale,
            right: 10 * scale,
            bottom: 8 * scale
          }}
        />
      )}
    </>
  );
}

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
    ["#ffd6e8", "#e3f5df"],
    ["#e3f5df", "#ffe8f1"],
    ["#fff8f0", "#cdebff"]
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
  ctx.fillText(["💖", "✨", "🌸", "🎀", "⭐", "💌", "🌷", "🫧"][index % 8], 320, 240);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function PhotoboothFlow() {
  const { t } = useLang();
  const params = useSearchParams();
  const initialCategory = (params.get("category") as CategoryId) || "everyday";

  const [stage, setStage] = useState<Stage>("setup");
  const [layoutId, setLayoutId] = useState("strip4");
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [filter, setFilter] = useState<FilterId>("korean-beauty");
  const [frame, setFrame] = useState<FrameId>("cream");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
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
  const [muted, setMutedState] = useState(false);
  const [gifBusy, setGifBusy] = useState(false);
  const [beauty, setBeauty] = useState<BeautyLevel>(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triedFilters = useRef<Set<FilterId>>(new Set());

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  const layout = LAYOUTS.find((l) => l.id === layoutId) ?? LAYOUTS[0];
  const layoutLabel = (id: string) =>
    id === "strip4" ? t.booth.layoutStrip4 : id === "grid4" ? t.booth.layoutGrid4 : t.booth.layoutGrid6;

  const filterInfo = filterById(filter);
  const frameInfo = frameById(frame);
  const mirrored = facing === "user";
  const pickedPhotos = useMemo(() => selected.map((i) => photos[i]).filter(Boolean), [selected, photos]);

  /* ---------------- camera ---------------- */

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (mode: "user" | "environment") => {
      stopCamera();
      setCameraError(false);
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
        setCameraError(true);
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
      return demoFrame(Math.floor(Math.random() * 8));
    }
    return captureFrame(videoRef.current, mirrored, beauty);
  }, [demoMode, mirrored, beauty]);

  const runCountdown = useCallback(
    () =>
      new Promise<void>((resolve) => {
        let n = COUNTDOWN_SECONDS;
        setCountdown(n);
        sfx.tick();
        const tick = window.setInterval(() => {
          n -= 1;
          if (n <= 0) {
            window.clearInterval(tick);
            setCountdown(null);
            sfx.go();
            resolve();
          } else {
            setCountdown(n);
            sfx.tick();
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
        sfx.shutter();
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
    setPhotos(Array(SHOT_COUNT).fill(""));
    setSelected([]);
    shootSequence(Array.from({ length: SHOT_COUNT }, (_, i) => i));
  }, [filter, shootSequence]);

  const retake = useCallback(
    (i: number) => {
      if (shooting) return;
      setRetakeIndex(i);
      shootSequence([i]);
    },
    [shooting, shootSequence]
  );

  const allCaptured = photos.length === SHOT_COUNT && photos.every(Boolean);

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      if (prev.length >= layout.count) return prev;
      sfx.pop();
      return [...prev, i];
    });
  };

  /** lets users build a strip from gallery photos — no camera needed */
  const onFilesPicked = async (files: FileList | null) => {
    if (!files?.length) return;
    const downscale = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new window.Image();
        img.onload = () => {
          const w = Math.min(img.width, 960);
          const h = Math.round(w * (img.height / img.width));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        img.onerror = reject;
        img.src = url;
      });

    const picked = await Promise.all(
      Array.from(files)
        .slice(0, SHOT_COUNT)
        .map((f) => downscale(f).catch(() => ""))
    );
    setPhotos((prev) => {
      const next = prev.length === SHOT_COUNT ? [...prev] : Array(SHOT_COUNT).fill("");
      let p = 0;
      // fill empty slots first, then overwrite from the top
      for (let i = 0; i < SHOT_COUNT && p < picked.length; i++) {
        if (!next[i] && picked[p]) next[i] = picked[p++];
      }
      for (let i = 0; i < SHOT_COUNT && p < picked.length; i++) {
        if (picked[p]) next[i] = picked[p++];
      }
      return next;
    });
    setSelected([]);
    sfx.pop();
  };

  /* ---------------- decorate ---------------- */

  const geo = useMemo(() => getStripGeometry(layout.count, layout.style), [layout]);
  const previewScale = (layout.style === "grid" ? 380 : 320) / geo.width;
  const stripBox = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; ox: number; oy: number } | null>(null);

  const addSticker = (key: string) => {
    const placed: PlacedSticker = {
      id: newId(),
      sticker: key,
      x: 0.25 + Math.random() * 0.5,
      y: 0.06 + Math.random() * 0.1,
      scale: 1,
      rotation: Math.round(Math.random() * 24 - 12)
    };
    setStickers((s) => [...s, placed]);
    setSelectedSticker(placed.id);
    sfx.pop();
    if (stickers.length + 1 >= 5) {
      const ach = unlockAchievement("decorator");
      if (ach) {
        const tr = t.achievements.decorator;
        mochiToast(tr.label, tr.description, ach.emoji);
      }
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
      new Date().toLocaleDateString(t.dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric"
      }),
    [t.dateLocale]
  );

  /* ---------------- save ---------------- */

  const finishAndSave = async () => {
    setSaving(true);
    try {
      const strip = await composeStrip({
        photos: pickedPhotos,
        count: layout.count,
        style: layout.style,
        filter,
        frame,
        stickers,
        title: title.trim(),
        dateLabel
      });
      const memory: Memory = {
        id: newId(),
        createdAt: Date.now(),
        title: title.trim() || t.booth.defaultTitle,
        note: "",
        category,
        layout: layout.count,
        layoutStyle: layout.style,
        filter,
        frame,
        stripDataUrl: strip
      };
      const ok = saveMemory(memory);
      setFinalStrip(strip);
      setSavedMemory(ok ? memory : null);
      setStage("done");
      sfx.chime();
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
            if (ach) {
              const tr = t.achievements[ach.id as keyof typeof t.achievements];
              mochiToast(tr.label, tr.description, ach.emoji);
            }
          }
        }
        if (triedFilters.current.size >= FILTERS.length) {
          const ach = unlockAchievement("all-filters");
          if (ach) {
            const tr = t.achievements["all-filters"];
            mochiToast(tr.label, tr.description, ach.emoji);
          }
        }
      } else {
        mochiToast(t.booth.storageFullTitle, t.booth.storageFullBody, "🥺");
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

  const makeGif = async () => {
    if (gifBusy) return;
    setGifBusy(true);
    try {
      const blob = await composeGif({
        photos: pickedPhotos,
        filter,
        frame,
        title: title.trim(),
        dateLabel
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dear-memory-${new Date().toISOString().slice(0, 10)}.gif`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      mochiToast(t.booth.gifReadyTitle, t.booth.gifReadyBody, "🎬");
    } catch {
      mochiToast(t.booth.gifFailTitle, t.booth.gifFailBody, "🥺");
    } finally {
      setGifBusy(false);
    }
  };

  const share = async () => {
    if (!finalStrip) return;
    const shared = await shareImage(finalStrip, "dear-memory.jpg", "Dear Memory 💖");
    if (!shared) {
      download();
      mochiToast(t.booth.shareFailTitle, t.booth.shareFailBody, "💌");
    }
  };

  /* ================= render ================= */

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
            <MochiDino pose="waving" size={170} message={t.mochi.beforePhoto} float />
            <h1 className="text-center font-display text-3xl sm:text-4xl">
              {t.booth.title1}
              <span className="title-gradient">{t.booth.titleHi}</span> 📸
            </h1>

            <div className="plush-card w-full max-w-2xl p-7">
              <h2 className="font-display text-lg">{t.booth.step1}</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayoutId(l.id)}
                    className={`rounded-3xl border-2 px-4 py-4 transition-all ${
                      layoutId === l.id
                        ? "border-blossom-400 bg-blossom-100 shadow-bubble scale-[1.02]"
                        : "border-white/70 bg-white/50 hover:bg-white/80"
                    }`}
                  >
                    {/* tiny layout sketch */}
                    <span
                      className={`mx-auto mb-2 grid w-fit gap-[3px] ${
                        l.style === "grid" ? "grid-cols-2" : "grid-cols-1"
                      }`}
                    >
                      {Array.from({ length: l.count }, (_, i) => (
                        <span
                          key={i}
                          className={`block rounded-[2px] ${
                            layoutId === l.id ? "bg-blossom-400/70" : "bg-cocoaSoft/30"
                          }`}
                          style={{ width: l.style === "grid" ? 14 : 22, height: 9 }}
                        />
                      ))}
                    </span>
                    <span
                      className={`block font-display text-sm leading-tight ${
                        layoutId === l.id ? "text-[#a45a7c]" : "text-cocoa"
                      }`}
                    >
                      {layoutLabel(l.id)}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-cocoaSoft">{t.booth.shotsInfo}</p>

              <h2 className="mt-6 font-display text-lg">{t.booth.step2}</h2>
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
                    {t.categories[c.id].label}
                  </button>
                ))}
              </div>

              <button onClick={() => setStage("capture")} className="btn-candy mt-7 w-full">
                {t.booth.open}
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
                  ? t.mochi.countdown
                  : allCaptured
                    ? t.mochi.afterPhoto
                    : retakeIndex !== null
                      ? t.booth.retakeOne
                      : t.booth.pickFilter}
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
                    <p className="font-display text-cocoa">{t.booth.demoTitle}</p>
                  </div>
                )}
                <FxOverlay fx={filterInfo.fx} />

                {cameraError && !demoMode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-cream-100/95 p-6 text-center">
                    <Image src="/mochi/mochi-curious.png" alt="" width={110} height={130} />
                    <p className="max-w-sm text-sm text-cocoa">{t.booth.cameraError}</p>
                    <div className="flex gap-3">
                      <button onClick={() => startCamera(facing)} className="btn-cloud !px-5 !py-2 !text-sm">
                        {t.booth.retryCamera}
                      </button>
                      <button onClick={() => setDemoMode(true)} className="btn-candy !px-5 !py-2 !text-sm">
                        {t.booth.demoMode}
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
                    {f.emoji} {t.filters[f.id]}
                  </button>
                ))}
              </div>

              {/* beauty skin control */}
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                <span className="font-display text-sm text-cocoa">{t.booth.beautyTitle}</span>
                {([0, 1, 2] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setBeauty(lvl)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      beauty === lvl
                        ? "border-mint-400 bg-mint-100 text-mint-600 shadow-plush scale-105"
                        : "border-white/70 bg-white/60 hover:bg-white/90"
                    }`}
                  >
                    {lvl === 0 ? t.booth.beautyOff : lvl === 1 ? t.booth.beautySoft : t.booth.beautyMax}
                  </button>
                ))}
                <span className="w-full text-center text-[11px] text-cocoaSoft">
                  {t.booth.beautyHint}
                </span>
              </div>
            </div>

            {/* controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  setMutedState(next);
                }}
                title={muted ? t.booth.unmuteTip : t.booth.muteTip}
                className="btn-cloud !px-4 !py-2.5 !text-sm"
              >
                {muted ? "🔕" : "🔔"}
              </button>
              <button
                onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
                disabled={shooting || demoMode}
                className="btn-cloud !px-5 !py-2.5 !text-sm disabled:opacity-40"
              >
                {t.booth.flip}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={shooting}
                className="btn-cloud !px-5 !py-2.5 !text-sm disabled:opacity-40"
              >
                {t.booth.fromGallery}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  onFilesPicked(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                onClick={startShoot}
                disabled={shooting || (!demoMode && cameraError)}
                className="btn-candy !px-9 disabled:opacity-50"
              >
                {shooting ? t.booth.shooting : allCaptured ? t.booth.shootAgain : t.booth.start}
              </button>
              {allCaptured && !shooting && (
                <button
                  onClick={() => setStage("select")}
                  className="btn-candy !bg-none !px-6"
                  style={{ background: "linear-gradient(135deg,#9ed193,#84bd78)" }}
                >
                  {t.booth.pickFavorites}
                </button>
              )}
            </div>

            {/* captured thumbnails (8 shots) */}
            <div className="flex max-w-2xl flex-wrap justify-center gap-2.5">
              {Array.from({ length: SHOT_COUNT }, (_, i) => (
                <button
                  key={i}
                  onClick={() => photos[i] && retake(i)}
                  title={photos[i] ? t.booth.tapRetakeTip : t.booth.waiting}
                  className={`relative h-16 w-[5.4rem] overflow-hidden rounded-xl border-2 transition-all ${
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
                      alt={`${t.booth.photoAlt} ${i + 1}`}
                      className={`h-full w-full object-cover ${filterInfo.className}`}
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-lg opacity-40">💗</span>
                  )}
                </button>
              ))}
            </div>
            {allCaptured && <p className="text-xs text-cocoaSoft">{t.booth.tapRetake}</p>}
          </motion.section>
        )}

        {/* ------------------------------------------------ select favorites */}
        {stage === "select" && (
          <motion.section
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-6 py-4"
          >
            <div className="flex items-center gap-4">
              <MochiDino pose="curious" size={92} float={false} interactive={false} />
              <p className="glass-strong max-w-xs rounded-3xl px-4 py-2.5 font-display text-sm shadow-bubble">
                {t.booth.selectMochi}
              </p>
            </div>
            <h2 className="text-center font-display text-2xl sm:text-3xl">
              {t.booth.selectTitle(layout.count)}
            </h2>
            <p className="chip">{t.booth.selectCount(selected.length, layout.count)}</p>

            <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((p, i) => {
                const order = selected.indexOf(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleSelect(i)}
                    className={`relative overflow-hidden rounded-2xl border-4 transition-all ${
                      order >= 0
                        ? "border-blossom-400 shadow-bubble scale-[1.03]"
                        : "border-white opacity-90 hover:scale-[1.02] hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p}
                      alt={`${t.booth.photoAlt} ${i + 1}`}
                      className={`aspect-[4/3] w-full object-cover ${filterInfo.className}`}
                    />
                    {order >= 0 && (
                      <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-blossom-400 font-display text-sm text-white shadow-bubble">
                        {order + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => setStage("capture")} className="btn-cloud">
                {t.booth.selectBack}
              </button>
              <button
                onClick={() => setStage("decorate")}
                disabled={selected.length !== layout.count}
                className="btn-candy disabled:opacity-50"
              >
                {t.booth.decorate}
              </button>
            </div>
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
                  width: geo.width * previewScale,
                  height: geo.height * previewScale,
                  backgroundColor: frameInfo.bg,
                  ...patternStyle(frameInfo.decor, previewScale)
                }}
              >
                {pickedPhotos.slice(0, layout.count).map((p, i) => {
                  const r = geo.rects[i];
                  if (!r) return null;
                  return (
                    <div
                      key={i}
                      className="absolute overflow-hidden"
                      style={{
                        left: r.x * previewScale,
                        top: r.y * previewScale,
                        width: r.w * previewScale,
                        height: r.h * previewScale,
                        borderRadius: 10
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p}
                        alt=""
                        draggable={false}
                        className={`h-full w-full object-cover ${filterInfo.className}`}
                      />
                      <FxOverlay fx={filterInfo.fx} rounded={10} />
                    </div>
                  );
                })}
                <div
                  className="absolute inset-x-0 text-center leading-tight"
                  style={{ top: (geo.captionY + 8) * previewScale, color: frameInfo.text }}
                >
                  {frameInfo.decor?.label && (
                    <p
                      className="font-display"
                      style={{ fontSize: 15 * previewScale * 0.95, opacity: 0.9 }}
                    >
                      {frameInfo.decor.label}
                    </p>
                  )}
                  <p className="font-display" style={{ fontSize: 22 * previewScale * 0.95 }}>
                    Dear Memory
                  </p>
                  <p style={{ fontSize: 14 * previewScale * 0.95, opacity: 0.85 }}>
                    {title ? `${title}  ·  ${dateLabel}` : dateLabel}
                  </p>
                </div>
                <FrameDecorOverlay decor={frameInfo.decor} geo={geo} scale={previewScale} />

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
                        left: s.x * geo.width * previewScale,
                        top: s.y * geo.height * previewScale,
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
                  {t.mochi.decorating}
                </p>
              </div>

              <div className="plush-card p-5">
                <h3 className="font-display text-base">{t.booth.nameTitle}</h3>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 40))}
                  placeholder={t.booth.namePh}
                  className="mt-2 w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm outline-none placeholder:text-cocoaSoft/60 focus:ring-2 focus:ring-blossom-300"
                />
              </div>

              <div className="plush-card p-5">
                <h3 className="font-display text-base">{t.booth.frameTitle}</h3>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {FRAMES.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFrame(f.id)}
                      title={t.frames[f.id]}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm transition-transform hover:scale-110 ${f.swatchClass} ${
                        frame === f.id ? "border-cocoa scale-110" : "border-white"
                      }`}
                    >
                      {f.decor ? f.decor.top[0] : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="plush-card p-5">
                <h3 className="font-display text-base">{t.booth.stickersTitle}</h3>
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
                    <span className="text-xs font-semibold text-cocoaSoft">{t.booth.selected}</span>
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
                <p className="mt-3 text-xs text-cocoaSoft">{t.booth.stickerHint}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStage("select")} className="btn-cloud flex-1 !text-base">
                  {t.booth.back}
                </button>
                <button onClick={finishAndSave} disabled={saving} className="btn-candy flex-1 !text-base">
                  {saving ? t.mochi.loading : t.booth.keep}
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
            <MochiDino pose="excited" size={150} message={t.mochi.afterPhoto} />
            <h2 className="text-center font-display text-3xl">
              {savedMemory ? t.booth.doneSaved : t.booth.doneReady}
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src={finalStrip}
              alt={t.booth.stripAlt}
              initial={{ rotate: -4 }}
              animate={{ rotate: [-4, 3, -2, 0] }}
              transition={{ duration: 1 }}
              className="rounded-2xl border-4 border-white shadow-plushLg"
              style={{ width: layout.style === "grid" ? 330 : 260 }}
            />
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={download} className="btn-candy">
                {t.booth.download}
              </button>
              <button onClick={makeGif} disabled={gifBusy} className="btn-candy disabled:opacity-60">
                {gifBusy ? t.booth.gifBusy : t.booth.gif}
              </button>
              <button onClick={share} className="btn-cloud">
                {t.booth.share}
              </button>
              <Link href="/scrapbook" className="btn-cloud">
                {t.booth.openScrapbook}
              </Link>
              <button
                onClick={() => {
                  setPhotos([]);
                  setSelected([]);
                  setStickers([]);
                  setTitle("");
                  setFinalStrip(null);
                  setStage("setup");
                }}
                className="btn-cloud"
              >
                {t.booth.newMemory}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
