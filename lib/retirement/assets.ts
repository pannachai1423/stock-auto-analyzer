/**
 * Asset classes available to Thai retail investors, with long-term
 * expected-return and volatility assumptions (rough historical figures,
 * for planning simulation only — not investment advice).
 */

export interface AssetClass {
  id: string;
  name: string;
  examples: string;
  expectedReturnPct: number; // long-term annual return assumption
  riskPct: number; // annual volatility proxy
}

export const ASSET_CLASSES: AssetClass[] = [
  {
    id: "cash",
    name: "เงินฝาก / ตลาดเงิน",
    examples: "กองทุนตลาดเงิน, เงินฝากประจำ",
    expectedReturnPct: 1.5,
    riskPct: 0.5
  },
  {
    id: "thBond",
    name: "ตราสารหนี้ไทย",
    examples: "กองทุนตราสารหนี้, พันธบัตรรัฐบาล",
    expectedReturnPct: 2.5,
    riskPct: 2
  },
  {
    id: "thEquity",
    name: "หุ้นไทย",
    examples: "กองทุนดัชนี SET50, RMF/SSF หุ้นไทย",
    expectedReturnPct: 6,
    riskPct: 15
  },
  {
    id: "globalEquity",
    name: "หุ้น / กองทุนต่างประเทศ",
    examples: "กองทุนดัชนี S&P 500, หุ้นโลก, Nasdaq",
    expectedReturnPct: 8,
    riskPct: 16
  },
  {
    id: "reit",
    name: "อสังหาฯ / REITs",
    examples: "กองทุนรวมอสังหาฯ ไทยและต่างประเทศ",
    expectedReturnPct: 5,
    riskPct: 12
  },
  {
    id: "gold",
    name: "ทองคำ",
    examples: "กองทุนทองคำ, ทองแท่ง",
    expectedReturnPct: 4,
    riskPct: 14
  }
];

/** Percent weight per asset id; weights need not sum to 100 — they are normalized. */
export type Allocation = Record<string, number>;

export const DEFAULT_ALLOCATION: Allocation = {
  cash: 10,
  thBond: 30,
  thEquity: 20,
  globalEquity: 30,
  reit: 5,
  gold: 5
};

export const MODEL_PORTFOLIOS: { label: string; alloc: Allocation }[] = [
  {
    label: "ปลอดภัย",
    alloc: { cash: 30, thBond: 45, thEquity: 10, globalEquity: 10, reit: 0, gold: 5 }
  },
  {
    label: "สมดุล",
    alloc: { cash: 10, thBond: 30, thEquity: 20, globalEquity: 30, reit: 5, gold: 5 }
  },
  {
    label: "เติบโต",
    alloc: { cash: 5, thBond: 10, thEquity: 20, globalEquity: 55, reit: 5, gold: 5 }
  }
];

export interface PortfolioSummary {
  totalPct: number;
  expectedReturnPct: number;
  riskPct: number;
  /** ± percentage points used for the good/bad scenario band */
  spreadPct: number;
  riskLabel: "ต่ำ" | "ปานกลาง" | "สูง";
}

export function summarizePortfolio(alloc: Allocation): PortfolioSummary {
  const total = ASSET_CLASSES.reduce((s, a) => s + (alloc[a.id] || 0), 0);
  if (total <= 0) {
    return { totalPct: 0, expectedReturnPct: 0, riskPct: 0, spreadPct: 1, riskLabel: "ต่ำ" };
  }
  let ret = 0;
  let risk = 0;
  for (const a of ASSET_CLASSES) {
    const w = (alloc[a.id] || 0) / total;
    ret += w * a.expectedReturnPct;
    risk += w * a.riskPct;
  }
  // mild diversification discount on the naive weighted volatility
  risk *= 0.85;
  const spreadPct = Math.min(4, Math.max(1, 1 + risk / 8));
  const riskLabel = risk <= 4 ? "ต่ำ" : risk <= 10 ? "ปานกลาง" : "สูง";
  return { totalPct: total, expectedReturnPct: ret, riskPct: risk, spreadPct, riskLabel };
}
