"use client";

import { FormEvent, useEffect, useState } from "react";
import { GitCompare, RefreshCw } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent, toneClass } from "@/components/format";

type MarketPayload = {
  rows: Array<{ symbol: string; price: number | null; changePercent: number | null; score: number | null; trend: string; relativeVolume: number | null }>;
  breadth: { bullish: number; bearish: number; neutral: number; averageScore: number };
};

export function CompareDashboard() {
  const [symbols, setSymbols] = useState("AAPL,NVDA,TSLA,MSFT,AMD,META,PLTR");
  const [payload, setPayload] = useState<MarketPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/market?symbols=${encodeURIComponent(symbols)}`, { cache: "no-store" });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error ?? "โหลดข้อมูลไม่ได้");
      setPayload(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่ได้");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load();
  }

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-white sm:text-3xl"><GitCompare className="h-6 w-6 text-cyan" />Compare Stocks</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">เทียบหุ้นหลายตัวด้วย score, trend, change และ relative volume</p>
        </div>
        <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 sm:max-w-2xl sm:flex-row">
          <input value={symbols} onChange={(event) => setSymbols(event.target.value.toUpperCase())} className="focus-ring h-11 flex-1 rounded-lg border border-line bg-panelSoft px-3 text-sm text-white" />
          <button className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan px-4 text-sm font-semibold text-ink"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Compare</button>
        </form>
      </header>

      {error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-red-100">{error}</div> : null}

      {payload ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <Card label="Bullish" value={payload.breadth.bullish} tone="text-lime" />
            <Card label="Bearish" value={payload.breadth.bearish} tone="text-danger" />
            <Card label="Neutral" value={payload.breadth.neutral} tone="text-caution" />
            <Card label="Average Score" value={payload.breadth.averageScore} tone="text-cyan" />
          </section>
          <section className="rounded-lg border border-line bg-panel p-4 shadow-glow">
            <div className="overflow-auto scrollbar-thin">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Symbol</th><th>Price</th><th>Change</th><th>Score</th><th>Trend</th><th>RelVol</th><th>Signal</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {payload.rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((row) => (
                    <tr key={row.symbol} className="hover:bg-panelSoft">
                      <td className="py-2 font-semibold text-white">{row.symbol}</td>
                      <td>{formatCurrency(row.price)}</td>
                      <td className={toneClass(row.changePercent)}>{formatPercent(row.changePercent)}</td>
                      <td>{row.score ?? "-"}</td>
                      <td>{row.trend}</td>
                      <td>{row.relativeVolume ? `${formatNumber(row.relativeVolume, 2)}x` : "-"}</td>
                      <td className={(row.score ?? 0) >= 70 ? "text-lime" : (row.score ?? 0) <= 35 ? "text-danger" : "text-caution"}>{(row.score ?? 0) >= 70 ? "Buy" : (row.score ?? 0) <= 35 ? "Sell" : "Watch"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : <div className="rounded-lg border border-line bg-panel p-8 text-center text-slate-300">กำลังโหลดข้อมูล...</div>}
    </main>
  );
}

function Card({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-glow">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}
