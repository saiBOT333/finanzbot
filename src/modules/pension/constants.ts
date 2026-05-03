/**
 * Single source of truth for every magic-number used in the pension module.
 * If you want to "schrauben an Annahmen", this is the file.
 *
 * Grouped by purpose so it stays scannable:
 *   - LEGAL/TAX: gesetzlich oder durch das Finanzamt vorgegebene Sätze
 *   - RULES_OF_THUMB: Faustformeln aus Finanztip / Finanzfluss / Trinity-Studie
 *   - BENCHMARKS: Vergleichswerte (deutscher Schnitt, Empfehlungs-Korridor)
 *   - DEFAULT_INPUTS: Voreinstellungen, die der User in der UI ändern kann
 */

// ──────────────────────────────────────────────────────────────────────────
// LEGAL / TAX
// ──────────────────────────────────────────────────────────────────────────

/** Kapitalertragssteuer inklusive Solidaritätszuschlag (DE 2026). */
export const CAPITAL_GAINS_TAX_RATE = 0.26375;

/** Faustformel-Pauschalabzug auf die Brutto-Rente: 20 % für Steuern + KV/PV. */
export const PENSION_GROSS_TO_NET_DEDUCTION = 0.2;

/** Realistische Bandbreite des Pauschalabzugs (KV+PV ~12 % als Untergrenze, hohe Renten + Nebeneinkünfte bis ~35 %). */
export const PENSION_DEDUCTION_RANGE = { min: 0.12, max: 0.35 } as const;

/** Mittel der DRV-Hochrechnungen 1 % und 2 % — Finanztip-Faustformel. */
export const PENSION_RAISE_DEFAULT = 0.015;

/** Plausible Bandbreite für die jährliche Rentenanpassung. */
export const PENSION_RAISE_RANGE = { min: 0, max: 0.03 } as const;

// ──────────────────────────────────────────────────────────────────────────
// RULES OF THUMB (Quellen: Finanztip / Finanzfluss / Trinity-Studie)
// ──────────────────────────────────────────────────────────────────────────

/** Bedarfsquote: ~80 % des heutigen Netto reichen im Ruhestand. */
export const REPLACEMENT_RATE_DEFAULT = 0.8;

/** Faustformel für die erwartete Netto-Rente: ~48 % vom heutigen Netto-Einkommen. */
export const STATE_PENSION_FACTOR = 0.48;

/** "Sichere Entnahmerate" nach Trinity-Studie. */
export const SAFE_WITHDRAWAL_RATE = 0.035;

/** Faustformel-Puffer für die Kapitalertragssteuer (Mitte von Finanzfluss' 10–15 %). */
export const TAX_BUFFER_DEFAULT = 0.12;

/** Finanztip-Empfehlung: rechne mit 30 Jahren Rentenzeit (≈ 100 Lebensjahre). */
export const PAYOUT_YEARS_DEFAULT = 30;

/** Reguläres Renteneintrittsalter in Deutschland. */
export const RETIREMENT_AGE_DEFAULT = 67;

/** Langfristige Inflations-Annahme (EZB-Ziel). */
export const INFLATION_DEFAULT = 0.02;

/** Reale Rendite Sparphase (Welt-ETF, Finanzfluss-Standard). */
export const REAL_RETURN_SAVING_DEFAULT = 0.05;

/** Reale Rendite Auszahlphase (geringere Aktienquote im Alter, Finanztip-Annahme: niedriger). */
export const REAL_RETURN_PAYOUT_DEFAULT = 0.03;

// ──────────────────────────────────────────────────────────────────────────
// BENCHMARKS (für die Sparquoten-Einordnung im Ergebnis)
// ──────────────────────────────────────────────────────────────────────────

export const SAVINGS_RATE_BENCHMARKS = {
  /** Deutscher Durchschnitt laut Bundesbank / Wirtschaftsweise. */
  germanyAverage: 0.113,
  /** Untergrenze des Empfehlungskorridors für die Altersvorsorge. */
  recommendedMin: 0.15,
  /** Obergrenze des Empfehlungskorridors. */
  recommendedMax: 0.2,
} as const;

