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
  /** Per-bucket weights and real returns during the saving phase. Weights sum to 1. */
  savingsBuckets: Array<{ weight: number; rate: number }>;
  /** Per-bucket weights and real returns during the payout phase. Weights sum to 1. */
  payoutBuckets: Array<{ weight: number; rate: number }>;
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
      /** Fixed nominal monthly savings — constant in nominal euros, no annual inflation adjustment needed. */
      fixedNominalSavings: number;
      savingsRatePct: number;
      gapAtRetirementNominal: number;
      /** Weighted average real return during saving (for display). */
      effectiveSavingReturn: number;
      /** Weighted average real return during payout (for display). */
      effectivePayoutReturn: number;
    }
  | { kind: "no-gap"; needToday: number; expectedStatePension: number }
  | { kind: "already-retired" }
  | { kind: "invalid"; reason: string };
