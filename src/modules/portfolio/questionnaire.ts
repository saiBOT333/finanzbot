import type { FragebogenAntworten, FragebogenSchluessel } from "./types";

export type Antwortoption = {
  label: string;
  punkte: number;
};

export type Frage = {
  key: FragebogenSchluessel;
  title: string;
  options: Antwortoption[];
};

export const QUESTIONS: Frage[] = [
  {
    key: "horizont",
    title: "Wann brauchst du das Geld voraussichtlich?",
    options: [
      { label: "In weniger als 3 Jahren", punkte: 0 },
      { label: "In 3 bis 10 Jahren", punkte: 1 },
      { label: "In 10 bis 20 Jahren", punkte: 2 },
      { label: "In über 20 Jahren", punkte: 3 },
    ],
  },
  {
    key: "schwankung",
    title: "Dein Depot fällt im Crash um 30 %. Was tust du?",
    options: [
      { label: "Verkaufen", punkte: 0 },
      { label: "Nervös beobachten", punkte: 1 },
      { label: "Halten und aussitzen", punkte: 2 },
      { label: "Nachkaufen", punkte: 3 },
    ],
  },
  {
    key: "notgroschen",
    title: "Hast du 3–6 Monatsausgaben separat als Notgroschen?",
    options: [
      { label: "Nein", punkte: 0 },
      { label: "Teilweise", punkte: 1 },
      { label: "Ja, vollständig", punkte: 2 },
    ],
  },
  {
    key: "erfahrung",
    title: "Hast du schon mit Aktien oder ETFs angelegt?",
    options: [
      { label: "Nein, neu für mich", punkte: 0 },
      { label: "Weniger als 2 Jahre", punkte: 1 },
      { label: "Mehr als 2 Jahre", punkte: 2 },
    ],
  },
  {
    key: "einkommen",
    title: "Wie sicher ist dein Einkommen in den nächsten 5 Jahren?",
    options: [
      { label: "Unsicher", punkte: 0 },
      { label: "Mittel sicher", punkte: 1 },
      { label: "Sehr sicher", punkte: 2 },
    ],
  },
];

function score(a: FragebogenAntworten): number {
  return a.horizont + a.schwankung + a.notgroschen + a.erfahrung + a.einkommen;
}

export function recommendEquityPercent(a: FragebogenAntworten): number {
  const s = score(a);
  if (s <= 3) return 20;
  if (s <= 6) return 50;
  if (s <= 9) return 70;
  return 90;
}
