"use client";

import type { FilterId, FrameId, PlacedSticker } from "./types";
import { filterById, frameById, type FilterFx } from "./filters";
import { stickerByKey } from "./stickers";
import { smoothSkin, type BeautyLevel } from "./beauty";

/** Geometry for a photo strip. All sizes in canvas pixels. */
export const STRIP = {
  width: 480,
  pad: 26,
  gap: 16,
  photoRatio: 3 / 4, // height / width of each photo
  captionHeight: 96
};

export function stripHeight(layout: 4 | 6): number {
  const photoH = (STRIP.width - STRIP.pad * 2) * STRIP.photoRatio;
  return STRIP.pad + layout * photoH + (layout - 1) * STRIP.gap + STRIP.captionHeight;
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
  photos: string[]; // raw captured frames as data URLs
  layout: 4 | 6;
  filter: FilterId;
  frame: FrameId;
  stickers: PlacedSticker[];
  title: string;
  dateLabel: string;
}

/** Composites the final keepsake strip and returns a JPEG data URL. */
export async function composeStrip(opts: ComposeOptions): Promise<string> {
  const { width, pad, gap, photoRatio, captionHeight } = STRIP;
  const height = stripHeight(opts.layout);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round(height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  const frame = frameById(opts.frame);
  const filter = filterById(opts.filter);

  ctx.fillStyle = frame.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const photoW = width - pad * 2;
  const photoH = photoW * photoRatio;
  const supportsFilter = typeof ctx.filter === "string";

  const images = await Promise.all(opts.photos.slice(0, opts.layout).map(loadImage));
  images.forEach((img, i) => {
    const y = pad + i * (photoH + gap);
    ctx.save();
    roundedRectPath(ctx, pad, y, photoW, photoH, 14);
    ctx.clip();
    if (supportsFilter && filter.css !== "none") ctx.filter = filter.css;
    drawCover(ctx, img, pad, y, photoW, photoH);
    ctx.filter = "none";
    applyFx(ctx, canvas, pad, y, photoW, photoH, filter.fx);
    ctx.restore();
  });

  // caption
  const capY = canvas.height - captionHeight;
  ctx.fillStyle = frame.text;
  ctx.textAlign = "center";
  ctx.font = "600 22px 'Baloo 2', 'Comic Sans MS', cursive";
  ctx.fillText("Dear Memory", width / 2, capY + 36);
  ctx.font = "500 14px 'Quicksand', sans-serif";
  ctx.globalAlpha = 0.85;
  const caption = opts.title ? `${opts.title}  ·  ${opts.dateLabel}` : opts.dateLabel;
  ctx.fillText(caption, width / 2, capY + 60);
  ctx.globalAlpha = 1;

  // stickers (positions are fractions of the full strip)
  for (const s of opts.stickers) {
    const def = stickerByKey(s.sticker);
    if (!def) continue;
    const cx = s.x * width;
    const cy = s.y * canvas.height;
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
