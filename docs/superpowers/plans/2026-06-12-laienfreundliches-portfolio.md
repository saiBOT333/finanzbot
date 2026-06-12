# Laienfreundliches Portfolio-Modul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Laienfreundlichkeits-Muster des Rentenrechners (Indigo/Grau-Farben, Klartext, Hero-Antwort, Werkstatt-Stil, kein Modal) auf das Portfolio-Modul übertragen.

**Architecture:** Reine Frontend-Änderungen. Eine neue Inline-Komponente (`FragebogenSection`) ersetzt das Modal, `ErgebnisStep` wird mit Hero-Karte neu aufgebaut, ein testgetriebener Helper (`isComplete`) kommt in `questionnaire.ts`. Spec: `docs/superpowers/specs/2026-06-12-laienfreundliches-portfolio-design.md`.

**Tech Stack:** React 18, TypeScript, Tailwind (M3-Tokens), Vitest. Tests: `npx vitest run`. Preview: „FinanzBot M3" (Port 5174).

**Branch:** Vor Task 1 anlegen: `git checkout -b claude/laienfreundliches-portfolio`

**Konventionen:** UI-Texte Deutsch mit Umlauten; Commit-Subjects ASCII (Conventional Commits); `formatEURRounded` existiert bereits in `src/lib/format.ts` (liefert „≈ 6.000 €").

---

### Task 1: Branch + Eyebrow-Fix in der App-Shell

**Files:**
- Modify: `src/App.tsx`

Das Eyebrow „Modul Vorsorge" über dem Modulkopf ist hartkodiert und bei Portfolio falsch. Es wird ersatzlos gestrichen (Label-Ausdünnung).

- [ ] **Step 1: Branch anlegen**

```powershell
git checkout -b claude/laienfreundliches-portfolio
```

- [ ] **Step 2: Eyebrow entfernen**

In `src/App.tsx` (~Zeile 156) innerhalb von `<div className="space-y-3">`:

```tsx
// Vorher:
<div className="space-y-3">
  <span className="m3-eyebrow">Modul Vorsorge</span>
  <h2 className="flex items-center gap-3 text-[28px] sm:text-[48px] ...">
// Nachher (Zeile mit dem span ersatzlos löschen):
<div className="space-y-3">
  <h2 className="flex items-center gap-3 text-[28px] sm:text-[48px] ...">
```

- [ ] **Step 3: Visuell prüfen**

Preview starten, beide Module anklicken: kein „MODUL VORSORGE"-Pill mehr über der Headline, Layout intakt.

- [ ] **Step 4: Tests + Commit**

```powershell
npx vitest run
git add src/App.tsx
git commit -m "fix(ui): hartkodiertes Modul-Vorsorge-Eyebrow entfernt"
```

---

### Task 2: `isComplete()` in questionnaire.ts (TDD)

**Files:**
- Modify: `src/modules/portfolio/questionnaire.ts`
- Test: `src/modules/portfolio/questionnaire.test.ts`

Type-Guard, der prüft, ob alle fünf Fragen beantwortet sind. Wichtig: Punktwert `0` zählt als beantwortet (nur `undefined` ist offen).

- [ ] **Step 1: Failing Tests schreiben**

In `src/modules/portfolio/questionnaire.test.ts` — Import erweitern und describe-Block anhängen:

```ts
import { recommendEquityPercent, isComplete, QUESTIONS } from "./questionnaire";
```

```ts
describe("isComplete", () => {
  it("leeres Objekt ist unvollständig", () => {
    expect(isComplete({})).toBe(false);
  });

  it("teilweise beantwortet ist unvollständig", () => {
    expect(isComplete({ horizont: 2, schwankung: 1 })).toBe(false);
  });

  it("vollständig beantwortet ist komplett — Punktwert 0 zählt als beantwortet", () => {
    expect(
      isComplete({ horizont: 0, schwankung: 0, notgroschen: 0, erfahrung: 0, einkommen: 0 }),
    ).toBe(true);
  });

  it("wirkt als Type-Guard für recommendEquityPercent", () => {
    const a: Partial<FragebogenAntworten> = {
      horizont: 3, schwankung: 3, notgroschen: 2, erfahrung: 2, einkommen: 2,
    };
    if (isComplete(a)) {
      expect(recommendEquityPercent(a)).toBe(90);
    } else {
      throw new Error("expected complete");
    }
  });
});
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

```powershell
npx vitest run src/modules/portfolio/questionnaire.test.ts
```

Erwartet: FAIL („isComplete is not a function" o. ä.).

- [ ] **Step 3: Helper implementieren**

In `src/modules/portfolio/questionnaire.ts` ans Ende anfügen:

```ts
/** Alle fünf Fragen beantwortet? Punktwert 0 zählt als beantwortet. */
export function isComplete(a: Partial<FragebogenAntworten>): a is FragebogenAntworten {
  return QUESTIONS.every((q) => a[q.key] !== undefined);
}
```

- [ ] **Step 4: Tests laufen lassen — müssen bestehen**

```powershell
npx vitest run src/modules/portfolio/questionnaire.test.ts
```

Erwartet: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/modules/portfolio/questionnaire.ts src/modules/portfolio/questionnaire.test.ts
git commit -m "feat(portfolio): isComplete-Typeguard fuer den Fragebogen"
```

---

### Task 3: Fragebogen inline statt Modal + ZielquoteStep-Umbau

**Files:**
- Create: `src/modules/portfolio/steps/FragebogenSection.tsx`
- Modify: `src/modules/portfolio/steps/ZielquoteStep.tsx` (komplett ersetzen)
- Delete: `src/modules/portfolio/steps/FragebogenModal.tsx`

- [ ] **Step 1: FragebogenSection erstellen**

`src/modules/portfolio/steps/FragebogenSection.tsx` (neu):

```tsx
import { useState } from "react";
import { QUESTIONS, recommendEquityPercent, isComplete } from "../questionnaire";
import type { FragebogenAntworten, FragebogenSchluessel } from "../types";
import { Button } from "../../../components/ui/Button";
import { ChoiceChip } from "../../../components/ui/ChoiceChip";

type Props = {
  initial?: FragebogenAntworten;
  onApply: (antworten: FragebogenAntworten, empfehlung: number) => void;
};

/**
 * Inline-Risiko-Fragebogen (ersetzt das frühere Modal — die App ist sonst
 * modalfrei). Startet bewusst ohne Vorauswahl: Die Empfehlung erscheint erst,
 * wenn alle fünf Fragen beantwortet sind — kein Anker-Effekt.
 */
export function FragebogenSection({ initial, onApply }: Props) {
  const [antworten, setAntworten] = useState<Partial<FragebogenAntworten>>(initial ?? {});

  const setAnswer = (key: FragebogenSchluessel, punkte: number) =>
    setAntworten({ ...antworten, [key]: punkte });

  const complete = isComplete(antworten);
  const offen = QUESTIONS.filter((q) => antworten[q.key] === undefined).length;

  return (
    <div className="space-y-5 border border-outline-variant bg-surface p-4">
      <ol className="space-y-5">
        {QUESTIONS.map((q) => (
          <li key={q.key}>
            <p className="mb-2 font-sans text-[14px] font-medium text-on-surface">{q.title}</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => (
                <ChoiceChip
                  key={o.label}
                  selected={antworten[q.key] === o.punkte}
                  onClick={() => setAnswer(q.key, o.punkte)}
                >
                  {o.label}
                </ChoiceChip>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
        {complete ? (
          <p className="font-sans text-[14px] text-on-surface">
            Empfohlene Aktienquote:{" "}
            <strong className="tabular-nums">{recommendEquityPercent(antworten)} %</strong>
          </p>
        ) : (
          <p className="font-sans text-[13px] text-on-surface-variant">
            Noch {offen} {offen === 1 ? "Frage" : "Fragen"} offen.
          </p>
        )}
        <Button
          disabled={!complete}
          onClick={() => {
            if (isComplete(antworten)) {
              onApply(antworten, recommendEquityPercent(antworten));
            }
          }}
        >
          Übernehmen
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ZielquoteStep komplett ersetzen**

`src/modules/portfolio/steps/ZielquoteStep.tsx` — gesamten Inhalt ersetzen:

```tsx
import { useState } from "react";
import { portfolioStore } from "../state";
import { NumberInput } from "../../../components/NumberInput";
import { FragebogenSection } from "./FragebogenSection";

export function ZielquoteStep() {
  const state = portfolioStore.useState();
  const [showFragebogen, setShowFragebogen] = useState(false);

  const setTarget = (value: number | undefined) => {
    const v = value ?? 0;
    const clamped = Math.max(0, Math.min(100, v));
    portfolioStore.set({ targetEquityPercent: clamped });
  };

  return (
    <div className="space-y-4">
      <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
        Wie viel Prozent deines Geldes soll in Aktien stecken? Der Rest bleibt im sicheren
        Teil (Tagesgeld, Anleihen, Geldmarkt). Mehr Aktien = mehr erwartete Rendite, aber
        stärkere Schwankungen.
      </p>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="mb-1 flex justify-between text-[12px] uppercase tracking-[0.04em] text-on-surface-variant">
            <span>Aktien</span>
            <span>Sicherer Teil</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={state.targetEquityPercent}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="m3-slider"
            style={{
              background: `linear-gradient(to right, var(--m3-primary) 0%, var(--m3-primary) ${state.targetEquityPercent}%, var(--m3-outline-variant) ${state.targetEquityPercent}%, var(--m3-outline-variant) 100%)`,
            }}
            aria-label="Gewünschte Aktienquote"
          />
        </div>
        <div className="w-32">
          <NumberInput
            label="Wert"
            value={state.targetEquityPercent}
            onChange={setTarget}
            unit="%"
            min={0}
            max={100}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowFragebogen((v) => !v)}
        className="text-[12px] font-medium uppercase tracking-[0.04em] text-primary hover:underline underline-offset-4 decoration-2"
      >
        {showFragebogen
          ? "▾ Fragebogen ausblenden"
          : "▸ Unsicher? Quote vorschlagen lassen — 5 kurze Fragen"}
      </button>

      {!showFragebogen && state.fragebogen && (
        <p className="text-xs text-on-surface-variant">
          Vorschlag aus Fragebogen aktiv — Slider übernommen.
        </p>
      )}

      {showFragebogen && (
        <FragebogenSection
          initial={state.fragebogen}
          onApply={(antworten, empfehlung) => {
            portfolioStore.set({
              fragebogen: antworten,
              targetEquityPercent: empfehlung,
            });
            setShowFragebogen(false);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Modal löschen**

```powershell
git rm src/modules/portfolio/steps/FragebogenModal.tsx
```

- [ ] **Step 4: Visuell prüfen**

Preview, Portfolio-Modul, Schritt 2:
- Slider indigo/grau, Labels ohne Rot/Grün.
- Toggle öffnet den Fragebogen inline (kein Overlay); alle Fragen starten unbeantwortet.
- „Übernehmen" deaktiviert, Zähler „Noch 5 Fragen offen" sichtbar; nach Beantwortung aller Fragen erscheint die Empfehlung, Übernehmen setzt den Slider und klappt zu.

- [ ] **Step 5: Tests + Commit**

```powershell
npx vitest run
git add src/modules/portfolio/steps/FragebogenSection.tsx src/modules/portfolio/steps/ZielquoteStep.tsx
git commit -m "feat(portfolio): Fragebogen inline ohne Vorauswahl, Slider in Indigo/Grau"
```

---

### Task 4: ErgebnisStep mit Hero-Antwort neu aufbauen

**Files:**
- Modify: `src/modules/portfolio/steps/ErgebnisStep.tsx` (komplett ersetzen)

- [ ] **Step 1: Komponente ersetzen**

`src/modules/portfolio/steps/ErgebnisStep.tsx` — gesamten Inhalt ersetzen:

```tsx
import { useProfile } from "../../../lib/profile/useProfile";
import { Card } from "../../../components/ui/Card";
import { portfolioStore } from "../state";
import { computeBreakdown } from "../classify";
import { computeRebalance } from "../rebalance";
import { formatEUR, formatEURRounded } from "../../../lib/format";

function StackedBar({ riskyPercent }: { riskyPercent: number }) {
  const safePercent = 100 - riskyPercent;
  return (
    <div className="flex h-6 w-full overflow-hidden rounded-m3-pill border border-outline-variant">
      <div
        className="bg-primary"
        style={{ width: `${riskyPercent}%` }}
        aria-label={`Aktien ${riskyPercent.toFixed(0)} %`}
      />
      <div
        className="bg-outline-variant"
        style={{ width: `${safePercent}%` }}
        aria-label={`Sicher ${safePercent.toFixed(0)} %`}
      />
    </div>
  );
}

/** „15 Prozentpunkte" bzw. „2,5 Prozentpunkte" — ohne Nachkommastelle, wenn ganzzahlig. */
function formatPp(pp: number): string {
  const rounded = Math.round(Math.abs(pp) * 10) / 10;
  const text = Number.isInteger(rounded)
    ? rounded.toFixed(0)
    : rounded.toFixed(1).replace(".", ",");
  return `${text} Prozentpunkte`;
}

/** Kleiner Farbpunkt, der Tabellenzeile und Balkenfarbe verknüpft. */
function ColorDot({ tone }: { tone: "equity" | "safe" }) {
  return (
    <span
      aria-hidden
      className={`mr-2 inline-block h-2.5 w-2.5 rounded-[3px] align-middle ${
        tone === "equity" ? "bg-primary" : "bg-outline-variant"
      }`}
    />
  );
}

export function ErgebnisStep() {
  const profile = useProfile();
  const state = portfolioStore.useState();
  const breakdown = computeBreakdown(profile.assets ?? []);
  const rebalance = computeRebalance(breakdown, state.targetEquityPercent);
  const hasAssets = breakdown.consideredEuro > 0;

  const targetRiskyEuro = (breakdown.consideredEuro * state.targetEquityPercent) / 100;
  const targetSafeEuro = breakdown.consideredEuro - targetRiskyEuro;
  const deltaRisky = targetRiskyEuro - breakdown.riskyEuro;
  const deltaSafe = targetSafeEuro - breakdown.safeEuro;
  const fmtDelta = (v: number) =>
    (v > 0 ? "+" : v < 0 ? "−" : "±") + formatEUR(Math.round(Math.abs(v)));
  const safePercent = 100 - state.targetEquityPercent;
  const currentSafePercent = 100 - breakdown.currentEquityPercent;

  return (
    <div className="space-y-6">
      {!hasAssets && (
        <Card>
          <p className="m3-eyebrow-muted">Hinweis</p>
          <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-on-surface-variant">
            Noch keine Empfehlung möglich — trag in Schritt 1 mindestens eine Position ein
            (Tagesgeld, ETF-Depot, Festgeld …).
          </p>
        </Card>
      )}

      {hasAssets && rebalance.direction === "shift-to-safe" && (
        <Card variant="hero">
          <p className="text-[12px] uppercase tracking-[0.08em] opacity-85">Deine Empfehlung</p>
          <p className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[34px]">
            Verschiebe {formatEURRounded(rebalance.deltaAmount, 100)} von Aktien in den
            sicheren Teil.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed opacity-85">
            Du liegst {formatPp(rebalance.deltaPercent)} über deiner Wunsch-Aktienquote.
            Sicherer Teil = Tagesgeld, Anleihen, Geldmarkt.
          </p>
        </Card>
      )}

      {hasAssets && rebalance.direction === "shift-to-equity" && (
        <Card variant="hero">
          <p className="text-[12px] uppercase tracking-[0.08em] opacity-85">Deine Empfehlung</p>
          <p className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[34px]">
            Verschiebe {formatEURRounded(rebalance.deltaAmount, 100)} in Aktien
            (z. B. Welt-ETF).
          </p>
          <p className="mt-3 text-[13px] leading-relaxed opacity-85">
            Du liegst {formatPp(rebalance.deltaPercent)} unter deiner Wunsch-Aktienquote.
          </p>
        </Card>
      )}

      {hasAssets && rebalance.direction === "balanced" && (
        <Card>
          <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-success">
            ◯ Alles im Lot
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-on-surface">
            Nichts zu tun.
          </p>
          <p className="mt-3 font-sans text-[13.5px] leading-relaxed text-on-surface-variant">
            Deine Aufteilung weicht weniger als 1 Prozentpunkt von deinem Wunsch ab.
          </p>
        </Card>
      )}

      {hasAssets && (
        <section>
          <p className="m3-eyebrow-muted">Ist-Aufteilung</p>
          <div className="mt-3">
            <StackedBar riskyPercent={breakdown.currentEquityPercent} />
          </div>
          <p className="mt-2 font-sans text-[14px] text-on-surface">
            <strong className="tabular-nums">{breakdown.currentEquityPercent.toFixed(1)} %</strong>{" "}
            Aktien ({formatEUR(breakdown.riskyEuro)}) · {formatEUR(breakdown.safeEuro)} sicherer
            Teil
          </p>
          {breakdown.excludedEuro > 0 && (
            <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">
              Zusätzlich {formatEUR(breakdown.excludedEuro)} außerhalb der Aufteilung
              (z. B. Immobilie, bAV) — lässt sich nicht einfach umschichten und wird deshalb
              separat ausgewiesen.
            </p>
          )}
        </section>
      )}

      {hasAssets && (
        <section>
          <p className="m3-eyebrow-muted">Wunsch-Aufteilung</p>
          <div className="mt-3">
            <StackedBar riskyPercent={state.targetEquityPercent} />
          </div>
          <p className="mt-2 font-sans text-[14px] text-on-surface">
            <strong className="tabular-nums">{state.targetEquityPercent} %</strong> Aktien ·{" "}
            {100 - state.targetEquityPercent} % sicherer Teil
          </p>
        </section>
      )}

      {hasAssets && (
        <section className="border border-outline-variant bg-surface-container p-4">
          <p className="m3-eyebrow-muted">Die Rechnung dahinter</p>
          <table className="mt-3 w-full font-sans text-sm tabular-nums">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.04em] text-on-surface-variant">
                <th className="pb-2 text-left font-medium"></th>
                <th className="pb-2 text-right font-medium">Aktuell</th>
                <th className="pb-2 text-right font-medium">Ziel</th>
                <th className="pb-2 text-right font-medium">Differenz</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-outline-variant">
                <td className="py-2 text-on-surface">
                  <ColorDot tone="equity" />
                  Aktien
                </td>
                <td className="py-2 text-right">
                  {formatEUR(breakdown.riskyEuro)}{" "}
                  <span className="text-on-surface-variant">
                    ({breakdown.currentEquityPercent.toFixed(1)} %)
                  </span>
                </td>
                <td className="py-2 text-right">
                  {formatEUR(Math.round(targetRiskyEuro))}{" "}
                  <span className="text-on-surface-variant">
                    ({state.targetEquityPercent.toFixed(1)} %)
                  </span>
                </td>
                <td className="py-2 text-right font-medium">{fmtDelta(deltaRisky)}</td>
              </tr>
              <tr className="border-t border-outline-variant">
                <td className="py-2 text-on-surface">
                  <ColorDot tone="safe" />
                  Sicherer Teil
                </td>
                <td className="py-2 text-right">
                  {formatEUR(breakdown.safeEuro)}{" "}
                  <span className="text-on-surface-variant">
                    ({currentSafePercent.toFixed(1)} %)
                  </span>
                </td>
                <td className="py-2 text-right">
                  {formatEUR(Math.round(targetSafeEuro))}{" "}
                  <span className="text-on-surface-variant">({safePercent.toFixed(1)} %)</span>
                </td>
                <td className="py-2 text-right font-medium">{fmtDelta(deltaSafe)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Visuell prüfen (alle Hero-Varianten)**

Preview, Schritt 3 mit Testdaten (z. B. 10.000 € Tagesgeld + 30.000 € Welt-ETF, Ziel 60 %):
1. Über Ziel → Hero „Verschiebe ≈ 6.000 € von Aktien in den sicheren Teil." + „15 Prozentpunkte".
2. Slider in Schritt 2 auf 75 % → „Alles im Lot / Nichts zu tun."
3. Slider auf 90 % → „Verschiebe ≈ 6.000 € in Aktien (z. B. Welt-ETF)."
4. Balken indigo/grau, Tabelle mit Farbpunkten, keine Serif-Überschriften, kein „Pp".

- [ ] **Step 3: Tests + Commit**

```powershell
npx vitest run
git add src/modules/portfolio/steps/ErgebnisStep.tsx
git commit -m "feat(portfolio): Ergebnis fuehrt mit Hero-Empfehlung, Indigo/Grau, Klartext"
```

---

### Task 5: Klartext in Bestand, Wizard-Titel, Risiko-Hint

**Files:**
- Modify: `src/modules/portfolio/steps/BestandStep.tsx`
- Modify: `src/modules/portfolio/PortfolioWizard.tsx`
- Modify: `src/components/AssetsManager.tsx`

- [ ] **Step 1: BestandStep-Texte vereinfachen**

In `src/modules/portfolio/steps/BestandStep.tsx`:

```tsx
// Vorher (Intro):
<p className="font-sans text-sm leading-relaxed text-on-surface-variant">
  Erfasse alle Anlagen, die in deine Risiko-Betrachtung einfließen sollen.
  Positionen, die nicht eindeutig in „riskant" oder „sicher" passen
  (z.&nbsp;B. selbstgenutzte Immobilie, bAV/Riester), kannst du pro Asset
  manuell zuordnen.
</p>
// Nachher:
<p className="font-sans text-sm leading-relaxed text-on-surface-variant">
  Trag hier dein Erspartes ein — jede Position einzeln. Was nicht eindeutig riskant
  oder sicher ist (z.&nbsp;B. selbstgenutzte Immobilie, bAV/Riester), kannst du pro
  Position selbst zuordnen.
</p>
```

```tsx
// Vorher (Hinweis):
<p className="border border-outline-variant bg-surface-container p-3 font-sans text-[13px] leading-relaxed text-on-surface-variant">
  Hinweis: {formatEUR(breakdown.excludedEuro)} sind als „außerhalb der
  Quote" eingestuft (z.&nbsp;B. Immobilie, bAV). Diese Anlagen werden
  separat ausgewiesen, fließen aber nicht in die Aktien-/Sicher-Quote
  ein.
</p>
// Nachher:
<p className="border border-outline-variant bg-surface-container p-3 font-sans text-[13px] leading-relaxed text-on-surface-variant">
  Hinweis: {formatEUR(breakdown.excludedEuro)} zählen nicht in die Aufteilung —
  z.&nbsp;B. Immobilie oder bAV, weil du sie nicht einfach umschichten kannst.
  Sie werden separat ausgewiesen.
</p>
```

- [ ] **Step 2: Wizard-Titel umbenennen**

In `src/modules/portfolio/PortfolioWizard.tsx`:

```tsx
// Vorher:
title: "2. Zielquote",
// Nachher:
title: "2. Wunsch-Aufteilung",
```

- [ ] **Step 3: Risiko-Einstufung mit Hilfssatz**

In `src/components/AssetsManager.tsx` (~Zeile 136):

```tsx
// Vorher:
<Field label="Risiko-Einstufung">
// Nachher:
<Field
  label="Risiko-Einstufung"
  hint="Standard ordnet automatisch zu: ETFs/Aktien/Krypto = riskant, Tagesgeld/Anleihen = sicher. Nur ändern, wenn eine Position nicht passt."
>
```

- [ ] **Step 4: Visuell prüfen**

Preview, Schritt 1: neuer Intro-Text, Hilfssatz unter „Risiko-Einstufung" (im Rentenmodul-AssetsManager — ohne `showRiskOverride` — erscheint er NICHT). Schrittliste zeigt „Wunsch-Aufteilung".

- [ ] **Step 5: Tests + Commit**

```powershell
npx vitest run
git add src/modules/portfolio/steps/BestandStep.tsx src/modules/portfolio/PortfolioWizard.tsx src/components/AssetsManager.tsx
git commit -m "feat(portfolio): Klartext in Bestand und Wizard-Titel, Risiko-Hint"
```

---

### Task 6: Gesamtverifikation & PR

- [ ] **Step 1: Komplette Test-Suite + Build**

```powershell
npx vitest run
npm run build
```

Erwartet: alle Tests PASS, Build ohne TypeScript-Fehler (insbesondere: keine Referenzen mehr auf `FragebogenModal`).

- [ ] **Step 2: End-to-End-Durchklick**

Desktop (1280 px) + Mobile (375 px), Portfolio-Modul komplett: Bestand → Wunsch-Aufteilung (Fragebogen auf/zu, unbeantwortet → beantwortet → Übernehmen) → Ergebnis (alle drei Hero-Varianten via Slider). Gegenprobe Rentenmodul: Eyebrow-Entfernung bricht dort nichts.

- [ ] **Step 3: PR erstellen**

Body als Datei schreiben (PowerShell-Quoting), dann:

```powershell
git push -u origin claude/laienfreundliches-portfolio
gh pr create --title "feat(portfolio): Laienfreundliches Portfolio-Modul" --body-file .pr-body.md
Remove-Item .pr-body.md -Confirm:$false
```
