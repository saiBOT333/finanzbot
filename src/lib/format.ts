const eurFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurFormatterPrecise = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("de-DE", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 0,
});

export function formatEUR(value: number, precise = false): string {
  if (!Number.isFinite(value)) return "—";
  return precise ? eurFormatterPrecise.format(value) : eurFormatter.format(value);
}

export function formatPercent(fraction: number): string {
  if (!Number.isFinite(fraction)) return "—";
  return percentFormatter.format(fraction);
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return numberFormatter.format(value);
}

export function parseLocalNumber(input: string): number | null {
  const cleaned = input.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "");
  const normalized = cleaned.replace(",", ".");
  if (!normalized || normalized === "-" || normalized === ".") return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
