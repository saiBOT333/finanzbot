export const pensionModule = {
  id: "pension",
  name: "Rentenlücke & Sparrate",
  slug: "rente",
  icon: "🏖️",
  description:
    "Berechne deine Rentenlücke und finde die monatliche Sparrate, mit der du sie schließt.",
} as const;

export type ModuleMeta = typeof pensionModule;
