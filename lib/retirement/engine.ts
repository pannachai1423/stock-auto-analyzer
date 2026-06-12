/**
 * Retirement planning engine — pure deterministic math, no UI concerns.
 * All money values are THB. All rates are percent per year (e.g. 5 = 5%).
 */

export interface PlanInput {
  currentAge: number;
  retireAge: number;
  endAge: number; // plan until this age (life expectancy)
  currentSavings: number; // THB available today
  monthlySaving: number; // THB saved per month
  savingGrowthPct: number; // yearly raise of the monthly saving
  preReturnPct: number; // annual return while accumulating
  postReturnPct: number; // annual return after retiring
  inflationPct: number;
  monthlyExpense: number; // desired retirement spending, today's value /month
  monthlyPension: number; // pension & other income, today's value /month
  /** ± percentage points for the optimistic/pessimistic paths (default 2) */
  spreadPct?: number;
}

export interface YearPoint {
  age: number;
  yearBE: number; // Buddhist calendar year
  expected: number;
  optimistic: number;
  pessimistic: number;
  withdrawal: number; // expected withdrawal during that year (0 while saving)
  phase: "save" | "retire";
}

export interface PlanResult {
  input: PlanInput;
  yearsToRetire: number;
  retirementYears: number;
  monthlyExpenseAtRetire: number; // first-month spending, inflated
  requiredFund: number; // nest egg needed on retirement day
  projectedFund: number; // expected nest egg on retirement day
  gap: number; // projectedFund - requiredFund
  readinessPct: number; // projected / required, capped at 999
  depletionAge: number | null; // expected-scenario age money runs out
  endBalance: number; // expected balance at endAge
  requiredMonthlySaving: number; // saving/month that closes the gap exactly
  timeline: YearPoint[];
}

export const DEFAULT_PLAN: PlanInput = {
  currentAge: 30,
  retireAge: 60,
  endAge: 85,
  currentSavings: 500_000,
  monthlySaving: 15_000,
  savingGrowthPct: 3,
  preReturnPct: 7,
  postReturnPct: 4,
  inflationPct: 3,
  monthlyExpense: 30_000,
  monthlyPension: 5_000
};

const r = (pct: number) => pct / 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function sanitizePlan(raw: PlanInput): PlanInput {
  const currentAge = clamp(Math.round(raw.currentAge) || 0, 18, 80);
  const retireAge = clamp(Math.round(raw.retireAge) || 0, currentAge + 1, 80);
  const endAge = clamp(Math.round(raw.endAge) || 0, retireAge + 1, 110);
  return {
    currentAge,
    retireAge,
    endAge,
    currentSavings: clamp(raw.currentSavings || 0, 0, 1e12),
    monthlySaving: clamp(raw.monthlySaving || 0, 0, 1e9),
    savingGrowthPct: clamp(raw.savingGrowthPct || 0, 0, 20),
    preReturnPct: clamp(raw.preReturnPct || 0, 0, 20),
    postReturnPct: clamp(raw.postReturnPct || 0, 0, 20),
    inflationPct: clamp(raw.inflationPct || 0, 0, 15),
    monthlyExpense: clamp(raw.monthlyExpense || 0, 0, 1e9),
    monthlyPension: clamp(raw.monthlyPension || 0, 0, 1e9),
    spreadPct: raw.spreadPct === undefined ? 2 : clamp(raw.spreadPct, 0.5, 6)
  };
}

interface ScenarioRun {
  balances: number[]; // index 0 = today, one entry per year up to endAge
  fundAtRetire: number;
  depletionAge: number | null;
  endBalance: number;
}

/** Simulate one path with the given returns; contributions earn ~half a year of growth. */
function runScenario(c: PlanInput, preReturn: number, postReturn: number): ScenarioRun {
  const inflation = r(c.inflationPct);
  const yearsToRetire = c.retireAge - c.currentAge;
  const netMonthlyNeed = Math.max(0, c.monthlyExpense - c.monthlyPension);

  const balances: number[] = [c.currentSavings];
  let bal = c.currentSavings;
  let yearlyContribution = c.monthlySaving * 12;
  let depletionAge: number | null = null;
  let fundAtRetire = c.currentSavings;

  for (let age = c.currentAge; age < c.endAge; age++) {
    if (age < c.retireAge) {
      bal = bal * (1 + preReturn) + yearlyContribution * (1 + preReturn / 2);
      yearlyContribution *= 1 + r(c.savingGrowthPct);
      if (age + 1 === c.retireAge) fundAtRetire = bal;
    } else {
      const yearsFromNow = age - c.currentAge;
      const need = netMonthlyNeed * 12 * Math.pow(1 + inflation, yearsFromNow);
      bal = (bal - need) * (1 + postReturn);
      if (bal < 0) {
        if (depletionAge === null) depletionAge = age + 1;
        bal = 0;
      }
    }
    balances.push(bal);
  }
  if (yearsToRetire <= 0) fundAtRetire = c.currentSavings;
  return { balances, fundAtRetire, depletionAge, endBalance: bal };
}

/** Nest egg needed at retirement: PV of inflation-growing withdrawals (annuity-due). */
function requiredFundAtRetirement(c: PlanInput): number {
  const netMonthlyNeed = Math.max(0, c.monthlyExpense - c.monthlyPension);
  if (netMonthlyNeed === 0) return 0;
  const inflation = r(c.inflationPct);
  const post = r(c.postReturnPct);
  const n = c.endAge - c.retireAge;
  const firstYearNeed = netMonthlyNeed * 12 * Math.pow(1 + inflation, c.retireAge - c.currentAge);
  const x = (1 + inflation) / (1 + post);
  if (Math.abs(1 - x) < 1e-9) return firstYearNeed * n;
  return (firstYearNeed * (1 - Math.pow(x, n))) / (1 - x);
}

/** Smallest monthly saving whose accumulation meets the required fund (binary search). */
function solveRequiredMonthlySaving(c: PlanInput, required: number): number {
  const fundWith = (monthly: number) =>
    runScenario({ ...c, monthlySaving: monthly }, r(c.preReturnPct), r(c.postReturnPct)).fundAtRetire;
  if (fundWith(0) >= required) return 0;
  let lo = 0;
  let hi = 5_000_000;
  if (fundWith(hi) < required) return hi;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (fundWith(mid) >= required) hi = mid;
    else lo = mid;
  }
  return hi;
}

export function buildPlan(raw: PlanInput): PlanResult {
  const c = sanitizePlan(raw);
  const yearBEToday = new Date().getFullYear() + 543;
  const spread = c.spreadPct ?? 2;

  const expected = runScenario(c, r(c.preReturnPct), r(c.postReturnPct));
  const optimistic = runScenario(c, r(c.preReturnPct + spread), r(c.postReturnPct + spread));
  const pessimistic = runScenario(
    c,
    r(Math.max(0, c.preReturnPct - spread)),
    r(Math.max(0, c.postReturnPct - spread))
  );

  const inflation = r(c.inflationPct);
  const netMonthlyNeed = Math.max(0, c.monthlyExpense - c.monthlyPension);
  const timeline: YearPoint[] = expected.balances.map((value, i) => {
    const age = c.currentAge + i;
    const retired = age > c.retireAge;
    return {
      age,
      yearBE: yearBEToday + i,
      expected: value,
      optimistic: optimistic.balances[i],
      pessimistic: pessimistic.balances[i],
      withdrawal: retired ? netMonthlyNeed * 12 * Math.pow(1 + inflation, age - 1 - c.currentAge) : 0,
      phase: age >= c.retireAge ? "retire" : "save"
    };
  });

  const requiredFund = requiredFundAtRetirement(c);
  const projectedFund = expected.fundAtRetire;
  const readinessPct =
    requiredFund <= 0 ? 100 : clamp((projectedFund / requiredFund) * 100, 0, 999);

  return {
    input: c,
    yearsToRetire: c.retireAge - c.currentAge,
    retirementYears: c.endAge - c.retireAge,
    monthlyExpenseAtRetire:
      c.monthlyExpense * Math.pow(1 + inflation, c.retireAge - c.currentAge),
    requiredFund,
    projectedFund,
    gap: projectedFund - requiredFund,
    readinessPct,
    depletionAge: expected.depletionAge,
    endBalance: expected.endBalance,
    requiredMonthlySaving: solveRequiredMonthlySaving(c, requiredFund),
    timeline
  };
}

/* ---------- formatting helpers (Thai locale) ---------- */

const bahtFull = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });

export function formatBaht(v: number): string {
  return `฿${bahtFull.format(Math.round(v))}`;
}

/** Compact Thai units: 12.3 ลบ. / 4.5 แสน / 12,000 */
export function formatBahtCompact(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(abs >= 1e8 ? 0 : 1)} ลบ.`;
  if (abs >= 1e5) return `${sign}${(abs / 1e5).toFixed(1)} แสน`;
  return `${sign}${bahtFull.format(Math.round(abs))}`;
}
