"use client";

import { motion } from "framer-motion";
import { useAnimatedNumber } from "./fields";

interface Props {
  /** 0–999, percentage of the required nest egg covered */
  readinessPct: number;
}

const R = 64;
const CIRCUMFERENCE = 2 * Math.PI * R;
const ARC = CIRCUMFERENCE * 0.75; // 270° arc

function verdict(pct: number): { label: string; tone: string } {
  if (pct >= 100) return { label: "พร้อมเกษียณ", tone: "text-emerald-300" };
  if (pct >= 80) return { label: "เกือบถึงเป้า", tone: "text-cyan-300" };
  if (pct >= 50) return { label: "ต้องเร่งเครื่อง", tone: "text-amber-300" };
  return { label: "ต้องปรับแผนด่วน", tone: "text-rose-300" };
}

export default function ReadinessGauge({ readinessPct }: Props) {
  const shown = useAnimatedNumber(Math.min(readinessPct, 999));
  const fill = Math.min(readinessPct, 100) / 100;
  const v = verdict(readinessPct);

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 160 160" className="h-44 w-44 -rotate-[135deg]">
        <defs>
          <linearGradient id="rt-gauge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
        />
        <motion.circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke="url(#rt-gauge-grad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
          initial={{ strokeDashoffset: ARC }}
          animate={{ strokeDashoffset: ARC * (1 - fill) }}
          transition={{ type: "spring", stiffness: 50, damping: 16 }}
          style={{ filter: "drop-shadow(0 0 10px rgba(167,139,250,0.55))" }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-2">
        <span className="rt-display text-4xl font-bold tracking-tight text-slate-50">
          {Math.round(shown)}
          <span className="text-xl text-slate-400">%</span>
        </span>
        <span className={`mt-1 text-xs font-semibold ${v.tone}`}>{v.label}</span>
      </div>
      <p className="-mt-4 text-center text-[11px] leading-4 text-slate-500">
        ความพร้อมเทียบกับเงินก้อน
        <br />
        ที่ต้องมี ณ วันเกษียณ
      </p>
    </div>
  );
}
