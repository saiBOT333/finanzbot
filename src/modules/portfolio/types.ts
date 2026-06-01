export type FragebogenAntworten = {
  horizont: 0 | 1 | 2 | 3;
  schwankung: 0 | 1 | 2 | 3;
  notgroschen: 0 | 1 | 2;
  erfahrung: 0 | 1 | 2;
  einkommen: 0 | 1 | 2;
};

export type FragebogenSchluessel = keyof FragebogenAntworten;

export type PortfolioState = {
  /** 0..100 — gewünschte Aktienquote. */
  targetEquityPercent: number;
  /** Snapshot der letzten Fragebogen-Beantwortung. Undefined = noch nicht beantwortet. */
  fragebogen?: FragebogenAntworten;
  /** Aktueller Schritt im Wizard (0-indexed). */
  currentStep: number;
};

export const PORTFOLIO_DEFAULTS: PortfolioState = {
  targetEquityPercent: 60,
  currentStep: 0,
};
