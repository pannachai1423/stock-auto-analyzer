import { cached } from "@/lib/cache";
import { buildIndicators, buildSupportResistance, classifyTrend, scoreStock } from "@/lib/analysis";
import type { Candle, OptionContractSummary, OptionsSummary, QuoteSnapshot, RankingRow, RankingsPayload, StockAnalysis } from "@/lib/types";

const DATA_DELAY_NOTE = "ข้อมูลมาจาก Yahoo Finance และอาจเป็น real-time หรือ delayed ตามตลาด/แพ็กเกจข้อมูลของ Yahoo Finance";
const STOCK_CACHE_MS = Number(process.env.STOCK_CACHE_MS ?? 30_000);
const RANKING_CACHE_MS = Number(process.env.RANKING_CACHE_MS ?? 60_000);
const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMD", "META", "PLTR", "AMZN", "GOOGL", "NFLX", "AVGO", "SMCI"];

type RawQuote = Record<string, unknown>;
type RawCandle = {
  date?: Date;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
};
type RawOptionContract = Record<string, unknown>;

export async function getStockAnalysis(symbolInput: string): Promise<StockAnalysis> {
  const symbol = normalizeSymbol(symbolInput);
  if (!symbol) throw new Error("Ticker symbol is required");

  return cached(`stock:${symbol}`, STOCK_CACHE_MS, async () => {
    const [quote, candles, options] = await Promise.all([
      fetchQuote(symbol),
      fetchCandles(symbol),
      fetchOptions(symbol)
    ]);

    if (!quote.price || candles.length < 50) {
      throw new Error(`Yahoo Finance returned insufficient price history for ${symbol}`);
    }

    quote.open = quote.open ?? candles.at(-1)?.open ?? null;
    quote.dayHigh = quote.dayHigh ?? candles.at(-1)?.high ?? null;
    quote.dayLow = quote.dayLow ?? candles.at(-1)?.low ?? null;
    quote.previousClose = quote.previousClose ?? candles.at(-2)?.close ?? null;
    quote.volume = quote.volume ?? candles.at(-1)?.volume ?? null;
    quote.averageVolume = quote.averageVolume ?? averageVolume(candles, 63);

    const { indicators, overlays } = buildIndicators(candles);
    const supportResistance = buildSupportResistance(candles);
    const trend = classifyTrend(indicators, candles);
    const score = scoreStock(trend.label, indicators, supportResistance, options, candles);

    return {
      quote,
      candles,
      indicators,
      overlays,
      supportResistance,
      trend,
      options,
      score
    };
  });
}

export async function getRankings(): Promise<RankingsPayload> {
  return cached("rankings", RANKING_CACHE_MS, async () => {
    const [mostActive, gainers, losers] = await Promise.all([
      fetchScreener("most_actives"),
      fetchScreener("day_gainers"),
      fetchScreener("day_losers")
    ]);

    const baseSymbols = Array.from(new Set([...mostActive, ...gainers, ...losers].map((row) => row.symbol).filter(Boolean))).slice(0, 30);
    const analyzed = await Promise.allSettled(baseSymbols.map((symbol) => getLightRankingRow(symbol)));
    const enriched = analyzed.flatMap((item) => (item.status === "fulfilled" ? [item.value] : []));
    const bySymbol = new Map([...mostActive, ...gainers, ...losers, ...enriched].map((row) => [row.symbol, row]));
    const allRows = Array.from(bySymbol.values());

    const optionsRows = await Promise.allSettled(DEFAULT_SYMBOLS.map((symbol) => getLightRankingRow(symbol, true)));
    const optionActivity = optionsRows.flatMap((item) => (item.status === "fulfilled" ? [item.value] : []));

    return {
      updatedAt: new Date().toISOString(),
      sourceDelayNote: DATA_DELAY_NOTE,
      mostActive: mostActive.slice(0, 15),
      topGainers: gainers.slice(0, 15),
      topLosers: losers.slice(0, 15),
      highRelativeVolume: allRows
        .filter((row) => row.relativeVolume !== null)
        .sort((a, b) => (b.relativeVolume ?? 0) - (a.relativeVolume ?? 0))
        .slice(0, 15),
      unusualOptions: optionActivity
        .filter((row) => (row.optionsVolume ?? 0) > 0)
        .sort((a, b) => (b.optionsVolume ?? 0) / Math.max(b.averageVolume ?? 1, 1) - (a.optionsVolume ?? 0) / Math.max(a.averageVolume ?? 1, 1))
        .slice(0, 15),
      highestOptionsVolume: optionActivity.sort((a, b) => (b.optionsVolume ?? 0) - (a.optionsVolume ?? 0)).slice(0, 15),
      highestOpenInterest: optionActivity.sort((a, b) => (b.openInterest ?? 0) - (a.openInterest ?? 0)).slice(0, 15)
    };
  });
}

export async function getMarketSnapshot(symbolsInput: string) {
  const symbols = symbolsInput
    .split(",")
    .map((symbol) => normalizeSymbol(symbol))
    .filter(Boolean)
    .slice(0, 20);
  const settled = await Promise.allSettled(symbols.map((symbol) => getStockAnalysis(symbol)));
  const analyses = settled.flatMap((item) => (item.status === "fulfilled" ? [item.value] : []));
  const rows = analyses.map((analysis) => ({
    symbol: analysis.quote.symbol,
    price: analysis.quote.price,
    changePercent: analysis.quote.previousClose && analysis.quote.price ? ((analysis.quote.price - analysis.quote.previousClose) / analysis.quote.previousClose) * 100 : null,
    score: analysis.score.total,
    trend: analysis.trend.label,
    relativeVolume: analysis.indicators.relativeVolume
  }));
  const bullish = rows.filter((row) => (row.score ?? 0) >= 60).length;
  const bearish = rows.filter((row) => (row.score ?? 0) < 40).length;
  const neutral = Math.max(rows.length - bullish - bearish, 0);
  const averageScore = rows.length ? Math.round(rows.reduce((total, row) => total + (row.score ?? 0), 0) / rows.length) : 0;

  return {
    updatedAt: new Date().toISOString(),
    rows,
    breadth: { bullish, bearish, neutral, averageScore }
  };
}

export async function getNewsSentiment(symbolInput: string) {
  const symbol = normalizeSymbol(symbolInput);
  if (!symbol) throw new Error("Ticker symbol is required");
  const payload = await yahooJson(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=10&quotesCount=0`);
  const news = ((payload.news ?? []) as RawQuote[]).map((item) => ({
    title: asString(item.title) ?? "",
    publisher: asString(item.publisher),
    link: asString(item.link),
    providerPublishTime: asNumber(item.providerPublishTime) ? new Date((asNumber(item.providerPublishTime) as number) * 1000).toISOString() : undefined
  })).filter((item) => item.title);
  const score = scoreNews(news.map((item) => item.title).join(" "));
  const sentiment = score > 10 ? "Positive" : score < -10 ? "Negative" : "Neutral";
  return {
    symbol,
    updatedAt: new Date().toISOString(),
    sentiment,
    score,
    items: news
  };
}

async function fetchQuote(symbol: string): Promise<QuoteSnapshot> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m&includePrePost=false`;
  const payload = await yahooJson(url);
  const result = payload.chart?.result?.[0];
  const quote = result?.meta as RawQuote | undefined;
  if (!quote) throw new Error(`Yahoo Finance returned no quote chart for ${symbol}`);
  const marketTime = asNumber(quote.regularMarketTime);
  const timestamp = marketTime ? new Date(marketTime * 1000).toISOString() : new Date().toISOString();

  return {
    symbol,
    shortName: asString(quote.shortName) ?? asString(quote.longName),
    currency: asString(quote.currency),
    price: asNumber(quote.regularMarketPrice),
    open: asNumber(quote.regularMarketOpen) ?? asNumber(quote.chartPreviousClose),
    dayHigh: asNumber(quote.regularMarketDayHigh),
    dayLow: asNumber(quote.regularMarketDayLow),
    previousClose: asNumber(quote.previousClose) ?? asNumber(quote.chartPreviousClose),
    volume: asNumber(quote.regularMarketVolume),
    averageVolume: asNumber(quote.averageDailyVolume3Month),
    marketCap: asNumber(quote.marketCap),
    fiftyTwoWeekHigh: asNumber(quote.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: asNumber(quote.fiftyTwoWeekLow),
    exchange: asString(quote.exchangeName) ?? asString(quote.fullExchangeName),
    marketState: asString(quote.marketState) ?? asString(quote.instrumentType),
    sourceDelayNote: DATA_DELAY_NOTE,
    dataTimestamp: timestamp
  };
}

async function fetchCandles(symbol: string): Promise<Candle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&includePrePost=false&events=div%2Csplits`;
  const payload = await yahooJson(url);
  const result = payload.chart?.result?.[0];
  const timestamps = (result?.timestamp ?? []) as number[];
  const quote = result?.indicators?.quote?.[0] ?? {};
  const opens = quote.open ?? [];
  const highs = quote.high ?? [];
  const lows = quote.low ?? [];
  const closes = quote.close ?? [];
  const volumes = quote.volume ?? [];

  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      open: Number(opens[index]),
      high: Number(highs[index]),
      low: Number(lows[index]),
      close: Number(closes[index]),
      volume: Number(volumes[index] ?? 0)
    }))
    .filter((row) => Number.isFinite(row.open) && Number.isFinite(row.high) && Number.isFinite(row.low) && Number.isFinite(row.close));
}

async function fetchOptions(symbol: string): Promise<OptionsSummary> {
  try {
    const response = await yahooJson(`https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}`);
    const result = response.optionChain?.result?.[0];
    const expirationDate = result?.expirationDates?.[0];
    const option = result?.options?.[0];
    if (!option) return emptyOptions();

    const calls = ((option.calls ?? []) as RawOptionContract[]).map((contract) => normalizeOptionContract(contract, "call"));
    const puts = ((option.puts ?? []) as RawOptionContract[]).map((contract) => normalizeOptionContract(contract, "put"));
    const all = [...calls, ...puts];
    const callVolume = calls.reduce((total, contract) => total + contract.volume, 0);
    const putVolume = puts.reduce((total, contract) => total + contract.volume, 0);
    const callOpenInterest = calls.reduce((total, contract) => total + contract.openInterest, 0);
    const putOpenInterest = puts.reduce((total, contract) => total + contract.openInterest, 0);

    return {
      hasOptions: true,
      expirationDate: typeof expirationDate === "number" ? new Date(expirationDate * 1000).toISOString().slice(0, 10) : undefined,
      callVolume,
      putVolume,
      callOpenInterest,
      putOpenInterest,
      totalVolume: callVolume + putVolume,
      totalOpenInterest: callOpenInterest + putOpenInterest,
      putCallVolumeRatio: callVolume > 0 ? putVolume / callVolume : null,
      topContracts: all.sort((a, b) => b.volume + b.openInterest * 0.05 - (a.volume + a.openInterest * 0.05)).slice(0, 12)
    };
  } catch {
    return emptyOptions();
  }
}

async function fetchScreener(scrId: string): Promise<RankingRow[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=${encodeURIComponent(scrId)}&count=25`;
    const response = await yahooJson(url);
    const quotes = response.finance?.result?.[0]?.quotes ?? [];
    return quotes.map((quote: RawQuote) => ({
      symbol: asString(quote.symbol) ?? "",
      name: asString(quote.shortName) ?? asString(quote.longName),
      price: asNumber(quote.regularMarketPrice),
      changePercent: asNumber(quote.regularMarketChangePercent),
      volume: asNumber(quote.regularMarketVolume),
      averageVolume: asNumber(quote.averageDailyVolume3Month),
      relativeVolume: relativeVolume(asNumber(quote.regularMarketVolume), asNumber(quote.averageDailyVolume3Month))
    })).filter((row: RankingRow) => row.symbol);
  } catch {
    return [];
  }
}

async function getLightRankingRow(symbol: string, includeOptions = false): Promise<RankingRow> {
  const quote = await fetchQuote(symbol);
  const options = includeOptions ? await fetchOptions(symbol) : undefined;
  return {
    symbol,
    name: quote.shortName,
    price: quote.price,
    changePercent: quote.previousClose && quote.price ? ((quote.price - quote.previousClose) / quote.previousClose) * 100 : null,
    volume: quote.volume,
    averageVolume: quote.averageVolume,
    relativeVolume: relativeVolume(quote.volume, quote.averageVolume),
    optionsVolume: options?.totalVolume,
    openInterest: options?.totalOpenInterest
  };
}

function emptyOptions(): OptionsSummary {
  return {
    hasOptions: false,
    callVolume: 0,
    putVolume: 0,
    callOpenInterest: 0,
    putOpenInterest: 0,
    totalVolume: 0,
    totalOpenInterest: 0,
    putCallVolumeRatio: null,
    topContracts: []
  };
}

function normalizeOptionContract(contract: RawOptionContract, type: "call" | "put"): OptionContractSummary {
  return {
    contractSymbol: asString(contract.contractSymbol) ?? "",
    type,
    strike: asNumber(contract.strike),
    lastPrice: asNumber(contract.lastPrice),
    volume: asNumber(contract.volume) ?? 0,
    openInterest: asNumber(contract.openInterest) ?? 0,
    impliedVolatility: asNumber(contract.impliedVolatility)
  };
}

function relativeVolume(volume: number | null, averageVolume: number | null) {
  return volume && averageVolume ? volume / averageVolume : null;
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length ? value : undefined;
}

function averageVolume(candles: Candle[], days: number) {
  const volumes = candles.slice(-days).map((candle) => candle.volume).filter((value) => Number.isFinite(value) && value > 0);
  if (!volumes.length) return null;
  return Math.round(volumes.reduce((total, value) => total + value, 0) / volumes.length);
}

async function yahooJson(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 StockAutoAnalyzer/1.0",
      Accept: "application/json"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed (${response.status})`);
  }

  return response.json();
}

function scoreNews(text: string) {
  const positive = ["beat", "beats", "surge", "rally", "upgrade", "growth", "record", "profit", "bullish", "strong", "gain", "jumps", "higher"];
  const negative = ["miss", "falls", "drop", "downgrade", "loss", "lawsuit", "weak", "bearish", "cut", "warning", "lower", "slump", "risk"];
  const lower = text.toLowerCase();
  const plus = positive.reduce((total, word) => total + countWord(lower, word), 0);
  const minus = negative.reduce((total, word) => total + countWord(lower, word), 0);
  return (plus - minus) * 10;
}

function countWord(text: string, word: string) {
  return (text.match(new RegExp(`\\b${word}\\b`, "g")) ?? []).length;
}
