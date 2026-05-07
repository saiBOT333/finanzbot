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
  payoutYears: number;
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
  return cleaned;
}

export const pensionStore = createModuleStore<PensionModuleState>(
  "pension",
  PENSION_MODULE_DEFAULTS,
  migrate,
);
