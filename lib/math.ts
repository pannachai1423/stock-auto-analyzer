import type { Candle, SeriesPoint } from "@/lib/types";

export function round(value: number | null | undefined, decimals = 2): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

export function average(values: number[]) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? sum(valid) / valid.length : null;
}

export function ema(values: number[], period: number): Array<number | null> {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const result: Array<number | null> = Array(values.length).fill(null);
  let previous = average(values.slice(0, period));

  if (previous === null || values.length < period) return result;
  result[period - 1] = previous;

  for (let i = period; i < values.length; i += 1) {
    previous = values[i] * k + previous * (1 - k);
    result[i] = previous;
  }

  return result;
}

export function sma(values: number[], period: number): Array<number | null> {
  return values.map((_, index) => {
    if (index + 1 < period) return null;
    return average(values.slice(index + 1 - period, index + 1));
  });
}

export function rsi(values: number[], period = 14): Array<number | null> {
  const result: Array<number | null> = Array(values.length).fill(null);
  if (values.length <= period) return result;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return result;
}

export function macd(values: number[]) {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  const line = values.map((_, index) => {
    if (fast[index] === null || slow[index] === null) return null;
    return (fast[index] as number) - (slow[index] as number);
  });

  const compact = line.map((value) => value ?? 0);
  const signalRaw = ema(compact, 9);
  const signal = signalRaw.map((value, index) => (line[index] === null ? null : value));
  const histogram = line.map((value, index) => {
    if (value === null || signal[index] === null) return null;
    return value - (signal[index] as number);
  });

  return { line, signal, histogram };
}

export function bollinger(values: number[], period = 20, multiplier = 2) {
  const middle = sma(values, period);
  const upper: Array<number | null> = Array(values.length).fill(null);
  const lower: Array<number | null> = Array(values.length).fill(null);

  values.forEach((_, index) => {
    if (index + 1 < period || middle[index] === null) return;
    const window = values.slice(index + 1 - period, index + 1);
    const mean = middle[index] as number;
    const variance = average(window.map((value) => (value - mean) ** 2)) ?? 0;
    const deviation = Math.sqrt(variance);
    upper[index] = mean + deviation * multiplier;
    lower[index] = mean - deviation * multiplier;
  });

  return { upper, middle, lower };
}

export function adx(candles: Candle[], period = 14): Array<number | null> {
  const result: Array<number | null> = Array(candles.length).fill(null);
  if (candles.length <= period * 2) return result;

  const tr: number[] = [];
  const plusDm: number[] = [];
  const minusDm: number[] = [];

  for (let i = 1; i < candles.length; i += 1) {
    const current = candles[i];
    const previous = candles[i - 1];
    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;
    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(Math.max(current.high - current.low, Math.abs(current.high - previous.close), Math.abs(current.low - previous.close)));
  }

  for (let i = period; i < tr.length; i += 1) {
    const trAvg = average(tr.slice(i - period, i)) ?? 0;
    const plus = ((average(plusDm.slice(i - period, i)) ?? 0) / trAvg) * 100;
    const minus = ((average(minusDm.slice(i - period, i)) ?? 0) / trAvg) * 100;
    const dx = Math.abs(plus - minus) / Math.max(plus + minus, 0.0001) * 100;
    const start = Math.max(period, i - period + 1);
    const dxWindow = Array.from({ length: i - start + 1 }, (_, offset) => {
      const j = start + offset;
      const trWindow = average(tr.slice(j - period, j)) ?? 0;
      const plusWindow = ((average(plusDm.slice(j - period, j)) ?? 0) / trWindow) * 100;
      const minusWindow = ((average(minusDm.slice(j - period, j)) ?? 0) / trWindow) * 100;
      return Math.abs(plusWindow - minusWindow) / Math.max(plusWindow + minusWindow, 0.0001) * 100;
    });
    result[i + 1] = average([...dxWindow, dx]);
  }

  return result;
}

export function toSeries(candles: Candle[], values: Array<number | null>, decimals = 2): SeriesPoint[] {
  return candles
    .map((candle, index) => {
      const value = round(values[index], decimals);
      return value === null ? null : { time: candle.date, value };
    })
    .filter((point): point is SeriesPoint => point !== null);
}

export function lastValue(values: Array<number | null>) {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    if (values[i] !== null && Number.isFinite(values[i])) return values[i];
  }
  return null;
}
