"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Search, TrendingDown, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PriceChart } from "@/components/PriceChart";
import { AdvancedTools } from "@/components/AdvancedTools";
import { ProTools } from "@/components/ProTools";
import { formatCurrency, formatNumber, formatPercent, formatTime } from "@/components/format";
import type { StockAnalysis } from "@/lib/types";

const PRESETS = ["AAPL", "NVDA", "TSLA", "PLTR", "AMD", "MSFT", "META"];

export function StockDashboard() {
  const [symbol, setSymbol] = useState("NVDA");
  const [query, setQuery] = useState("NVDA");
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshSeconds, setRefreshSeconds] = useState(30);

  useEffect(() => {
    void load(symbol);
  }, [symbol]);

  useEffect(() => {
    const timer = window.setInterval(() => void load(symbol, true), refreshSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [symbol, refreshSeconds]);

  const changePercent = useMemo(() => {
    if (!analysis?.quote.price || !analysis.quote.previousClose) return null;
    return ((analysis.quote.price - analysis.quote.previousClose) / analysis.quote.previousClose) * 100;
  }, [analysis]);

  async function load(nextSymbol: string, quiet = false) {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/stock/${encodeURIComponent(nextSymbol)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "ดึงข้อมูลไม่ได้");
      setAnalysis(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดึงข้อมูลไม่ได้");
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = query.trim().toUpperCase();
    if (clean) setSymbol(clean);
  }

  const currency = analysis?.quote.currency ?? "USD";
  const signalTone = analysis?.score.signal === "Buy" ? "bullish" : analysis?.score.signal === "Sell" ? "bearish" : "neutral";
  const trendTone = analysis?.trend.label.includes("Uptrend") ? "bullish" : analysis?.trend.label === "Downtrend" ? "bearish" : "neutral";

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Stock Auto Analyzer</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            วิเคราะห์หุ้นจาก Yahoo Finance พร้อมแนวรับ แนวต้าน trend, volume, options activity และสัญญาณซื้อ/ขาย/รอดู
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="AAPL, NVDA, TSLA, PLTR"
              className="focus-ring h-11 w-full rounded-lg border border-line bg-panelSoft pl-10 pr-3 text-sm text-white placeholder:text-slate-500"
            />
          </label>
          <button className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan px-4 text-sm font-semibold text-ink hover:bg-cyan/90">
            <Search className="h-4 w-4" />
            วิเคราะห์
          </button>
        </form>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <button key={item} onClick={() => { setQuery(item); setSymbol(item); }} className="focus-ring rounded-md border border-line bg-panel px-3 py-2 text-sm text-slate-200 hover:border-cyan/60">
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-cyan" : ""}`} />
          <select value={refreshSeconds} onChange={(event) => setRefreshSeconds(Number(event.target.value))} className="focus-ring rounded-md border border-line bg-panel px-2 py-2">
            <option value={15}>Refresh 15s</option>
            <option value={30}>Refresh 30s</option>
            <option value={60}>Refresh 60s</option>
          </select>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-red-100">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />เกิดข้อผิดพลาด</div>
          <p className="mt-2">{error}</p>
        </div>
      ) : null}

      {analysis ? (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={`${analysis.quote.symbol} Price`} value={formatCurrency(analysis.quote.price, currency)} detail={`${analysis.quote.shortName ?? ""} • ${analysis.quote.exchange ?? "-"} • ${formatTime(analysis.quote.dataTimestamp)}`} tone={changePercent && changePercent >= 0 ? "bullish" : "bearish"} />
            <MetricCard label="Stock Score" value={`${analysis.score.total}/100`} detail={`${analysis.score.label} • Signal: ${analysis.score.signal}`} tone={signalTone} />
            <MetricCard label="Trend" value={analysis.trend.label} detail={analysis.trend.detail} tone={trendTone} />
            <MetricCard label="Volume" value={formatNumber(analysis.quote.volume)} detail={`Avg ${formatNumber(analysis.quote.averageVolume)} • RelVol ${analysis.indicators.relativeVolume ?? "-"}x`} tone={analysis.indicators.volumeSpike ? "bullish" : "neutral"} />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <PriceChart analysis={analysis} />
            <aside className="flex flex-col gap-4">
              <Panel title="Snapshot">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Open" value={formatCurrency(analysis.quote.open, currency)} />
                  <Info label="Prev Close" value={formatCurrency(analysis.quote.previousClose, currency)} />
                  <Info label="Day High" value={formatCurrency(analysis.quote.dayHigh, currency)} />
                  <Info label="Day Low" value={formatCurrency(analysis.quote.dayLow, currency)} />
                  <Info label="52W High" value={formatCurrency(analysis.quote.fiftyTwoWeekHigh, currency)} />
                  <Info label="52W Low" value={formatCurrency(analysis.quote.fiftyTwoWeekLow, currency)} />
                  <Info label="Change" value={formatPercent(changePercent)} />
                  <Info label="Market Cap" value={formatNumber(analysis.quote.marketCap)} />
                </div>
              </Panel>

              <Panel title="แนวรับ / แนวต้าน">
                <LevelList title="Support" levels={analysis.supportResistance.support} tone="text-lime" />
                <LevelList title="Resistance" levels={analysis.supportResistance.resistance} tone="text-danger" />
                {analysis.supportResistance.alerts.length ? (
                  <div className="mt-3 rounded-md border border-caution/30 bg-caution/10 p-3 text-sm text-yellow-100">
                    {analysis.supportResistance.alerts.join(" • ")}
                  </div>
                ) : null}
              </Panel>

              <Panel title="Indicators">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="EMA20" value={formatCurrency(analysis.indicators.ema20, currency)} />
                  <Info label="EMA50" value={formatCurrency(analysis.indicators.ema50, currency)} />
                  <Info label="EMA200" value={formatCurrency(analysis.indicators.ema200, currency)} />
                  <Info label="RSI14" value={formatNumber(analysis.indicators.rsi14, 2)} />
                  <Info label="MACD" value={formatNumber(analysis.indicators.macd, 3)} />
                  <Info label="ADX" value={formatNumber(analysis.indicators.adx14, 2)} />
                </div>
              </Panel>
            </aside>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <Panel title="Score Breakdown">
              <div className="space-y-3">
                <ScoreBar label="Trend strength" value={analysis.score.trendStrength} />
                <ScoreBar label="Volume strength" value={analysis.score.volumeStrength} />
                <ScoreBar label="Momentum" value={analysis.score.momentum} />
                <ScoreBar label="Options activity" value={analysis.score.optionsActivity} />
                <ScoreBar label="Support/resistance setup" value={analysis.score.setup} />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-300">
                {analysis.score.reasons.map((reason) => <div key={reason}>• {reason}</div>)}
              </div>
            </Panel>

            <Panel title="Options Activity">
              {analysis.options.hasOptions ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <Info label="Call Vol" value={formatNumber(analysis.options.callVolume)} />
                    <Info label="Put Vol" value={formatNumber(analysis.options.putVolume)} />
                    <Info label="Open Interest" value={formatNumber(analysis.options.totalOpenInterest)} />
                    <Info label="Put/Call" value={formatNumber(analysis.options.putCallVolumeRatio, 2)} />
                  </div>
                  <div className="mt-4 max-h-80 overflow-auto scrollbar-thin">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-panel text-xs uppercase text-slate-400">
                        <tr><th className="py-2">Contract</th><th>Type</th><th>Strike</th><th>Vol</th><th>OI</th></tr>
                      </thead>
                      <tbody className="divide-y divide-line text-slate-200">
                        {analysis.options.topContracts.map((contract) => (
                          <tr key={contract.contractSymbol}>
                            <td className="py-2 font-medium">{contract.contractSymbol}</td>
                            <td className={contract.type === "call" ? "text-lime" : "text-danger"}>{contract.type.toUpperCase()}</td>
                            <td>{formatCurrency(contract.strike, currency)}</td>
                            <td>{formatNumber(contract.volume)}</td>
                            <td>{formatNumber(contract.openInterest)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-line bg-panelSoft p-4 text-sm text-slate-300">ไม่มีข้อมูล options</div>
              )}
            </Panel>
          </section>

          <AdvancedTools analysis={analysis} onSelectSymbol={(nextSymbol) => { setQuery(nextSymbol); setSymbol(nextSymbol); }} />
          <ProTools analysis={analysis} onSelectSymbol={(nextSymbol) => { setQuery(nextSymbol); setSymbol(nextSymbol); }} />

          <footer className="rounded-lg border border-line bg-panel p-4 text-xs leading-5 text-slate-400">
            {analysis.quote.sourceDelayNote} แสดงเวลาข้อมูลล่าสุดเสมอ และผลวิเคราะห์นี้ไม่ใช่คำแนะนำการลงทุน
          </footer>
        </>
      ) : (
        <div className="rounded-lg border border-line bg-panel p-8 text-center text-slate-300">
          {loading ? "กำลังดึงข้อมูลจาก Yahoo Finance..." : "กรอก ticker เพื่อเริ่มวิเคราะห์"}
        </div>
      )}
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4 shadow-glow">
      <h2 className="mb-3 text-base font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panelSoft p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function LevelList({ title, levels, tone }: { title: string; levels: StockAnalysis["supportResistance"]["support"]; tone: string }) {
  return (
    <div className="mt-3">
      <div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${tone}`}>
        {title === "Support" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        {title}
      </div>
      <div className="space-y-2">
        {levels.map((level) => (
          <div key={`${level.label}-${level.price}`} className="flex items-center justify-between gap-3 rounded-md border border-line bg-panelSoft px-3 py-2 text-sm">
            <span>
              <span className="font-semibold text-slate-100">{level.label}</span>
              <span className="ml-2 text-xs text-slate-500">{level.method}</span>
            </span>
            <span className="font-semibold text-white">${level.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-lime" : value >= 45 ? "bg-caution" : "bg-danger";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-slate-300"><span>{label}</span><span>{value}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-panelSoft"><div className={`h-full ${color}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}
