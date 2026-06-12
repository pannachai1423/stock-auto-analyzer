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

function verdict(pct: number): { label: string; color: string; bg: string } {
  if (pct >= 100) return { label: "พร้อมเกษียณแล้ว", color: "#3e8e5d", bg: "#e7f3eb" };
  if (pct >= 80) return { label: "เกือบถึงเป้าแล้ว", color: "#b07c1f", bg: "#f9efd9" };
  if (pct >= 50) return { label: "ยังต้องสะสมเพิ่ม", color: "#b07c1f", bg: "#f9efd9" };
  return { label: "ควรปรับแผน", color: "#c2502f", bg: "#fbe9e2" };
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
          stroke="#f0eadf"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
        />
        <motion.circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke="#ef7350"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
          initial={{ strokeDashoffset: ARC }}
          animate={{ strokeDashoffset: ARC * (1 - fill) }}
          transition={{ type: "spring", stiffness: 50, damping: 18 }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-4">
        <span className="rt-display text-[40px] font-medium leading-none text-[#3b362e]">
          {Math.round(shown)}
          <span className="text-lg text-[#b3aa9b]">%</span>
        </span>
      </div>
      <span
        className="rt-display -mt-5 rounded-full px-3.5 py-1 text-[13px]"
        style={{ color: v.color, background: v.bg }}
      >
        {v.label}
      </span>
      <p className="mt-2 text-center text-[11px] leading-4 text-[#b3aa9b]">
        เทียบกับเงินก้อนที่ต้องมี ณ วันเกษียณ
      </p>
    </div>
  );
}
