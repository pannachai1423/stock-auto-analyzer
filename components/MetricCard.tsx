import { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "bullish" | "bearish" | "neutral" | "cyan";
};

const toneMap = {
  bullish: "border-lime/30 bg-lime/5 text-lime",
  bearish: "border-danger/30 bg-danger/5 text-danger",
  neutral: "border-caution/30 bg-caution/5 text-caution",
  cyan: "border-cyan/30 bg-cyan/5 text-cyan"
};

export function MetricCard({ label, value, detail, tone = "cyan" }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-glow">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-2 inline-flex rounded-md border px-2 py-1 text-xl font-semibold ${toneMap[tone]}`}>{value}</div>
      {detail ? <div className="mt-3 text-sm leading-5 text-slate-300">{detail}</div> : null}
    </div>
  );
}
