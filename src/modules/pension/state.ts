import { createModuleStore } from "../../lib/moduleStore";
import { newAllocationId, type Allocation } from "../../lib/assets";
import { DEFAULT_PENSION_STATE } from "./presets";
import type { PayoutMethod } from "./types";

export type PensionModuleState = {
  replacementRate: number;
  /** null → derive from net income via PENSION_DEFAULTS.statePensionFactor. */
  expectedStatePension: number | null;
  inflation: number;
  /** Mix of asset buckets the user contributes to during saving. Sums to 100 %. */
  savingsAllocation: Allocation;
  /** Mix during the payout phase — typically more defensive than during saving. */
  payoutAllocation: Allocation;
  payoutMethod: PayoutMethod;
  /** Bis zu welchem Lebensalter die Auszahlphase reichen soll. Default 90. */
  planningAge: number;
  /** Alter, ab dem in die DRV eingezahlt wurde. Default 20 (linear). */
  contributionStartAge: number;
  safeWithdrawalRate: number;
  taxBufferPct: number;
};

/** Default-State (Finanztip-Methodik): siehe `presets.ts`. */
export const PENSION_MODULE_DEFAULTS: PensionModuleState = {
  ...DEFAULT_PENSION_STATE,
  expectedStatePension: null,
};

/**
 * Migrate older persisted states that still carry the legacy single-rate fields
 * (`realReturn` / `payoutRealReturn`). Drops them in favour of the allocation
 * model — the previous rate becomes a single-bucket allocation if neither is
 * present yet.
 */
function migrate(stored: Partial<PensionModuleState> & {
  realReturn?: number;
  payoutRealReturn?: number;
  payoutYears?: number;
}): Partial<PensionModuleState> {
  const cleaned: Partial<PensionModuleState> = { ...stored };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (cleaned as any).realReturn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (cleaned as any).payoutRealReturn;

  if (!stored.savingsAllocation && stored.realReturn !== undefined) {
    cleaned.savingsAllocation = [
      {
        id: newAllocationId(),
        type: "etf-mixed",
        percent: 100,
        realReturnOverride: stored.realReturn,
      },
    ];
  }
  if (!stored.payoutAllocation && stored.payoutRealReturn !== undefined) {
    cleaned.payoutAllocation = [
      {
        id: newAllocationId(),
        type: "etf-mixed",
        percent: 100,
        realReturnOverride: stored.payoutRealReturn,
      },
    ];
  }

  // Legacy: payoutYears wurde durch planningAge ersetzt.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyPayoutYears = (stored as any).payoutYears as number | undefined;
  if (cleaned.planningAge === undefined && legacyPayoutYears !== undefined) {
    // Ohne Profil-Zugriff im Store-Loader: konservativ 67 als Default-Renteneintritt
    // nehmen. Wer das überschreiben will, ändert das Planungsalter im UI.
    cleaned.planningAge = 67 + legacyPayoutYears;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (cleaned as any).payoutYears;

  if (cleaned.contributionStartAge === undefined) {
    cleaned.contributionStartAge = 20;
  }

  return cleaned;
}

export const pensionStore = createModuleStore<PensionModuleState>(
  "pension",
  PENSION_MODULE_DEFAULTS,
  migrate,
);
