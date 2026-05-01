/**
 * Financial helpers (rate is per period — match the period of `n`).
 * Shared across modules; keep pure and side-effect-free.
 */

export function compound(value: number, rate: number, n: number): number {
  return value * Math.pow(1 + rate, n);
}

export function presentValueAnnuity(payment: number, rate: number, n: number): number {
  if (n <= 0) return 0;
  if (rate === 0) return payment * n;
  return (payment * (1 - Math.pow(1 + rate, -n))) / rate;
}

export function futureValueAnnuity(payment: number, rate: number, n: number): number {
  if (n <= 0) return 0;
  if (rate === 0) return payment * n;
  return (payment * (Math.pow(1 + rate, n) - 1)) / rate;
}

export function paymentForFutureValue(
  futureValue: number,
  rate: number,
  n: number,
): number {
  if (n <= 0) return Number.POSITIVE_INFINITY;
  if (rate === 0) return futureValue / n;
  return futureValue / ((Math.pow(1 + rate, n) - 1) / rate);
}

export function annualToMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

export function monthlyToAnnualRate(monthlyRate: number): number {
  return Math.pow(1 + monthlyRate, 12) - 1;
}
