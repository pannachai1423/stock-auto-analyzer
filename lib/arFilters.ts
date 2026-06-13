"use client";

import type { FaceLandmarks } from "./faceTracker";

export type ArFilterId =
  | "none"
  | "bunny"
  | "cat"
  | "puppy"
  | "crown"
  | "glasses"
  | "hearts"
  | "flower"
  | "sparkle";

export interface ArFilterInfo {
  id: ArFilterId;
  emoji: string;
}

export const AR_FILTERS: ArFilterInfo[] = [
  { id: "none", emoji: "🚫" },
  { id: "bunny", emoji: "🐰" },
  { id: "cat", emoji: "🐱" },
  { id: "puppy", emoji: "🐶" },
  { id: "crown", emoji: "👑" },
  { id: "glasses", emoji: "🕶️" },
  { id: "hearts", emoji: "😍" },
  { id: "flower", emoji: "🌸" },
  { id: "sparkle", emoji: "✨" }
];

// FaceMesh landmark indices we anchor to (478-point model with irises)
const FOREHEAD = 10;
const CHIN = 152;
const FACE_L = 234;
const FACE_R = 454;
const IRIS_L = 468;
const IRIS_R = 473;
const NOSE = 1;

type Pt = { x: number; y: number };

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function drawEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  cx: number,
  cy: number,
  size: number,
  angle = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.font = `${size}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 0, 0);
  ctx.restore();
}

function softEar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  outer: string,
  inner: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.ellipse(0, h * 0.05, w / 4, h / 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function triangleEar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  flip: number,
  outer: string,
  inner: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(flip * w * 0.15, -h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.moveTo(-w / 4, -h * 0.12);
  ctx.lineTo(w / 4, -h * 0.12);
  ctx.lineTo(flip * w * 0.12, -h * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draws an AR filter over a face, in raw (un-mirrored) video pixel space.
 * The caller is responsible for any mirroring transform.
 */
export function drawArFilter(
  ctx: CanvasRenderingContext2D,
  lms: FaceLandmarks,
  W: number,
  H: number,
  id: ArFilterId
) {
  if (id === "none" || !lms || lms.length < 478) return;
  const P = (i: number): Pt => ({ x: lms[i].x * W, y: lms[i].y * H });

  try {
    const top = P(FOREHEAD);
    const chin = P(CHIN);
    const fl = P(FACE_L);
    const fr = P(FACE_R);
    const eyeL = P(IRIS_L);
    const eyeR = P(IRIS_R);
    const nose = P(NOSE);
    const faceW = dist(fl, fr);
    const faceH = dist(top, chin);
    const angle = Math.atan2(fr.y - fl.y, fr.x - fl.x);
    const eyeMid = mid(eyeL, eyeR);
    const eyeGap = dist(eyeL, eyeR);
    const headTop = { x: top.x, y: top.y - faceH * 0.12 };
    const ux = Math.cos(angle);
    const uy = Math.sin(angle); // unit vector along the eye line

    switch (id) {
      case "bunny": {
        const ew = faceW * 0.26;
        const eh = faceH * 0.7;
        const off = faceW * 0.26;
        softEar(ctx, headTop.x - ux * off, headTop.y - eh * 0.5 - uy * off, ew, eh, angle - 0.25, "#fff7fb", "#ffc4dd");
        softEar(ctx, headTop.x + ux * off, headTop.y - eh * 0.5 + uy * off, ew, eh, angle + 0.25, "#fff7fb", "#ffc4dd");
        // blush
        ctx.fillStyle = "rgba(255,150,180,0.35)";
        ctx.beginPath();
        ctx.ellipse(nose.x - faceW * 0.26, nose.y, faceW * 0.1, faceW * 0.07, 0, 0, 7);
        ctx.ellipse(nose.x + faceW * 0.26, nose.y, faceW * 0.1, faceW * 0.07, 0, 0, 7);
        ctx.fill();
        break;
      }
      case "cat": {
        const ew = faceW * 0.42;
        const eh = faceH * 0.55;
        const off = faceW * 0.28;
        triangleEar(ctx, headTop.x - ux * off, headTop.y - uy * off, ew, eh, -1, "#9a8a82", "#ffc4dd");
        triangleEar(ctx, headTop.x + ux * off, headTop.y + uy * off, ew, eh, 1, "#9a8a82", "#ffc4dd");
        // whiskers
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = Math.max(1.5, faceW * 0.008);
        for (const s of [-1, 1]) {
          for (const dy of [-0.04, 0, 0.04]) {
            ctx.beginPath();
            ctx.moveTo(nose.x + s * faceW * 0.08, nose.y + faceH * dy);
            ctx.lineTo(nose.x + s * faceW * 0.42, nose.y + faceH * (dy * 2 - 0.02));
            ctx.stroke();
          }
        }
        drawEmoji(ctx, "🐾", nose.x, nose.y, faceW * 0.12, angle);
        break;
      }
      case "puppy": {
        const ew = faceW * 0.3;
        const eh = faceH * 0.85;
        softEar(ctx, fl.x - ux * faceW * 0.02, fl.y - faceH * 0.05, ew, eh, angle - 0.5, "#b98a5e", "#8a5a3a");
        softEar(ctx, fr.x + ux * faceW * 0.02, fr.y - faceH * 0.05, ew, eh, angle + 0.5, "#b98a5e", "#8a5a3a");
        drawEmoji(ctx, "🐽", nose.x, nose.y + faceH * 0.02, faceW * 0.16, angle);
        break;
      }
      case "crown":
        drawEmoji(ctx, "👑", headTop.x, headTop.y - faceH * 0.18, faceW * 0.7, angle);
        break;
      case "glasses": {
        const r = eyeGap * 0.42;
        ctx.strokeStyle = "#3a2c25";
        ctx.lineWidth = Math.max(2, faceW * 0.012);
        ctx.fillStyle = "rgba(180,220,255,0.18)";
        for (const c of [eyeL, eyeR]) {
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, r, r * 0.92, angle, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(eyeL.x + ux * r, eyeL.y + uy * r);
        ctx.lineTo(eyeR.x - ux * r, eyeR.y - uy * r);
        ctx.stroke();
        // little glints
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        for (const c of [eyeL, eyeR]) {
          ctx.beginPath();
          ctx.ellipse(c.x - r * 0.35, c.y - r * 0.35, r * 0.22, r * 0.14, angle, 0, 7);
          ctx.fill();
        }
        break;
      }
      case "hearts":
        drawEmoji(ctx, "💗", eyeL.x, eyeL.y, eyeGap * 0.7, angle);
        drawEmoji(ctx, "💗", eyeR.x, eyeR.y, eyeGap * 0.7, angle);
        break;
      case "flower": {
        const n = 7;
        for (let i = 0; i < n; i++) {
          const t = i / (n - 1) - 0.5; // -0.5..0.5 across the brow
          const px = headTop.x + ux * t * faceW * 1.05;
          const py = headTop.y + uy * t * faceW * 1.05 - Math.cos(t * Math.PI) * faceH * 0.08;
          drawEmoji(ctx, i % 2 ? "🌸" : "🌼", px, py, faceW * 0.16, angle);
        }
        break;
      }
      case "sparkle": {
        const spots: [number, number, number][] = [
          [headTop.x, headTop.y, 0.22],
          [fl.x - faceW * 0.05, eyeMid.y, 0.14],
          [fr.x + faceW * 0.05, eyeMid.y, 0.14],
          [nose.x - faceW * 0.3, chin.y, 0.12],
          [nose.x + faceW * 0.3, chin.y, 0.12]
        ];
        for (const [x, y, s] of spots) drawEmoji(ctx, "✨", x, y, faceW * s, angle);
        // cheek stars
        drawEmoji(ctx, "⭐", nose.x - faceW * 0.3, nose.y + faceH * 0.05, faceW * 0.12, angle);
        drawEmoji(ctx, "⭐", nose.x + faceW * 0.3, nose.y + faceH * 0.05, faceW * 0.12, angle);
        break;
      }
    }
  } catch {
    // never let a draw error break the booth
  }
}
