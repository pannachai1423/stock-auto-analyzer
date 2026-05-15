"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpen, Briefcase, CandlestickChart, Languages, Moon, Radar, Route, Sun, Trash2 } from "lucide-react";
import { buildProIndicators, buildScenarioPlan, scanBreakout } from "@/lib/pro";
import { formatCurrency, formatNumber, formatPercent, toneClass } from "@/components/format";
import type { StockAnalysis } from "@/lib/types";

type MarketPayload = {
  rows: Array<{ symbol: string; price: number | null; changePercent: number | null; score: number | null; trend: string; relativeVolume: number | null }>;
};

type Position = { id: string; symbol: string; shares: number; cost: number };
type Journal = { id: string; date: string; symbol: string; side: string; note: string };

export function ProTools({ analysis, onSelectSymbol }: { analysis: StockAnalysis; onSelectSymbol: (symbol: string) => void }) {
  const [market, setMarket] = useState<MarketPayload | null>(null);
  const [benchmark, setBenchmark] = useState<StockAnalysis | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [journal, setJournal] = useState<Journal[]>([]);
  const [symbolInput, setSymbolInput] = useState(analysis.quote.symbol);
  const [sharesInput, setSharesInput] = useState("10");
  const [costInput, setCostInput] = useState(String(analysis.quote.price ?? ""));
  const [journalNote, setJournalNote] = useState("");
  const [journalSide, setJournalSide] = useState("Plan");
  const [language, setLanguage] = useState("TH");

  useEffect(() => {
    setPositions(readJson("stock-positions", []));
    setJournal(readJson("stock-journal", []));
    setLanguage(localStorage.getItem("stock-language") ?? "TH");
  }, []);

  useEffect(() => {
    localStorage.setItem("stock-positions", JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem("stock-journal", JSON.stringify(journal));
  }, [journal]);

  useEffect(() => {
    localStorage.setItem("stock-language", language);
  }, [language]);

  useEffect(() => {
    setSymbolInput(analysis.quote.symbol);
    setCostInput(String(analysis.quote.price ?? ""));
    void fetch("/api/stock/QQQ").then((response) => response.json()).then(setBenchmark).catch(() => setBenchmark(null));
    void fetch("/api/market?symbols=AAPL,NVDA,TSLA,MSFT,AMD,META,PLTR,AVGO,SMCI,GOOGL").then((response) => response.json()).then(setMarket).catch(() => setMarket(null));
  }, [analysis]);

  const pro = useMemo(() => buildProIndicators(analysis, benchmark), [analysis, benchmark]);
  const scenarios = useMemo(() => buildScenarioPlan(analysis), [analysis]);
  const scannerRows = useMemo(() => scanBreakout(market?.rows ?? []), [market]);
  const portfolioRows = positions.map((position) => {
    const price = position.symbol === analysis.quote.symbol ? analysis.quote.price : market?.rows.find((row) => row.symbol === position.symbol)?.price;
    const marketValue = (price ?? position.cost) * position.shares;
    const costValue = position.cost * position.shares;
    return { ...position, price, marketValue, pnl: marketValue - costValue, pnlPct: costValue ? ((marketValue - costValue) / costValue) * 100 : 0 };
  });
  const portfolioValue = portfolioRows.reduce((total, row) => total + row.marketValue, 0);
  const portfolioPnl = portfolioRows.reduce((total, row) => total + row.pnl, 0);

  function addPosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const symbol = symbolInput.trim().toUpperCase();
    const shares = Number(sharesInput);
    const cost = Number(costInput);
    if (!symbol || !Number.isFinite(shares) || !Number.isFinite(cost)) return;
    setPositions((current) => [...current, { id: crypto.randomUUID(), symbol, shares, cost }]);
  }

  function addJournal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!journalNote.trim()) return;
    setJournal((current) => [{ id: crypto.randomUUID(), date: new Date().toISOString(), symbol: analysis.quote.symbol, side: journalSide, note: journalNote.trim() }, ...current]);
    setJournalNote("");
  }

  function setTheme(theme: "dark" | "light") {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("stock-theme", theme);
  }

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <Panel title="Pro Indicators" icon={<CandlestickChart className="h-4 w-4 text-cyan" />}>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Info label="ATR 14" value={formatCurrency(pro.atr14)} />
          <Info label="VWAP 20D" value={formatCurrency(pro.vwap20)} />
          <Info label="Supertrend" value={`${pro.supertrend.direction} ${formatCurrency(pro.supertrend.value)}`} />
          <Info label="RS vs QQQ" value={pro.relativeStrength === null ? "-" : `${pro.relativeStrength.toFixed(2)}%`} />
          <Info label="Weekly" value={pro.weeklyTrend} />
          <Info label="Monthly" value={pro.monthlyTrend} />
          <Info label="Pattern" value={pro.pattern} />
          <Info label="Gap" value={pro.gap} />
        </div>
      </Panel>

      <Panel title="Scenario Planner" icon={<Route className="h-4 w-4 text-cyan" />}>
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <div key={scenario.name} className="rounded-md border border-line bg-panelSoft p-3 text-sm">
              <div className="font-semibold text-white">{scenario.name}</div>
              <div className="mt-1 text-slate-300">{scenario.trigger}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span>Stop: {scenario.stop}</span>
                <span>Target: {scenario.target}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Portfolio Tracker" icon={<Briefcase className="h-4 w-4 text-cyan" />}>
        <form onSubmit={addPosition} className="mb-3 grid gap-2 sm:grid-cols-[1fr_90px_120px_80px]">
          <input value={symbolInput} onChange={(event) => setSymbolInput(event.target.value.toUpperCase())} className="focus-ring rounded-md border border-line bg-panelSoft px-3 py-2 text-sm" />
          <input value={sharesInput} onChange={(event) => setSharesInput(event.target.value)} className="focus-ring rounded-md border border-line bg-panelSoft px-3 py-2 text-sm" />
          <input value={costInput} onChange={(event) => setCostInput(event.target.value)} className="focus-ring rounded-md border border-line bg-panelSoft px-3 py-2 text-sm" />
          <button className="focus-ring rounded-md bg-cyan px-3 py-2 text-sm font-semibold text-ink">Add</button>
        </form>
        <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
          <Info label="Value" value={formatCurrency(portfolioValue)} />
          <Info label="P/L" value={<span className={portfolioPnl >= 0 ? "text-lime" : "text-danger"}>{formatCurrency(portfolioPnl)}</span>} />
        </div>
        <div className="overflow-auto scrollbar-thin">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Symbol</th><th>Shares</th><th>Cost</th><th>Price</th><th>P/L</th><th></th></tr></thead>
            <tbody className="divide-y divide-line">
              {portfolioRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 font-semibold text-white"><button onClick={() => onSelectSymbol(row.symbol)}>{row.symbol}</button></td>
                  <td>{formatNumber(row.shares)}</td>
                  <td>{formatCurrency(row.cost)}</td>
                  <td>{formatCurrency(row.price)}</td>
                  <td className={row.pnl >= 0 ? "text-lime" : "text-danger"}>{formatCurrency(row.pnl)} ({formatPercent(row.pnlPct)})</td>
                  <td><button onClick={() => setPositions((current) => current.filter((item) => item.id !== row.id))} className="text-slate-500 hover:text-danger"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Breakout / Gap Scanner" icon={<Radar className="h-4 w-4 text-cyan" />}>
        <div className="space-y-2">
          {scannerRows.length ? scannerRows.map((row) => (
            <button key={row.symbol} onClick={() => onSelectSymbol(row.symbol)} className="flex w-full items-center justify-between rounded-md border border-line bg-panelSoft px-3 py-2 text-sm hover:border-cyan/60">
              <span className="font-semibold text-white">{row.symbol}</span>
              <span className={toneClass(row.relativeVolume)}>Score {row.score} / RelVol {row.relativeVolume?.toFixed(2)}x</span>
            </button>
          )) : <p className="text-sm text-slate-400">No breakout candidates in current scan.</p>}
        </div>
      </Panel>

      <Panel title="Trade Journal" icon={<BookOpen className="h-4 w-4 text-cyan" />}>
        <form onSubmit={addJournal} className="mb-3 grid gap-2 sm:grid-cols-[120px_1fr_80px]">
          <select value={journalSide} onChange={(event) => setJournalSide(event.target.value)} className="focus-ring rounded-md border border-line bg-panelSoft px-3 py-2 text-sm">
            <option>Plan</option>
            <option>Buy</option>
            <option>Sell</option>
            <option>Review</option>
          </select>
          <input value={journalNote} onChange={(event) => setJournalNote(event.target.value)} placeholder="Reason, lesson, or plan" className="focus-ring rounded-md border border-line bg-panelSoft px-3 py-2 text-sm" />
          <button className="focus-ring rounded-md bg-cyan px-3 py-2 text-sm font-semibold text-ink">Save</button>
        </form>
        <div className="max-h-64 space-y-2 overflow-auto scrollbar-thin">
          {journal.map((item) => (
            <div key={item.id} className="rounded-md border border-line bg-panelSoft p-3 text-sm">
              <div className="flex justify-between gap-2"><span className="font-semibold text-white">{item.symbol} {item.side}</span><span className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</span></div>
              <p className="mt-1 text-slate-300">{item.note}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Theme / Language" icon={<Languages className="h-4 w-4 text-cyan" />}>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTheme("dark")} className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-panelSoft px-3 py-2 text-sm"><Moon className="h-4 w-4" />Dark</button>
          <button onClick={() => setTheme("light")} className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-panelSoft px-3 py-2 text-sm"><Sun className="h-4 w-4" />Light</button>
          <button onClick={() => setLanguage(language === "TH" ? "EN" : "TH")} className="focus-ring rounded-md bg-cyan px-3 py-2 text-sm font-semibold text-ink">Language: {language}</button>
        </div>
        <p className="mt-3 text-sm text-slate-400">{language === "TH" ? "โหมดนี้บันทึกการตั้งค่าไว้ในเครื่องนี้" : "This mode saves preferences locally on this browser."}</p>
      </Panel>
    </section>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4 shadow-glow">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">{icon}{title}</h2>
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

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}
