"use client";

import { useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent, formatTime, toneClass } from "@/components/format";
import type { RankingRow, RankingsPayload } from "@/lib/types";

const sections: Array<[keyof RankingsPayload, string, string[]]> = [
  ["mostActive", "Most Active by Volume", ["Symbol", "Price", "Change", "Volume", "RelVol"]],
  ["topGainers", "Top Gainers", ["Symbol", "Price", "Change", "Volume", "RelVol"]],
  ["topLosers", "Top Losers", ["Symbol", "Price", "Change", "Volume", "RelVol"]],
  ["highRelativeVolume", "High Relative Volume", ["Symbol", "Price", "Change", "Volume", "RelVol"]],
  ["unusualOptions", "Unusual Options Activity", ["Symbol", "Price", "Options Vol", "Open Interest", "RelVol"]],
  ["highestOptionsVolume", "Highest Options Volume", ["Symbol", "Price", "Options Vol", "Open Interest", "RelVol"]],
  ["highestOpenInterest", "Highest Open Interest", ["Symbol", "Price", "Options Vol", "Open Interest", "RelVol"]]
];

export function RankingTables({ optionsOnly = false }: { optionsOnly?: boolean }) {
  const [payload, setPayload] = useState<RankingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  async function load(quiet = false) {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/rankings", { cache: "no-store" });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error ?? "ดึง ranking ไม่ได้");
      setPayload(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดึง ranking ไม่ได้");
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  const visibleSections = sections.filter(([key]) => !optionsOnly || ["unusualOptions", "highestOptionsVolume", "highestOpenInterest"].includes(String(key)));

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{optionsOnly ? "Options Activity" : "หุ้นมาแรง"}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            ตารางจัดอันดับจาก Yahoo Finance พร้อม relative volume, options volume และ open interest
          </p>
        </div>
        <button onClick={() => void load()} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-panel px-4 text-sm text-slate-200 hover:border-cyan/60">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-cyan" : ""}`} />
          Refresh
        </button>
      </header>

      {payload ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel p-4 text-sm text-slate-300">
          <BarChart3 className="h-4 w-4 text-cyan" />
          <span>อัปเดตล่าสุด {formatTime(payload.updatedAt)}</span>
          <span className="text-slate-500">•</span>
          <span>{payload.sourceDelayNote}</span>
        </div>
      ) : null}

      {error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-red-100">{error}</div> : null}

      {payload ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {visibleSections.map(([key, title, headers]) => (
            <RankingTable key={String(key)} title={title} headers={headers} rows={(payload[key] as RankingRow[]) ?? []} optionsColumns={["unusualOptions", "highestOptionsVolume", "highestOpenInterest"].includes(String(key))} />
          ))}
        </section>
      ) : (
        <div className="rounded-lg border border-line bg-panel p-8 text-center text-slate-300">
          {loading ? "กำลังโหลดตาราง..." : "ยังไม่มีข้อมูล"}
        </div>
      )}

      <footer className="rounded-lg border border-line bg-panel p-4 text-xs leading-5 text-slate-400">
        ไม่ใช่คำแนะนำการลงทุน ข้อมูล options อาจไม่มีในบางหุ้น และ Yahoo Finance อาจให้ข้อมูลแบบ delayed ในบางตลาด
      </footer>
    </main>
  );
}

function RankingTable({ title, headers, rows, optionsColumns }: { title: string; headers: string[]; rows: RankingRow[]; optionsColumns: boolean }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4 shadow-glow">
      <h2 className="mb-3 text-base font-semibold text-white">{title}</h2>
      <div className="overflow-auto scrollbar-thin">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>{headers.map((header) => <th key={header} className="border-b border-line py-2 pr-3">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line text-slate-200">
            {rows.length ? rows.map((row) => (
              <tr key={`${title}-${row.symbol}`} className="hover:bg-panelSoft">
                <td className="py-2 pr-3">
                  <div className="font-semibold text-white">{row.symbol}</div>
                  <div className="max-w-48 truncate text-xs text-slate-500">{row.name}</div>
                </td>
                <td className="pr-3">{formatCurrency(row.price)}</td>
                {optionsColumns ? (
                  <>
                    <td className="pr-3">{formatNumber(row.optionsVolume)}</td>
                    <td className="pr-3">{formatNumber(row.openInterest)}</td>
                  </>
                ) : (
                  <>
                    <td className={`pr-3 font-medium ${toneClass(row.changePercent)}`}>{formatPercent(row.changePercent)}</td>
                    <td className="pr-3">{formatNumber(row.volume)}</td>
                  </>
                )}
                <td className="pr-3">{row.relativeVolume ? `${row.relativeVolume.toFixed(2)}x` : "-"}</td>
              </tr>
            )) : (
              <tr><td className="py-6 text-center text-slate-500" colSpan={headers.length}>ไม่มีข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
