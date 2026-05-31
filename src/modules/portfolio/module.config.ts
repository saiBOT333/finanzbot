export const portfolioModule = {
  id: "portfolio",
  name: "Portfolio & Rebalancing",
  slug: "portfolio",
  /** Material Symbol-Name (Rounded). */
  icon: "donut_large",
  description:
    "Sieh deine aktuelle Aktienquote, definiere deine Wunsch-Aufteilung und finde heraus, ob du umschichten solltest.",
} as const;

export type PortfolioModuleMeta = typeof portfolioModule;
