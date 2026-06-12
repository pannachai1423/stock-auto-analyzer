"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { PlanResult, YearPoint } from "@/lib/retirement/engine";
import { formatBaht, formatBahtCompact } from "@/lib/retirement/engine";

const W = 860;
const H = 380;
const PAD = { top: 24, right: 18, bottom: 36, left: 64 };

const CORAL = "#7fa38c";
const GREEN = "#8499b1";
const RED = "#b0644c";
const MUTED = "#b3aa9b";
const GRID = "#f0eadf";

interface Props {
  plan: PlanResult;
}

export default function WealthChart({ plan }: Props) {
  const { timeline, input, depletionAge, requiredFund } = plan;
  const [hover, setHover] = useState<YearPoint | null>(null);

  const geom = useMemo(() => {
    const ages = timeline.map((p) => p.age);
    const minAge = ages[0];
    const maxAge = ages[ages.length - 1];
    const maxVal = Math.max(requiredFund, ...timeline.map((p) => p.optimistic), 1);

    const x = (age: number) =>
      PAD.left + ((age - minAge) / Math.max(1, maxAge - minAge)) * (W - PAD.left - PAD.right);
    const y = (v: number) => PAD.top + (1 - v / maxVal) * (H - PAD.top - PAD.bottom);

    const line = (pick: (p: YearPoint) => number) =>
      timeline.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.age).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(" ");

    const band =
      timeline.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.age).toFixed(1)},${y(p.optimistic).toFixed(1)}`).join(" ") +
      [...timeline].reverse().map((p) => `L${x(p.age).toFixed(1)},${y(p.pessimistic).toFixed(1)}`).join(" ") +
      "Z";

    const area =
      line((p) => p.expected) +
      `L${x(maxAge).toFixed(1)},${y(0).toFixed(1)}L${x(minAge).toFixed(1)},${y(0).toFixed(1)}Z`;

    // ~6 horizontal gridlines on round values
    const stepRaw = maxVal / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(stepRaw)));
    const step = Math.ceil(stepRaw / mag) * mag;
    const gridVals: number[] = [];
    for (let v = 0; v <= maxVal; v += step) gridVals.push(v);

    const ageStep = maxAge - minAge > 40 ? 10 : 5;
    const ageTicks: number[] = [];
    for (let a = Math.ceil(minAge / ageStep) * ageStep; a <= maxAge; a += ageStep) ageTicks.push(a);

    return { minAge, maxAge, maxVal, x, y, line, band, area, gridVals, ageTicks };
  }, [timeline, requiredFund]);

  const { x, y } = geom;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const age = Math.round(
      geom.minAge + ((px - PAD.left) / (W - PAD.left - PAD.right)) * (geom.maxAge - geom.minAge)
    );
    setHover(timeline.find((p) => p.age === age) ?? null);
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="กราฟจำลองความมั่งคั่งตั้งแต่วันนี้จนถึงปลายแผน"
      >
        <defs>
          <linearGradient id="rt-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CORAL} stopOpacity="0.14" />
            <stop offset="100%" stopColor={CORAL} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines + axis labels */}
        {geom.gridVals.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke={GRID} />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill={MUTED}>
              {formatBahtCompact(v)}
            </text>
          </g>
        ))}
        {geom.ageTicks.map((a) => (
          <text key={a} x={x(a)} y={H - 12} textAnchor="middle" fontSize="11" fill={MUTED}>
            {a}
          </text>
        ))}
        <text x={W - PAD.right} y={H - 12} textAnchor="end" fontSize="11" fill={MUTED}>
          อายุ (ปี)
        </text>

        {/* optimistic–pessimistic band */}
        <path d={geom.band} fill="rgba(120, 105, 80, 0.06)" />

        {/* expected area + line */}
        <path d={geom.area} fill="url(#rt-area)" />
        <motion.path
          d={geom.line((p) => p.expected)}
          fill="none"
          stroke={CORAL}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />

        {/* required-fund target line */}
        {requiredFund > 0 && requiredFund <= geom.maxVal && (
          <g>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(requiredFund)}
              y2={y(requiredFund)}
              stroke={GREEN}
              strokeWidth="1.5"
              strokeDasharray="2 5"
              opacity="0.8"
            />
            <text x={W - PAD.right} y={y(requiredFund) - 6} textAnchor="end" fontSize="11" fill={GREEN}>
              เป้าหมาย {formatBahtCompact(requiredFund)}
            </text>
          </g>
        )}

        {/* retirement marker */}
        <line
          x1={x(input.retireAge)}
          x2={x(input.retireAge)}
          y1={PAD.top}
          y2={H - PAD.bottom}
          stroke="#d8cfbd"
          strokeWidth="1.25"
          strokeDasharray="3 5"
        />
        <text x={x(input.retireAge) + 6} y={PAD.top + 12} fontSize="11" fill="#9a9183">
          เกษียณ {input.retireAge}
        </text>

        {/* depletion marker */}
        {depletionAge !== null && (
          <g>
            <circle cx={x(depletionAge)} cy={y(0)} r="4.5" fill={RED} />
            <text x={x(depletionAge)} y={y(0) - 10} textAnchor="middle" fontSize="11" fill={RED}>
              เงินหมดอายุ {depletionAge}
            </text>
          </g>
        )}

        {/* hover crosshair */}
        {hover && (
          <g>
            <line
              x1={x(hover.age)}
              x2={x(hover.age)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="#d8cfbd"
            />
            <circle cx={x(hover.age)} cy={y(hover.expected)} r="5" fill="#ffffff" stroke={CORAL} strokeWidth="2.5" />
          </g>
        )}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute top-3 z-10 min-w-[185px] rounded-2xl border border-[#ede7db] bg-white px-4 py-3 text-xs shadow-lg shadow-[#50412808]"
          style={{
            left: `clamp(0%, ${((x(hover.age) / W) * 100).toFixed(1)}% - 92px, calc(100% - 195px))`
          }}
        >
          <p className="rt-display mb-1.5 text-sm text-[#3b362e]">
            อายุ {hover.age} ปี · พ.ศ. {hover.yearBE}
          </p>
          <p className="flex justify-between gap-4 text-[#8a8378]">
            <span>คาดการณ์</span>
            <span className="font-semibold text-[#557f63]">{formatBaht(hover.expected)}</span>
          </p>
          <p className="flex justify-between gap-4 text-[#b3aa9b]">
            <span>กรณีดี / แย่</span>
            <span>
              {formatBahtCompact(hover.optimistic)} / {formatBahtCompact(hover.pessimistic)}
            </span>
          </p>
          {hover.withdrawal > 0 && (
            <p className="flex justify-between gap-4 text-[#b3aa9b]">
              <span>ถอนใช้ปีนั้น</span>
              <span>{formatBahtCompact(hover.withdrawal)}</span>
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[11px] text-[#9a9183]">
        <span className="flex items-center gap-2">
          <i className="h-[3px] w-5 rounded bg-[#7fa38c]" /> เส้นทางที่คาดไว้
        </span>
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-5 rounded bg-[#786950]/10" /> ช่วงผลตอบแทน ±
          {(plan.input.spreadPct ?? 2).toFixed(1).replace(/\.0$/, "")}%
        </span>
        <span className="flex items-center gap-2">
          <i className="h-[2px] w-5 rounded border-t-2 border-dashed border-[#8499b1]" /> เงินก้อนเป้าหมาย
        </span>
      </div>
    </div>
  );
}
