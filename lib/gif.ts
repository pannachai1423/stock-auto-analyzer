"use client";

import { GIFEncoder, quantize, applyPalette } from "gifenc";
import type { FilterId, FrameId } from "./types";
import { filterById, frameById } from "./filters";

const GIF_W = 480;
const PHOTO_H = 360;
const CAPTION_H = 64;
const GIF_H = PHOTO_H + CAPTION_H;
const FRAME_DELAY_MS = 650;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export interface GifOptions {
  photos: string[];
  filter: FilterId;
  frame: FrameId;
  title: string;
  dateLabel: string;
}

/**
 * Turns the captured photos into a looping photobooth-style GIF —
 * each shot flips by like a little memory movie.
 */
export async function composeGif(opts: GifOptions): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = GIF_W;
  canvas.height = GIF_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas unavailable");

  const filter = filterById(opts.filter);
  const frame = frameById(opts.frame);
  const supportsFilter = typeof ctx.filter === "string";
  const images = await Promise.all(opts.photos.map(loadImage));

  const gif = GIFEncoder();

  for (const img of images) {
    ctx.filter = "none";
    ctx.fillStyle = frame.bg;
    ctx.fillRect(0, 0, GIF_W, GIF_H);

    // photo (cover)
    const scale = Math.max(GIF_W / img.width, PHOTO_H / img.height);
    const sw = GIF_W / scale;
    const sh = PHOTO_H / scale;
    ctx.save();
    if (supportsFilter && filter.css !== "none") ctx.filter = filter.css;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, GIF_W, PHOTO_H);
    ctx.restore();

    // caption bar
    ctx.fillStyle = frame.text;
    ctx.textAlign = "center";
    ctx.font = "600 24px 'Baloo 2', 'Comic Sans MS', cursive";
    ctx.fillText("Dear Memory 💖", GIF_W / 2, PHOTO_H + 28);
    ctx.font = "500 14px 'Quicksand', sans-serif";
    ctx.globalAlpha = 0.85;
    const caption = opts.title ? `${opts.title}  ·  ${opts.dateLabel}` : opts.dateLabel;
    ctx.fillText(caption, GIF_W / 2, PHOTO_H + 50);
    ctx.globalAlpha = 1;

    const { data } = ctx.getImageData(0, 0, GIF_W, GIF_H);
    const palette = quantize(data, 256);
    const indexed = applyPalette(data, palette);
    gif.writeFrame(indexed, GIF_W, GIF_H, { palette, delay: FRAME_DELAY_MS });
  }

  gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
}
