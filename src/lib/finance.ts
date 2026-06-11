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

/**
 * Present value of an annuity whose payment grows at `growth` per period
 * (first payment = `payment`, paid in arrears). With growth = 0 this is
 * exactly `presentValueAnnuity`. Negative growth models a shrinking payment.
 */
export function presentValueGrowingAnnuity(
  payment: number,
  rate: number,
  growth: number,
  n: number,
): number {
  if (n <= 0) return 0;
  if (rate === growth) return (payment * n) / (1 + rate);
  return (payment * (1 - Math.pow((1 + growth) / (1 + rate), n))) / (rate - growth);
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

/**
 * One bucket of a weighted projection: a fraction (0..1) of the cash flow
 * grows or is drawn down at its own rate.
 */
export type WeightedBucket = { weight: number; rate: number };

/**
 * Weighted future value of a savings annuity that is split across buckets.
 * Each bucket compounds at its own rate. Bucket weights are normalised to
 * sum to 1, so callers may pass raw shares (e.g. 60/40) without pre-scaling.
 */
export function weightedFutureValueAnnuity(
  payment: number,
  buckets: WeightedBucket[],
  n: number,
): number {
  const totalWeight = buckets.reduce((s, b) => s + b.weight, 0);
  if (totalWeight === 0) return 0;
  return buckets.reduce(
    (sum, b) => sum + (b.weight / totalWeight) * futureValueAnnuity(payment, b.rate, n),
    0,
  );
}

/**
 * Weighted present value of a payout annuity drawn from buckets that yield
 * different rates. Used to size the capital needed at retirement when the
 * portfolio mix is non-uniform. Bucket weights are normalised to sum to 1.
 */
export function weightedPresentValueAnnuity(
  payment: number,
  buckets: WeightedBucket[],
  n: number,
): number {
  const totalWeight = buckets.reduce((s, b) => s + b.weight, 0);
  if (totalWeight === 0) return 0;
  return buckets.reduce(
    (sum, b) => sum + (b.weight / totalWeight) * presentValueAnnuity(payment, b.rate, n),
    0,
  );
}

/**
 * Weighted equivalent FV-Annuity factor (independent of the payment).
 * Use to derive the required monthly payment for a target FV:
 *   payment = targetFV / weightedAnnuityFactor(buckets, n)
 */
export function weightedFutureValueAnnuityFactor(
  buckets: WeightedBucket[],
  n: number,
): number {
  return weightedFutureValueAnnuity(1, buckets, n);
}
