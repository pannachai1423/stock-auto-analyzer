import type { Metadata } from "next";
import { Noto_Sans_Thai, Trirong } from "next/font/google";

const thaiDisplay = Trirong({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-rt-display"
});

const thaiBody = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
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
  font-family: var(--font-rt-body), "Noto Sans Thai", sans-serif;
  font-feature-settings: "tnum";
  background: #0c0c0e;
  color: #e9e6df;
}
.rt-display {
  font-family: var(--font-rt-display), "Trirong", serif;
}
.rt-root ::selection { background: rgba(222, 188, 124, 0.3); color: #f5f2ea; }
.rt-root::-webkit-scrollbar { width: 10px; }
.rt-root::-webkit-scrollbar-thumb { background: rgba(222, 188, 124, 0.2); border-radius: 999px; }
.rt-root::-webkit-scrollbar-thumb:hover { background: rgba(222, 188, 124, 0.4); }

/* quiet film grain so large dark areas don't look flat */
.rt-grain {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity: 0.05;
}

.rt-panel {
  background: rgba(255, 255, 255, 0.022);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 1.25rem;
}

/* understated range slider — thin track, solid brass thumb */
.rt-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 3px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, #debc7c, #debc7c) 0 / var(--rt-fill, 50%) 100% no-repeat,
    rgba(255, 255, 255, 0.13);
  outline: none;
  cursor: pointer;
}
.rt-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #e9cd92;
  border: none;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.55);
  transition: transform 0.15s;
}
.rt-range:hover::-webkit-slider-thumb { transform: scale(1.18); }
.rt-range::-webkit-slider-thumb:active { transform: scale(1.3); }
.rt-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #e9cd92;
  border: none;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.55);
}

.rt-num {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.6rem;
  color: #e9e6df;
  transition: border-color 0.2s;
}
.rt-num:focus {
  outline: none;
  border-color: rgba(222, 188, 124, 0.55);
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
