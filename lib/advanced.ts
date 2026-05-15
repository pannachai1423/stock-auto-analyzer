import type { Candle, StockAnalysis } from "@/lib/types";

export type BacktestResult = {
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  averageReturn: number;
  totalReturn: number;
  maxDrawdown: number;
};

export function buildThaiSummary(analysis: StockAnalysis) {
  const price = analysis.quote.price ?? analysis.candles.at(-1)?.close ?? 0;
  const support = analysis.supportResistance.support[0]?.price;
  const resistance = analysis.supportResistance.resistance[0]?.price;
  const relVol = analysis.indicators.relativeVolume;
  const parts: string[] = [];

  parts.push(`${analysis.quote.symbol} ตอนนี้อยู่ในภาพรวมแบบ ${analysis.trend.label} ด้วยคะแนน ${analysis.score.total}/100 (${analysis.score.label})`);

  if (support && resistance) {
    const downside = ((price - support) / price) * 100;
    const upside = ((resistance - price) / price) * 100;
    parts.push(`แนวรับใกล้สุดอยู่แถว ${support.toFixed(2)} และแนวต้านใกล้สุดอยู่แถว ${resistance.toFixed(2)} ทำให้ upside ประมาณ ${upside.toFixed(1)}% เทียบกับ downside ประมาณ ${downside.toFixed(1)}%`);
  }

  if (analysis.supportResistance.breakout) {
    parts.push("ราคาเพิ่งมีลักษณะ breakout พร้อม volume สูง ควรดูว่าราคายืนเหนือแนวต้านเดิมได้หรือไม่");
  } else if (analysis.supportResistance.breakdown) {
    parts.push("ราคาหลุดแนวรับสำคัญ ความเสี่ยงขาลงเพิ่มขึ้น");
  } else if (relVol && relVol >= 1.5) {
    parts.push(`volume สูงกว่าค่าเฉลี่ยชัดเจนที่ ${relVol.toFixed(2)}x แปลว่ามีแรงสนใจเข้ามามากกว่าปกติ`);
  } else {
    parts.push("volume ยังไม่ใช่ spike เด่น จึงควรรอสัญญาณยืนยันก่อนตัดสินใจหนัก");
  }

  if (analysis.indicators.rsi14 && analysis.indicators.rsi14 >= 70) {
    parts.push("RSI อยู่โซนร้อนแรง เสี่ยงพักตัวระยะสั้น");
  } else if (analysis.indicators.rsi14 && analysis.indicators.rsi14 <= 30) {
    parts.push("RSI อยู่โซน oversold อาจมีแรงเด้งได้ แต่ต้องรอดูแรงซื้อยืนยัน");
  }

  parts.push(`สัญญาณระบบตอนนี้คือ ${analysis.score.signal} และไม่ใช่คำแนะนำการลงทุน`);
  return parts.join(" ");
}

export function runSimpleBacktest(candles: Candle[]): BacktestResult {
  if (candles.length < 80) {
    return { trades: 0, wins: 0, losses: 0, winRate: 0, averageReturn: 0, totalReturn: 0, maxDrawdown: 0 };
  }

  const closes = candles.map((candle) => candle.close);
  const ema20 = rollingEma(closes, 20);
  const ema50 = rollingEma(closes, 50);
  const trades: number[] = [];
  let inTrade = false;
  let entry = 0;
  let equity = 1;
  let peak = 1;
  let maxDrawdown = 0;

  for (let i = 51; i < candles.length; i += 1) {
    const buy = !inTrade && ema20[i - 1] <= ema50[i - 1] && ema20[i] > ema50[i];
    const sell = inTrade && (ema20[i - 1] >= ema50[i - 1] && ema20[i] < ema50[i]);

    if (buy) {
      inTrade = true;
      entry = closes[i];
    }

    if (sell && entry > 0) {
      const result = (closes[i] - entry) / entry;
      trades.push(result);
      equity *= 1 + result;
      peak = Math.max(peak, equity);
      maxDrawdown = Math.max(maxDrawdown, (peak - equity) / peak);
      inTrade = false;
      entry = 0;
    }
  }

  if (inTrade && entry > 0) {
    const result = (closes.at(-1)! - entry) / entry;
    trades.push(result);
    equity *= 1 + result;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, (peak - equity) / peak);
  }

  const wins = trades.filter((trade) => trade > 0).length;
  const losses = trades.length - wins;
  const averageReturn = trades.length ? trades.reduce((total, trade) => total + trade, 0) / trades.length : 0;

  return {
    trades: trades.length,
    wins,
    losses,
    winRate: trades.length ? (wins / trades.length) * 100 : 0,
    averageReturn: averageReturn * 100,
    totalReturn: (equity - 1) * 100,
    maxDrawdown: maxDrawdown * 100
  };
}

export function toAnalysisCsv(analysis: StockAnalysis) {
  const rows = [
    ["Symbol", analysis.quote.symbol],
    ["Price", String(analysis.quote.price ?? "")],
    ["Trend", analysis.trend.label],
    ["Score", String(analysis.score.total)],
    ["Signal", analysis.score.signal],
    ["Volume", String(analysis.quote.volume ?? "")],
    ["Relative Volume", String(analysis.indicators.relativeVolume ?? "")],
    ["Support 1", String(analysis.supportResistance.support[0]?.price ?? "")],
    ["Resistance 1", String(analysis.supportResistance.resistance[0]?.price ?? "")],
    ["RSI14", String(analysis.indicators.rsi14 ?? "")],
    ["MACD Histogram", String(analysis.indicators.macdHistogram ?? "")],
    ["Updated At", analysis.quote.dataTimestamp]
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function rollingEma(values: number[], period: number) {
  const result = Array(values.length).fill(0);
  const k = 2 / (period + 1);
  let previous = values.slice(0, period).reduce((total, value) => total + value, 0) / period;
  result[period - 1] = previous;
  for (let i = period; i < values.length; i += 1) {
    previous = values[i] * k + previous * (1 - k);
    result[i] = previous;
  }
  return result;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
