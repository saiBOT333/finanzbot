import type { Asset } from "../assets";

/** Cross-module user profile. Modules read/write selected fields. */
export type Profile = {
  age?: number;
  retirementAge?: number;
  netIncomeMonthly?: number;
  /** Existing capital, broken down by bucket so each can grow at its own rate. */
  assets?: Asset[];
  monthlySavingsCapacity?: number;
};

export const EMPTY_PROFILE: Profile = {};
