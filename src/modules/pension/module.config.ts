export const pensionModule = {
  id: "pension",
  name: "Rentenlücke & Sparrate",
  slug: "rente",
  /** Material Symbol-Name (Rounded-Familie). Siehe https://fonts.google.com/icons */
  icon: "savings",
  description:
    "Berechne deine Rentenlücke und finde die monatliche Sparrate, mit der du sie schließt.",
} as const;

export type ModuleMeta = typeof pensionModule;
