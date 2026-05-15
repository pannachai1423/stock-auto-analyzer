export function formatCurrency(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value > 100 ? 2 : 3
  }).format(value);
}

export function formatNumber(value: number | null | undefined, decimals = 0) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals }).format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatTime(iso: string | undefined) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(iso));
}

export function toneClass(value: number | null | undefined) {
  if (value === null || value === undefined) return "text-slate-300";
  return value >= 0 ? "text-lime" : "text-danger";
}
