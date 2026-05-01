import { createModuleStore } from "../../lib/moduleStore";
import { STANDARD_PRESET } from "./presets";
import type { PayoutMethod } from "./types";

export type PensionModuleState = {
  replacementRate: number;
  /** null → derive from net income via PENSION_DEFAULTS.statePensionFactor. */
  expectedStatePension: number | null;
  inflation: number;
  realReturn: number;
  payoutRealReturn: number;
  payoutMethod: PayoutMethod;
  payoutYears: number;
  safeWithdrawalRate: number;
  taxBufferPct: number;
};

/** Defaults are coupled to the "Standard" preset to keep them in sync. */
export const PENSION_MODULE_DEFAULTS: PensionModuleState = {
  ...STANDARD_PRESET.state,
  expectedStatePension: null,
};

export const pensionStore = createModuleStore<PensionModuleState>(
  "pension",
  PENSION_MODULE_DEFAULTS,
);
