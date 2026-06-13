"use client";

import type { FilterId, FrameId, PlacedSticker } from "./types";
import { filterById, frameById, type FilterFx, type FrameDecor } from "./filters";
import { stickerByKey } from "./stickers";
import { smoothSkin, type BeautyLevel } from "./beauty";

export type LayoutStyle = "strip" | "grid";

export interface PhotoRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StripGeometry {
  width: number;
  height: number;
  pad: number;
  captionY: number;
  rects: PhotoRect[];
}

const PAD = 26;
const GAP = 16;
const CAPTION_H = 96;
const RATIO = 3 / 4; // photo height / width

/**
 * Layout geometry for every booth style:
 * - "strip": the classic Korean 1×4 / 1×6 vertical strip
 * - "grid": 2×2 or 2×3 like Life4Cuts grids
 */
export function getStripGeometry(count: 4 | 6, style: LayoutStyle): StripGeometry {
  const rects: PhotoRect[] = [];
  if (style === "grid") {
    const width = 640;
    const cols = 2;
    const rows = count / 2;
    const w = (width - PAD * 2 - GAP) / cols;
    const h = w * RATIO;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rects.push({ x: PAD + c * (w + GAP), y: PAD + r * (h + GAP), w, h });
      }
    }
    const height = Math.round(PAD + rows * h + (rows - 1) * GAP + CAPTION_H);
    return { width, height, pad: PAD, captionY: height - CAPTION_H, rects };
  }
  const width = 480;
  const w = width - PAD * 2;
  const h = w * RATIO;
  for (let i = 0; i < count; i++) {
    rects.push({ x: PAD, y: PAD + i * (h + GAP), w, h });
  }
  const height = Math.round(PAD + count * h + (count - 1) * GAP + CAPTION_H);
  return { width, height, pad: PAD, captionY: height - CAPTION_H, rects };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draws an image into a rect using cover semantics. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

let grainTile: HTMLCanvasElement | null = null;

/** small noise tile reused as a repeating film-grain pattern */
function getGrainTile(): HTMLCanvasElement {
  if (grainTile) return grainTile;
  const tile = document.createElement("canvas");
  tile.width = tile.height = 128;
  const tctx = tile.getContext("2d")!;
  const img = tctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = tile;
  return tile;
}

/** Applies film-style extras (glow, grain, vignette) over a photo rect. */
export function applyFx(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  fx: FilterFx | undefined
) {
  if (!fx) return;

  if (fx.glow && typeof ctx.filter === "string") {
    // soft bloom: screen-blend a blurred copy of the photo over itself
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext("2d");
    if (tctx) {
      tctx.filter = `blur(${Math.max(4, Math.round(w / 70))}px) brightness(1.1)`;
      tctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = fx.glow;
      ctx.drawImage(tmp, x, y);
      ctx.restore();
    }
  }

  if (fx.grain) {
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = fx.grain;
    ctx.fillStyle = ctx.createPattern(getGrainTile(), "repeat")!;
    ctx.translate(x, y);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  if (fx.vignette) {
    const grad = ctx.createRadialGradient(
      x + w / 2,
      y + h / 2,
      Math.min(w, h) * 0.42,
      x + w / 2,
      y + h / 2,
      Math.max(w, h) * 0.72
    );
    grad.addColorStop(0, "rgba(30,16,26,0)");
    grad.addColorStop(1, `rgba(30,16,26,${fx.vignette})`);
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}

/** Draws a patterned background (gingham / dots) over the base color. */
function drawFramePattern(
  ctx: CanvasRenderingContext2D,
  geo: StripGeometry,
  decor: FrameDecor
) {
  if (!decor.pattern) return;
  const ink = decor.patternColor ?? "rgba(0,0,0,0.15)";
  ctx.save();
  if (decor.pattern === "gingham") {
    const cell = 22;
    ctx.fillStyle = ink;
    // overlapping translucent bands give the classic gingham look
    for (let x = 0; x < geo.width; x += cell * 2) ctx.fillRect(x, 0, cell, geo.height);
    for (let y = 0; y < geo.height; y += cell * 2) ctx.fillRect(0, y, geo.width, cell);
  } else if (decor.pattern === "dots") {
    ctx.fillStyle = ink;
    const gap = 26;
    for (let y = gap / 2; y < geo.height; y += gap) {
      for (let x = gap / 2; x < geo.width; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/** Draws the frame trim: top bar, emoji border, corners and official Mochi art. */
async function drawFrameDecor(
  ctx: CanvasRenderingContext2D,
  geo: StripGeometry,
  decor: FrameDecor
) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // booth-receipt top label bar
  if (decor.bar) {
    ctx.fillStyle = decor.patternColor ?? "rgba(255,255,255,0.9)";
    ctx.font = "700 12px 'Quicksand', sans-serif";
    ctx.fillText(decor.bar, geo.width / 2, 13);
  } else {
    // top border row
    ctx.font = "14px serif";
    ctx.globalAlpha = 0.95;
    let e = 0;
    for (let x = geo.pad + 10; x <= geo.width - geo.pad - 10; x += 52) {
      ctx.fillText(decor.top[e % decor.top.length], x, 13);
      e++;
    }
    ctx.globalAlpha = 1;
  }

  // corners
  ctx.font = "16px serif";
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = decor.patternColor ?? "rgba(0,0,0,0.8)";
  ctx.fillText(decor.corner, 13, 13);
  ctx.fillText(decor.corner, geo.width - 13, 13);
  ctx.fillText(decor.corner, 13, geo.height - 14);
  if (!decor.mochi) ctx.fillText(decor.corner, geo.width - 13, geo.height - 14);
  ctx.globalAlpha = 1;

  // official Mochi art tucked into the caption corner
  if (decor.mochi) {
    try {
      const img = await loadImage(decor.mochi);
      const h = 64;
      const w = h * (img.width / img.height);
      ctx.drawImage(img, geo.width - w - 10, geo.height - h - 8, w, h);
    } catch {
      // decor art is optional — never block the strip
    }
  }
  ctx.restore();
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface ComposeOptions {
  photos: string[]; // the chosen shots, in strip order
  count: 4 | 6;
  style: LayoutStyle;
  filter: FilterId;
  frame: FrameId;
  stickers: PlacedSticker[];
  title: string;
  dateLabel: string;
}

/** Composites the final keepsake strip and returns a JPEG data URL. */
export async function composeStrip(opts: ComposeOptions): Promise<string> {
  const geo = getStripGeometry(opts.count, opts.style);
  const canvas = document.createElement("canvas");
  canvas.width = geo.width;
  canvas.height = geo.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  const frame = frameById(opts.frame);
  const filter = filterById(opts.filter);

  ctx.fillStyle = frame.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (frame.decor) drawFramePattern(ctx, geo, frame.decor);

  const supportsFilter = typeof ctx.filter === "string";
  const images = await Promise.all(opts.photos.slice(0, opts.count).map(loadImage));
  images.forEach((img, i) => {
    const r = geo.rects[i];
    if (!r) return;
    ctx.save();
    roundedRectPath(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.clip();
    if (supportsFilter && filter.css !== "none") ctx.filter = filter.css;
    drawCover(ctx, img, r.x, r.y, r.w, r.h);
    ctx.filter = "none";
    applyFx(ctx, canvas, r.x, r.y, r.w, r.h, filter.fx);
    ctx.restore();
  });

  // caption
  ctx.fillStyle = frame.text;
  ctx.textAlign = "center";
  if (frame.decor?.label) {
    ctx.font = "600 15px 'Baloo 2', cursive";
    ctx.globalAlpha = 0.9;
    ctx.fillText(frame.decor.label, geo.width / 2, geo.captionY + 16);
    ctx.globalAlpha = 1;
  }
  ctx.font = "600 22px 'Baloo 2', 'Comic Sans MS', cursive";
  ctx.fillText("Dear Memory", geo.width / 2, geo.captionY + 40);
  ctx.font = "500 14px 'Quicksand', sans-serif";
  ctx.globalAlpha = 0.85;
  const caption = opts.title ? `${opts.title}  ·  ${opts.dateLabel}` : opts.dateLabel;
  ctx.fillText(caption, geo.width / 2, geo.captionY + 62);
  ctx.globalAlpha = 1;

  if (frame.decor) await drawFrameDecor(ctx, geo, frame.decor);

  // stickers (positions are fractions of the full strip)
  for (const s of opts.stickers) {
    const def = stickerByKey(s.sticker);
    if (!def) continue;
    const cx = s.x * geo.width;
    const cy = s.y * geo.height;
    const size = 52 * s.scale;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((s.rotation * Math.PI) / 180);
    if (def.kind === "emoji") {
      ctx.font = `${size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(def.value, 0, 0);
    } else {
      const img = await loadImage(def.value);
      const h = size * (img.height / img.width);
      ctx.drawImage(img, -size / 2, -h / 2, size, h);
    }
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.85);
}

/** Captures the current video frame (with optional skin smoothing) into a data URL. */
export function captureFrame(
  video: HTMLVideoElement,
  mirrored: boolean,
  beauty: BeautyLevel = 0
): string {
  const canvas = document.createElement("canvas");
  const w = Math.min(video.videoWidth || 640, 960);
  const h = Math.round(w * (video.videoHeight / video.videoWidth || 0.75));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  if (mirrored) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  smoothSkin(canvas, ctx, beauty);
  return canvas.toDataURL("image/jpeg", 0.9);
}
