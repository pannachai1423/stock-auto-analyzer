"use client";

import { motion } from "framer-motion";
import { useAnimatedNumber } from "./fields";

interface Props {
  /** 0–999, percentage of the required nest egg covered */
  readinessPct: number;
}

const R = 66;
const CIRCUMFERENCE = 2 * Math.PI * R;
const ARC = CIRCUMFERENCE * 0.75; // 270° arc

function verdict(pct: number): { label: string; tone: string } {
  if (pct >= 100) return { label: "พร้อมเกษียณ", tone: "text-[#9dbfa9]" };
  if (pct >= 80) return { label: "เกือบถึงเป้า", tone: "text-[#e9cd92]" };
  if (pct >= 50) return { label: "ยังต้องสะสมเพิ่ม", tone: "text-[#e9cd92]" };
  return { label: "ควรปรับแผน", tone: "text-[#cf8d7a]" };
}

export default function ReadinessGauge({ readinessPct }: Props) {
  const shown = useAnimatedNumber(Math.min(readinessPct, 999));
  const fill = Math.min(readinessPct, 100) / 100;
  const v = verdict(readinessPct);

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 160 160" className="h-44 w-44 -rotate-[135deg]">
        <circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
        />
        <motion.circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke="#debc7c"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
          initial={{ strokeDashoffset: ARC }}
          animate={{ strokeDashoffset: ARC * (1 - fill) }}
          transition={{ type: "spring", stiffness: 50, damping: 18 }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-3">
        <span className="rt-display text-[42px] font-medium leading-none tracking-tight text-stone-100">
          {Math.round(shown)}
        </span>
        <span className="mt-1 text-[11px] tracking-[0.2em] text-stone-500">เปอร์เซ็นต์</span>
      </div>
      <p className={`-mt-5 text-sm ${v.tone}`}>{v.label}</p>
      <p className="mt-1 text-center text-[11px] leading-4 text-stone-600">
        เทียบกับเงินก้อนที่ต้องมี ณ วันเกษียณ
      </p>
    </div>
  );
}
