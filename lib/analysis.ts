import type {
  Candle,
  ChartOverlay,
  IndicatorSummary,
  Level,
  OptionsSummary,
  ScoreBreakdown,
  SupportResistance,
  TrendLabel
} from "@/lib/types";
import { adx, average, bollinger, ema, lastValue, macd, round, rsi, sma, toSeries } from "@/lib/math";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function buildIndicators(candles: Candle[]) {
  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema100 = ema(closes, 100);
  const ema200 = ema(closes, 200);
  const rsi14 = rsi(closes, 14);
  const macdData = macd(closes);
  const bands = bollinger(closes, 20, 2);
  const adx14 = adx(candles, 14);
  const recentVolume = volumes.at(-1) ?? 0;
  const avgVolume20 = average(volumes.slice(-21, -1)) ?? 0;
  const relativeVolume = avgVolume20 > 0 ? recentVolume / avgVolume20 : null;

  const indicators: IndicatorSummary = {
    ema20: round(lastValue(ema20)),
    ema50: round(lastValue(ema50)),
    ema100: round(lastValue(ema100)),
    ema200: round(lastValue(ema200)),
    rsi14: round(lastValue(rsi14)),
    macd: round(lastValue(macdData.line), 3),
    macdSignal: round(lastValue(macdData.signal), 3),
    macdHistogram: round(lastValue(macdData.histogram), 3),
    bollingerUpper: round(lastValue(bands.upper)),
    bollingerMiddle: round(lastValue(bands.middle)),
    bollingerLower: round(lastValue(bands.lower)),
    adx14: round(lastValue(adx14)),
    relativeVolume: round(relativeVolume, 2),
    volumeSpike: Boolean(relativeVolume && relativeVolume >= 1.5)
  };

  const overlays: ChartOverlay = {
    ema20: toSeries(candles, ema20),
    ema50: toSeries(candles, ema50),
    ema200: toSeries(candles, ema200),
    rsi14: toSeries(candles, rsi14),
    macd: toSeries(candles, macdData.line, 3),
    macdSignal: toSeries(candles, macdData.signal, 3),
    macdHistogram: toSeries(candles, macdData.histogram, 3)
  };

  return { indicators, overlays };
}

export function buildSupportResistance(candles: Candle[]): SupportResistance {
  const latest = candles.at(-1);
  const previous = candles.at(-2);
  if (!latest || !previous) {
    return { support: [], resistance: [], watchLevels: [], alerts: [], breakout: false, breakdown: false };
  }

  const candidates: Level[] = [];
  const pivot = (previous.high + previous.low + previous.close) / 3;
  candidates.push({ label: "Pivot", price: pivot, method: "Pivot Points", strength: 70 });
  candidates.push({ label: "S1", price: 2 * pivot - previous.high, method: "Pivot Points", strength: 78 });
  candidates.push({ label: "S2", price: pivot - (previous.high - previous.low), method: "Pivot Points", strength: 68 });
  candidates.push({ label: "R1", price: 2 * pivot - previous.low, method: "Pivot Points", strength: 78 });
  candidates.push({ label: "R2", price: pivot + (previous.high - previous.low), method: "Pivot Points", strength: 68 });
  candidates.push({ label: "Prev Low", price: previous.low, method: "Previous High / Low", strength: 72 });
  candidates.push({ label: "Prev High", price: previous.high, method: "Previous High / Low", strength: 72 });

  const closes = candles.map((candle) => candle.close);
  for (const period of [20, 50, 100, 200]) {
    const value = lastValue(sma(closes, period));
    if (value) candidates.push({ label: `MA ${period}`, price: value, method: "Moving Average", strength: 62 + period / 20 });
  }

  const windows = [
    { label: "3M", days: 63 },
    { label: "6M", days: 126 },
    { label: "1Y", days: 252 }
  ];
  for (const window of windows) {
    const slice = candles.slice(-window.days);
    if (slice.length > 5) {
      candidates.push({ label: `${window.label} Low`, price: Math.min(...slice.map((c) => c.low)), method: "Recent support/resistance", strength: 82 });
      candidates.push({ label: `${window.label} High`, price: Math.max(...slice.map((c) => c.high)), method: "Recent support/resistance", strength: 82 });
    }
  }

  const recent = candles.slice(-60);
  for (let i = 2; i < recent.length - 2; i += 1) {
    const item = recent[i];
    const isSwingHigh = item.high > recent[i - 1].high && item.high > recent[i - 2].high && item.high > recent[i + 1].high && item.high > recent[i + 2].high;
    const isSwingLow = item.low < recent[i - 1].low && item.low < recent[i - 2].low && item.low < recent[i + 1].low && item.low < recent[i + 2].low;
    if (isSwingHigh) candidates.push({ label: "Swing High", price: item.high, method: "Swing High / Low", strength: 74 });
    if (isSwingLow) candidates.push({ label: "Swing Low", price: item.low, method: "Swing High / Low", strength: 74 });
  }

  const oneYear = candles.slice(-252);
  const high = Math.max(...oneYear.map((c) => c.high));
  const low = Math.min(...oneYear.map((c) => c.low));
  const range = high - low;
  for (const ratio of [0.236, 0.382, 0.5, 0.618, 0.786]) {
    candidates.push({ label: `Fib ${Math.round(ratio * 100)}%`, price: high - range * ratio, method: "Fibonacci Retracement", strength: 66 });
  }

  candidates.push(...volumeProfileLevels(candles));

  const deduped = clusterLevels(candidates, latest.close);
  const support = deduped
    .filter((level) => level.price < latest.close)
    .sort((a, b) => b.price - a.price)
    .slice(0, 3)
    .map((level, index) => ({ ...level, label: `แนวรับ ${index + 1}` }));
  const resistance = deduped
    .filter((level) => level.price > latest.close)
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)
    .map((level, index) => ({ ...level, label: `แนวต้าน ${index + 1}` }));

  const alerts: string[] = [];
  const nearestSupport = support[0];
  const nearestResistance = resistance[0];
  const recentAvgVolume = average(candles.slice(-21, -1).map((c) => c.volume)) ?? 0;
  const breakout = Boolean(nearestResistance && latest.close > nearestResistance.price && latest.volume > recentAvgVolume * 1.25);
  const breakdown = Boolean(nearestSupport && latest.close < nearestSupport.price);

  if (breakout) alerts.push("ราคาเบรกแนวต้านพร้อม Volume สูง: มีลักษณะ breakout");
  if (breakdown) alerts.push("ราคาหลุดแนวรับสำคัญ: ความเสี่ยงขาลงเพิ่มขึ้น");
  if (!alerts.length && nearestSupport && latest.close < nearestSupport.price * 1.02) alerts.push("ราคาใกล้แนวรับ ควรรอดูแรงซื้อยืนยัน");
  if (!alerts.length && nearestResistance && latest.close > nearestResistance.price * 0.98) alerts.push("ราคาใกล้แนวต้าน ควรรอดูการเบรกพร้อม Volume");

  return {
    support: support.map(normalizeLevel),
    resistance: resistance.map(normalizeLevel),
    watchLevels: [...support, ...resistance].sort((a, b) => Math.abs(a.price - latest.close) - Math.abs(b.price - latest.close)).slice(0, 5).map(normalizeLevel),
    alerts,
    breakout,
    breakdown
  };
}

export function classifyTrend(indicators: IndicatorSummary, candles: Candle[]) {
  const price = candles.at(-1)?.close ?? 0;
  const rsi14 = indicators.rsi14 ?? 50;
  const adx14 = indicators.adx14 ?? 15;
  const macdHist = indicators.macdHistogram ?? 0;
  const above20 = indicators.ema20 !== null && price > indicators.ema20;
  const above50 = indicators.ema50 !== null && price > indicators.ema50;
  const above200 = indicators.ema200 !== null && price > indicators.ema200;
  const alignedUp = indicators.ema20 !== null && indicators.ema50 !== null && indicators.ema200 !== null && indicators.ema20 > indicators.ema50 && indicators.ema50 > indicators.ema200;
  const alignedDown = indicators.ema20 !== null && indicators.ema50 !== null && indicators.ema200 !== null && indicators.ema20 < indicators.ema50 && indicators.ema50 < indicators.ema200;

  let label: TrendLabel = "Sideway";
  if (rsi14 >= 74) label = "Risky / Overbought";
  else if (rsi14 <= 30) label = "Oversold";
  else if (alignedUp && above20 && above50 && above200 && adx14 >= 25 && macdHist > 0) label = "Strong Uptrend";
  else if (above50 && above200 && macdHist >= 0) label = "Uptrend";
  else if (above50 && !above200) label = "Weak Uptrend";
  else if (alignedDown || (!above50 && !above200 && macdHist < 0)) label = "Downtrend";

  const detail = [
    above20 ? "ราคาอยู่เหนือ EMA20" : "ราคาอยู่ใต้ EMA20",
    above50 ? "เหนือ EMA50" : "ใต้ EMA50",
    above200 ? "เหนือ EMA200" : "ใต้ EMA200",
    `RSI ${round(rsi14) ?? "-"}`
  ].join(", ");

  return { label, detail };
}

export function scoreStock(
  trendLabel: TrendLabel,
  indicators: IndicatorSummary,
  supportResistance: SupportResistance,
  options: OptionsSummary,
  candles: Candle[]
): ScoreBreakdown {
  const price = candles.at(-1)?.close ?? 0;
  const ema50 = indicators.ema50 ?? price;
  const ema200 = indicators.ema200 ?? price;
  const trendBase: Record<TrendLabel, number> = {
    "Strong Uptrend": 100,
    Uptrend: 82,
    "Weak Uptrend": 64,
    Sideway: 50,
    Downtrend: 24,
    "Risky / Overbought": 56,
    Oversold: 42
  };

  const trendStrength = trendBase[trendLabel];
  const volumeStrength = clamp(((indicators.relativeVolume ?? 0.7) / 2) * 100);
  const rsiScore = indicators.rsi14 === null ? 50 : indicators.rsi14 > 70 ? 55 : indicators.rsi14 < 30 ? 45 : 100 - Math.abs(55 - indicators.rsi14) * 1.4;
  const macdScore = indicators.macdHistogram && indicators.macdHistogram > 0 ? 75 : 38;
  const momentum = clamp((rsiScore + macdScore) / 2);
  const optionsActivity = options.hasOptions ? clamp((options.totalVolume / 50000) * 55 + (options.totalOpenInterest / 500000) * 45) : 35;
  const nearestSupport = supportResistance.support[0]?.price ?? price * 0.95;
  const nearestResistance = supportResistance.resistance[0]?.price ?? price * 1.05;
  const reward = nearestResistance - price;
  const risk = price - nearestSupport;
  const setup = clamp((reward / Math.max(risk, price * 0.005)) * 35 + (price > ema50 ? 25 : 8) + (price > ema200 ? 25 : 8) + (supportResistance.breakout ? 20 : 0));

  const total = Math.round(
    trendStrength * 0.3 +
      volumeStrength * 0.2 +
      momentum * 0.2 +
      optionsActivity * 0.15 +
      setup * 0.15
  );

  const label = total >= 80 ? "Very Strong" : total >= 60 ? "Bullish" : total >= 40 ? "Neutral" : total >= 20 ? "Bearish" : "Very Weak";
  const signal = total >= 70 && trendLabel !== "Risky / Overbought" ? "Buy" : total <= 35 || trendLabel === "Downtrend" ? "Sell" : "Watch";
  const reasons = [
    `Trend ${trendLabel}`,
    indicators.volumeSpike ? "Volume วันนี้สูงกว่าค่าเฉลี่ยชัดเจน" : "Volume ยังไม่ใช่ spike เด่น",
    options.hasOptions ? `Options volume ${options.totalVolume.toLocaleString("en-US")}` : "ไม่มีข้อมูล options",
    supportResistance.breakout ? "Breakout พร้อม volume" : "ยังต้องจับตาแนวรับ/แนวต้าน"
  ];

  return {
    total,
    label,
    trendStrength: Math.round(trendStrength),
    volumeStrength: Math.round(volumeStrength),
    momentum: Math.round(momentum),
    optionsActivity: Math.round(optionsActivity),
    setup: Math.round(setup),
    signal,
    reasons
  };
}

function volumeProfileLevels(candles: Candle[]): Level[] {
  const slice = candles.slice(-126);
  if (slice.length < 20) return [];
  const high = Math.max(...slice.map((c) => c.high));
  const low = Math.min(...slice.map((c) => c.low));
  const bucketCount = 16;
  const bucketSize = (high - low) / bucketCount || 1;
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    price: low + bucketSize * (index + 0.5),
    volume: 0
  }));

  for (const candle of slice) {
    const typical = (candle.high + candle.low + candle.close) / 3;
    const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((typical - low) / bucketSize)));
    buckets[index].volume += candle.volume;
  }

  return buckets
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 4)
    .map((bucket) => ({ label: "Volume Node", price: bucket.price, method: "Basic Volume Profile", strength: 76 }));
}

function clusterLevels(levels: Level[], currentPrice: number): Level[] {
  const tolerance = Math.max(currentPrice * 0.006, 0.05);
  const sorted = levels.filter((level) => Number.isFinite(level.price) && level.price > 0).sort((a, b) => a.price - b.price);
  const clusters: Level[][] = [];

  for (const level of sorted) {
    const target = clusters.at(-1);
    if (target && Math.abs((target.at(-1)?.price ?? level.price) - level.price) <= tolerance) target.push(level);
    else clusters.push([level]);
  }

  return clusters.map((cluster) => {
    const price = average(cluster.map((level) => level.price)) ?? cluster[0].price;
    const strongest = cluster.sort((a, b) => b.strength - a.strength)[0];
    return {
      ...strongest,
      price,
      strength: Math.min(100, strongest.strength + (cluster.length - 1) * 5),
      method: Array.from(new Set(cluster.map((level) => level.method))).slice(0, 2).join(" + ")
    };
  });
}

function normalizeLevel(level: Level): Level {
  return {
    ...level,
    price: round(level.price) ?? level.price,
    strength: Math.round(level.strength)
  };
}
