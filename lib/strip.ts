"use client";

import type { FilterId, FrameId, PlacedSticker } from "./types";
import { filterById, frameById } from "./filters";
import { stickerByKey } from "./stickers";

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

/** Captures the current video frame into a data URL (unfiltered). */
export function captureFrame(video: HTMLVideoElement, mirrored: boolean): string {
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
  return canvas.toDataURL("image/jpeg", 0.9);
}
