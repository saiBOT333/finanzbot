# Portfolio- und Rebalancing-Modul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neues `portfolio`-Modul, das die aktuelle Aktienquote eines Nutzers berechnet, mit einer gewünschten Quote vergleicht und eine konkrete Rebalancing-Empfehlung gibt. Inklusive Erweiterung des AssetType-Katalogs um sechs neue Kategorien und ein Risiko-Override pro Position.

**Architecture:** Eigenes Modul unter `src/modules/portfolio/` analog zu `pension`. Liest Bestand aus `profile.assets` (geteilte Quelle), hält Soll-Quote + Fragebogenantworten im modul-lokalen Store (`createModuleStore`). Klassifikation, Aggregation und Rebalancing-Berechnung als reine Funktionen mit Unit-Tests. Wizard mit 3 Schritten (Bestand → Zielquote → Ergebnis).

**Tech Stack:** TypeScript, React 18, Vite, Vitest, Tailwind, Testing Library. Bestehende Bausteine: `Wizard`, `AssetsManager`, `NumberInput`, `lib/profile/useProfile`, `lib/moduleStore`.

**Reference:** [Designdokument](../specs/2026-05-31-portfolio-rebalancing-design.md)

---

## Phase 1 — Asset-Katalog erweitern

### Task 1: AssetType-Union, neue Einträge, Label-Update, RiskClass-Typ

**Files:**
- Modify: `src/lib/assets.ts`

- [ ] **Step 1: AssetType-Union erweitern**

Ersetze den `AssetType`-Union-Typ in `src/lib/assets.ts` (aktuell Zeile 9–15) durch:

```ts
export type AssetType =
  | "cash"
  | "bonds"
  | "bonds-etf"
  | "money-market"
  | "etf-world"
  | "etf-mixed"
  | "stocks"
  | "crypto"
  | "commodities"
  | "real-estate"
  | "company-pension"
  | "other";
```

- [ ] **Step 2: RiskClass-Typ und `riskClassOverride`-Feld einführen**

Direkt unter dem `AssetType`-Block einfügen:

```ts
export type RiskClass = "risky" | "safe" | "excluded";
```

Dann den `Asset`-Typ (aktuell ab Zeile 68) erweitern:

```ts
export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  /** Aktueller Wert in heutigen Euro. */
  amount: number;
  /** Optional: überschreibt den Default-Realwert des Typs. */
  realReturnOverride?: number;
  /** Optional: überschreibt die Default-Risikoklassifikation aus dem AssetType. */
  riskClassOverride?: RiskClass;
};
```

- [ ] **Step 3: `ASSET_TYPES`-Array erweitern und `bonds`-Label anpassen**

Ersetze das gesamte `ASSET_TYPES`-Array durch:

```ts
export const ASSET_TYPES: AssetTypeDef[] = [
  {
    id: "cash",
    label: "Tagesgeld / Sparbuch",
    hint: "Liquide, jederzeit verfügbar, real meist nahe 0 % nach Inflation.",
    defaultRealReturn: 0,
  },
  {
    id: "bonds",
    label: "Festgeld / Termingeld",
    hint: "Festverzinsliche Einlagen mit fester Laufzeit. Real ca. 1 % langfristig.",
    defaultRealReturn: 0.01,
  },
  {
    id: "bonds-etf",
    label: "Anleihen-ETF",
    hint: "Breit gestreute Staats-/Unternehmensanleihen, börsentäglich handelbar. Real ca. 1 %.",
    defaultRealReturn: 0.01,
  },
  {
    id: "money-market",
    label: "Geldmarkt-Fonds",
    hint: "Kurzlaufende Geldmarktpapiere, sehr geringe Schwankung, nahe Leitzins.",
    defaultRealReturn: 0,
  },
  {
    id: "etf-world",
    label: "Welt-ETF (Aktien)",
    hint: "MSCI World / FTSE All-World. Langfristig real ~5 % bei breiter Streuung.",
    defaultRealReturn: 0.05,
  },
  {
    id: "etf-mixed",
    label: "Gemischtes Depot 60/40",
    hint: "60 % Aktien-ETF + 40 % Anleihen. Real ~3 %.",
    defaultRealReturn: 0.03,
  },
  {
    id: "stocks",
    label: "Einzelaktien",
    hint: "Einzelne Aktien statt breitem ETF. Langfristig ähnliche Erwartung wie Welt-ETF, aber höheres Einzelrisiko.",
    defaultRealReturn: 0.05,
  },
  {
    id: "crypto",
    label: "Kryptowährungen",
    hint: "Hochvolatil, keine seriöse Langfristprognose. Default bewusst konservativ.",
    defaultRealReturn: 0,
  },
  {
    id: "commodities",
    label: "Gold / Rohstoffe",
    hint: "Diversifizierer, keine laufenden Erträge. Langfristig real ~1 %, hohe Schwankung.",
    defaultRealReturn: 0.01,
  },
  {
    id: "real-estate",
    label: "Immobilie (ohne Mieteinnahmen)",
    hint: "Reine Wertsteigerung selbstgenutzter Immobilien — real ~2 %.",
    defaultRealReturn: 0.02,
  },
  {
    id: "company-pension",
    label: "bAV / Riester / Rürup",
    hint: "Betriebliche oder geförderte Altersvorsorge. Illiquide, nicht frei umschichtbar.",
    defaultRealReturn: 0.02,
  },
  {
    id: "other",
    label: "Sonstiges",
    hint: "Konservativ angesetzt mit 0 %, anpassbar.",
    defaultRealReturn: 0,
  },
];
```

- [ ] **Step 4: Type-Check ausführen**

Run: `npm run typecheck`
Expected: PASS. Falls Fehler in anderen Dateien wegen erweitertem `AssetType`-Union: erst dort Switch-Cases ergänzen (im Pension-Modul, falls vorhanden — gerade die Allocation-Stellen sind potenziell betroffen).

- [ ] **Step 5: Bestehende Tests laufen lassen**

Run: `npm test`
Expected: alle bestehenden Tests grün. Es ist kein Test-Update nötig, da nur Erweiterungen vorgenommen wurden.

- [ ] **Step 6: Commit**

```bash
git add src/lib/assets.ts
git commit -m "feat(assets): neue AssetTypes und riskClassOverride

Ergänzt bonds-etf, money-market, stocks, crypto, commodities und
company-pension; benennt bonds um zu Festgeld/Termingeld; führt
optionales riskClassOverride pro Asset ein für Grenzfälle wie
Riester-Altersvorsorgedepot oder vermietete Immobilien."
```

---

## Phase 2 — Klassifikation und Aggregation

### Task 2: Modul-Verzeichnis anlegen + `classify.ts` (TDD)

**Files:**
- Create: `src/modules/portfolio/classify.ts`
- Create: `src/modules/portfolio/classify.test.ts`

- [ ] **Step 1: Verzeichnis anlegen**

Run: `mkdir -p src/modules/portfolio/steps`
Expected: erfolgreich. Falls Windows-PowerShell: `New-Item -ItemType Directory -Force src/modules/portfolio/steps`.

- [ ] **Step 2: Failing Tests für `assetSplit` schreiben**

Lege `src/modules/portfolio/classify.test.ts` an:

```ts
import { describe, it, expect } from "vitest";
import { assetSplit, computeBreakdown } from "./classify";
import type { Asset } from "../../lib/assets";

const A = (overrides: Partial<Asset>): Asset => ({
  id: "a",
  name: "Test",
  type: "cash",
  amount: 0,
  ...overrides,
});

describe("assetSplit", () => {
  it("klassifiziert cash als 100 % safe", () => {
    expect(assetSplit(A({ type: "cash" }))).toEqual({ risky: 0, safe: 1, excluded: 0 });
  });

  it("klassifiziert etf-world als 100 % risky", () => {
    expect(assetSplit(A({ type: "etf-world" }))).toEqual({ risky: 1, safe: 0, excluded: 0 });
  });

  it("splittet etf-mixed in 60/40", () => {
    expect(assetSplit(A({ type: "etf-mixed" }))).toEqual({ risky: 0.6, safe: 0.4, excluded: 0 });
  });

  it("klassifiziert real-estate als excluded", () => {
    expect(assetSplit(A({ type: "real-estate" }))).toEqual({ risky: 0, safe: 0, excluded: 1 });
  });

  it("klassifiziert company-pension default als excluded", () => {
    expect(assetSplit(A({ type: "company-pension" }))).toEqual({ risky: 0, safe: 0, excluded: 1 });
  });

  it("respektiert riskClassOverride='risky' für company-pension", () => {
    expect(
      assetSplit(A({ type: "company-pension", riskClassOverride: "risky" })),
    ).toEqual({ risky: 1, safe: 0, excluded: 0 });
  });

  it("respektiert riskClassOverride='safe' für other", () => {
    expect(
      assetSplit(A({ type: "other", riskClassOverride: "safe" })),
    ).toEqual({ risky: 0, safe: 1, excluded: 0 });
  });

  it("respektiert riskClassOverride='excluded' für etf-world", () => {
    expect(
      assetSplit(A({ type: "etf-world", riskClassOverride: "excluded" })),
    ).toEqual({ risky: 0, safe: 0, excluded: 1 });
  });
});
```

- [ ] **Step 3: Tests laufen lassen und Fehlschlag bestätigen**

Run: `npm test -- classify`
Expected: FAIL — "Cannot find module './classify'".

- [ ] **Step 4: `classify.ts` mit `assetSplit` implementieren**

Lege `src/modules/portfolio/classify.ts` an:

```ts
import type { Asset, AssetType } from "../../lib/assets";

export type Split = {
  /** Anteil 0..1, der als riskant gewertet wird. */
  risky: number;
  /** Anteil 0..1, der als Sicherheitsbaustein gewertet wird. */
  safe: number;
  /** Anteil 0..1, der gar nicht in die Quote einfließt. */
  excluded: number;
};

const TYPE_DEFAULT_SPLIT: Record<AssetType, Split> = {
  "cash":            { risky: 0,   safe: 1,   excluded: 0 },
  "bonds":           { risky: 0,   safe: 1,   excluded: 0 },
  "bonds-etf":       { risky: 0,   safe: 1,   excluded: 0 },
  "money-market":    { risky: 0,   safe: 1,   excluded: 0 },
  "etf-world":       { risky: 1,   safe: 0,   excluded: 0 },
  "etf-mixed":       { risky: 0.6, safe: 0.4, excluded: 0 },
  "stocks":          { risky: 1,   safe: 0,   excluded: 0 },
  "crypto":          { risky: 1,   safe: 0,   excluded: 0 },
  "commodities":     { risky: 1,   safe: 0,   excluded: 0 },
  "real-estate":     { risky: 0,   safe: 0,   excluded: 1 },
  "company-pension": { risky: 0,   safe: 0,   excluded: 1 },
  "other":           { risky: 0,   safe: 0,   excluded: 1 },
};

export function assetSplit(asset: Asset): Split {
  if (asset.riskClassOverride) {
    return {
      risky:    asset.riskClassOverride === "risky"    ? 1 : 0,
      safe:     asset.riskClassOverride === "safe"     ? 1 : 0,
      excluded: asset.riskClassOverride === "excluded" ? 1 : 0,
    };
  }
  return TYPE_DEFAULT_SPLIT[asset.type];
}

export type PortfolioBreakdown = {
  riskyEuro: number;
  safeEuro: number;
  excludedEuro: number;
  /** Summe aller drei Töpfe. */
  totalEuro: number;
  /** Bezugsgröße für die Quote: risky + safe. */
  consideredEuro: number;
  /** riskyEuro / consideredEuro * 100, 0 falls considered === 0. */
  currentEquityPercent: number;
};

export function computeBreakdown(assets: readonly Asset[]): PortfolioBreakdown {
  let riskyEuro = 0;
  let safeEuro = 0;
  let excludedEuro = 0;

  for (const asset of assets) {
    const split = assetSplit(asset);
    riskyEuro    += asset.amount * split.risky;
    safeEuro     += asset.amount * split.safe;
    excludedEuro += asset.amount * split.excluded;
  }

  const consideredEuro = riskyEuro + safeEuro;
  const totalEuro = consideredEuro + excludedEuro;
  const currentEquityPercent =
    consideredEuro > 0 ? (riskyEuro / consideredEuro) * 100 : 0;

  return {
    riskyEuro,
    safeEuro,
    excludedEuro,
    totalEuro,
    consideredEuro,
    currentEquityPercent,
  };
}
```

- [ ] **Step 5: Tests laufen lassen, jetzt grün**

Run: `npm test -- classify`
Expected: alle `assetSplit`-Tests PASS.

- [ ] **Step 6: Failing Tests für `computeBreakdown` ergänzen**

Hänge an `src/modules/portfolio/classify.test.ts` an:

```ts
describe("computeBreakdown", () => {
  it("gibt für leeres Portfolio Nullen zurück", () => {
    const b = computeBreakdown([]);
    expect(b).toEqual({
      riskyEuro: 0,
      safeEuro: 0,
      excludedEuro: 0,
      totalEuro: 0,
      consideredEuro: 0,
      currentEquityPercent: 0,
    });
  });

  it("rechnet 50 % etf-world + 50 % cash zu 50 % Aktienquote", () => {
    const b = computeBreakdown([
      A({ id: "1", type: "etf-world", amount: 5000 }),
      A({ id: "2", type: "cash", amount: 5000 }),
    ]);
    expect(b.riskyEuro).toBe(5000);
    expect(b.safeEuro).toBe(5000);
    expect(b.excludedEuro).toBe(0);
    expect(b.consideredEuro).toBe(10000);
    expect(b.currentEquityPercent).toBe(50);
  });

  it("splittet etf-mixed gemäß 60/40", () => {
    const b = computeBreakdown([A({ id: "m", type: "etf-mixed", amount: 10000 })]);
    expect(b.riskyEuro).toBe(6000);
    expect(b.safeEuro).toBe(4000);
    expect(b.currentEquityPercent).toBe(60);
  });

  it("zählt excluded-Assets separat und nicht in der Quote", () => {
    const b = computeBreakdown([
      A({ id: "1", type: "etf-world", amount: 6000 }),
      A({ id: "2", type: "cash", amount: 4000 }),
      A({ id: "3", type: "real-estate", amount: 200000 }),
    ]);
    expect(b.consideredEuro).toBe(10000);
    expect(b.excludedEuro).toBe(200000);
    expect(b.totalEuro).toBe(210000);
    expect(b.currentEquityPercent).toBe(60);
  });

  it("gibt 0 % zurück, wenn nur excluded-Assets vorhanden sind", () => {
    const b = computeBreakdown([
      A({ id: "1", type: "real-estate", amount: 100000 }),
      A({ id: "2", type: "other", amount: 5000 }),
    ]);
    expect(b.consideredEuro).toBe(0);
    expect(b.excludedEuro).toBe(105000);
    expect(b.currentEquityPercent).toBe(0);
  });
});
```

- [ ] **Step 7: Tests laufen lassen — sollten direkt grün sein**

Run: `npm test -- classify`
Expected: alle PASS (die Implementierung in Schritt 4 enthielt `computeBreakdown` bereits).

- [ ] **Step 8: Commit**

```bash
git add src/modules/portfolio/classify.ts src/modules/portfolio/classify.test.ts
git commit -m "feat(portfolio): Klassifikation und Portfolio-Aggregation

assetSplit teilt jeden Asset in risky/safe/excluded, mit Override pro
Position. computeBreakdown aggregiert eine Asset-Liste zu Topfsummen
und Aktienquote (Bezugsgröße: risky + safe)."
```

---

### Task 3: Rebalancing-Logik (TDD)

**Files:**
- Create: `src/modules/portfolio/rebalance.ts`
- Create: `src/modules/portfolio/rebalance.test.ts`

- [ ] **Step 1: Failing Tests schreiben**

Lege `src/modules/portfolio/rebalance.test.ts` an:

```ts
import { describe, it, expect } from "vitest";
import { computeRebalance } from "./rebalance";
import type { PortfolioBreakdown } from "./classify";

const B = (overrides: Partial<PortfolioBreakdown>): PortfolioBreakdown => ({
  riskyEuro: 0,
  safeEuro: 0,
  excludedEuro: 0,
  totalEuro: 0,
  consideredEuro: 0,
  currentEquityPercent: 0,
  ...overrides,
});

describe("computeRebalance", () => {
  it("erkennt zu viel Aktien und schlägt shift-to-safe vor", () => {
    const breakdown = B({
      riskyEuro: 7500,
      safeEuro: 2500,
      consideredEuro: 10000,
      totalEuro: 10000,
      currentEquityPercent: 75,
    });
    const r = computeRebalance(breakdown, 60);
    expect(r.currentEquityPercent).toBe(75);
    expect(r.targetEquityPercent).toBe(60);
    expect(r.deltaPercent).toBe(15);
    expect(r.deltaAmount).toBe(1500);
    expect(r.direction).toBe("shift-to-safe");
  });

  it("erkennt zu wenig Aktien und schlägt shift-to-equity vor", () => {
    const breakdown = B({
      riskyEuro: 3000,
      safeEuro: 7000,
      consideredEuro: 10000,
      totalEuro: 10000,
      currentEquityPercent: 30,
    });
    const r = computeRebalance(breakdown, 60);
    expect(r.deltaPercent).toBe(-30);
    expect(r.deltaAmount).toBe(3000);
    expect(r.direction).toBe("shift-to-equity");
  });

  it("gilt unter 1 Prozentpunkt Abweichung als balanced", () => {
    const breakdown = B({
      riskyEuro: 6050,
      safeEuro: 3950,
      consideredEuro: 10000,
      totalEuro: 10000,
      currentEquityPercent: 60.5,
    });
    const r = computeRebalance(breakdown, 60);
    expect(r.direction).toBe("balanced");
  });

  it("liefert balanced + Nullwerte, wenn consideredEuro 0 ist", () => {
    const breakdown = B({ excludedEuro: 200000, totalEuro: 200000 });
    const r = computeRebalance(breakdown, 60);
    expect(r.deltaAmount).toBe(0);
    expect(r.deltaPercent).toBe(0);
    expect(r.direction).toBe("balanced");
  });

  it("rundet deltaAmount auf ganze Euro", () => {
    const breakdown = B({
      riskyEuro: 7333.33,
      safeEuro: 2666.67,
      consideredEuro: 10000,
      totalEuro: 10000,
      currentEquityPercent: 73.3333,
    });
    const r = computeRebalance(breakdown, 60);
    expect(Number.isInteger(r.deltaAmount)).toBe(true);
  });
});
```

- [ ] **Step 2: Tests laufen lassen und Fehlschlag bestätigen**

Run: `npm test -- rebalance`
Expected: FAIL — "Cannot find module './rebalance'".

- [ ] **Step 3: `rebalance.ts` implementieren**

Lege `src/modules/portfolio/rebalance.ts` an:

```ts
import type { PortfolioBreakdown } from "./classify";

/** Unter diesem Schwellwert (in Prozentpunkten) gilt das Portfolio als balanced. */
export const BALANCED_TOLERANCE_PP = 1;

export type RebalanceDirection = "shift-to-safe" | "shift-to-equity" | "balanced";

export type RebalanceResult = {
  currentEquityPercent: number;
  targetEquityPercent: number;
  /** current - target, in Prozentpunkten. Positiv = zu viel Aktien. */
  deltaPercent: number;
  /** Absoluter Euro-Betrag, der verschoben werden müsste. Auf ganze Euro gerundet. */
  deltaAmount: number;
  direction: RebalanceDirection;
};

export function computeRebalance(
  breakdown: PortfolioBreakdown,
  targetEquityPercent: number,
): RebalanceResult {
  if (breakdown.consideredEuro <= 0) {
    return {
      currentEquityPercent: 0,
      targetEquityPercent,
      deltaPercent: 0,
      deltaAmount: 0,
      direction: "balanced",
    };
  }

  const deltaPercent = breakdown.currentEquityPercent - targetEquityPercent;
  const rawAmount = (deltaPercent / 100) * breakdown.consideredEuro;
  const deltaAmount = Math.round(Math.abs(rawAmount));

  let direction: RebalanceDirection;
  if (Math.abs(deltaPercent) < BALANCED_TOLERANCE_PP) {
    direction = "balanced";
  } else if (deltaPercent > 0) {
    direction = "shift-to-safe";
  } else {
    direction = "shift-to-equity";
  }

  return {
    currentEquityPercent: breakdown.currentEquityPercent,
    targetEquityPercent,
    deltaPercent,
    deltaAmount,
    direction,
  };
}
```

- [ ] **Step 4: Tests laufen lassen, jetzt grün**

Run: `npm test -- rebalance`
Expected: alle PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/portfolio/rebalance.ts src/modules/portfolio/rebalance.test.ts
git commit -m "feat(portfolio): Rebalancing-Empfehlung

computeRebalance vergleicht Ist- und Soll-Aktienquote, liefert
Richtung (shift-to-safe / shift-to-equity / balanced) und den
absoluten Euro-Betrag, der verschoben werden muss. Bagatellgrenze
1 Prozentpunkt."
```

---

### Task 4: Risiko-Fragebogen (TDD)

**Files:**
- Create: `src/modules/portfolio/questionnaire.ts`
- Create: `src/modules/portfolio/questionnaire.test.ts`

- [ ] **Step 1: Failing Tests schreiben**

Lege `src/modules/portfolio/questionnaire.test.ts` an:

```ts
import { describe, it, expect } from "vitest";
import { recommendEquityPercent, QUESTIONS } from "./questionnaire";
import type { FragebogenAntworten } from "./types";

const A = (overrides: Partial<FragebogenAntworten> = {}): FragebogenAntworten => ({
  horizont: 0,
  schwankung: 0,
  notgroschen: 0,
  erfahrung: 0,
  einkommen: 0,
  ...overrides,
});

describe("recommendEquityPercent", () => {
  it("gibt 20 % bei Score 0", () => {
    expect(recommendEquityPercent(A())).toBe(20);
  });

  it("gibt 20 % an der oberen Grenze von Bucket 1 (Score 3)", () => {
    expect(recommendEquityPercent(A({ horizont: 3 }))).toBe(20);
  });

  it("springt bei Score 4 auf 50 %", () => {
    expect(recommendEquityPercent(A({ horizont: 3, schwankung: 1 }))).toBe(50);
  });

  it("gibt 70 % bei Score 7", () => {
    expect(recommendEquityPercent(A({ horizont: 3, schwankung: 3, notgroschen: 1 }))).toBe(70);
  });

  it("gibt 90 % bei maximalem Score 12", () => {
    expect(
      recommendEquityPercent(A({
        horizont: 3, schwankung: 3, notgroschen: 2, erfahrung: 2, einkommen: 2,
      })),
    ).toBe(90);
  });
});

describe("QUESTIONS", () => {
  it("enthält genau 5 Fragen", () => {
    expect(QUESTIONS).toHaveLength(5);
  });

  it("jede Frage hat mindestens 2 Antwortoptionen", () => {
    for (const q of QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});
```

- [ ] **Step 2: Tests laufen lassen und Fehlschlag bestätigen**

Run: `npm test -- questionnaire`
Expected: FAIL — Modul fehlt.

- [ ] **Step 3: `types.ts` für Fragebogen-Antworten anlegen**

Lege `src/modules/portfolio/types.ts` an:

```ts
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
```

- [ ] **Step 4: `questionnaire.ts` implementieren**

Lege `src/modules/portfolio/questionnaire.ts` an:

```ts
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
```

- [ ] **Step 5: Tests laufen lassen, jetzt grün**

Run: `npm test -- questionnaire`
Expected: alle PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/portfolio/types.ts src/modules/portfolio/questionnaire.ts src/modules/portfolio/questionnaire.test.ts
git commit -m "feat(portfolio): Risikofragebogen und Empfehlungs-Mapping

5 Fragen, gewichtete Antworten, Summe 0–12 wird auf 20/50/70/90 %
Aktienquote gemappt."
```

---

## Phase 3 — Modul-Gerüst und Registrierung

### Task 5: Modul-Konfiguration, Store, Index

**Files:**
- Create: `src/modules/portfolio/module.config.ts`
- Create: `src/modules/portfolio/state.ts`
- Create: `src/modules/portfolio/index.ts`

- [ ] **Step 1: `module.config.ts` anlegen**

```ts
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
```

- [ ] **Step 2: `state.ts` mit Store anlegen**

```ts
import { createModuleStore } from "../../lib/moduleStore";
import { PORTFOLIO_DEFAULTS, type PortfolioState } from "./types";

export const portfolioStore = createModuleStore<PortfolioState>(
  "portfolio",
  PORTFOLIO_DEFAULTS,
);
```

- [ ] **Step 3: `index.ts` mit Re-Exports anlegen**

```ts
export { portfolioModule } from "./module.config";
export { PortfolioWizard } from "./PortfolioWizard";
export { portfolioStore } from "./state";
```

- [ ] **Step 4: Type-Check ausführen**

Run: `npm run typecheck`
Expected: FAIL bei `PortfolioWizard` (existiert noch nicht). Das ist okay — wird im nächsten Task angelegt. Falls andere Fehler: beheben.

- [ ] **Step 5: Commit (noch nicht — erst nach Wizard-Skelett, damit Build grün ist)**

Kein Commit in diesem Task; wird mit Task 6 zusammen committed.

---

### Task 6: Wizard-Skelett und Registry-Eintrag

**Files:**
- Create: `src/modules/portfolio/PortfolioWizard.tsx`
- Modify: `src/modules/registry.ts`

- [ ] **Step 1: Wizard-Skelett mit Platzhalter-Steps anlegen**

Lege `src/modules/portfolio/PortfolioWizard.tsx` an:

```tsx
import { Wizard, type WizardStep } from "../../components/Wizard";

export function PortfolioWizard() {
  const steps: WizardStep[] = [
    {
      id: "bestand",
      title: "1. Bestand",
      content: <div>Schritt Bestand — Platzhalter</div>,
      canProceed: true,
    },
    {
      id: "zielquote",
      title: "2. Zielquote",
      content: <div>Schritt Zielquote — Platzhalter</div>,
      canProceed: true,
    },
    {
      id: "ergebnis",
      title: "3. Ergebnis",
      content: <div>Schritt Ergebnis — Platzhalter</div>,
      canProceed: true,
    },
  ];

  return <Wizard steps={steps} />;
}
```

- [ ] **Step 2: Registry-Eintrag ergänzen**

Ersetze den Inhalt von `src/modules/registry.ts` durch:

```ts
import type { ComponentType } from "react";
import { pensionModule, PensionWizard, pensionStore } from "./pension";
import { portfolioModule, PortfolioWizard, portfolioStore } from "./portfolio";
import type { ModuleStore } from "../lib/moduleStore";

export type ModuleEntry = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  Component: ComponentType;
  /** Persistent module-local store, used for export/import. */
  store: ModuleStore<object>;
};

export const modules: ModuleEntry[] = [
  {
    ...pensionModule,
    Component: PensionWizard,
    store: pensionStore as unknown as ModuleStore<object>,
  },
  {
    ...portfolioModule,
    Component: PortfolioWizard,
    store: portfolioStore as unknown as ModuleStore<object>,
  },
];

export function findModule(id: string): ModuleEntry | undefined {
  return modules.find((m) => m.id === id);
}
```

- [ ] **Step 3: Type-Check und Build**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Dev-Server starten und Modul aufrufen**

Run: `npm run dev`
Öffne die App und navigiere zum neuen Modul (sollte über das Hauptmenü erreichbar sein — vermutlich `/portfolio`).
Erwartet: Wizard mit 3 leeren Platzhalter-Schritten, Navigation funktioniert.

Wenn das passt, Dev-Server stoppen.

- [ ] **Step 5: Commit (Phase 3 zusammen)**

```bash
git add src/modules/portfolio/module.config.ts src/modules/portfolio/state.ts src/modules/portfolio/index.ts src/modules/portfolio/PortfolioWizard.tsx src/modules/registry.ts
git commit -m "feat(portfolio): Modul-Skelett mit Wizard und Registry-Eintrag

3-Schritt-Wizard (Bestand, Zielquote, Ergebnis) zunächst mit
Platzhalter-Steps. Modul ist über die Registry sichtbar."
```

---

## Phase 4 — UI-Schritte

### Task 7: AssetsManager um Risiko-Override erweitern

**Files:**
- Modify: `src/components/AssetsManager.tsx`

Hintergrund: Der bestehende `AssetsManager` wird vom Pension-Modul genutzt. Für das Portfolio-Modul brauchen wir die Möglichkeit, pro Asset eine `riskClassOverride` zu setzen. Damit das Pension-Modul unverändert bleibt, fügen wir eine optionale Prop hinzu.

- [ ] **Step 1: Prop `showRiskOverride?: boolean` ergänzen**

Öffne `src/components/AssetsManager.tsx` und ersetze den `Props`-Typ und die Komponenten-Signatur (Zeile 17–22) durch:

```tsx
type Props = {
  assets: readonly Asset[];
  onChange: (next: Asset[]) => void;
  /** Wenn true, wird je Asset ein Dropdown für riskClassOverride angezeigt. */
  showRiskOverride?: boolean;
};

export function AssetsManager({ assets, onChange, showRiskOverride = false }: Props) {
```

- [ ] **Step 2: Risiko-Override-Dropdown im Render-Body ergänzen**

Suche im File die Stelle, an der der Rendite-Override pro Asset gerendert wird (vermutlich ein `<Field>` oder `<Select>` für `realReturnOverride`). Direkt darunter einfügen:

```tsx
{showRiskOverride && (
  <Field label="Risiko-Einstufung">
    <Select
      value={a.riskClassOverride ?? "default"}
      onChange={(v) =>
        update(a.id, {
          riskClassOverride: v === "default" ? undefined : (v as "risky" | "safe" | "excluded"),
        })
      }
    >
      <option value="default">Standard (aus Asset-Typ)</option>
      <option value="risky">Riskant (Aktien)</option>
      <option value="safe">Sicher (Anleihen/Cash)</option>
      <option value="excluded">Außerhalb der Quote</option>
    </Select>
  </Field>
)}
```

Hinweis: Wenn der `Select`-Wrapper das `value`/`onChange`-Pattern abweichend handhabt, an die lokale API anpassen. Schau dir die Verwendung bei `type` an und repliziere sie.

- [ ] **Step 3: Type-Check**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Manuelle Sichtprüfung im Pension-Modul**

Run: `npm run dev`
Öffne das Pension-Modul, gehe zum Assets-Schritt. Das Override-Dropdown darf dort **nicht** sichtbar sein (Default `false`).

Dev-Server stoppen.

- [ ] **Step 5: Commit**

```bash
git add src/components/AssetsManager.tsx
git commit -m "feat(AssetsManager): optionales Risiko-Override-Dropdown

Neue Prop showRiskOverride (default false). Wenn aktiv, kann pro
Asset risky/safe/excluded überschrieben werden. Pension-Modul nutzt
das Feature nicht, bleibt damit unverändert."
```

---

### Task 8: BestandStep

**Files:**
- Create: `src/modules/portfolio/steps/BestandStep.tsx`
- Modify: `src/modules/portfolio/PortfolioWizard.tsx`

- [ ] **Step 1: BestandStep anlegen**

Lege `src/modules/portfolio/steps/BestandStep.tsx` an:

```tsx
import { AssetsManager } from "../../../components/AssetsManager";
import { useProfile } from "../../../lib/profile/useProfile";
import { computeBreakdown } from "../classify";
import { formatEUR } from "../../../lib/format";

export function BestandStep() {
  const profile = useProfile();
  const assets = profile.assets ?? [];
  const breakdown = computeBreakdown(assets);

  return (
    <div className="space-y-4">
      <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
        Erfasse alle Anlagen, die in deine Risiko-Betrachtung einfließen sollen.
        Positionen, die nicht eindeutig in „riskant" oder „sicher" passen
        (z.&nbsp;B. selbstgenutzte Immobilie, bAV/Riester), kannst du pro Asset
        manuell zuordnen.
      </p>

      <AssetsManager
        assets={assets}
        onChange={(next) => profile.update({ assets: next })}
        showRiskOverride
      />

      {breakdown.excludedEuro > 0 && (
        <p className="border border-outline-variant bg-surface-container p-3 font-sans text-[13px] leading-relaxed text-on-surface-variant">
          Hinweis: {formatEUR(breakdown.excludedEuro)} sind als „außerhalb der
          Quote" eingestuft (z.&nbsp;B. Immobilie, bAV). Diese Anlagen werden
          separat ausgewiesen, fließen aber nicht in die Aktien-/Sicher-Quote
          ein.
        </p>
      )}
    </div>
  );
}

export function isBestandComplete(assetCount: number): boolean {
  return assetCount > 0;
}
```

Hinweis: Prüfe in `src/lib/profile/useProfile.ts`, ob die API tatsächlich `profile.update({ assets })` heißt. Falls anders (z. B. `profile.setAssets(...)` oder `update(profile => ...)`): API entsprechend nutzen. Schau dir zum Vergleich an, wie das Pension-Modul die Assets schreibt.

- [ ] **Step 2: PortfolioWizard auf BestandStep umstellen**

In `src/modules/portfolio/PortfolioWizard.tsx`: oben Import ergänzen,

```tsx
import { BestandStep, isBestandComplete } from "./steps/BestandStep";
import { useProfile } from "../../lib/profile/useProfile";
```

und den ersten Step ersetzen:

```tsx
const profile = useProfile();
const assetCount = profile.assets?.length ?? 0;

const steps: WizardStep[] = [
  {
    id: "bestand",
    title: "1. Bestand",
    content: <BestandStep />,
    canProceed: isBestandComplete(assetCount),
    blockReason: isBestandComplete(assetCount)
      ? undefined
      : "Bitte mindestens eine Position eintragen.",
  },
  // ... restliche Steps wie gehabt
];
```

- [ ] **Step 3: Type-Check und Dev-Server**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run dev`. Öffne Portfolio-Modul, lege ein Asset an, klicke das Override-Dropdown durch (risky/safe/excluded/Standard). Beobachte:
- Hinweis-Banner erscheint nur, wenn excluded-Summe > 0.
- Navigation zu Schritt 2 nur möglich, wenn mindestens 1 Asset eingetragen.

Dev-Server stoppen.

- [ ] **Step 4: Commit**

```bash
git add src/modules/portfolio/steps/BestandStep.tsx src/modules/portfolio/PortfolioWizard.tsx
git commit -m "feat(portfolio): BestandStep mit AssetsManager und Override

Liest und schreibt profile.assets. Aktiviert das Risiko-Override-UI.
Zeigt Hinweis-Banner für excluded-Anteile."
```

---

### Task 9: ZielquoteStep mit Slider und Fragebogen-Modal

**Files:**
- Create: `src/modules/portfolio/steps/ZielquoteStep.tsx`
- Create: `src/modules/portfolio/steps/FragebogenModal.tsx`
- Modify: `src/modules/portfolio/PortfolioWizard.tsx`

- [ ] **Step 1: FragebogenModal anlegen**

Lege `src/modules/portfolio/steps/FragebogenModal.tsx` an:

```tsx
import { useState } from "react";
import { QUESTIONS, recommendEquityPercent } from "../questionnaire";
import type { FragebogenAntworten, FragebogenSchluessel } from "../types";
import { Button } from "../../../components/ui/Button";

type Props = {
  initial?: FragebogenAntworten;
  onCancel: () => void;
  onApply: (antworten: FragebogenAntworten, empfehlung: number) => void;
};

const EMPTY: FragebogenAntworten = {
  horizont: 0,
  schwankung: 0,
  notgroschen: 0,
  erfahrung: 0,
  einkommen: 0,
};

export function FragebogenModal({ initial, onCancel, onApply }: Props) {
  const [antworten, setAntworten] = useState<FragebogenAntworten>(initial ?? EMPTY);

  const setAnswer = (key: FragebogenSchluessel, punkte: number) => {
    setAntworten({ ...antworten, [key]: punkte } as FragebogenAntworten);
  };

  const empfehlung = recommendEquityPercent(antworten);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto bg-surface p-6">
        <h2 className="mb-4 font-serif text-xl">Risiko-Fragebogen</h2>

        <ol className="space-y-5">
          {QUESTIONS.map((q) => (
            <li key={q.key}>
              <p className="mb-2 font-sans text-sm font-medium">{q.title}</p>
              <div className="flex flex-col gap-1">
                {q.options.map((o) => (
                  <label key={o.label} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.key}
                      checked={antworten[q.key] === o.punkte}
                      onChange={() => setAnswer(q.key, o.punkte)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 border-t border-outline-variant pt-4">
          <p className="font-sans text-sm">
            Empfohlene Aktienquote: <strong>{empfehlung}&nbsp;%</strong>
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
          <Button onClick={() => onApply(antworten, empfehlung)}>Übernehmen</Button>
        </div>
      </div>
    </div>
  );
}
```

Hinweis: Falls `Button` keine `variant`-Prop hat, ohne Variant verwenden oder die im Projekt übliche Sekundär-Button-API nutzen. Schau bei Bedarf in `src/components/ui/Button.tsx`.

- [ ] **Step 2: ZielquoteStep anlegen**

Lege `src/modules/portfolio/steps/ZielquoteStep.tsx` an:

```tsx
import { useState } from "react";
import { portfolioStore } from "../state";
import { NumberInput } from "../../../components/NumberInput";
import { Button } from "../../../components/ui/Button";
import { FragebogenModal } from "./FragebogenModal";

export function ZielquoteStep() {
  const state = portfolioStore.useState();
  const [showModal, setShowModal] = useState(false);

  const setTarget = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    portfolioStore.set({ targetEquityPercent: clamped });
  };

  return (
    <div className="space-y-4">
      <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
        Wie viel Prozent deines liquiden Vermögens sollen in Aktien stecken?
        Der Rest landet im Sicherheitsbaustein (Cash, Anleihen, Geldmarkt).
      </p>

      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={state.targetEquityPercent}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="flex-1"
          aria-label="Gewünschte Aktienquote"
        />
        <div className="flex items-center gap-1">
          <NumberInput
            value={state.targetEquityPercent}
            onChange={setTarget}
            min={0}
            max={100}
          />
          <span>%</span>
        </div>
      </div>

      <div>
        <Button variant="outline" onClick={() => setShowModal(true)}>
          Quote vorschlagen lassen
        </Button>
        {state.fragebogen && (
          <span className="ml-3 text-xs text-on-surface-variant">
            Vorschlag aus Fragebogen aktiv — Slider übernommen.
          </span>
        )}
      </div>

      {showModal && (
        <FragebogenModal
          initial={state.fragebogen}
          onCancel={() => setShowModal(false)}
          onApply={(antworten, empfehlung) => {
            portfolioStore.set({
              fragebogen: antworten,
              targetEquityPercent: empfehlung,
            });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: PortfolioWizard auf ZielquoteStep umstellen**

In `src/modules/portfolio/PortfolioWizard.tsx`: Import ergänzen und Step 2 ersetzen.

```tsx
import { ZielquoteStep } from "./steps/ZielquoteStep";
```

```tsx
{
  id: "zielquote",
  title: "2. Zielquote",
  content: <ZielquoteStep />,
  canProceed: true,
},
```

- [ ] **Step 4: Type-Check und Dev-Server**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run dev`. Im Portfolio-Modul Schritt 2 aufrufen, Slider bewegen, Modal öffnen, Antworten setzen, Übernehmen klicken. Erwartet: Slider übernimmt den empfohlenen Wert; Hinweis „Vorschlag aus Fragebogen aktiv" erscheint.

Dev-Server stoppen.

- [ ] **Step 5: Commit**

```bash
git add src/modules/portfolio/steps/ZielquoteStep.tsx src/modules/portfolio/steps/FragebogenModal.tsx src/modules/portfolio/PortfolioWizard.tsx
git commit -m "feat(portfolio): ZielquoteStep mit Slider und Fragebogen-Modal

Slider + NumberInput für die manuelle Eingabe. Optionales Modal mit
5 Fragen, dessen Empfehlung den Slider vorbefüllt."
```

---

### Task 10: ErgebnisStep mit Vergleich und Rebalancing-Empfehlung

**Files:**
- Create: `src/modules/portfolio/steps/ErgebnisStep.tsx`
- Modify: `src/modules/portfolio/PortfolioWizard.tsx`

- [ ] **Step 1: ErgebnisStep anlegen**

Lege `src/modules/portfolio/steps/ErgebnisStep.tsx` an:

```tsx
import { useProfile } from "../../../lib/profile/useProfile";
import { portfolioStore } from "../state";
import { computeBreakdown } from "../classify";
import { computeRebalance } from "../rebalance";
import { formatEUR } from "../../../lib/format";

function StackedBar({ riskyPercent }: { riskyPercent: number }) {
  const safePercent = 100 - riskyPercent;
  return (
    <div className="flex h-6 w-full overflow-hidden border border-outline-variant">
      <div
        className="bg-primary"
        style={{ width: `${riskyPercent}%` }}
        aria-label={`Aktien ${riskyPercent.toFixed(0)} %`}
      />
      <div
        className="bg-surface-variant"
        style={{ width: `${safePercent}%` }}
        aria-label={`Sicher ${safePercent.toFixed(0)} %`}
      />
    </div>
  );
}

export function ErgebnisStep() {
  const profile = useProfile();
  const state = portfolioStore.useState();
  const breakdown = computeBreakdown(profile.assets ?? []);
  const rebalance = computeRebalance(breakdown, state.targetEquityPercent);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-serif text-lg">Ist-Aufteilung</h3>
        {breakdown.consideredEuro > 0 ? (
          <>
            <StackedBar riskyPercent={breakdown.currentEquityPercent} />
            <p className="mt-2 font-sans text-sm">
              <strong>{breakdown.currentEquityPercent.toFixed(1)}&nbsp;%</strong> Aktien
              ({formatEUR(breakdown.riskyEuro)}) · {formatEUR(breakdown.safeEuro)} Sicherheitsbaustein
            </p>
          </>
        ) : (
          <p className="font-sans text-sm text-on-surface-variant">
            Keine Anlagen in der Risikobetrachtung. Trage liquide Positionen
            (Cash, Anleihen, ETFs …) in Schritt 1 ein.
          </p>
        )}
        {breakdown.excludedEuro > 0 && (
          <p className="mt-2 text-xs text-on-surface-variant">
            Zusätzlich {formatEUR(breakdown.excludedEuro)} außerhalb der Quote (z.&nbsp;B. Immobilie, bAV).
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-serif text-lg">Ziel-Aufteilung</h3>
        <StackedBar riskyPercent={state.targetEquityPercent} />
        <p className="mt-2 font-sans text-sm">
          <strong>{state.targetEquityPercent}&nbsp;%</strong> Aktien · {100 - state.targetEquityPercent}&nbsp;% sicher
        </p>
      </section>

      <section className="border border-outline-variant bg-surface-container p-4">
        <h3 className="mb-2 font-serif text-lg">Rebalancing-Empfehlung</h3>
        {rebalance.direction === "balanced" && breakdown.consideredEuro > 0 && (
          <p className="font-sans text-sm">
            Dein Portfolio liegt im Zielkorridor (Abweichung unter 1&nbsp;Prozentpunkt). Nichts zu tun.
          </p>
        )}
        {rebalance.direction === "balanced" && breakdown.consideredEuro === 0 && (
          <p className="font-sans text-sm">
            Noch keine Empfehlung möglich — trag in Schritt 1 mindestens eine
            liquide Anlage ein.
          </p>
        )}
        {rebalance.direction === "shift-to-safe" && (
          <p className="font-sans text-sm">
            Du liegst <strong>{Math.abs(rebalance.deltaPercent).toFixed(1)}&nbsp;Pp</strong>{" "}
            über deinem Ziel. Verschiebe ca. <strong>{formatEUR(rebalance.deltaAmount)}</strong>{" "}
            aus Aktien in den Sicherheitsbaustein (Cash, Anleihen, Geldmarkt).
          </p>
        )}
        {rebalance.direction === "shift-to-equity" && (
          <p className="font-sans text-sm">
            Du liegst <strong>{Math.abs(rebalance.deltaPercent).toFixed(1)}&nbsp;Pp</strong>{" "}
            unter deinem Ziel. Verschiebe ca. <strong>{formatEUR(rebalance.deltaAmount)}</strong>{" "}
            in Aktien (z.&nbsp;B. Welt-ETF).
          </p>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: PortfolioWizard auf ErgebnisStep umstellen**

In `src/modules/portfolio/PortfolioWizard.tsx`: Import ergänzen und Step 3 ersetzen.

```tsx
import { ErgebnisStep } from "./steps/ErgebnisStep";
```

```tsx
{
  id: "ergebnis",
  title: "3. Ergebnis",
  content: <ErgebnisStep />,
  canProceed: true,
},
```

- [ ] **Step 3: Type-Check und Build**

Run: `npm run typecheck && npm run build`
Expected: beide PASS.

- [ ] **Step 4: Manuelle End-to-End-Verifikation**

Run: `npm run dev`. Im Portfolio-Modul:
1. Schritt 1: Trag 5.000 € `etf-world` und 5.000 € `cash` ein. → Ist-Quote sollte später 50 % zeigen.
2. Schritt 2: Setze Slider auf 70 %.
3. Schritt 3:
   - Ist-Balken zeigt 50 % Aktien.
   - Ziel-Balken zeigt 70 % Aktien.
   - Empfehlung: „Verschiebe ca. 2.000 € in Aktien." (20 Pp von 10.000 € = 2.000 €).
4. Zurück in Schritt 1, ergänze 200.000 € `real-estate`. → Hinweis: 200.000 € außerhalb der Quote. Quote bleibt 50 %.
5. In Schritt 1: setze `riskClassOverride` der `etf-world`-Position auf `excluded`. → Ist-Quote in Schritt 3 sollte 0 % zeigen, Empfehlung „Verschiebe ca. 7.000 € in Aktien" (70 % von 10.000 € — Cash bleibt considered).

Dev-Server stoppen.

- [ ] **Step 5: Alle Tests durchlaufen lassen**

Run: `npm test`
Expected: alle PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/portfolio/steps/ErgebnisStep.tsx src/modules/portfolio/PortfolioWizard.tsx
git commit -m "feat(portfolio): ErgebnisStep mit Ist/Soll-Vergleich

Stacked-Bar-Visualisierung für Ist und Soll, getrennte Anzeige des
excluded-Anteils, drei Empfehlungstexte (balanced, shift-to-safe,
shift-to-equity)."
```

---

## Phase 5 — Abschluss

### Task 11: Akzeptanzkriterien-Checkliste durchgehen

- [ ] **Step 1: AssetTypes vollständig**

Run: `npm test`
Expected: alle PASS. Insbesondere `classify.test.ts` deckt alle 12 AssetTypes und das Override-Verhalten ab.

- [ ] **Step 2: Modul in der Registry sichtbar**

Run: `npm run dev`. Hauptmenü zeigt „Portfolio & Rebalancing".

- [ ] **Step 3: Testportfolio 50/50 → 50 % Aktienquote**

Manuell im Wizard verifizieren (siehe Task 10 Step 4 #1).

- [ ] **Step 4: Ziel-Quote 70 % bei 50/50-Portfolio → shift-to-equity, 2.000 €**

Manuell verifizieren (siehe Task 10 Step 4 #2-3).

- [ ] **Step 5: Fragebogen-Maximum → 90 %**

Manuell verifizieren: alle Fragen mit der höchsten Punktzahl beantworten, Modal-Empfehlung sollte 90 % zeigen.

- [ ] **Step 6: company-pension mit Override `risky` zählt mit**

Manuell verifizieren: Asset `company-pension` mit 10.000 € hinzufügen, Override auf `risky` setzen, Schritt 3: Aktienquote sollte sich entsprechend verschieben.

- [ ] **Step 7: Lint laufen lassen**

Run: `npm run lint`
Expected: keine neuen Fehler. Falls Warnings: prüfen und ggf. fixen.

- [ ] **Step 8: Final-Commit (falls Fixes nötig waren)**

Falls in Steps 1–7 Anpassungen nötig waren, diese committen mit:
```bash
git commit -m "chore(portfolio): kleine Korrekturen nach Akzeptanztests"
```

Andernfalls kein zusätzlicher Commit.

---

## Notes für den Implementierer

- **TDD strikt:** Bei den Berechnungs-Tasks (2, 3, 4) erst die Tests schreiben, fallen lassen, dann implementieren.
- **Nicht „aufräumen":** Pension-Modul und globale Komponenten nur dort anfassen, wo dieser Plan es explizit verlangt (Task 7).
- **Profile-API überprüfen:** Vor Task 8 unbedingt einmal in `src/lib/profile/useProfile.ts` schauen, wie das Setzen von `assets` aussieht — der Plan setzt einen generischen `update({ assets })`-Aufruf voraus, die echte API kann minimal abweichen.
- **AssetsManager-Form-Pattern:** Wie die Form-Felder im AssetsManager genau aussehen (Select, Field, Layout), entscheidet das vorhandene Markup. Bei Task 7 Schritt 2 das bestehende Pattern für `realReturnOverride` direkt darüber als Vorlage nehmen.
- **Commits:** Häufig committen, Commit-Messages auf Deutsch (passt zur bisherigen Repo-Konvention).
