import type { Metadata } from "next";
import { Anuphan, Mitr } from "next/font/google";

const thaiDisplay = Mitr({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-rt-display"
});

const thaiBody = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
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
/* While the planner is on screen, hide the host app chrome (navbar/footer/toaster)
   without touching their source files — they live in sibling stacking contexts
   that would otherwise paint above this fixed overlay. */
body:has(.rt-root) > header,
body:has(.rt-root) > footer,
body:has(.rt-root) > div.pointer-events-none.fixed.bottom-5 {
  display: none;
}

.rt-root {
  font-family: var(--font-rt-body), "Anuphan", sans-serif;
  font-feature-settings: "tnum";
  background: #faf8f3;
  color: #3b362e;
}
.rt-display {
  font-family: var(--font-rt-display), "Mitr", sans-serif;
}
.rt-root ::selection { background: rgba(157, 191, 169, 0.35); color: #3b362e; }
.rt-root::-webkit-scrollbar { width: 10px; }
.rt-root::-webkit-scrollbar-thumb { background: #e3dccd; border-radius: 999px; }
.rt-root::-webkit-scrollbar-thumb:hover { background: #d4cab6; }

.rt-panel {
  background: #ffffff;
  border: 1px solid #ede7db;
  border-radius: 1.5rem;
  box-shadow: 0 1px 2px rgba(80, 65, 40, 0.03), 0 10px 28px -16px rgba(80, 65, 40, 0.1);
}

/* friendly range slider — soft track, white thumb with coral ring */
.rt-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, #a9c4b1, #a9c4b1) 0 / var(--rt-fill, 50%) 100% no-repeat,
    #f0eadf;
  outline: none;
  cursor: pointer;
}
.rt-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ffffff;
  border: 2.5px solid #87a892;
  box-shadow: 0 2px 6px rgba(80, 65, 40, 0.18);
  transition: transform 0.15s;
}
.rt-range:hover::-webkit-slider-thumb { transform: scale(1.12); }
.rt-range::-webkit-slider-thumb:active { transform: scale(1.25); }
.rt-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ffffff;
  border: 2.5px solid #87a892;
  box-shadow: 0 2px 6px rgba(80, 65, 40, 0.18);
}
.rt-range:focus-visible {
  box-shadow: 0 0 0 3px rgba(135, 168, 146, 0.35);
}

.rt-num {
  background: #faf8f3;
  border: 1px solid #e7dfd0;
  border-radius: 0.7rem;
  color: #3b362e;
  transition: border-color 0.2s, background 0.2s;
}
.rt-num:focus {
  outline: none;
  background: #ffffff;
  border-color: #87a892;
}
.rt-num::-webkit-outer-spin-button, .rt-num::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.rt-num[type="number"] { -moz-appearance: textfield; appearance: textfield; }
`;

export default function RetirementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${thaiDisplay.variable} ${thaiBody.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </div>
  );
}
