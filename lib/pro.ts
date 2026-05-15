import type { Candle, StockAnalysis } from "@/lib/types";

export type ProIndicators = {
  atr14: number;
  vwap20: number;
  supertrend: {
    value: number;
    direction: "Bullish" | "Bearish";
  };
  weeklyTrend: "Bullish" | "Bearish" | "Neutral";
  monthlyTrend: "Bullish" | "Bearish" | "Neutral";
  pattern: string;
  gap: string;
  relativeStrength: number | null;
};

export function buildProIndicators(analysis: StockAnalysis, benchmark?: StockAnalysis | null): ProIndicators {
  const candles = analysis.candles;
  return {
    atr14: round(atr(candles, 14)),
    vwap20: round(vwap(candles.slice(-20))),
    supertrend: supertrend(candles),
    weeklyTrend: timeframeTrend(candles, 5),
    monthlyTrend: timeframeTrend(candles, 21),
    pattern: detectPattern(candles),
    gap: detectGap(candles),
    relativeStrength: benchmark ? round(relativeStrength(analysis, benchmark), 2) : null
  };
}

export function buildScenarioPlan(analysis: StockAnalysis) {
  const price = analysis.quote.price ?? analysis.candles.at(-1)?.close ?? 0;
  const support = analysis.supportResistance.support[0]?.price ?? price * 0.97;
  const resistance = analysis.supportResistance.resistance[0]?.price ?? price * 1.03;
  const atr14 = atr(analysis.candles, 14);
  return [
    {
      name: "Breakout Plan",
      trigger: `Buy only if price closes above ${resistance.toFixed(2)} with relative volume > 1.3x`,
      stop: (resistance - atr14).toFixed(2),
      target: (resistance + atr14 * 2).toFixed(2)
    },
    {
      name: "Pullback Plan",
      trigger: `Watch for bounce near support ${support.toFixed(2)}`,
      stop: (support - atr14 * 0.75).toFixed(2),
      target: resistance.toFixed(2)
    },
    {
      name: "Risk-Off Plan",
      trigger: `Avoid or reduce if price closes below ${support.toFixed(2)}`,
      stop: support.toFixed(2),
      target: (support - atr14 * 1.5).toFixed(2)
    }
  ];
}

export function scanBreakout(rows: Array<{ symbol: string; score: number | null; relativeVolume: number | null; trend: string }>) {
  return rows
    .filter((row) => (row.score ?? 0) >= 60 && (row.relativeVolume ?? 0) >= 1.1 && row.trend !== "Downtrend")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

function atr(candles: Candle[], period: number) {
  if (candles.length < period + 1) return 0;
  const ranges: number[] = [];
  for (let i = 1; i < candles.length; i += 1) {
    ranges.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    ));
  }
  return average(ranges.slice(-period));
}

function vwap(candles: Candle[]) {
  const volume = candles.reduce((total, candle) => total + candle.volume, 0);
  if (!volume) return 0;
  return candles.reduce((total, candle) => {
    const typical = (candle.high + candle.low + candle.close) / 3;
    return total + typical * candle.volume;
  }, 0) / volume;
}

function supertrend(candles: Candle[]) {
  const latest = candles.at(-1);
  if (!latest) return { value: 0, direction: "Bearish" as const };
  const atr14 = atr(candles, 14);
  const mid = (latest.high + latest.low) / 2;
  const upper = mid + atr14 * 3;
  const lower = mid - atr14 * 3;
  return latest.close >= lower
    ? { value: round(lower), direction: "Bullish" as const }
    : { value: round(upper), direction: "Bearish" as const };
}

function timeframeTrend(candles: Candle[], daysPerBar: number) {
  const bars = aggregate(candles, daysPerBar);
  if (bars.length < 8) return "Neutral";
  const last = bars.at(-1)!;
  const previous = bars.at(-4)!;
  if (last.close > previous.close && last.close > average(bars.slice(-8).map((bar) => bar.close))) return "Bullish";
  if (last.close < previous.close && last.close < average(bars.slice(-8).map((bar) => bar.close))) return "Bearish";
  return "Neutral";
}

function aggregate(candles: Candle[], size: number): Candle[] {
  const bars: Candle[] = [];
  for (let i = 0; i < candles.length; i += size) {
    const slice = candles.slice(i, i + size);
    if (!slice.length) continue;
    bars.push({
      date: slice.at(-1)!.date,
      open: slice[0].open,
      high: Math.max(...slice.map((candle) => candle.high)),
      low: Math.min(...slice.map((candle) => candle.low)),
      close: slice.at(-1)!.close,
      volume: slice.reduce((total, candle) => total + candle.volume, 0)
    });
  }
  return bars;
}

function detectPattern(candles: Candle[]) {
  const recent = candles.slice(-8);
  if (recent.length < 8) return "Not enough data";
  const highsUp = recent.at(-1)!.high > recent.at(-3)!.high && recent.at(-3)!.high > recent.at(-5)!.high;
  const lowsUp = recent.at(-1)!.low > recent.at(-3)!.low && recent.at(-3)!.low > recent.at(-5)!.low;
  const highsDown = recent.at(-1)!.high < recent.at(-3)!.high && recent.at(-3)!.high < recent.at(-5)!.high;
  const lowsDown = recent.at(-1)!.low < recent.at(-3)!.low && recent.at(-3)!.low < recent.at(-5)!.low;
  const range = Math.max(...recent.map((c) => c.high)) - Math.min(...recent.map((c) => c.low));
  const avgClose = average(recent.map((c) => c.close));
  if (highsUp && lowsUp) return "Higher high / higher low";
  if (highsDown && lowsDown) return "Lower high / lower low";
  if (range / avgClose < 0.04) return "Tight base";
  return "Mixed structure";
}

function detectGap(candles: Candle[]) {
  const today = candles.at(-1);
  const yesterday = candles.at(-2);
  if (!today || !yesterday) return "No data";
  const gapPct = ((today.open - yesterday.close) / yesterday.close) * 100;
  if (gapPct >= 2) return `Gap up ${gapPct.toFixed(2)}%`;
  if (gapPct <= -2) return `Gap down ${gapPct.toFixed(2)}%`;
  return "No major gap";
}

function relativeStrength(analysis: StockAnalysis, benchmark: StockAnalysis) {
  const stockStart = analysis.candles.at(-63)?.close;
  const stockEnd = analysis.candles.at(-1)?.close;
  const benchStart = benchmark.candles.at(-63)?.close;
  const benchEnd = benchmark.candles.at(-1)?.close;
  if (!stockStart || !stockEnd || !benchStart || !benchEnd) return 0;
  return ((stockEnd / stockStart - 1) - (benchEnd / benchStart - 1)) * 100;
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
