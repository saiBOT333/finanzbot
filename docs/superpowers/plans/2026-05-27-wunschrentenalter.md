# Wunschrentenalter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Wunschrentenalter beeinflusst Renteninfo (Abschläge + Beitragsjahre) und Bezugsdauer (über ein Planungsalter) sauber und nachvollziehbar.

**Architektur:** Drei reine Funktionen in `defaults.ts` (testbar, kein UI), Store-Schema-Migration (`payoutYears` → `planningAge`, neu `contributionStartAge`), Mapping-Anpassung in `ResultStep.tsx`, zwei UI-Schritte (PensionInformationStep mit Korrektur-Pipeline, AssumptionsStep mit Planungsalter). Die `PensionInputs`-Schnittstelle und `calculations.ts` bleiben unverändert — `payoutYears` wird einen Layer höher abgeleitet.

**Tech Stack:** React + TypeScript, Vitest, Vite, Tailwind/Material You.

---

## File Structure

| Datei | Rolle | Aktion |
|---|---|---|
| `src/modules/pension/constants.ts` | Zentrale Magic-Numbers | modifizieren |
| `src/modules/pension/defaults.ts` | Reine Funktionen für Defaults + Renten-Pipeline | erweitern |
| `src/modules/pension/defaults.test.ts` | Tests dazu | erweitern |
| `src/modules/pension/state.ts` | Store-Schema + Migration | modifizieren |
| `src/modules/pension/presets.ts` | Default-State-Werte | modifizieren |
| `src/modules/pension/presets.test.ts` | Test der Default-State-Werte | modifizieren |
| `src/modules/pension/tooltips.ts` | Tooltip-Texte | modifizieren |
| `src/modules/pension/steps/ResultStep.tsx` | Mapping Store → `PensionInputs` | modifizieren |
| `src/modules/pension/steps/PensionInformationStep.tsx` | Renteninfo-UI mit Korrektur | modifizieren |
| `src/modules/pension/steps/AssumptionsStep.tsx` | Annahmen-UI: Planungsalter statt Bezugsdauer | modifizieren |

---

## Task 1: Konstanten umstellen

**Files:**
- Modify: `src/modules/pension/constants.ts`

- [ ] **Step 1: Konstanten ersetzen**

In `src/modules/pension/constants.ts`:

- Zeile entfernen: `/** Finanztip-Empfehlung: rechne mit 30 Jahren Rentenzeit (≈ 100 Lebensjahre). */` + `export const PAYOUT_YEARS_DEFAULT = 30;`
- An derselben Stelle einfügen:

```ts
/**
 * Default-Planungsalter für die Auszahlphase. Bewusster Puffer über die
 * durchschnittliche Restlebenserwartung mit 67 (≈ 85–88 Jahre laut DESTATIS),
 * damit das Langlebigkeitsrisiko abgedeckt ist. Im UI überschreibbar.
 */
export const PLANNING_AGE_DEFAULT = 90;

/**
 * Default-Beitragsbeginn (Alter), an dem laut Modell die Einzahlung in die DRV
 * losging. Linear angenommen — wer Studium, Kinderpause oder späten
 * Selbstständigkeits-Einstieg hatte, überschreibt das im Renteninfo-Schritt.
 */
export const CONTRIBUTION_START_AGE_DEFAULT = 20;
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/pension/constants.ts
git commit -m "feat(pension): Konstanten für Planungsalter + Beitragsbeginn"
```

---

## Task 2: `regelaltersgrenze()` per TDD

**Files:**
- Modify: `src/modules/pension/defaults.ts`
- Test: `src/modules/pension/defaults.test.ts`

- [ ] **Step 1: Failing tests**

In `src/modules/pension/defaults.test.ts` ans Ende einfügen:

```ts
import { regelaltersgrenze } from "./defaults";

describe("regelaltersgrenze", () => {
  it("Jahrgang 1946 und früher: 65", () => {
    expect(regelaltersgrenze(1946)).toBe(65);
    expect(regelaltersgrenze(1900)).toBe(65);
  });

  it("Jahrgänge 1947–1958: + 1 Monat pro Jahr", () => {
    expect(regelaltersgrenze(1947)).toBeCloseTo(65 + 1 / 12, 6);
    expect(regelaltersgrenze(1958)).toBeCloseTo(66, 6);
  });

  it("Jahrgänge 1959–1963: + 2 Monate pro Jahr", () => {
    expect(regelaltersgrenze(1959)).toBeCloseTo(66 + 2 / 12, 6);
    expect(regelaltersgrenze(1963)).toBeCloseTo(66 + 10 / 12, 6);
  });

  it("Jahrgang 1964 und später: 67", () => {
    expect(regelaltersgrenze(1964)).toBe(67);
    expect(regelaltersgrenze(2000)).toBe(67);
  });
});
```

- [ ] **Step 2: Run tests, verify fail**

```
npx vitest run src/modules/pension/defaults.test.ts
```

Expected: alle vier neuen Tests scheitern mit „regelaltersgrenze is not exported".

- [ ] **Step 3: Implementierung**

In `src/modules/pension/defaults.ts` ans Ende einfügen:

```ts
/**
 * Regelaltersgrenze nach SGB VI § 235.
 *  - Jahrgänge bis 1946: 65
 *  - Jahrgänge 1947–1958: +1 Monat pro Jahr (65y 1m … 66y 0m)
 *  - Jahrgänge 1959–1963: +2 Monate pro Jahr (66y 2m … 66y 10m)
 *  - Jahrgänge ab 1964: 67
 *
 * Quelle: Deutsche Rentenversicherung.
 */
export function regelaltersgrenze(birthYear: number): number {
  if (birthYear <= 1946) return 65;
  if (birthYear >= 1964) return 67;
  const monthsExtra =
    birthYear <= 1958
      ? birthYear - 1946 // 1 … 12 Monate
      : 12 + (birthYear - 1958) * 2; // 14, 16, 18, 20, 22 Monate
  return 65 + monthsExtra / 12;
}
```

- [ ] **Step 4: Run tests, verify pass**

```
npx vitest run src/modules/pension/defaults.test.ts
```

Expected: alle Tests grün.

- [ ] **Step 5: Commit**

```bash
git add src/modules/pension/defaults.ts src/modules/pension/defaults.test.ts
git commit -m "feat(pension): regelaltersgrenze() aus Geburtsjahr ableiten"
```

---

## Task 3: `adjustGrossForEarlyRetirement()` per TDD

**Files:**
- Modify: `src/modules/pension/defaults.ts`
- Test: `src/modules/pension/defaults.test.ts`

- [ ] **Step 1: Failing tests**

In `src/modules/pension/defaults.test.ts` ans Ende einfügen:

```ts
import { adjustGrossForEarlyRetirement } from "./defaults";

describe("adjustGrossForEarlyRetirement", () => {
  it("Eintritt zur Regelaltersgrenze: keine Korrektur", () => {
    const r = adjustGrossForEarlyRetirement(2000, 67, 67, 20);
    expect(r.adjustedGross).toBe(2000);
    expect(r.abschlagPct).toBe(0);
    expect(r.beitragsFaktor).toBe(1);
  });

  it("Eintritt nach Regelaltersgrenze: keine Korrektur (Zuschläge sind Out-of-Scope)", () => {
    const r = adjustGrossForEarlyRetirement(2000, 70, 67, 20);
    expect(r.adjustedGross).toBe(2000);
    expect(r.abschlagPct).toBe(0);
    expect(r.beitragsFaktor).toBe(1);
  });

  it("4 Jahre vorzeitig (63 vs 67), Beitragsbeginn 20: Abschlag 14,4 %, Beitragsfaktor 43/47", () => {
    const r = adjustGrossForEarlyRetirement(2000, 63, 67, 20);
    expect(r.abschlagPct).toBeCloseTo(0.144, 6);
    expect(r.beitragsFaktor).toBeCloseTo(43 / 47, 6);
    expect(r.adjustedGross).toBeCloseTo(2000 * (1 - 0.144) * (43 / 47), 4);
  });

  it("Abschlag wird bei mehr als 4 Jahren vorzeitig auf 14,4 % gedeckelt", () => {
    const r = adjustGrossForEarlyRetirement(2000, 60, 67, 20);
    expect(r.abschlagPct).toBe(0.144);
  });

  it("Späterer Beitragsbeginn senkt den Beitragsfaktor zusätzlich", () => {
    const r = adjustGrossForEarlyRetirement(2000, 63, 67, 27);
    expect(r.beitragsFaktor).toBeCloseTo(36 / 40, 6); // 63-27=36 ist tatsächlich, 67-27=40 geplant
  });

  it("Retirement <= contributionStart führt zu Beitragsfaktor 0 (Edge Case)", () => {
    const r = adjustGrossForEarlyRetirement(2000, 19, 67, 20);
    expect(r.beitragsFaktor).toBe(0);
    expect(r.adjustedGross).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests, verify fail**

```
npx vitest run src/modules/pension/defaults.test.ts
```

Expected: alle sechs neuen Tests scheitern mit „adjustGrossForEarlyRetirement is not exported".

- [ ] **Step 3: Implementierung**

In `src/modules/pension/defaults.ts` ans Ende einfügen:

```ts
/**
 * Reduziert die Renteninfo-Brutto-Rente um:
 *  - Abschläge: 0,3 % pro Monat vorzeitig (zwischen retirementAge und
 *    regelaltersgrenze), gedeckelt bei 14,4 % (48 Monate × 0,3 %).
 *  - Beitragsjahre-Faktor: tatsächliche / geplante Beitragsmonate, linear.
 *
 * Bei Eintritt zur Regelaltersgrenze oder später bleibt die Brutto-Rente
 * unverändert. Zuschläge für späteren Eintritt sind bewusst NICHT modelliert
 * (separater Scope, betrifft Edge-Case-Nutzer).
 */
export function adjustGrossForEarlyRetirement(
  grossWithoutAdjustment: number,
  retirementAge: number,
  regelalter: number,
  contributionStartAge: number,
): { adjustedGross: number; abschlagPct: number; beitragsFaktor: number } {
  if (retirementAge >= regelalter) {
    return {
      adjustedGross: grossWithoutAdjustment,
      abschlagPct: 0,
      beitragsFaktor: 1,
    };
  }
  const monthsEarly = (regelalter - retirementAge) * 12;
  const abschlagPct = Math.min(0.144, monthsEarly * 0.003);

  const plannedContributionMonths = (regelalter - contributionStartAge) * 12;
  const actualContributionMonths = (retirementAge - contributionStartAge) * 12;
  const beitragsFaktor =
    plannedContributionMonths <= 0
      ? 0
      : Math.max(0, actualContributionMonths / plannedContributionMonths);

  const adjustedGross = grossWithoutAdjustment * (1 - abschlagPct) * beitragsFaktor;
  return { adjustedGross, abschlagPct, beitragsFaktor };
}
```

- [ ] **Step 4: Run tests, verify pass**

```
npx vitest run src/modules/pension/defaults.test.ts
```

Expected: alle Tests grün.

- [ ] **Step 5: Commit**

```bash
git add src/modules/pension/defaults.ts src/modules/pension/defaults.test.ts
git commit -m "feat(pension): adjustGrossForEarlyRetirement() für Abschlag + Beitragsjahre"
```

---

## Task 4: `projectedNetPensionToday()` um Korrektur erweitern

**Files:**
- Modify: `src/modules/pension/defaults.ts`
- Test: `src/modules/pension/defaults.test.ts`

- [ ] **Step 1: Test für neue Pipeline-Felder + Korrektur**

In `src/modules/pension/defaults.test.ts` ans Ende einfügen:

```ts
describe("projectedNetPensionToday mit Korrektur", () => {
  it("Eintritt zur Regelaltersgrenze: Korrektur ist Identität, Pipeline-Felder vorhanden", () => {
    const r = projectedNetPensionToday(2000, 0.015, 0.2, 0.02, 30, {
      retirementAge: 67,
      regelalter: 67,
      contributionStartAge: 20,
    });
    expect(r.grossBeforeAdjustment).toBe(2000);
    expect(r.abschlagPct).toBe(0);
    expect(r.beitragsFaktor).toBe(1);
    expect(r.grossAdjusted).toBe(2000);
    expect(r.grossNominal).toBeCloseTo(2000 * Math.pow(1.015, 30), 4);
    expect(r.netNominal).toBeCloseTo(r.grossNominal * 0.8, 4);
    expect(r.netReal).toBeCloseTo(r.netNominal / Math.pow(1.02, 30), 4);
  });

  it("4 Jahre vorzeitig: Brutto wird vor der Anpassung gekürzt", () => {
    const r = projectedNetPensionToday(2000, 0.015, 0.2, 0.02, 26, {
      retirementAge: 63,
      regelalter: 67,
      contributionStartAge: 20,
    });
    const expectedAdjusted = 2000 * (1 - 0.144) * (43 / 47);
    expect(r.grossAdjusted).toBeCloseTo(expectedAdjusted, 4);
    expect(r.grossNominal).toBeCloseTo(expectedAdjusted * Math.pow(1.015, 26), 4);
  });

  it("Fehlende Korrektur-Parameter: Aufruf wie früher (Backwards-Kompatibilität)", () => {
    const r = projectedNetPensionToday(2000, 0.015, 0.2, 0.02, 30);
    expect(r.grossAdjusted).toBe(2000);
    expect(r.abschlagPct).toBe(0);
    expect(r.beitragsFaktor).toBe(1);
  });
});
```

(`projectedNetPensionToday` ist im Test bereits importiert oder über den bestehenden Import-Block sichtbar; falls nicht: oben im File ergänzen.)

- [ ] **Step 2: Run tests, verify fail**

```
npx vitest run src/modules/pension/defaults.test.ts
```

Expected: Tests scheitern, weil `grossBeforeAdjustment`, `abschlagPct`, `beitragsFaktor`, `grossAdjusted` nicht zurückgegeben werden bzw. die Funktion den Options-Parameter nicht kennt.

- [ ] **Step 3: Funktion umbauen**

In `src/modules/pension/defaults.ts` die Funktion `projectedNetPensionToday` komplett ersetzen durch:

```ts
/**
 * Project a statutory pension from "without adjustment" (DRV-Renteninfo)
 * all the way to today's purchasing power. Pipeline:
 *
 *   0. grossAdjusted = grossWithoutAdjustment × (1 − abschlag) × beitragsFaktor
 *      (Identität bei Eintritt zur Regelaltersgrenze oder ohne adjust-Optionen)
 *   1. grossNominal = grossAdjusted × (1 + raise)^years
 *   2. netNominal   = grossNominal × (1 − deductionPct)
 *   3. netReal      = netNominal / (1 + inflation)^years
 *
 * Alle vier Pipeline-Stages werden zurückgegeben, damit das UI sie auflisten
 * kann. Bei `yearsToRetirement <= 0` wird die Hochrechnung übersprungen
 * (Eintritt heute), die Korrektur greift trotzdem.
 */
export function projectedNetPensionToday(
  grossWithoutAdjustment: number,
  raise: number,
  deductionPct: number,
  inflation: number,
  yearsToRetirement: number,
  adjust?: {
    retirementAge: number;
    regelalter: number;
    contributionStartAge: number;
  },
): {
  grossBeforeAdjustment: number;
  abschlagPct: number;
  beitragsFaktor: number;
  grossAdjusted: number;
  grossNominal: number;
  netNominal: number;
  netReal: number;
} {
  const correction = adjust
    ? adjustGrossForEarlyRetirement(
        grossWithoutAdjustment,
        adjust.retirementAge,
        adjust.regelalter,
        adjust.contributionStartAge,
      )
    : { adjustedGross: grossWithoutAdjustment, abschlagPct: 0, beitragsFaktor: 1 };

  const grossAdjusted = correction.adjustedGross;

  if (yearsToRetirement <= 0) {
    const netNominal = applyPensionDeduction(grossAdjusted, deductionPct);
    return {
      grossBeforeAdjustment: grossWithoutAdjustment,
      abschlagPct: correction.abschlagPct,
      beitragsFaktor: correction.beitragsFaktor,
      grossAdjusted,
      grossNominal: grossAdjusted,
      netNominal,
      netReal: netNominal,
    };
  }
  const grossNominal = grossAdjusted * Math.pow(1 + raise, yearsToRetirement);
  const netNominal = applyPensionDeduction(grossNominal, deductionPct);
  const netReal = netNominal / Math.pow(1 + inflation, yearsToRetirement);
  return {
    grossBeforeAdjustment: grossWithoutAdjustment,
    abschlagPct: correction.abschlagPct,
    beitragsFaktor: correction.beitragsFaktor,
    grossAdjusted,
    grossNominal,
    netNominal,
    netReal,
  };
}
```

- [ ] **Step 4: Run tests, verify pass**

```
npx vitest run src/modules/pension/defaults.test.ts
```

Expected: alle Tests grün, inklusive der bereits bestehenden Daniela-Cross-Check-Tests (sie nutzen den 5-Argument-Pfad, der unverändert funktioniert).

- [ ] **Step 5: Commit**

```bash
git add src/modules/pension/defaults.ts src/modules/pension/defaults.test.ts
git commit -m "feat(pension): projectedNetPensionToday() um Renten-Korrektur erweitert"
```

---

## Task 5: Store-Schema migrieren

**Files:**
- Modify: `src/modules/pension/state.ts`
- Modify: `src/modules/pension/presets.ts`
- Modify: `src/modules/pension/presets.test.ts`

- [ ] **Step 1: Presets umstellen**

In `src/modules/pension/presets.ts` Zeile `payoutYears: 30,` ersetzen durch:

```ts
  planningAge: 90,
  contributionStartAge: 20,
```

Wenn die Import-Zeile noch nicht passt: oben nichts ändern (Konstanten kommen nicht aus presets.ts).

- [ ] **Step 2: Schema und Migration im Store**

In `src/modules/pension/state.ts`:

a) Typ `PensionModuleState`: die Zeile `payoutYears: number;` ersetzen durch:

```ts
  /** Bis zu welchem Lebensalter die Auszahlphase reichen soll. Default 90. */
  planningAge: number;
  /** Alter, ab dem in die DRV eingezahlt wurde. Default 20 (linear). */
  contributionStartAge: number;
```

b) Migrationsfunktion `migrate()` erweitern (am Ende, vor dem `return cleaned`):

```ts
  // Legacy: payoutYears wurde durch planningAge ersetzt.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyPayoutYears = (stored as any).payoutYears as number | undefined;
  if (cleaned.planningAge === undefined && legacyPayoutYears !== undefined) {
    // Ohne Profil-Zugriff im Store-Loader: konservativ 67 als Default-Renteneintritt
    // nehmen. Wer das überschreiben will, ändert das Planungsalter im UI.
    cleaned.planningAge = 67 + legacyPayoutYears;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (cleaned as any).payoutYears;

  if (cleaned.contributionStartAge === undefined) {
    cleaned.contributionStartAge = 20;
  }
```

c) Den Migrations-Parameter-Typ erweitern: in der `migrate`-Signatur `realReturn?: number; payoutRealReturn?: number;` ergänzen um `payoutYears?: number;`.

- [ ] **Step 3: Presets-Test anpassen**

In `src/modules/pension/presets.test.ts` jede Assertion auf `payoutYears` ersetzen durch passende Assertion auf `planningAge` (90) bzw. `contributionStartAge` (20). Vor der Änderung Datei kurz lesen und Stellen identifizieren.

- [ ] **Step 4: Tests laufen lassen**

```
npx vitest run src/modules/pension/presets.test.ts src/modules/pension/state.ts
```

Erwartete Fehler bleiben nur dort, wo Konsumenten (ResultStep, AssumptionsStep) noch `m.payoutYears` lesen. Die `presets.test.ts` muss grün sein.

- [ ] **Step 5: Commit**

```bash
git add src/modules/pension/state.ts src/modules/pension/presets.ts src/modules/pension/presets.test.ts
git commit -m "feat(pension): Store-Schema von payoutYears auf planningAge + contributionStartAge"
```

---

## Task 6: Mapping in `ResultStep.tsx` anpassen

**Files:**
- Modify: `src/modules/pension/steps/ResultStep.tsx`

- [ ] **Step 1: Mapping aktualisieren**

In `src/modules/pension/steps/ResultStep.tsx` die Zeile innerhalb des `withDefaults({...})`-Aufrufs

```ts
    payoutYears: m.payoutYears,
```

ersetzen durch:

```ts
    payoutYears: Math.max(0, m.planningAge - (profile.retirementAge ?? 0)),
```

- [ ] **Step 2: Typecheck**

```
npx tsc --noEmit
```

Expected: kein Fehler in `ResultStep.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/modules/pension/steps/ResultStep.tsx
git commit -m "feat(pension): payoutYears aus planningAge − retirementAge ableiten"
```

---

## Task 7: AssumptionsStep auf Planungsalter umstellen

**Files:**
- Modify: `src/modules/pension/steps/AssumptionsStep.tsx`
- Modify: `src/modules/pension/tooltips.ts`

- [ ] **Step 1: Tooltip umbenennen**

In `src/modules/pension/tooltips.ts` den Eintrag `payoutYears` umbenennen zu `planningAge` und den Text ersetzen durch:

```ts
  planningAge:
    "Bis zu welchem Lebensalter dein Kapital reichen soll. Default 90 als Puffer über die durchschnittliche Restlebenserwartung mit 67 (ca. 85–88 J.). Wer langfristig plant: 95 oder 100.",
```

- [ ] **Step 2: AssumptionsStep anpassen**

In `src/modules/pension/steps/AssumptionsStep.tsx`:

a) `payoutSummary` ersetzen:

```ts
const derivedPayoutYears = Math.max(0, m.planningAge - (profile.retirementAge ?? 0));
const payoutSummary =
  m.payoutMethod === "annuity"
    ? `Annuität · bis Alter ${m.planningAge}`
    : `Sichere Entnahme · ${pct(m.safeWithdrawalRate * 100)}`;
```

b) Den `NumberInput` für die Bezugsdauer (Block `m.payoutMethod === "annuity"`, `label="Rentenbezugsdauer"`) ersetzen durch:

```tsx
<div className="space-y-2">
  <NumberInput
    label="Planen bis Alter"
    value={m.planningAge}
    onChange={(v) => v !== undefined && pensionStore.set({ planningAge: v })}
    unit="Jahre"
    min={(profile.retirementAge ?? 0) + 1}
    max={120}
    tooltip={tooltips.planningAge}
  />
  <p className="text-[11px] tabular-nums text-on-surface-variant">
    Bei Renteneintritt mit {profile.retirementAge ?? "—"} = {derivedPayoutYears} Jahre Rentenzeit
  </p>
</div>
```

- [ ] **Step 3: Typecheck + Test**

```
npx tsc --noEmit
npx vitest run
```

Expected: keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add src/modules/pension/steps/AssumptionsStep.tsx src/modules/pension/tooltips.ts
git commit -m "feat(pension): Annahmen-UI auf Planungsalter umgestellt"
```

---

## Task 8: PensionInformationStep mit Korrektur-Pipeline

**Files:**
- Modify: `src/modules/pension/steps/PensionInformationStep.tsx`

- [ ] **Step 1: Importe + Hilfswerte**

Importzeile ergänzen:

```ts
import { PENSION_DEFAULTS, projectedNetPensionToday, regelaltersgrenze } from "../defaults";
```

(`projectedNetPensionToday` und `PENSION_DEFAULTS` sind bereits importiert — nur `regelaltersgrenze` neu.)

Innerhalb der Komponente nach `const m = pensionStore.useState();` einfügen:

```ts
const retirementAge = profile.retirementAge ?? PENSION_DEFAULTS.retirementAge;
const currentYear = new Date().getFullYear();
const birthYear = profile.age !== undefined ? currentYear - profile.age : undefined;
const regelalter = birthYear !== undefined ? regelaltersgrenze(birthYear) : 67;
const contributionStartAge = m.contributionStartAge;
```

- [ ] **Step 2: Hochrechnungs-Aufruf erweitern**

Den Aufruf

```ts
const projection = ready
  ? projectedNetPensionToday(
      grossWithoutAdjustment!,
      raise,
      deduction,
      inflation,
      yearsToRetirement,
    )
  : undefined;
```

ersetzen durch:

```ts
const projection = ready
  ? projectedNetPensionToday(
      grossWithoutAdjustment!,
      raise,
      deduction,
      inflation,
      yearsToRetirement,
      { retirementAge, regelalter, contributionStartAge },
    )
  : undefined;
```

- [ ] **Step 3: Hochrechnungs-Box um Korrektur-Zeilen erweitern**

Im JSX-Block, der mit `{projection && grossWithoutAdjustment !== undefined && (` beginnt, die `<dl>`-Liste so erweitern, dass die zwei Korrektur-Zeilen vor `× (1 + raise)^years` auftauchen und nur erscheinen, wenn `abschlagPct > 0` (also bei früherem Eintritt):

```tsx
<dl className="mt-2 divide-y divide-outline-variant text-[12px] text-on-surface-variant">
  <CalcRow
    label="Brutto ohne Anpassung"
    value={formatEUR(grossWithoutAdjustment)}
  />
  {projection.abschlagPct > 0 && (
    <>
      <CalcRow
        label={`− ${formatPercent(projection.abschlagPct)} Abschlag (${(regelalter - retirementAge).toFixed(0)} J. vorzeitig)`}
        value={`${formatEUR(grossWithoutAdjustment * (1 - projection.abschlagPct))} brutto`}
      />
      <CalcRow
        label={`× ${formatPercent(projection.beitragsFaktor)} Beitragsjahre (${(retirementAge - contributionStartAge).toFixed(0)}/${(regelalter - contributionStartAge).toFixed(0)})`}
        value={`${formatEUR(projection.grossAdjusted)} brutto angepasst`}
      />
    </>
  )}
  <CalcRow
    label={`× (1 + ${formatPercent(raise)})^${yearsToRetirement}`}
    value={`${formatEUR(projection.grossNominal)} brutto in ${yearsToRetirement} J.`}
  />
  <CalcRow
    label={`− ${formatPercent(deduction)} Steuern + KV/PV`}
    value={`${formatEUR(projection.netNominal)} netto in ${yearsToRetirement} J.`}
  />
  <CalcRow
    label={`÷ Inflation ${formatPercent(inflation)} · ${yearsToRetirement} J.`}
    value={`${formatEUR(projection.netReal)} heute`}
    highlight
  />
</dl>
```

- [ ] **Step 4: Override-Feld „Beitragsbeginn"**

Direkt unter dem `NumberInput` für „Pauschalabzug für Steuern + KV/PV" (Label = „Pauschalabzug für Steuern + KV/PV") einfügen:

```tsx
<details className="pt-1">
  <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.04em] text-primary hover:underline underline-offset-4 decoration-2">
    ▸ Abweichende Erwerbsbiografie?
  </summary>
  <div className="mt-3 space-y-2">
    <NumberInput
      label="Beitragsbeginn (Alter)"
      value={contributionStartAge}
      onChange={(v) =>
        v !== undefined && pensionStore.set({ contributionStartAge: v })
      }
      unit="Jahre"
      min={14}
      max={Math.max(14, retirementAge - 1)}
      hint="Default 20: durchgängig ab Ausbildung/Studium gerechnet. Höher setzen bei Spätstart in DRV-Pflichteinzahlung (z. B. langes Studium, Selbstständigkeit, Auslandsjahre)."
    />
    <p className="text-[11px] text-on-surface-variant">
      Wirkt sich auf den Beitragsjahre-Faktor in der Hochrechnung aus.
    </p>
  </div>
</details>
```

- [ ] **Step 5: Hint-Block bei Eintritt nach Regelaltersgrenze**

Direkt über der `<div className="space-y-4 border …">` (nur sichtbar, wenn `!hasStored` und kein vorzeitiger Eintritt) einen kleinen Hinweis einfügen, damit der Nutzer versteht, warum keine Abschläge erscheinen:

```tsx
{retirementAge >= regelalter && (
  <div className="border-l-[3px] border-outline-variant bg-surface-container px-3 py-2">
    <p className="font-sans text-[11.5px] leading-relaxed text-on-surface-variant">
      Du gehst zur Regelaltersgrenze ({regelalter.toFixed(0)}) oder später in Rente —
      keine Abschläge, kein Beitragsjahre-Abschlag in der Hochrechnung.
    </p>
  </div>
)}
```

- [ ] **Step 6: Typecheck + Tests**

```
npx tsc --noEmit
npx vitest run
```

Expected: keine Fehler.

- [ ] **Step 7: Commit**

```bash
git add src/modules/pension/steps/PensionInformationStep.tsx
git commit -m "feat(pension): Renteninfo-Schritt mit Abschlag- und Beitragsjahre-Korrektur"
```

---

## Task 9: End-to-End-Regressions-Test

**Files:**
- Modify: `src/modules/pension/calculations.test.ts`

- [ ] **Step 1: Test schreiben**

Am Ende von `src/modules/pension/calculations.test.ts` einfügen:

```ts
describe("Wunschrentenalter wirkt korrekt aufs Ergebnis", () => {
  // Fester Bezugsfall: 36-Jähriger, 3.000 € Netto, 1.500 € erwartete
  // gesetzliche Rente (heute), Standard-Annahmen.
  const baseInputs = withDefaults({
    currentAge: 36,
    netIncomeMonthly: 3000,
    expectedStatePension: 1500,
  });

  it("Default-Rentenalter 67 ergibt eine endliche, positive Sparrate", () => {
    const r = calculatePension({ ...baseInputs, retirementAge: 67, payoutYears: 23 });
    expect(r.kind).toBe("ok");
    if (r.kind !== "ok") return;
    expect(r.monthlySavings).toBeGreaterThan(0);
  });

  it("Renteneintritt mit 63 statt 67 (gleiche Rente, payoutYears +4) erhöht Sparrate und Kapitalbedarf", () => {
    const a = calculatePension({ ...baseInputs, retirementAge: 67, payoutYears: 23 });
    const b = calculatePension({ ...baseInputs, retirementAge: 63, payoutYears: 27 });
    if (a.kind !== "ok" || b.kind !== "ok") throw new Error("setup");
    expect(b.capitalNeeded).toBeGreaterThan(a.capitalNeeded);
    expect(b.monthlySavings).toBeGreaterThan(a.monthlySavings);
  });
});
```

(Wenn `withDefaults` noch nicht importiert ist, ergänzen.)

- [ ] **Step 2: Test laufen lassen**

```
npx vitest run src/modules/pension/calculations.test.ts
```

Expected: alle Tests grün.

- [ ] **Step 3: Commit**

```bash
git add src/modules/pension/calculations.test.ts
git commit -m "test(pension): Regression: Wunschrentenalter wirkt aufs Ergebnis"
```

---

## Task 10: Browser-Verifikation

**Files:** keine

- [ ] **Step 1: Dev-Server starten**

```
npm run dev
```

(Über `preview_start`, falls Preview-Tools verwendet werden.)

- [ ] **Step 2: Golden Path durchspielen**

Im Browser:
1. Alter 36, Renteneintritt 67, Netto 3.000 €.
2. Renteninfo-Schritt: Brutto 2.000 € eintragen. Hochrechnungs-Box erscheint **ohne** Abschlags-/Beitragsjahre-Zeilen, weil 67 = Regelaltersgrenze.
3. Zurück zu Schritt 1, Renteneintritt auf 63 ändern. Im Renteninfo-Schritt: Abschlags-Zeile (`14,4 %`) und Beitragsjahre-Zeile (`43/47`) müssen erscheinen, `netReal` muss sinken.
4. Annahmen-Schritt: „Planen bis Alter 90" sichtbar, der Hinweis darunter zeigt „Bei Renteneintritt mit 63 = 27 Jahre Rentenzeit".
5. Ergebnis-Schritt: monatliche Sparrate ist höher als beim Default-Setup mit 67.

- [ ] **Step 3: Migration eines alten Exports prüfen**

Die Datei `finanzbot-2026-05-19.json` im Repo-Root (Vor-Migrations-Stand) per Import-Funktion laden. Erwartung: keine Error-Boundary, `planningAge` wird aus altem `payoutYears` (30) + Default-Renteneintritt (67) = 97 abgeleitet. Im Annahmen-UI dann auf 90 zurücksetzen möglich.

- [ ] **Step 4: Screenshot der Hochrechnungs-Box mit Abschlags-Zeilen**

Über `preview_screenshot` festhalten, in der finalen PR-Beschreibung verlinken.

- [ ] **Step 5: Build verifizieren**

```
npm run build
```

Expected: kein Fehler.

- [ ] **Step 6: Optional Commit (nur falls Build-Artefakte oder Snapshots im Repo)**

Keine Commit-Aktion, falls nur Verifikation lief.

---

## Self-Review (Spec ↔ Plan)

**Spec-Abdeckung:**
- Baustein 1 (Regelaltersgrenze) → Task 2 ✓
- Baustein 2 (Renten-Korrektur) → Task 3 + Task 4 + Task 8 ✓
- Baustein 3 (Planungsalter) → Task 1 + Task 5 + Task 6 + Task 7 ✓
- Migration alter Stände → Task 5 (Store-Migration) + Task 10 Step 3 (E2E-Check) ✓
- Tests + Regression → Task 9 ✓

**Type-Konsistenz:**
- Store-Feld heißt durchgehend `planningAge` und `contributionStartAge`.
- `PensionInputs.payoutYears` bleibt unverändert (calculations.ts API-Garantie).
- Funktion heißt durchgehend `adjustGrossForEarlyRetirement`, `regelaltersgrenze`, `projectedNetPensionToday`.
- Pipeline-Rückgabefelder identisch in Task 4 (Definition) und Task 8 (Verbrauch).

Keine offenen Placeholder.
