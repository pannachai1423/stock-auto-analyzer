"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Bell, Download, FileText, Newspaper, Plus, Scale, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { buildThaiSummary, runSimpleBacktest, toAnalysisCsv } from "@/lib/advanced";
import { formatCurrency, formatNumber, formatPercent, toneClass } from "@/components/format";
import type { StockAnalysis } from "@/lib/types";

type AlertRule = {
  id: string;
  symbol: string;
  metric: "priceAbove" | "priceBelow" | "rsiAbove" | "rsiBelow" | "relVolAbove";
  value: number;
};

type MarketPayload = {
  updatedAt: string;
  rows: Array<{ symbol: string; price: number | null; changePercent: number | null; score: number | null; trend: string; relativeVolume: number | null }>;
  breadth: { bullish: number; bearish: number; neutral: number; averageScore: number };
};

type NewsPayload = {
  symbol: string;
  updatedAt: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  score: number;
  items: Array<{ title: string; publisher?: string; link?: string; providerPublishTime?: string }>;
};

export function AdvancedTools({ analysis, onSelectSymbol }: { analysis: StockAnalysis; onSelectSymbol: (symbol: string) => void }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [alertValue, setAlertValue] = useState("");
  const [alertMetric, setAlertMetric] = useState<AlertRule["metric"]>("priceAbove");
  const [market, setMarket] = useState<MarketPayload | null>(null);
  const [news, setNews] = useState<NewsPayload | null>(null);
  const [riskCapital, setRiskCapital] = useState("10000");
  const [riskPercent, setRiskPercent] = useState("1");
  const [entry, setEntry] = useState(String(analysis.quote.price ?? ""));
  const [stop, setStop] = useState(String(analysis.supportResistance.support[0]?.price ?? ""));
  const [target, setTarget] = useState(String(analysis.supportResistance.resistance[0]?.price ?? ""));

  useEffect(() => {
    setWatchlist(readJson("stock-watchlist", ["AAPL", "NVDA", "TSLA"]));
    setAlerts(readJson("stock-alerts", []));
  }, []);

  useEffect(() => {
    setEntry(String(analysis.quote.price ?? ""));
    setStop(String(analysis.supportResistance.support[0]?.price ?? ""));
    setTarget(String(analysis.supportResistance.resistance[0]?.price ?? ""));
    void fetch(`/api/news/${analysis.quote.symbol}`).then((response) => response.json()).then(setNews).catch(() => setNews(null));
  }, [analysis]);

  useEffect(() => {
    localStorage.setItem("stock-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("stock-alerts", JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    if (!watchlist.length) return;
    void fetch(`/api/market?symbols=${encodeURIComponent(watchlist.join(","))}`).then((response) => response.json()).then(setMarket).catch(() => setMarket(null));
  }, [watchlist]);

  const summary = useMemo(() => buildThaiSummary(analysis), [analysis]);
  const backtest = useMemo(() => runSimpleBacktest(analysis.candles), [analysis]);
  const triggeredAlerts = useMemo(() => alerts.filter((rule) => rule.symbol === analysis.quote.symbol && isAlertTriggered(rule, analysis)), [alerts, analysis]);
  const risk = useMemo(() => {
    const capital = Number(riskCapital);
    const percent = Number(riskPercent);
    const entryPrice = Number(entry);
    const stopPrice = Number(stop);
    const targetPrice = Number(target);
    const riskPerShare = Math.max(entryPrice - stopPrice, 0);
    const budgetRisk = capital * (percent / 100);
    const shares = riskPerShare > 0 ? Math.floor(budgetRisk / riskPerShare) : 0;
    const rewardPerShare = Math.max(targetPrice - entryPrice, 0);
    return {
      shares,
      dollarsAtRisk: shares * riskPerShare,
      potentialReward: shares * rewardPerShare,
      ratio: riskPerShare > 0 ? rewardPerShare / riskPerShare : 0
    };
  }, [riskCapital, riskPercent, entry, stop, target]);

  function addCurrentToWatchlist() {
    setWatchlist((current) => Array.from(new Set([...current, analysis.quote.symbol])));
  }

  function addAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(alertValue);
    if (!Number.isFinite(value)) return;
    setAlerts((current) => [...current, { id: crypto.randomUUID(), symbol: analysis.quote.symbol, metric: alertMetric, value }]);
    setAlertValue("");
  }

  function exportCsv() {
    const csv = toAnalysisCsv(analysis);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${analysis.quote.symbol}-analysis.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <ToolPanel title="AI Summary ภาษาไทย" icon={<Sparkles className="h-4 w-4 text-cyan" />}>
        <p className="text-sm leading-6 text-slate-300">{summary}</p>
        {triggeredAlerts.length ? (
          <div className="mt-3 rounded-md border border-caution/30 bg-caution/10 p-3 text-sm text-yellow-100">
            แจ้งเตือนที่เข้าเงื่อนไข: {triggeredAlerts.map(alertLabel).join(", ")}
          </div>
        ) : null}
      </ToolPanel>

      <ToolPanel title="Watchlist ส่วนตัว" icon={<Plus className="h-4 w-4 text-cyan" />}>
        <div className="mb-3 flex flex-wrap gap-2">
          <button onClick={addCurrentToWatchlist} className="focus-ring rounded-md bg-cyan px-3 py-2 text-sm font-semibold text-ink">เพิ่ม {analysis.quote.symbol}</button>
          {watchlist.map((symbol) => (
            <button key={symbol} onClick={() => onSelectSymbol(symbol)} className="focus-ring rounded-md border border-line bg-panelSoft px-3 py-2 text-sm text-slate-200 hover:border-cyan/60">{symbol}</button>
          ))}
        </div>
        {market ? (
          <div className="overflow-auto scrollbar-thin">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Symbol</th><th>Price</th><th>Change</th><th>Score</th><th>Trend</th><th></th></tr></thead>
              <tbody className="divide-y divide-line">
                {market.rows.map((row) => (
                  <tr key={row.symbol}>
                    <td className="py-2 font-semibold text-white">{row.symbol}</td>
                    <td>{formatCurrency(row.price)}</td>
                    <td className={toneClass(row.changePercent)}>{formatPercent(row.changePercent)}</td>
                    <td>{row.score ?? "-"}</td>
                    <td>{row.trend}</td>
                    <td><button onClick={() => setWatchlist((current) => current.filter((item) => item !== row.symbol))} className="text-slate-500 hover:text-danger"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-slate-400">กำลังโหลด watchlist...</p>}
      </ToolPanel>

      <ToolPanel title="Alert แจ้งเตือน" icon={<Bell className="h-4 w-4 text-cyan" />}>
        <form onSubmit={addAlert} className="mb-3 grid gap-2 sm:grid-cols-[1fr_140px_90px]">
          <select value={alertMetric} onChange={(event) => setAlertMetric(event.target.value as AlertRule["metric"])} className="focus-ring rounded-md border border-line bg-panelSoft px-3 py-2 text-sm">
            <option value="priceAbove">ราคามากกว่า</option>
            <option value="priceBelow">ราคาน้อยกว่า</option>
            <option value="rsiAbove">RSI มากกว่า</option>
            <option value="rsiBelow">RSI น้อยกว่า</option>
            <option value="relVolAbove">RelVol มากกว่า</option>
          </select>
          <input value={alertValue} onChange={(event) => setAlertValue(event.target.value)} placeholder="ค่า" className="focus-ring rounded-md border border-line bg-panelSoft px-3 py-2 text-sm" />
          <button className="focus-ring rounded-md bg-cyan px-3 py-2 text-sm font-semibold text-ink">เพิ่ม</button>
        </form>
        <div className="space-y-2">
          {alerts.length ? alerts.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between rounded-md border border-line bg-panelSoft px-3 py-2 text-sm">
              <span className={isAlertTriggered(rule, analysis) ? "text-caution" : "text-slate-300"}>{alertLabel(rule)}</span>
              <button onClick={() => setAlerts((current) => current.filter((item) => item.id !== rule.id))} className="text-slate-500 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
            </div>
          )) : <p className="text-sm text-slate-400">ยังไม่มี alert</p>}
        </div>
      </ToolPanel>

      <ToolPanel title="Backtest สัญญาณ EMA20/50" icon={<ShieldAlert className="h-4 w-4 text-cyan" />}>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Info label="Trades" value={formatNumber(backtest.trades)} />
          <Info label="Win Rate" value={`${backtest.winRate.toFixed(1)}%`} />
          <Info label="Avg Return" value={`${backtest.averageReturn.toFixed(2)}%`} />
          <Info label="Total Return" value={`${backtest.totalReturn.toFixed(2)}%`} />
        </div>
        <p className="mt-3 text-xs text-slate-500">Backtest เป็นแบบง่ายจาก EMA crossover ไม่รวมค่าคอมมิชชั่น slippage และภาษี</p>
      </ToolPanel>

      <ToolPanel title="Risk / Reward Calculator" icon={<Scale className="h-4 w-4 text-cyan" />}>
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label="ทุน" value={riskCapital} setValue={setRiskCapital} />
          <Field label="เสี่ยง %" value={riskPercent} setValue={setRiskPercent} />
          <Field label="จุดเข้า" value={entry} setValue={setEntry} />
          <Field label="Stop" value={stop} setValue={setStop} />
          <Field label="Target" value={target} setValue={setTarget} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Info label="จำนวนหุ้น" value={formatNumber(risk.shares)} />
          <Info label="เงินที่เสี่ยง" value={formatCurrency(risk.dollarsAtRisk)} />
          <Info label="กำไรเป้าหมาย" value={formatCurrency(risk.potentialReward)} />
          <Info label="R/R" value={`${risk.ratio.toFixed(2)}x`} />
        </div>
      </ToolPanel>

      <ToolPanel title="Market Breadth + News Sentiment" icon={<Newspaper className="h-4 w-4 text-cyan" />}>
        {market ? (
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Info label="Bullish" value={market.breadth.bullish} />
            <Info label="Bearish" value={market.breadth.bearish} />
            <Info label="Neutral" value={market.breadth.neutral} />
            <Info label="Avg Score" value={market.breadth.averageScore} />
          </div>
        ) : null}
        {news ? (
          <>
            <div className="mb-3 rounded-md border border-line bg-panelSoft p-3 text-sm">
              Sentiment: <span className={news.sentiment === "Positive" ? "text-lime" : news.sentiment === "Negative" ? "text-danger" : "text-caution"}>{news.sentiment}</span> ({news.score})
            </div>
            <div className="space-y-2">
              {news.items.slice(0, 5).map((item) => (
                <a key={item.title} href={item.link} target="_blank" className="block rounded-md border border-line bg-panelSoft p-3 text-sm text-slate-200 hover:border-cyan/60">
                  {item.title}
                  <span className="mt-1 block text-xs text-slate-500">{item.publisher ?? "Yahoo Finance"}</span>
                </a>
              ))}
            </div>
          </>
        ) : <p className="text-sm text-slate-400">กำลังโหลดข่าว...</p>}
      </ToolPanel>

      <ToolPanel title="Export รายงาน" icon={<FileText className="h-4 w-4 text-cyan" />}>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="focus-ring inline-flex items-center gap-2 rounded-md bg-cyan px-3 py-2 text-sm font-semibold text-ink"><Download className="h-4 w-4" />CSV</button>
          <button onClick={() => window.print()} className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-panelSoft px-3 py-2 text-sm text-slate-200"><FileText className="h-4 w-4" />PDF / Print</button>
        </div>
        <p className="mt-3 text-sm text-slate-400">ใช้ปุ่ม PDF / Print แล้วเลือก Save as PDF ได้จากหน้าต่างพิมพ์ของเบราว์เซอร์</p>
      </ToolPanel>
    </section>
  );
}

function ToolPanel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4 shadow-glow">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">{icon}{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panelSoft p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function Field({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) {
  return (
    <label className="text-xs uppercase tracking-wide text-slate-500">
      {label}
      <input value={value} onChange={(event) => setValue(event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-line bg-panelSoft px-3 py-2 text-sm normal-case tracking-normal text-white" />
    </label>
  );
}

function isAlertTriggered(rule: AlertRule, analysis: StockAnalysis) {
  const price = analysis.quote.price ?? 0;
  const rsi = analysis.indicators.rsi14 ?? 0;
  const relVol = analysis.indicators.relativeVolume ?? 0;
  if (rule.metric === "priceAbove") return price >= rule.value;
  if (rule.metric === "priceBelow") return price <= rule.value;
  if (rule.metric === "rsiAbove") return rsi >= rule.value;
  if (rule.metric === "rsiBelow") return rsi <= rule.value;
  return relVol >= rule.value;
}

function alertLabel(rule: AlertRule) {
  const names: Record<AlertRule["metric"], string> = {
    priceAbove: "ราคามากกว่า",
    priceBelow: "ราคาน้อยกว่า",
    rsiAbove: "RSI มากกว่า",
    rsiBelow: "RSI น้อยกว่า",
    relVolAbove: "RelVol มากกว่า"
  };
  return `${rule.symbol}: ${names[rule.metric]} ${rule.value}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}
