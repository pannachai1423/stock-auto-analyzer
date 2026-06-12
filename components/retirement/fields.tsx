"use client";

import { useEffect, useRef, useState } from "react";

interface SliderFieldProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

/** Slider paired with a directly-editable number, the core control of the planner. */
export function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange
}: SliderFieldProps) {
  // Let the user type freely (including a cleared field) before committing.
  const [draft, setDraft] = useState<string | null>(null);
  const fillPct = ((value - min) / (max - min)) * 100;

  const commitDraft = () => {
    if (draft !== null) {
      const parsed = Number(draft.replace(/,/g, ""));
      if (!Number.isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
      setDraft(null);
    }
  };

  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-[#6f675c]">{label}</span>
        <span className="flex items-baseline gap-1.5">
          <input
            type="text"
            inputMode="decimal"
            className="rt-num w-28 px-2.5 py-1 text-right text-sm font-semibold text-[#3b362e]"
            value={draft ?? (format ? format(value) : String(value))}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setDraft(String(value))}
            onBlur={commitDraft}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            aria-label={label}
          />
          <span className="text-[11px] text-[#b3aa9b]">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="rt-range"
        style={{ "--rt-fill": `${fillPct}%` } as React.CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="mt-1.5 text-[11px] leading-4 text-[#b3aa9b]">{hint}</p>}
    </label>
  );
}

/** Eases a number toward its target so stat figures feel alive when inputs move. */
export function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      setDisplay(value);
      fromRef.current = value;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}
