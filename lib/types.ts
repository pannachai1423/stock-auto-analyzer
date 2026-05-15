export type Candle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type QuoteSnapshot = {
  symbol: string;
  shortName?: string;
  currency?: string;
  price: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  previousClose: number | null;
  volume: number | null;
  averageVolume: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  exchange?: string;
  marketState?: string;
  sourceDelayNote: string;
  dataTimestamp: string;
};

export type OptionsSummary = {
  hasOptions: boolean;
  expirationDate?: string;
  callVolume: number;
  putVolume: number;
  callOpenInterest: number;
  putOpenInterest: number;
  totalVolume: number;
  totalOpenInterest: number;
  putCallVolumeRatio: number | null;
  topContracts: OptionContractSummary[];
};

export type OptionContractSummary = {
  contractSymbol: string;
  type: "call" | "put";
  strike: number | null;
  lastPrice: number | null;
  volume: number;
  openInterest: number;
  impliedVolatility: number | null;
};

export type IndicatorSummary = {
  ema20: number | null;
  ema50: number | null;
  ema100: number | null;
  ema200: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  adx14: number | null;
  relativeVolume: number | null;
  volumeSpike: boolean;
};

export type ChartOverlay = {
  ema20: SeriesPoint[];
  ema50: SeriesPoint[];
  ema200: SeriesPoint[];
  rsi14: SeriesPoint[];
  macd: SeriesPoint[];
  macdSignal: SeriesPoint[];
  macdHistogram: SeriesPoint[];
};

export type SeriesPoint = {
  time: string;
  value: number;
};

export type Level = {
  label: string;
  price: number;
  method: string;
  strength: number;
};

export type SupportResistance = {
  support: Level[];
  resistance: Level[];
  watchLevels: Level[];
  alerts: string[];
  breakout: boolean;
  breakdown: boolean;
};

export type TrendLabel =
  | "Strong Uptrend"
  | "Uptrend"
  | "Weak Uptrend"
  | "Sideway"
  | "Downtrend"
  | "Risky / Overbought"
  | "Oversold";

export type ScoreBreakdown = {
  total: number;
  label: "Very Strong" | "Bullish" | "Neutral" | "Bearish" | "Very Weak";
  trendStrength: number;
  volumeStrength: number;
  momentum: number;
  optionsActivity: number;
  setup: number;
  signal: "Buy" | "Sell" | "Watch";
  reasons: string[];
};

export type StockAnalysis = {
  quote: QuoteSnapshot;
  candles: Candle[];
  indicators: IndicatorSummary;
  overlays: ChartOverlay;
  supportResistance: SupportResistance;
  trend: {
    label: TrendLabel;
    detail: string;
  };
  options: OptionsSummary;
  score: ScoreBreakdown;
};

export type RankingRow = {
  symbol: string;
  name?: string;
  price: number | null;
  changePercent: number | null;
  volume: number | null;
  averageVolume: number | null;
  relativeVolume: number | null;
  optionsVolume?: number;
  openInterest?: number;
};

export type RankingsPayload = {
  updatedAt: string;
  sourceDelayNote: string;
  mostActive: RankingRow[];
  topGainers: RankingRow[];
  topLosers: RankingRow[];
  highRelativeVolume: RankingRow[];
  unusualOptions: RankingRow[];
  highestOptionsVolume: RankingRow[];
  highestOpenInterest: RankingRow[];
};
