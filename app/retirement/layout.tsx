import type { Metadata } from "next";
import { Chakra_Petch, Noto_Sans_Thai } from "next/font/google";

const thaiDisplay = Chakra_Petch({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rt-display"
});

const thaiBody = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rt-body"
});

export const metadata: Metadata = {
  title: "วางแผนเกษียณ — Retirement Planner",
  description:
    "ระบบวางแผนเกษียณครบวงจร คำนวณเงินที่ต้องมี เงินที่จะมี และเงินออมต่อเดือนที่ต้องเพิ่ม พร้อมกราฟจำลองความมั่งคั่งตลอดชีวิต"
};

/*
 * Self-contained styles for the /retirement zone only.
 * Everything is namespaced with `rt-` so nothing leaks into the rest of the app.
 */
const css = `
.rt-root {
  font-family: var(--font-rt-body), "Noto Sans Thai", sans-serif;
  font-feature-settings: "tnum";
}
.rt-display {
  font-family: var(--font-rt-display), "Chakra Petch", var(--font-rt-body), sans-serif;
}
.rt-root ::selection { background: rgba(34, 211, 238, 0.35); color: #f8fafc; }
.rt-root::-webkit-scrollbar { width: 10px; }
.rt-root::-webkit-scrollbar-thumb { background: rgba(94, 234, 212, 0.25); border-radius: 999px; }
.rt-root::-webkit-scrollbar-thumb:hover { background: rgba(94, 234, 212, 0.45); }

/* glass panels on dark */
.rt-panel {
  background: linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.09);
  backdrop-filter: blur(18px);
  border-radius: 1.5rem;
  box-shadow: 0 24px 60px -28px rgba(0, 0, 0, 0.7);
}
.rt-panel-glow {
  position: relative;
}
.rt-panel-glow::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(34,211,238,0.5), rgba(167,139,250,0.35) 45%, rgba(244,114,182,0.4));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* futuristic range slider */
.rt-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, #22d3ee, #a78bfa) 0 / var(--rt-fill, 50%) 100% no-repeat,
    rgba(255, 255, 255, 0.12);
  outline: none;
  cursor: pointer;
  transition: filter 0.2s;
}
.rt-range:hover { filter: brightness(1.15); }
.rt-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #f8fafc;
  border: 2px solid #22d3ee;
  box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.22), 0 0 14px rgba(34, 211, 238, 0.55);
  transition: transform 0.15s;
}
.rt-range::-webkit-slider-thumb:active { transform: scale(1.2); }
.rt-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #f8fafc;
  border: 2px solid #22d3ee;
  box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.22), 0 0 14px rgba(34, 211, 238, 0.55);
}

/* numeric input — frameless until focus */
.rt-num {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.75rem;
  color: #e2e8f0;
  transition: border-color .2s, box-shadow .2s;
}
.rt-num:focus {
  outline: none;
  border-color: rgba(34,211,238,0.7);
  box-shadow: 0 0 0 3px rgba(34,211,238,0.18);
}
.rt-num::-webkit-outer-spin-button, .rt-num::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.rt-num[type="number"] { -moz-appearance: textfield; appearance: textfield; }

/* slow aurora drift */
@keyframes rt-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(40px, -30px, 0) scale(1.12); }
}
.rt-aurora { animation: rt-drift 14s ease-in-out infinite; will-change: transform; }
.rt-aurora-slow { animation: rt-drift 22s ease-in-out infinite reverse; will-change: transform; }

@keyframes rt-scan {
  from { background-position: 0 0; }
  to { background-position: 0 64px; }
}
.rt-grid-bg {
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
  background-size: 64px 64px;
  animation: rt-scan 18s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .rt-aurora, .rt-aurora-slow, .rt-grid-bg { animation: none; }
}
`;

export default function RetirementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${thaiDisplay.variable} ${thaiBody.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </div>
  );
}
