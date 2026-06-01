# Portfolio- und Rebalancing-Modul — Designdokument

Datum: 2026-05-31
Status: Entwurf zur Implementierung

## Ziel

Ein neues Modul ergänzt den FinanzBot um eine Sicht auf die **aktuelle Aktienquote** des Nutzers (basierend auf seinen eingetragenen Anlagen) und vergleicht diese mit einer **gewünschten Aktienquote**. Daraus wird eine konkrete, aggregierte **Rebalancing-Empfehlung** abgeleitet.

Risikomodell ist bewusst das einfache Finanztip-/Finanzfluss-Modell: **Aktien (riskant) vs. Sicherheitsbaustein (Cash + Anleihen)**. Illiquide oder strukturell andere Anlageformen werden separat ausgewiesen, fließen aber nicht in die Quote ein.

## Teil A — Erweiterung von `src/lib/assets.ts`

### Neue und geänderte AssetTypes

Insgesamt 12 AssetTypes (6 bestehende, 1 umgelabelt, 6 neu).

| ID | Label | Hinweis | Default-Realrendite | Default-Risikoklasse |
|---|---|---|---|---|
| `cash` | Tagesgeld / Sparbuch | Liquide, jederzeit verfügbar, real meist nahe 0 % nach Inflation. | 0 % | safe |
| `bonds` | **Festgeld / Termingeld** *(Label angepasst)* | Festverzinsliche Einlagen mit fester Laufzeit. | 1 % | safe |
| `bonds-etf` | Anleihen-ETF | Breit gestreute Staats-/Unternehmensanleihen, börsentäglich handelbar. | 1 % | safe |
| `money-market` | Geldmarkt-Fonds | Kurzlaufende Geldmarktpapiere, sehr geringe Schwankung, nahe Leitzins. | 0 % | safe |
| `etf-world` | Welt-ETF (Aktien) | MSCI World / FTSE All-World. Langfristig real ~5 % bei breiter Streuung. | 5 % | risky |
| `etf-mixed` | Gemischtes Depot 60/40 | 60 % Aktien-ETF + 40 % Anleihen. Real ~3 %. | 3 % | 60 % risky / 40 % safe |
| `stocks` | Einzelaktien | Einzelne Aktien statt breitem ETF. Langfristig ähnliche Erwartung wie Welt-ETF, aber höheres Einzelrisiko. | 5 % | risky |
| `crypto` | Kryptowährungen | Hochvolatil, keine seriöse Langfristprognose. Default bewusst konservativ. | 0 % | risky |
| `commodities` | Gold / Rohstoffe | Diversifizierer, keine laufenden Erträge. Langfristig real ~1 %, hohe Schwankung. | 1 % | risky |
| `real-estate` | Immobilie (ohne Mieteinnahmen) | Reine Wertsteigerung selbstgenutzter Immobilien — real ~2 %. | 2 % | excluded |
| `company-pension` | bAV / Riester / Rürup | Betriebliche oder geförderte Altersvorsorge. Illiquide, nicht frei umschichtbar. Default-Klassifikation passt zu klassischen Versicherungsformen — Altersvorsorgedepot/Pensionsfonds per Override anpassbar. | 2 % | excluded |
| `other` | Sonstiges | Konservativ angesetzt mit 0 %, anpassbar. | 0 % | excluded |

**Hinweis zur Migration:** `bonds` behält die ID; nur das Label ändert sich. Bestehende Speicherstände bleiben kompatibel.

### Neues Risiko-Override-Feld

```ts
export type RiskClass = "risky" | "safe" | "excluded";

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  amount: number;
  realReturnOverride?: number;
  riskClassOverride?: RiskClass;   // NEU
};
```

Begründung: Insbesondere `company-pension` ist intern heterogen (Versicherung vs. Altersvorsorgedepot vs. Pensionsfonds). Statt die Kategorie aufzusplitten, deckt ein optionales Override alle Grenzfälle ab (auch z. B. vermietete Immobilie als sicher, oder bewusst risky markiertes „Sonstiges").

Die effektive Risikoklasse eines Assets ist:
- `asset.riskClassOverride`, falls gesetzt
- sonst die Default-Klasse aus dem AssetType (für `etf-mixed`: Split-Behandlung, siehe unten)

### Aktualisierte Default-Renditen

Keine Änderung an bestehenden Default-Renditen. Neue Typen wie oben.

## Teil B — Neues Modul `portfolio`

### Modul-Struktur

Analog zu `pension`, registriert in `src/modules/registry.ts`.

```
src/modules/portfolio/
  module.config.ts        # id "portfolio", name, icon, slug
  index.ts                # Re-Exports
  PortfolioWizard.tsx     # 3-Schritt-Wizard
  state.ts                # Zustand-Store (modul-lokal)
  types.ts                # PortfolioState, FragebogenAntworten
  classify.ts             # Asset → RiskClass-Split, Portfolio-Aggregation
  rebalance.ts            # Soll/Ist-Vergleich, Rebalancing-Empfehlung
  questionnaire.ts        # Fragenkatalog + Score→Quote-Mapping
  steps/
    BestandStep.tsx       # Liste der Assets aus profile.assets
    ZielquoteStep.tsx     # Slider + „Vorschlag berechnen"-Modal
    ErgebnisStep.tsx      # Donut Ist vs Soll + Empfehlung
  classify.test.ts
  rebalance.test.ts
  questionnaire.test.ts
```

### Datenfluss

- **Bestand** kommt aus `profile.assets` (geteilt mit Pension-Modul). Das Modul liest, schreibt aber nur über die bestehenden Profile-APIs (`useProfile`).
- **Soll-Quote und Fragebogen-Antworten** leben im modul-lokalen Store.

### Modul-Zustand

```ts
// types.ts
export type FragebogenAntworten = {
  horizont: 0 | 1 | 2 | 3;
  schwankung: 0 | 1 | 2 | 3;
  notgroschen: 0 | 1 | 2;
  erfahrung: 0 | 1 | 2;
  einkommen: 0 | 1 | 2;
};

export type PortfolioState = {
  targetEquityPercent: number;            // 0..100, default 60
  fragebogen?: FragebogenAntworten;       // optional, Snapshot der letzten Beantwortung
  currentStep: number;                    // Wizard-Step
};
```

### Risiko-Klassifikation (`classify.ts`)

```ts
type Split = { risky: number; safe: number; excluded: number };   // Anteile 0..1, summe = 1

// Default-Split pro AssetType (override durch riskClassOverride)
const TYPE_DEFAULT_SPLIT: Record<AssetType, Split> = {
  cash:            { risky: 0,   safe: 1,   excluded: 0 },
  bonds:           { risky: 0,   safe: 1,   excluded: 0 },
  "bonds-etf":     { risky: 0,   safe: 1,   excluded: 0 },
  "money-market":  { risky: 0,   safe: 1,   excluded: 0 },
  "etf-world":     { risky: 1,   safe: 0,   excluded: 0 },
  "etf-mixed":     { risky: 0.6, safe: 0.4, excluded: 0 },
  stocks:          { risky: 1,   safe: 0,   excluded: 0 },
  crypto:          { risky: 1,   safe: 0,   excluded: 0 },
  commodities:     { risky: 1,   safe: 0,   excluded: 0 },
  "real-estate":   { risky: 0,   safe: 0,   excluded: 1 },
  "company-pension": { risky: 0, safe: 0,   excluded: 1 },
  other:           { risky: 0,   safe: 0,   excluded: 1 },
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
  totalEuro: number;        // Summe aller drei
  consideredEuro: number;   // risky + safe (Basis der Quote)
  currentEquityPercent: number; // riskyEuro / consideredEuro * 100, 0 falls considered=0
};

export function computeBreakdown(assets: readonly Asset[]): PortfolioBreakdown;
```

### Rebalancing-Logik (`rebalance.ts`)

```ts
export type RebalanceResult = {
  currentEquityPercent: number;
  targetEquityPercent: number;
  deltaPercent: number;        // current - target (positiv = zu viel Aktien)
  deltaAmount: number;         // absoluter € Betrag, der verschoben werden müsste
  direction: "shift-to-safe" | "shift-to-equity" | "balanced";
  // balanced: |deltaPercent| < 1 (Bagatellgrenze)
};

export function computeRebalance(
  breakdown: PortfolioBreakdown,
  targetEquityPercent: number,
): RebalanceResult;
```

Berechnung: `deltaAmount = (currentEquityPercent - targetEquityPercent) / 100 * consideredEuro`.

Edge Cases:
- `consideredEuro === 0` (nur excluded oder leer): `direction = "balanced"`, alle Deltas 0, UI zeigt Hinweis statt Empfehlung.
- Bagatellgrenze 1 Prozentpunkt — darunter `direction = "balanced"`.

### Fragebogen (`questionnaire.ts`)

5 Fragen mit gewichteten Antworten (siehe `FragebogenAntworten`). Maximale Summe: 3+3+2+2+2 = 12 Punkte.

Score → empfohlene Aktienquote:
- 0–3 Pkt: 20 %
- 4–6 Pkt: 50 %
- 7–9 Pkt: 70 %
- 10–12 Pkt: 90 %

Fragenkatalog (final):

1. **Anlagehorizont** — Wann brauchst du das Geld voraussichtlich?
   `<3 Jahre (0) / 3–10 J. (1) / 10–20 J. (2) / >20 J. (3)`
2. **Schwankungstoleranz** — Dein Depot fällt im Crash um 30 %. Was tust du?
   `Verkaufen (0) / Beobachten (1) / Halten (2) / Nachkaufen (3)`
3. **Notgroschen** — Hast du 3–6 Monatsausgaben separat als Cash?
   `Nein (0) / Teilweise (1) / Ja (2)`
4. **Erfahrung** — Hast du schon mit Aktien/ETFs angelegt?
   `Nein (0) / <2 J. (1) / >2 J. (2)`
5. **Einkommensstabilität** — Wie sicher ist dein Einkommen die nächsten 5 Jahre?
   `Unsicher (0) / Mittel (1) / Sehr sicher (2)`

```ts
export function recommendEquityPercent(a: FragebogenAntworten): number;
```

### Wizard-Schritte

**1. Bestand (`BestandStep.tsx`)**
- Liste der Assets aus `profile.assets` mit Spalten Name, Typ, Betrag, kleinem Risiko-Badge (risky/safe/excluded).
- „+ Asset"-Button (öffnet das gleiche Eingabe-UI, das auch das Pension-Modul nutzt — falls so existiert; sonst eigener kleiner Editor).
- Optionales Aufklapp-Dropdown pro Asset für `riskClassOverride`, mit Erklärungstext.
- Hinweis-Banner, dass `excluded`-Assets nicht in die Quote einfließen.

**2. Zielquote (`ZielquoteStep.tsx`)**
- Großer Slider 0–100 % Aktien, danebenstehende numerische Eingabe.
- Button „Quote vorschlagen lassen" → Modal mit 5 Fragen → bei „Übernehmen" wird Slider auf empfohlene Quote gesetzt, Antworten in `state.fragebogen` gespeichert.
- Nutzer kann nach Vorschlag manuell nachjustieren.

**3. Ergebnis (`ErgebnisStep.tsx`)**
- Donut oder Stacked-Bar: Ist-Aufteilung risky/safe (excluded separat ausgewiesen).
- Direktvergleich Ist vs. Soll als zwei Balken.
- Rebalancing-Karte:
  - `balanced`: „Dein Portfolio liegt im Zielkorridor (Abweichung < 1 %)."
  - `shift-to-safe`: „Du liegst X Pp über deinem Ziel. Verschiebe ca. **Y €** aus Aktien in den Sicherheitsbaustein."
  - `shift-to-equity`: spiegelbildlich.
- Footnote-Hinweis auf `excludedEuro`, falls > 0.

## Tests

Jede Berechnungseinheit bekommt Unit-Tests:

- **`classify.test.ts`**: Default-Split pro AssetType, Override-Verhalten, `etf-mixed`-Aufteilung, leeres Portfolio, nur-excluded-Portfolio.
- **`rebalance.test.ts`**: Quote-Berechnung, positives/negatives Delta, Bagatellgrenze, Division-by-zero bei `consideredEuro === 0`.
- **`questionnaire.test.ts`**: Mapping aller Score-Grenzen (0, 3, 4, 6, 7, 9, 10, 12), Reaktion auf jede einzelne Frage.
- **Bestehende `format.test.ts`/`finance.test.ts`** bleiben unberührt.

Smoke-Test für den Wizard ist nice-to-have, aber kein Muss für das MVP dieses Moduls.

## Registrierung

`src/modules/registry.ts` bekommt einen zweiten Eintrag analog zum Pension-Modul. `module.config.ts` setzt `id: "portfolio"`, `slug: "portfolio"`, einen passenden Icon-String und eine Kurzbeschreibung.

## Bewusst NICHT enthalten (YAGNI)

- Steuer- oder Kostenberechnung beim Umschichten.
- Historische Risikokennzahlen (Volatilität, Sharpe-Ratio, Max Drawdown).
- Pro-Position-Empfehlung („verkaufe genau diese Position").
- Mehrfach-Portfolios / Konten-Trennung.
- Automatisches Rebalancing über Zeitachse oder Sparpläne — das wäre Folge-Arbeit, nicht Bestandteil dieses Moduls.

## Akzeptanzkriterien

1. Alle 12 AssetTypes sind in `assets.ts` definiert; `bonds` ist umgelabelt; `riskClassOverride` ist auf `Asset` verfügbar.
2. Das `portfolio`-Modul ist in der Registry sichtbar und im Hauptmenü erreichbar.
3. Bei einem Test-Portfolio aus 50 % `etf-world` und 50 % `cash` zeigt das Modul `currentEquityPercent = 50`.
4. Setze Ziel-Quote auf 70 % → `direction = "shift-to-equity"`, `deltaAmount` korrekt berechnet.
5. Fragebogen mit allen Antworten auf Maximum gibt 90 % empfohlene Aktienquote zurück.
6. Ein Asset vom Typ `company-pension` mit `riskClassOverride: "risky"` wird in der Aktien-Quote mitgezählt.
7. Alle neuen Unit-Tests laufen grün.
