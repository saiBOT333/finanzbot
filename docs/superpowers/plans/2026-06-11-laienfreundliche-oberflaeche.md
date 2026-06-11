# Laienfreundliche Oberfläche — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den Rentenrechner für Menschen ohne Finanz-Vorwissen zugänglich machen — Gabelung in Schritt 3, Klartext statt Jargon, ehrliche Rundung, korrekte Farbsemantik, reparierter Mobile-Header, weniger Label-Lärm.

**Architecture:** Reine Frontend-Änderungen im bestehenden React/Vite/Tailwind-Stack. Ein neues persistiertes Store-Feld (`pensionInfoChoice`), ein neuer Format-Helper (`formatEURRounded`), sonst Umbauten in bestehenden Komponenten. Spec: `docs/superpowers/specs/2026-06-11-laienfreundliche-oberflaeche-design.md`.

**Tech Stack:** React 18, TypeScript, Tailwind (M3-Tokens), Vitest. Tests: `npx vitest run`. Dev-Server für visuelle Prüfung: Preview „FinanzBot M3" (Port 5174).

**Branch:** Vor Task 1 anlegen: `git checkout -b claude/laienfreundliche-ui`

**Wichtige Konventionen:**
- UI-Texte auf Deutsch mit korrekten Umlauten (kein ASCII-Fallback).
- Material Symbols sind als Font geladen; Icons werden als Ligatur-Text in einem `<span className="m3-icon">` gerendert (z. B. `<span className="m3-icon">download</span>`).
- Commit-Messages: Conventional Commits, ASCII im Subject (wie bisherige Historie).

---

## Phase 1 — Quick Wins (Header/Mobile/Farben)

### Task 1: Header & Modulkopf mobiltauglich (App.tsx)

**Files:**
- Modify: `src/App.tsx`

Der Header bricht auf 375 px um (Tagline auf 4 Zeilen) und die Emoji-Buttons (📥📤🔄) laufen über den rechten Rand. Außerdem ist der Modulkopf auf Mobile zu hoch.

- [ ] **Step 1: Branch anlegen**

```powershell
git checkout -b claude/laienfreundliche-ui
```

- [ ] **Step 2: Tagline auf Mobile ausblenden**

In `src/App.tsx` (~Zeile 96):

```tsx
// Vorher:
<span className="text-[14px] text-on-surface-variant">
  Modulare Finanzplanung · lokal · quelloffen
</span>
// Nachher:
<span className="hidden sm:inline text-[14px] text-on-surface-variant">
  Modulare Finanzplanung · lokal · quelloffen
</span>
```

- [ ] **Step 3: Emoji-Buttons durch Material Symbols ersetzen**

In `src/App.tsx` (~Zeilen 101–117), die drei Buttons. Import = Datei in die App laden (`upload`), Export = Datei speichern (`download`):

```tsx
<Button variant="text" size="sm" onClick={handleImportClick} title="Daten importieren">
  <span aria-hidden className="m3-icon text-[20px] sm:hidden">upload</span>
  <span className="hidden sm:inline">Import</span>
</Button>
<Button variant="text" size="sm" onClick={handleExport} title="Daten exportieren">
  <span aria-hidden className="m3-icon text-[20px] sm:hidden">download</span>
  <span className="hidden sm:inline">Export</span>
</Button>
<Button
  variant="text"
  size="sm"
  onClick={handleReset}
  title="Alle Eingaben löschen"
>
  <span aria-hidden className="m3-icon text-[20px] sm:hidden">restart_alt</span>
  <span className="hidden sm:inline">Zurücksetzen</span>
</Button>
```

- [ ] **Step 4: Modulkopf-Headline auf Mobile verkleinern**

In `src/App.tsx` (~Zeilen 158–160):

```tsx
// Vorher:
<h2 className="flex items-center gap-3 text-[40px] sm:text-[48px] font-semibold leading-[1.05] tracking-[-0.02em] text-on-surface">
  <span aria-hidden className="m3-icon text-primary text-[44px] sm:text-[52px]">{active.icon}</span>
// Nachher:
<h2 className="flex items-center gap-3 text-[28px] sm:text-[48px] font-semibold leading-[1.05] tracking-[-0.02em] text-on-surface">
  <span aria-hidden className="m3-icon text-primary text-[32px] sm:text-[52px]">{active.icon}</span>
```

- [ ] **Step 5: Visuell prüfen**

Preview „FinanzBot M3" starten, Viewport auf `mobile` (375×812) stellen, Screenshot:
- Tagline weg, drei Icon-Buttons vollständig sichtbar (kein Abschneiden am rechten Rand).
- Headline einzeilig oder maximal zweizeilig kompakt.
Dann Viewport `desktop`: Header unverändert mit Text-Buttons.

- [ ] **Step 6: Tests laufen lassen und committen**

```powershell
npx vitest run
git add src/App.tsx
git commit -m "fix(ui): Header und Modulkopf mobiltauglich (Tagline, Icons, Headline)"
```

---

### Task 2: Wizard-Fortschritt auf Mobile kompakt (Wizard.tsx)

**Files:**
- Modify: `src/components/Wizard.tsx`

Die Schritt-Chip-Liste braucht auf 375 px drei Zeilen. Auf Schmal genügen Fortschrittsbalken + der vorhandene „Schritt X / 5"-Eyebrow + Titel — die Chips werden ausgeblendet.

- [ ] **Step 1: Chip-Liste auf Mobile ausblenden**

In `src/components/Wizard.tsx` (~Zeile 58):

```tsx
// Vorher:
<ol className="flex flex-wrap gap-2">
// Nachher:
<ol className="hidden flex-wrap gap-2 sm:flex">
```

- [ ] **Step 2: Visuell prüfen**

Preview auf `mobile`: nur Balken + „Schritt 1 / 5" + Titel sichtbar. Auf `desktop`: Chips unverändert.

- [ ] **Step 3: Tests laufen lassen und committen**

```powershell
npx vitest run
git add src/components/Wizard.tsx
git commit -m "fix(ui): Wizard-Schrittliste auf Mobile ausblenden"
```

---

### Task 3: Farbsemantik im Ergebnis (ResultStep.tsx)

**Files:**
- Modify: `src/modules/pension/steps/ResultStep.tsx`

Drei Korrekturen: (a) Lesehinweis raus aus der pinken `tertiary-container`-Box ins neutrale Hinweis-Muster, (b) Sparquote-Indikator nie rot, (c) Emojis 📄/💡 durch Material Symbols ersetzen.

- [ ] **Step 1: Lesehinweis-Box umstylen**

In `src/modules/pension/steps/ResultStep.tsx` (~Zeilen 251–262) den gesamten Block ersetzen:

```tsx
// Vorher:
{/* Tip-Card auf Tertiary für den Lesehinweis. */}
<div className="rounded-m3-md bg-tertiary-container text-on-tertiary-container p-4 flex gap-3 items-start">
  <span aria-hidden className="text-xl leading-none">💡</span>
  <div className="space-y-1.5">
    <p className="text-[12px] font-medium uppercase tracking-[0.08em] opacity-85">Lesehinweis</p>
    <p className="text-[13px] leading-relaxed">
      Der Hauptbetrag gilt in heutiger Kaufkraft. Um real gleich zu bleiben, musst du ihn
      jedes Jahr um die Inflation anpassen (z. B. +2 %). Steigt dein Gehalt mit der
      Inflation, bleibt die Sparquote konstant.
    </p>
  </div>
</div>
// Nachher:
{/* Neutraler Lesehinweis im Border-links-Muster (kein Pink — das liest sich als Warnung). */}
<div className="border-l-[3px] border-primary bg-surface-container px-4 py-3 flex gap-3 items-start">
  <span aria-hidden className="m3-icon text-[20px] leading-none text-primary">lightbulb</span>
  <div className="space-y-1.5">
    <p className="m3-eyebrow-muted">Lesehinweis</p>
    <p className="font-sans text-[13px] leading-relaxed text-on-surface-variant">
      Der Hauptbetrag gilt in heutiger Kaufkraft. Um real gleich zu bleiben, musst du ihn
      jedes Jahr um die Inflation anpassen (z. B. +2 %). Steigt dein Gehalt mit der
      Inflation, bleibt die Sparquote konstant.
    </p>
  </div>
</div>
```

- [ ] **Step 2: Sparquote-Indikator nie rot**

In `SparquoteEinordnung` (~Zeilen 363–375) die beiden Conditionals durch Konstanten ersetzen — die Bewertung übernimmt der Text (`savingsRateMessage`):

```tsx
// Vorher:
const accent =
  pct < recMin
    ? "border-primary text-on-surface"
    : pct <= recMax
      ? "border-success text-on-surface"
      : "border-error text-on-surface";

const indicatorColor =
  pct < recMin
    ? "bg-primary"
    : pct <= recMax
      ? "bg-success"
      : "bg-error";
// Nachher:
// Bewusst keine Ampelfarben: Rot würde „Fehler" signalisieren, dabei ist eine
// hohe Sparquote nur ein Hinweis. Die Einordnung übernimmt der Text darunter.
const accent = "border-primary text-on-surface";
const indicatorColor = "bg-primary";
```

- [ ] **Step 3: PDF-Emoji ersetzen**

Im PDF-Button (~Zeile 201–208):

```tsx
// Vorher:
  📄 Als PDF speichern
// Nachher:
  <span aria-hidden className="m3-icon text-[18px]">picture_as_pdf</span> Als PDF speichern
```

- [ ] **Step 4: Visuell prüfen**

Preview, Wizard bis Schritt 5 durchklicken: Lesehinweis neutral grau mit Lampen-Icon, Sparquote-Balken indigo, PDF-Button mit Symbol-Icon. Kein Pink, kein Rot (außer es liegt wirklich ein Fehler/fehlende Renteninfo vor).

- [ ] **Step 5: Tests laufen lassen und committen**

```powershell
npx vitest run
git add src/modules/pension/steps/ResultStep.tsx
git commit -m "fix(ui): Farbsemantik im Ergebnis (Lesehinweis neutral, Sparquote nie rot, PDF-Icon)"
```

---

## Phase 2 — Schritt-3-Gabelung

### Task 4: Store-Feld `pensionInfoChoice` (TDD)

**Files:**
- Modify: `src/modules/pension/state.ts`
- Test: `src/modules/pension/state.test.ts`

Neues persistiertes Feld: `"letter"` (Brief liegt vor), `"estimate"` (bewusst schätzen), `null` (noch keine Entscheidung). Bestandsdaten mit eingetragener Brutto-Rente gelten automatisch als `"letter"`.

- [ ] **Step 1: Failing Tests schreiben**

In `src/modules/pension/state.test.ts` anhängen:

```ts
describe("migrate — pensionInfoChoice", () => {
  it("startet ohne Entscheidung (null)", () => {
    const migrated = migrate({});
    expect(migrated.pensionInfoChoice).toBeNull();
  });

  it("leitet 'letter' ab, wenn bereits eine Brutto-Rente eingetragen ist", () => {
    const migrated = migrate({
      pensionInfo: { grossWithoutAdjustment: 1988 } as never,
    });
    expect(migrated.pensionInfoChoice).toBe("letter");
  });

  it("behält eine persistierte Entscheidung bei", () => {
    const migrated = migrate({ pensionInfoChoice: "estimate" });
    expect(migrated.pensionInfoChoice).toBe("estimate");
  });

  it("Module-Defaults starten mit null", () => {
    expect(PENSION_MODULE_DEFAULTS.pensionInfoChoice).toBeNull();
  });
});
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

```powershell
npx vitest run src/modules/pension/state.test.ts
```

Erwartet: FAIL (Property `pensionInfoChoice` existiert nicht / ist `undefined`).

- [ ] **Step 3: State erweitern**

In `src/modules/pension/state.ts`:

(a) Typ ergänzen (nach dem `PensionInfoInputs`-Typ):

```ts
/** Wie Schritt 3 beantwortet wurde: Brief liegt vor, bewusst geschätzt, oder noch offen. */
export type PensionInfoChoice = "letter" | "estimate" | null;
```

(b) Feld in `PensionModuleState` (nach `pensionInfo: PensionInfoInputs;`):

```ts
  pensionInfo: PensionInfoInputs;
  /** Gabelung Schritt 3: null = noch nicht entschieden. */
  pensionInfoChoice: PensionInfoChoice;
```

(c) Default in `PENSION_MODULE_DEFAULTS`:

```ts
export const PENSION_MODULE_DEFAULTS: PensionModuleState = {
  ...DEFAULT_PENSION_STATE,
  expectedStatePension: null,
  pensionInfoChoice: null,
};
```

(d) In `migrate()` direkt nach dem `cleaned.pensionInfo = { ... }`-Block:

```ts
  // Gabelung Schritt 3: Bestandsdaten mit eingetragener Brutto-Rente haben die
  // Frage implizit schon beantwortet — sonst bleibt eine persistierte Wahl
  // erhalten bzw. startet offen (null).
  if (cleaned.pensionInfoChoice === undefined) {
    cleaned.pensionInfoChoice =
      cleaned.pensionInfo.grossWithoutAdjustment !== null ? "letter" : null;
  }
```

Hinweis: Falls `DEFAULT_PENSION_STATE` in `presets.ts` den Typ `PensionModuleState` (ohne die neuen Felder) erfüllt und TypeScript meckert, dort NICHTS ändern — `PENSION_MODULE_DEFAULTS` ergänzt die Felder explizit. Sollte `presets.ts` selbst `PensionModuleState` als Typ-Annotation tragen und der Build deshalb scheitern, das Feld `pensionInfoChoice: null` analog dort im Objekt ergänzen.

- [ ] **Step 4: Tests laufen lassen — müssen bestehen**

```powershell
npx vitest run src/modules/pension/state.test.ts
```

Erwartet: PASS (alle, auch die bestehenden Migrationstests).

- [ ] **Step 5: Gesamte Suite + committen**

```powershell
npx vitest run
git add src/modules/pension/state.ts src/modules/pension/state.test.ts
git commit -m "feat(pension): pensionInfoChoice im Store (Gabelung Schritt 3)"
```

---

### Task 5: Gabelung in PensionInformationStep

**Files:**
- Modify: `src/modules/pension/steps/PensionInformationStep.tsx`

Der Schritt bekommt drei Zustände (Frage / Brief-Formular / Schätzung). Die Hochrechnungstabelle wandert hinter ein `<details>`. Wichtig: Der Wechsel-Link „Brief doch nicht zur Hand?" erscheint nur solange KEINE Brutto-Rente eingetragen ist — sonst entstünde der Widerspruch „Wahl = schätzen, aber Ableitung nutzt den Brief-Wert" (die Ableitung in `deriveExpectedStatePension` greift immer, wenn `grossWithoutAdjustment` gesetzt ist).

- [ ] **Step 1: Komponente umbauen**

`src/modules/pension/steps/PensionInformationStep.tsx` — die `PensionInformationStep`-Funktion komplett ersetzen (Imports und `CalcRow` bleiben unverändert):

```tsx
export function PensionInformationStep() {
  const profile = useProfile();
  const m = pensionStore.useState();

  const retirementAge = profile.retirementAge ?? PENSION_DEFAULTS.retirementAge;
  const currentYear = new Date().getFullYear();
  // Je nach Geburtstag bis zu 1 Jahrgang daneben — kostet bei der
  // Regelaltersgrenze maximal 2 Monate, bewusst kein eigenes Eingabefeld.
  const birthYear = profile.age !== undefined ? currentYear - profile.age : undefined;
  const regelalter = birthYear !== undefined ? regelaltersgrenze(birthYear) : PENSION_DEFAULTS.retirementAge;
  const contributionStartAge = m.contributionStartAge;

  const formatYearsDiff = (years: number): string => {
    const rounded = Math.round(years * 12) / 12;
    if (Number.isInteger(rounded)) return `${rounded.toFixed(0)} J.`;
    const months = Math.round(years * 12);
    return `${months} Mon.`;
  };

  const yearsToRetirement = Math.max(
    0,
    (profile.retirementAge ?? PENSION_DEFAULTS.retirementAge) - (profile.age ?? 0),
  );
  const netIncome = profile.netIncomeMonthly ?? 0;

  // Rohwerte liegen persistiert im Modul-State; die Netto-Rente wird daraus
  // live abgeleitet — Änderungen an Renteneintritt/Inflation schlagen durch.
  const { grossWithoutAdjustment, raise, deduction } = m.pensionInfo;
  const setInfo = (patch: Partial<PensionInfoInputs>) =>
    pensionStore.set({ pensionInfo: { ...m.pensionInfo, ...patch } });

  // Bei aktivem Override ist das Formular ausgeblendet — derived.projection
  // wird also genau dann gebraucht, wenn die Renteninfo-Quelle aktiv ist.
  const projection = deriveExpectedStatePension(profile, m, currentYear).projection;

  const fallbackEstimate = netIncome * PENSION_DEFAULTS.statePensionFactor;
  const stored = m.expectedStatePension;
  const hasOverride = stored !== null;
  const choice = m.pensionInfoChoice;

  const clearOverride = () => pensionStore.set({ expectedStatePension: null });
  const clearGross = () => setInfo({ grossWithoutAdjustment: null });
  const setChoice = (next: "letter" | "estimate") =>
    pensionStore.set({ pensionInfoChoice: next });

  return (
    <div className="space-y-5">
      <p className="font-sans text-[14px] leading-relaxed text-on-surface-variant">
        Wie hoch deine gesetzliche Rente voraussichtlich wird, steht in deiner{" "}
        <strong className="font-semibold">Renteninformation</strong> — dem Brief, den die
        Deutsche Rentenversicherung dir jedes Jahr schickt.
      </p>

      {hasOverride && (
        <div className="border-l-[3px] border-success bg-surface-container px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m3-eyebrow-muted">Manueller Wert aktiv</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-on-surface">
                {formatEUR(stored)}
                <span className="ml-1.5 font-sans text-[11px] uppercase tracking-[0.04em] text-on-surface-variant">
                  / Monat · heute
                </span>
              </p>
              <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-on-surface-variant">
                Die Rente wurde manuell festgelegt (Annahmen, Schritt 04) — Eingaben aus diesem
                Schritt werden ignoriert, bis du den Wert löschst.
              </p>
            </div>
            <Button variant="text" size="sm" onClick={clearOverride}>
              Ändern
            </Button>
          </div>
        </div>
      )}

      {!hasOverride && choice === null && (
        <div className="border-l-[3px] border-primary bg-surface-container px-4 py-4 space-y-3">
          <p className="font-sans text-[15px] font-medium text-on-surface">
            Hast du deine Renteninformation zur Hand?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setChoice("letter")}>Ja, Wert eintragen</Button>
            <Button variant="tonal" onClick={() => setChoice("estimate")}>
              Nein, erstmal schätzen
            </Button>
          </div>
          <p className="font-sans text-[13px] leading-relaxed text-on-surface-variant">
            Mit dem Wert aus dem Brief wird dein Ergebnis deutlich genauer — du kannst aber
            jederzeit mit einer Schätzung starten und den Wert später nachtragen.
          </p>
        </div>
      )}

      {!hasOverride && choice === "estimate" && (
        <div className="border-l-[3px] border-primary bg-surface-container px-4 py-4 space-y-3">
          <p className="m3-eyebrow-muted">Geschätzte gesetzliche Rente</p>
          <p className="font-sans text-[13px] leading-relaxed text-on-surface-variant">
            Wir schätzen deine Rente auf{" "}
            <strong className="tabular-nums text-on-surface">
              rund {formatEUR(fallbackEstimate)} im Monat
            </strong>{" "}
            — pauschal {formatPercent(PENSION_DEFAULTS.statePensionFactor)} deines
            Netto-Einkommens. Das ist grob; mit dem echten Wert aus deiner Renteninformation
            wird dein Ergebnis deutlich genauer.
          </p>
          <Button variant="tonal" size="sm" onClick={() => setChoice("letter")}>
            Wert aus dem Brief eintragen
          </Button>
        </div>
      )}

      {!hasOverride && choice === "letter" && (
        <>
          {retirementAge >= regelalter && (
            <div className="border-l-[3px] border-outline-variant bg-surface-container px-3 py-2">
              <p className="font-sans text-[13px] leading-relaxed text-on-surface-variant">
                Du gehst zur Regelaltersgrenze ({Number.isInteger(regelalter) ? regelalter : regelalter.toFixed(1)}) oder später in Rente —
                keine Abschläge, kein Beitragsjahre-Abschlag in der Hochrechnung. Die
                Regelaltersgrenze schätzen wir aus deinem Jahrgang (auf das Kalenderjahr genau).
              </p>
            </div>
          )}
          <div className="space-y-4 border border-on-surface-variant bg-surface p-4">
            <p className="font-sans text-[13px] leading-relaxed text-on-surface-variant">
              Such auf dem Brief den Wert{" "}
              <strong className="font-semibold">
                „voraussichtliche Regelaltersrente, wenn Sie wie bisher Beiträge zahlen"
              </strong>{" "}
              — meist in der Tabelle direkt unter dem heutigen Rentenwert.
            </p>
            <NumberInput
              label="Monatliche Rente laut Brief (der Wert ohne künftige Anpassungen)"
              value={grossWithoutAdjustment ?? undefined}
              onChange={(v) => setInfo({ grossWithoutAdjustment: v ?? null })}
              unit="€"
              min={0}
              required
              placeholder="z. B. 1.988"
            />
            <NumberInput
              label="Erwartete jährliche Rentenanpassung"
              value={raise * 100}
              onChange={(v) => v !== undefined && setInfo({ raise: v / 100 })}
              unit="%"
              min={PENSION_RAISE_RANGE.min * 100}
              max={PENSION_RAISE_RANGE.max * 100}
              hint="Finanztip-Faustformel: 1,5 % (Mitte zwischen den DRV-Hochrechnungen 1 % und 2 %). Pessimistisch eher Richtung 1 %."
            />
            <NumberInput
              label="Pauschalabzug für Steuern + KV/PV"
              value={deduction * 100}
              onChange={(v) => v !== undefined && setInfo({ deduction: v / 100 })}
              unit="%"
              min={PENSION_DEDUCTION_RANGE.min * 100}
              max={PENSION_DEDUCTION_RANGE.max * 100}
              hint="20 % = Faustformel Finanztip (mittlere Rente). 12 % bei niedriger Rente, 30 %+ bei höherer Rente mit Nebeneinkünften."
            />

            <details className="pt-1">
              <summary className="cursor-pointer text-[12px] font-medium uppercase tracking-[0.04em] text-primary hover:underline underline-offset-4 decoration-2">
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
                <p className="text-[13px] text-on-surface-variant">
                  Wirkt sich auf den Beitragsjahre-Faktor in der Hochrechnung aus.
                </p>
              </div>
            </details>

            {projection && grossWithoutAdjustment !== null && (
              <details className="pt-1">
                <summary className="cursor-pointer text-[12px] font-medium uppercase tracking-[0.04em] text-primary hover:underline underline-offset-4 decoration-2">
                  ▸ Wie rechnen wir das um?
                </summary>
                <div className="mt-3 border-l-[3px] border-success bg-surface-container px-4 py-3">
                  <p className="m3-eyebrow-muted">Hochrechnung · fließt live ins Ergebnis ein</p>
                  <dl className="mt-2 divide-y divide-outline-variant text-[12px] text-on-surface-variant">
                    <CalcRow
                      label="Brutto ohne Anpassung"
                      value={formatEUR(grossWithoutAdjustment)}
                    />
                    {projection.abschlagPct > 0 && (
                      <CalcRow
                        label={`− ${formatPercent(projection.abschlagPct)} Abschlag (${formatYearsDiff(regelalter - Math.max(retirementAge, STATE_PENSION_MIN_CLAIM_AGE))} vorzeitig, Anspruch ab ${STATE_PENSION_MIN_CLAIM_AGE})`}
                        value={`${formatEUR(grossWithoutAdjustment * (1 - projection.abschlagPct))} brutto`}
                      />
                    )}
                    {projection.beitragsFaktor < 1 && (
                      <CalcRow
                        label={`× ${formatPercent(projection.beitragsFaktor)} Beitragsjahre (${formatYearsDiff(retirementAge - contributionStartAge)}/${formatYearsDiff(regelalter - contributionStartAge)})`}
                        value={`${formatEUR(projection.grossAdjusted)} brutto angepasst`}
                      />
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
                      label={`÷ Inflation ${formatPercent(m.inflation)} · ${yearsToRetirement} J.`}
                      value={`${formatEUR(projection.netReal)} heute`}
                      highlight
                    />
                  </dl>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="font-sans text-[13px] leading-relaxed text-on-surface-variant">
                      Ändern sich Renteneintritt oder Inflation, rechnet das Ergebnis automatisch mit.
                    </p>
                    <Button variant="text" size="sm" onClick={clearGross}>
                      Zurücksetzen
                    </Button>
                  </div>
                </div>
              </details>
            )}
          </div>

          {grossWithoutAdjustment === null && (
            <button
              type="button"
              onClick={() => setChoice("estimate")}
              className="text-[12px] font-medium text-primary hover:underline underline-offset-4 decoration-2"
            >
              Brief doch nicht zur Hand? Erstmal schätzen →
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

Das aktuelle netReal-Ergebnis (z. B. „1.517 € heute") ist mit zugeklappter Tabelle nicht mehr sichtbar — das ist okay: Es erscheint prominent im Ergebnis-Schritt („Gesetzliche Rente · live aus deiner Renteninformation").

- [ ] **Step 2: Visuell prüfen (alle drei Zustände)**

Preview, zu Schritt 3 navigieren. Im Browser-Devtools-Ersatz (`preview_eval`) den State zurücksetzen, falls nötig: `localStorage.removeItem('finanzbot:module:pension'); location.reload()` (Key ggf. via `Object.keys(localStorage)` prüfen).
1. Frage-Zustand: zwei Buttons, kein Formular.
2. „Nein, erstmal schätzen": Schätz-Box mit 48-%-Wert, Button „Wert aus dem Brief eintragen".
3. „Ja, Wert eintragen": Formular; 1.988 eintragen → Hochrechnung hinter „Wie rechnen wir das um?" aufklappbar; Wechsel-Link verschwindet, sobald ein Wert drinsteht.

- [ ] **Step 3: Tests laufen lassen und committen**

```powershell
npx vitest run
git add src/modules/pension/steps/PensionInformationStep.tsx
git commit -m "feat(pension): Gabelung in Schritt 3 (Brief vorhanden / schaetzen)"
```

---

### Task 6: Ergebnis-Banner an die Gabelung koppeln (ResultStep.tsx)

**Files:**
- Modify: `src/modules/pension/steps/ResultStep.tsx`

Rotes „Achtung"-Banner nur noch, wenn der Schritt OHNE Entscheidung übersprungen wurde. Bei bewusster Schätzung: neutraler Hinweis.

- [ ] **Step 1: Banner-Bedingungen ändern**

In `src/modules/pension/steps/ResultStep.tsx` (~Zeile 135) den Fallback-Block ersetzen:

```tsx
// Vorher:
{statePension.source === "fallback" && (
  <div className="rounded-m3-md bg-error-container p-4 flex gap-3 items-start">
    ...
  </div>
)}
// Nachher:
{statePension.source === "fallback" && m.pensionInfoChoice !== "estimate" && (
  <div className="rounded-m3-md bg-error-container p-4 flex gap-3 items-start">
    <span aria-hidden className="text-xl leading-none">▲</span>
    <div className="space-y-1">
      <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-error">
        Achtung · Renteninformation fehlt
      </p>
      <p className="text-[13px] leading-relaxed text-on-surface">
        Wir rechnen mit der Faustformel <strong className="font-semibold">48 % vom Netto</strong>{" "}
        ={" "}
        <span className="tabular-nums">{formatEUR(result.needToday - result.gapToday)}</span> pro
        Monat. Das ist eine sehr grobe Schätzung und kann je nach Erwerbsbiografie deutlich
        daneben liegen. Trag in{" "}
        <strong className="font-semibold">Schritt 03 (Renteninformation)</strong> deinen echten
        Wert ein.
      </p>
    </div>
  </div>
)}

{statePension.source === "fallback" && m.pensionInfoChoice === "estimate" && (
  <div className="border-l-[3px] border-primary bg-surface-container px-4 py-3">
    <p className="m3-eyebrow-muted">Gesetzliche Rente · geschätzt</p>
    <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-on-surface-variant">
      Dein Ergebnis basiert auf einer Schätzung der gesetzlichen Rente:{" "}
      <span className="tabular-nums font-semibold text-on-surface">
        {formatEUR(result.needToday - result.gapToday)}
      </span>{" "}
      pro Monat — pauschal 48 % deines Netto-Einkommens. Mit dem Wert aus deiner
      Renteninformation (Schritt 3) wird es deutlich genauer.
    </p>
  </div>
)}
```

- [ ] **Step 2: Visuell prüfen**

Preview: (a) Mit Wahl „schätzen" → neutraler Hinweis im Ergebnis. (b) Pension-Modul-State löschen, Schritt 3 per Chip-Navigation überspringen geht nicht (Chips nur rückwärts) — stattdessen: Frage-Zustand stehen lassen, „Weiter" klicken bis Ergebnis → rotes Banner, weil `choice === null`.

- [ ] **Step 3: Tests laufen lassen und committen**

```powershell
npx vitest run
git add src/modules/pension/steps/ResultStep.tsx
git commit -m "feat(pension): Ergebnis-Banner unterscheidet bewusste Schaetzung von uebersprungenem Schritt"
```

---

## Phase 3 — Sprache & Labels

### Task 7: Klartext auf Welcome, Annahmen, Einkommen

**Files:**
- Modify: `src/components/WelcomeScreen.tsx`
- Modify: `src/modules/pension/steps/AssumptionsStep.tsx`
- Modify: `src/modules/pension/steps/IncomeStep.tsx`

- [ ] **Step 1: WelcomeScreen-Intro entjargonisieren**

In `src/components/WelcomeScreen.tsx` (~Zeilen 20–25):

```tsx
// Vorher:
<p className="max-w-prose text-[16px] leading-[1.6] text-on-surface-variant">
  In fünf Schritten errechnen wir deine Rentenlücke und die monatliche Sparrate, mit
  der du sie schließt — nach der konservativen Finanztip-Methodik (gemischtes
  Portfolio, real gerechnet, Annuität über 30 Jahre). Anlage-Allokation,
  Auszahlungsmethode und alle Annahmen kannst du frei anpassen.
</p>
// Nachher:
<p className="max-w-prose text-[16px] leading-[1.6] text-on-surface-variant">
  In fünf Schritten errechnen wir deine Rentenlücke und die monatliche Sparrate, mit
  der du sie schließt. Wir rechnen bewusst vorsichtig: mit gemischter Geldanlage, nach
  Abzug der Inflation, und so, dass dein Geld bis Alter 90 reicht. Alle Annahmen
  kannst du später anpassen.
</p>
```

- [ ] **Step 2: Annahmen-Zusammenfassung in ganze Sätze**

In `src/modules/pension/steps/AssumptionsStep.tsx` (~Zeilen 42–49):

```tsx
// Vorher:
<p className="mt-1.5 font-sans text-[13px] leading-relaxed text-on-surface-variant">
  Konservative Standard-Annahmen: gemischtes Portfolio,{" "}
  <span className="tabular-nums">3 %</span> real Anspar,{" "}
  <span className="tabular-nums">1 %</span> real Auszahl, Annuität bis Alter{" "}
  <span className="tabular-nums">90</span>,{" "}
  <span className="tabular-nums">12 %</span> Steuer-Puffer. Du kannst alle Annahmen unten
  frei anpassen — inklusive Auszahlungsmethode und Anlage-Allokation.
</p>
// Nachher:
<p className="mt-1.5 font-sans text-[13px] leading-relaxed text-on-surface-variant">
  Wir rechnen mit vorsichtigen Standard-Annahmen: Dein Erspartes wächst mit{" "}
  <span className="tabular-nums">3 %</span> pro Jahr über der Inflation, im Ruhestand
  mit <span className="tabular-nums">1 %</span>. Das Geld soll bis Alter{" "}
  <span className="tabular-nums">90</span> reichen, und für spätere Steuern planen wir{" "}
  <span className="tabular-nums">12 %</span> Reserve ein. Unten kannst du alles
  anpassen — auch die Geldanlage selbst.
</p>
```

- [ ] **Step 3: Hilfstext „Bedarf in Rente" sichtbar machen**

In `src/modules/pension/steps/IncomeStep.tsx` (~Zeile 31):

```tsx
// Vorher:
hint="Faustformel: 80 %"
// Nachher:
hint="Faustformel: 80 % — viele Ausgaben (Pendeln, Sparen für die Rente) fallen im Ruhestand weg."
```

- [ ] **Step 4: Visuell prüfen**

Preview: Welcome-Screen (localStorage-Key `finanzbot:welcomeSeen` entfernen + reload), Schritt 2 und Schritt 4 gegenlesen — keine Begriffe „Annuität", „Allokation", „real" mehr außerhalb der Disclosures.

- [ ] **Step 5: Tests laufen lassen und committen**

```powershell
npx vitest run
git add src/components/WelcomeScreen.tsx src/modules/pension/steps/AssumptionsStep.tsx src/modules/pension/steps/IncomeStep.tsx
git commit -m "feat(ui): Klartext statt Fachjargon auf Welcome, Annahmen und Einkommen"
```

---

### Task 8: Label-Ausdünnung & Schriftgrößen

**Files:**
- Modify: `src/modules/pension/steps/ResultStep.tsx`
- Modify: `src/styles/globals.css`
- Modify: `src/components/ui/Field.tsx`

- [ ] **Step 1: Hero-Karte entrümpeln („OUTPUT · 01" weg, Unterzeilen Klartext)**

In `src/modules/pension/steps/ResultStep.tsx`, Hero-Karte (~Zeilen 187–248):

(a) Eyebrow entfernen und Kopf vereinfachen:

```tsx
// Vorher:
<div>
  <span className="m3-eyebrow bg-primary text-on-primary">Output · 01</span>
  <div className="mt-2 flex items-center gap-1.5">
    <p className="text-[12px] uppercase tracking-[0.08em] opacity-85">
      Empfohlene monatliche Sparrate
    </p>
    <InfoTooltip
      content={tooltips.monthlySavings}
      label="Erklärung zu Empfohlene monatliche Sparrate"
    />
  </div>
</div>
// Nachher:
<div className="flex items-center gap-1.5">
  <p className="text-[12px] uppercase tracking-[0.08em] opacity-85">
    Empfohlene monatliche Sparrate
  </p>
  <InfoTooltip
    content={tooltips.monthlySavings}
    label="Erklärung zu Empfohlene monatliche Sparrate"
  />
</div>
```

(b) Caps-Unterzeile unter der Display-Zahl in Klartext:

```tsx
// Vorher:
<span className="text-[12px] uppercase tracking-[0.08em] opacity-85">
  Monatlich · Real · Heutige Kaufkraft
</span>
// Nachher:
<span className="text-[13px] opacity-85">pro Monat, in heutiger Kaufkraft</span>
```

(c) Alternative in Klartext:

```tsx
// Vorher:
<p className="text-[11px] uppercase tracking-[0.08em] opacity-85">Alternativ · Nominal fix</p>
// Nachher:
<p className="text-[12px] font-medium opacity-85">Alternative: fester Betrag</p>
```

und die zugehörige Unterzeile:

```tsx
// Vorher:
<p className="mt-1 text-[12px] leading-snug opacity-85">
  gleichbleibender Betrag, ohne jährliche Inflationsanpassung
</p>
// Nachher:
<p className="mt-1 text-[12px] leading-snug opacity-85">
  jeden Monat gleich viel, dafür ohne jährliche Erhöhung
</p>
```

(d) Das `label`-Attribut des zugehörigen InfoTooltips angleichen:

```tsx
// Vorher:
label="Erklärung zu Alternativ · Nominal fix"
// Nachher:
label="Erklärung zu Alternative: fester Betrag"
```

- [ ] **Step 2: Eyebrow-Schrift vergrößern**

In `src/styles/globals.css` (~Zeilen 58–65), in BEIDEN Klassen `.m3-eyebrow` und `.m3-eyebrow-muted`: `text-[11px]` → `text-[12px]`.

- [ ] **Step 3: Field-Hints auf 13 px**

In `src/components/ui/Field.tsx` (~Zeile 50):

```tsx
// Vorher:
<p className="text-[12px] leading-snug text-on-surface-variant">{hint}</p>
// Nachher:
<p className="text-[13px] leading-snug text-on-surface-variant">{hint}</p>
```

- [ ] **Step 4: Stat-Karten-Hints auf 13 px**

In `src/modules/pension/steps/ResultStep.tsx`, `Stat`-Komponente (~Zeile 432):

```tsx
// Vorher:
<div className="mt-2 text-[12px] leading-snug text-on-surface-variant">{hint}</div>
// Nachher:
<div className="mt-2 text-[13px] leading-snug text-on-surface-variant">{hint}</div>
```

- [ ] **Step 5: Visuell prüfen**

Preview, Ergebnis-Schritt: kein „OUTPUT · 01" mehr, Unterzeilen in Mixed-Case, Eyebrows minimal größer, kein Layout-Bruch (auch auf `mobile` prüfen — die Hero-Zahl darf nicht umbrechen).

- [ ] **Step 6: Tests laufen lassen und committen**

```powershell
npx vitest run
git add src/modules/pension/steps/ResultStep.tsx src/styles/globals.css src/components/ui/Field.tsx
git commit -m "feat(ui): Labels ausgeduennt und Hilfstexte vergroessert"
```

---

## Phase 4 — Rundung

### Task 9: `formatEURRounded` (TDD)

**Files:**
- Modify: `src/lib/format.ts`
- Test: `src/lib/format.test.ts`

- [ ] **Step 1: Failing Tests schreiben**

In `src/lib/format.test.ts` — Import erweitern und describe-Block anhängen:

```ts
import { formatEUR, formatEURRounded, formatPercent, formatNumber, parseLocalNumber } from "./format";
```

```ts
describe("formatEURRounded", () => {
  it("rundet auf 5-Euro-Schritte mit ≈-Präfix", () => {
    expect(formatEURRounded(783.48, 5)).toBe("≈ 785 €");
    expect(formatEURRounded(782.4, 5)).toBe("≈ 780 €");
  });

  it("rundet Kapitalbeträge auf Tausender", () => {
    expect(formatEURRounded(430952, 1000)).toBe("≈ 431.000 €");
  });

  it("default-Schritt ist 5", () => {
    expect(formatEURRounded(99)).toBe("≈ 100 €");
  });

  it("returns dash for non-finite", () => {
    expect(formatEURRounded(Number.NaN)).toBe("—");
  });
});
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

```powershell
npx vitest run src/lib/format.test.ts
```

Erwartet: FAIL („formatEURRounded is not exported" o. ä.).

- [ ] **Step 3: Helper implementieren**

In `src/lib/format.ts` nach `formatEUR` einfügen:

```ts
/**
 * Gerundete Anzeige für Projektionswerte: „≈ 785 €". Das ≈ kommuniziert, dass
 * eine Jahrzehnte-Projektion keine centgenaue Antwort hat — exakte Werte
 * bleiben im Rechenweg und im PDF.
 */
export function formatEURRounded(value: number, step = 5): string {
  if (!Number.isFinite(value) || step <= 0) return "—";
  return `≈ ${eurFormatter.format(Math.round(value / step) * step)}`;
}
```

- [ ] **Step 4: Tests laufen lassen — müssen bestehen**

```powershell
npx vitest run src/lib/format.test.ts
```

Erwartet: PASS.

- [ ] **Step 5: Committen**

```powershell
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "feat(format): formatEURRounded fuer gerundete Projektionswerte"
```

---

### Task 10: Gerundete Schlagzahlen im Ergebnis

**Files:**
- Modify: `src/modules/pension/steps/ResultStep.tsx`

Nur die Anzeige der Schlagzahlen rundet. Unverändert exakt: `PensionRechenweg`, `PensionPrintSheet`, „So entsteht die Empfehlung", alle Berechnungen, der Profil-Spiegelwert.

- [ ] **Step 1: Import erweitern**

```tsx
// Vorher:
import { formatEUR, formatPercent } from "../../../lib/format";
// Nachher:
import { formatEUR, formatEURRounded, formatPercent } from "../../../lib/format";
```

- [ ] **Step 2: Hero-Zahl runden**

```tsx
// Vorher:
<p className="m3-display text-on-primary-container">
  {formatEUR(result.monthlySavings, true)}
</p>
// Nachher:
<p className="m3-display text-on-primary-container">
  {formatEURRounded(result.monthlySavings)}
</p>
```

- [ ] **Step 3: Alternative runden**

```tsx
// Vorher:
<p className="mt-1 text-2xl font-semibold tabular-nums">
  {formatEUR(result.fixedNominalSavings, true)}
</p>
// Nachher:
<p className="mt-1 text-2xl font-semibold tabular-nums">
  {formatEURRounded(result.fixedNominalSavings)}
</p>
```

- [ ] **Step 4: Kapitalbedarf-Stat auf Tausender runden**

```tsx
// Vorher:
<Stat
  label="Kapitalbedarf (heutige Kaufkraft)"
  value={formatEUR(result.capitalNeeded)}
// Nachher:
<Stat
  label="Kapitalbedarf (heutige Kaufkraft)"
  value={formatEURRounded(result.capitalNeeded, 1000)}
```

- [ ] **Step 5: Visuell prüfen**

Preview, Ergebnis: Hero zeigt „≈ 785 €" (bei Beispieldaten), Kapitalbedarf „≈ 431.000 €". Rechenweg im Detail und „So entsteht die Empfehlung" zeigen weiterhin exakte Werte. Auf `mobile` prüfen, dass die Hero-Zahl mit ≈ nicht umbricht.

- [ ] **Step 6: Tests laufen lassen und committen**

```powershell
npx vitest run
git add src/modules/pension/steps/ResultStep.tsx
git commit -m "feat(pension): Schlagzahlen im Ergebnis gerundet anzeigen"
```

---

## Abschluss

### Task 11: Gesamtverifikation & PR

- [ ] **Step 1: Komplette Test-Suite**

```powershell
npx vitest run
```

Erwartet: alle Tests PASS.

- [ ] **Step 2: Build prüfen**

```powershell
npm run build
```

Erwartet: Build ohne TypeScript-Fehler.

- [ ] **Step 3: End-to-End-Durchklick im Preview**

Desktop (1280 px) UND Mobile (375 px), jeweils mit frischem State (`localStorage.clear(); location.reload()`):
1. Welcome-Screen → Texte ohne Jargon.
2. Schritt 1–2 ausfüllen.
3. Schritt 3: Gabelung testen (beide Pfade).
4. Schritt 4: neuer Zusammenfassungstext.
5. Schritt 5: gerundete Zahlen, neutrale Farben, keine „OUTPUT · 01"-Labels.
6. Header: Mobile ohne Umbruch/Abschneiden.

- [ ] **Step 4: PR erstellen**

```powershell
git push -u origin claude/laienfreundliche-ui
gh pr create --title "feat(ui): Laienfreundliche Oberflaeche" --body "Setzt die Spec docs/superpowers/specs/2026-06-11-laienfreundliche-oberflaeche-design.md um: Gabelung in Schritt 3, Klartext statt Jargon, gerundete Schlagzahlen, korrigierte Farbsemantik, Mobile-Header-Fix, Label-Ausduennung.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```
