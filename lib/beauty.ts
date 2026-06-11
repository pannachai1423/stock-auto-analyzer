"use client";

/**
 * Korean-photobooth-style skin smoothing, fully client-side.
 *
 * How it works: the frame is blurred once, then blended back into the
 * original ONLY where pixels look like skin (YCbCr chroma range, with a
 * soft falloff so there are no hard seams). Eyes, brows, lips, hair and
 * the background keep their detail, so the photo stays sharp while skin
 * turns porcelain-smooth — the same trick beauty apps use.
 */

export type BeautyLevel = 0 | 1 | 2;

/** blend strength per level (0 = off) */
const STRENGTH: Record<BeautyLevel, number> = { 0: 0, 1: 0.5, 2: 0.75 };
/** subtle brightening of skin areas per level, in RGB points */
const BRIGHTEN: Record<BeautyLevel, number> = { 0: 0, 1: 4, 2: 8 };

/** soft 0..1 membership for v in [lo, hi] with a feathered edge */
function softRange(v: number, lo: number, hi: number, feather: number): number {
  if (v < lo - feather || v > hi + feather) return 0;
  if (v < lo) return (v - (lo - feather)) / feather;
  if (v > hi) return (hi + feather - v) / feather;
  return 1;
}

/** Smooths skin in place on the given canvas. No-op when unsupported. */
export function smoothSkin(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  level: BeautyLevel
): void {
  const strength = STRENGTH[level];
  if (strength <= 0) return;
  // ctx.filter is needed for the blur pass; bail gracefully without it
  if (typeof ctx.filter !== "string") return;

  const { width: w, height: h } = canvas;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");
  if (!octx) return;
  const radius = Math.max(3, Math.round(w / 140));
  octx.filter = `blur(${radius}px)`;
  octx.drawImage(canvas, 0, 0);

  const src = ctx.getImageData(0, 0, w, h);
  const blur = octx.getImageData(0, 0, w, h);
  const s = src.data;
  const b = blur.data;
  const brighten = BRIGHTEN[level];

  for (let i = 0; i < s.length; i += 4) {
    const r = s[i];
    const g = s[i + 1];
    const bl = s[i + 2];
    // classic YCbCr skin chroma window, feathered
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * bl;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * bl;
    const p = softRange(cb, 80, 125, 14) * softRange(cr, 134, 172, 14);
    if (p <= 0) continue;
    const a = strength * p;
    s[i] = r + (b[i] - r) * a + brighten * p;
    s[i + 1] = g + (b[i + 1] - g) * a + brighten * p;
    s[i + 2] = bl + (b[i + 2] - bl) * a + brighten * p;
  }

  ctx.putImageData(src, 0, 0);
}
