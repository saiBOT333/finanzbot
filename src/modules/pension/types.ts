export type PayoutMethod = "annuity" | "safe-withdrawal";

export type PensionInputs = {
  currentAge: number;
  retirementAge: number;
  netIncomeMonthly: number;
  /** Ratio 0..1 of current net income needed in retirement. */
  replacementRate: number;
  /** Expected statutory net pension per month, in today's purchasing power. */
  expectedStatePension: number;
  /** Annual inflation rate, e.g. 0.02 for 2 %. */
  inflation: number;
  /** Annual real return during the saving phase. */
  realReturn: number;
  /** Annual real return during the payout phase (typically lower — fewer equities). */
  payoutRealReturn: number;
  /**
   * Existing capital earmarked for retirement, broken down by bucket.
   * Each entry grows at its own real rate during the saving phase.
   */
  existingAssets: Array<{ amount: number; realReturn: number }>;
  /** Method used to derive the capital needed at retirement. */
  payoutMethod: PayoutMethod;
  /** For "annuity": years over which the gap is drawn down. */
  payoutYears: number;
  /** For "safe-withdrawal": fraction of capital withdrawn yearly (e.g. 0.035). */
  safeWithdrawalRate: number;
  /** Capital buffer for capital gains tax, e.g. 0.12 → +12 % on the capital. */
  taxBufferPct: number;
};

export type PensionResult =
  | {
      kind: "ok";
      yearsToRetirement: number;
      needToday: number;
      gapToday: number;
      capitalNeededBeforeTax: number;
      taxBufferAmount: number;
      capitalNeeded: number;
      existingFV: number;
      remainingCapital: number;
      monthlySavings: number;
      savingsRatePct: number;
      gapAtRetirementNominal: number;
    }
  | { kind: "no-gap"; needToday: number; expectedStatePension: number }
  | { kind: "already-retired" }
  | { kind: "invalid"; reason: string };
