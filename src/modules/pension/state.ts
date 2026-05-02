import { createModuleStore } from "../../lib/moduleStore";
import { DEFAULT_PRESET } from "./presets";
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

/** Defaults are coupled to the conservative preset (Finanztip-Methode). */
export const PENSION_MODULE_DEFAULTS: PensionModuleState = {
  ...DEFAULT_PRESET.state,
  expectedStatePension: null,
};

export const pensionStore = createModuleStore<PensionModuleState>(
  "pension",
  PENSION_MODULE_DEFAULTS,
);
