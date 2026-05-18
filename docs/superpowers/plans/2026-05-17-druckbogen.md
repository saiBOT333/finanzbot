# Druckbogen für den Rentenrechner — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine auf genau eine DIN-A4-Seite passende Druckausgabe des Rentenrechner-Ergebnisses als Mini-Report zum Abheften.

**Architecture:** Eine dedizierte Druckbogen-Komponente wird zusätzlich zur Bildschirm-Ansicht gerendert, ist am Bildschirm per `hidden` unsichtbar und nur im Druck sichtbar. Ein `@media print`-Block in `globals.css` blendet beim Drucken alles außer dem Bogen aus. Die Bildschirm-Ansicht bleibt unverändert.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS 3, Vitest. Datenquelle ist die bereits in `ResultStep` berechnete `Explanation` (aus `explain.ts`) und das `PensionResult`.

---

## File Structure

| Datei | Verantwortung |
|---|---|
| `src/modules/pension/savingsRate.ts` (neu) | Reine Funktion: Sparquote → einordnender Text. Geteilt von Bildschirm-Ansicht und Druckbogen. |
| `src/modules/pension/savingsRate.test.ts` (neu) | Unit-Tests der Einordnungs-Schwellen. |
| `src/modules/pension/PensionPrintSheet.tsx` (neu) | Druckbogen-Komponente — fürs Papier gebautes 1-Seiten-Dokument. |
| `src/modules/pension/steps/ResultStep.tsx` (ändern) | Druckbogen rendern, `savingsRateMessage` statt Inline-Ternary nutzen, `data-print`-Attribut entfernen. |
| `src/components/Wizard.tsx` (ändern) | `data-print="hide"`-Attribut entfernen (nicht mehr gebraucht). |
| `src/styles/globals.css` (ändern) | `@media print`-Block ersetzen, `@page`-Regel ergänzen. |

---

## Task 1: Sparquoten-Einordnung als geteilte Funktion

Die Logik „Sparquote → einordnender Satz" steckt aktuell als Inline-Ternary in der lokalen Funktion `SparquoteEinordnung` in `ResultStep.tsx`. Sie wird als reine Funktion extrahiert, damit der Druckbogen denselben Text zeigt.

**Files:**
- Create: `src/modules/pension/savingsRate.ts`
- Test: `src/modules/pension/savingsRate.test.ts`

- [ ] **Step 1: Write the failing test**

Erstelle `src/modules/pension/savingsRate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { savingsRateMessage } from "./savingsRate";

describe("savingsRateMessage", () => {
  it("warnt bei einer Quote unter dem deutschen Durchschnitt", () => {
    expect(savingsRateMessage(8)).toContain("leicht zu erreichen");
  });

  it("ordnet eine Quote zwischen Durchschnitt und Empfehlung ein", () => {
    expect(savingsRateMessage(13)).toContain("unter der Finanzfluss-Empfehlung");
  });

  it("bestätigt eine Quote im empfohlenen Korridor", () => {
    expect(savingsRateMessage(18)).toContain("empfohlenen Korridor");
  });

  it("warnt bei einer sehr hohen Quote", () => {
    expect(savingsRateMessage(25)).toContain("Hohe Sparquote");
  });

  it("zählt die Korridor-Untergrenze (15 %) noch zum Korridor", () => {
    expect(savingsRateMessage(15)).toContain("empfohlenen Korridor");
  });

  it("zählt die Korridor-Obergrenze (20 %) noch zum Korridor", () => {
    expect(savingsRateMessage(20)).toContain("empfohlenen Korridor");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- savingsRate`
Expected: FAIL — `savingsRate.ts` existiert nicht, Import schlägt fehl.

- [ ] **Step 3: Write minimal implementation**

Erstelle `src/modules/pension/savingsRate.ts`:

```ts
import { SAVINGS_RATE_BENCHMARKS } from "./constants";

/**
 * Einordnender Satz zur Sparquote. `pct` ist die Quote in Prozent (z. B. 18.3),
 * verglichen gegen den deutschen Durchschnitt und den empfohlenen Korridor.
 */
export function savingsRateMessage(pct: number): string {
  const avg = SAVINGS_RATE_BENCHMARKS.germanyAverage * 100;
  const recMin = SAVINGS_RATE_BENCHMARKS.recommendedMin * 100;
  const recMax = SAVINGS_RATE_BENCHMARKS.recommendedMax * 100;

  if (pct < avg) {
    return "Liegt unter dem deutschen Durchschnitt — leicht zu erreichen. Achtung: vermutlich rechnest du mit eher optimistischen Annahmen.";
  }
  if (pct < recMin) {
    return "Über dem deutschen Durchschnitt, aber unter der Finanzfluss-Empfehlung für eine ausreichende Altersvorsorge.";
  }
  if (pct <= recMax) {
    return "Im empfohlenen Korridor — solide Altersvorsorge laut Finanzfluss.";
  }
  return "Hohe Sparquote — prüfe, ob deine Annahmen (Lücke, Bezugsdauer, Rendite) realistisch sind.";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- savingsRate`
Expected: PASS — alle 6 Tests grün.

- [ ] **Step 5: Commit**

```bash
git add src/modules/pension/savingsRate.ts src/modules/pension/savingsRate.test.ts
git commit -m "feat(pension): Sparquoten-Einordnung als geteilte Funktion"
```

---

## Task 2: Druckbogen-Komponente

Die Komponente rendert ein A4-breites Dokument mit eigenem, druckfertigem Styling (schwarz auf weiß, dünne Rahmen). Sie ist am Bildschirm per `hidden` unsichtbar und im Druck per `print:block` sichtbar. Die Sichtbarkeitssteuerung des restlichen Seiteninhalts kommt in Task 3 (`globals.css`).

Die Komponente braucht **kein** `inputs`-Prop — `explanation.inputs` enthält die Annahmen bereits als formatierte Strings. Das Achtung-Banner braucht `usingDefaultStatePension`, das `ResultStep` bereits berechnet.

**Files:**
- Create: `src/modules/pension/PensionPrintSheet.tsx`

- [ ] **Step 1: Create the component**

Erstelle `src/modules/pension/PensionPrintSheet.tsx`:

```tsx
import type { PensionResult } from "./types";
import type { Explanation } from "./explain";
import { formatEUR, formatPercent } from "../../lib/format";
import { savingsRateMessage } from "./savingsRate";

type Props = {
  result: Extract<PensionResult, { kind: "ok" }>;
  explanation: Explanation;
  usingDefaultStatePension: boolean;
};

/**
 * Druckbogen — ein fürs Papier gebautes 1-Seiten-Dokument. Am Bildschirm
 * `hidden`, im Druck per `print:block` + dem @media-print-Block in globals.css
 * das einzig sichtbare Element.
 */
export function PensionPrintSheet({
  result,
  explanation,
  usingDefaultStatePension,
}: Props) {
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="print-sheet hidden print:block w-[210mm] bg-white p-[14mm] text-[9.5pt] leading-snug text-black">
      {/* 1 — Kopf */}
      <header className="flex items-baseline justify-between border-b-2 border-black pb-2">
        <h1 className="text-[15pt] font-bold">
          Vorsorge · Rentenlücke &amp; Sparrate
        </h1>
        <span className="text-[9pt]">Stand: {today}</span>
      </header>

      {/* 2 — Achtung (bedingt) */}
      {usingDefaultStatePension && (
        <p className="mt-3 border border-black px-3 py-2 text-[8.5pt]">
          <strong>Achtung:</strong> Die gesetzliche Rente wurde per Faustformel
          (48 % vom Netto) geschätzt. Mit dem echten Wert aus der
          Renteninformation kann die Sparrate deutlich abweichen.
        </p>
      )}

      {/* 3 — Ergebnis */}
      <section className="mt-4">
        <p className="text-[8pt] font-semibold uppercase tracking-wide">
          Empfohlene monatliche Sparrate
        </p>
        <div className="flex items-end justify-between gap-4">
          <p className="text-[26pt] font-bold leading-none tabular-nums">
            {formatEUR(result.monthlySavings, true)}
          </p>
          <div className="text-right text-[9pt]">
            <p>
              Sparquote:{" "}
              <strong>{formatPercent(result.savingsRatePct / 100)}</strong> vom
              Netto
            </p>
            <p>
              Alternativ fix nominal:{" "}
              <strong>{formatEUR(result.fixedNominalSavings, true)}</strong>
            </p>
          </div>
        </div>
        <p className="mt-1 text-[8.5pt]">
          {savingsRateMessage(result.savingsRatePct)}
        </p>
      </section>

      {/* 4 — Annahmen & Eingaben */}
      <section className="mt-4">
        <h2 className="mb-1 text-[8pt] font-semibold uppercase tracking-wide">
          Annahmen &amp; Eingaben
        </h2>
        <table className="w-full border-collapse text-[8.5pt]">
          <tbody>
            {explanation.inputs.map((it) => (
              <tr key={it.symbol} className="border-b border-neutral-300">
                <td className="py-0.5 pr-2 font-mono">{it.symbol}</td>
                <td className="py-0.5 pr-2">{it.label}</td>
                <td className="py-0.5 pr-2 text-right font-semibold tabular-nums">
                  {it.value}
                </td>
                <td className="py-0.5 text-right text-[7.5pt] uppercase text-neutral-600">
                  {it.isDefault ? "Standard" : "Eingabe"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 5 — Kernzahlen */}
      <section className="mt-4 grid grid-cols-3 gap-2">
        <KernzahlCell
          label="Rentenlücke / Monat (heute)"
          value={formatEUR(result.gapToday)}
        />
        <KernzahlCell
          label="Kapitalbedarf bei Renteneintritt"
          value={formatEUR(result.capitalNeeded)}
        />
        <KernzahlCell
          label="Vorhandenes Vermögen berücksichtigt"
          value={formatEUR(result.existingFV)}
        />
      </section>

      {/* 6 — Herleitung kompakt */}
      <section className="mt-4">
        <h2 className="mb-1 text-[8pt] font-semibold uppercase tracking-wide">
          Herleitung
        </h2>
        <ol className="text-[8.5pt]">
          {explanation.steps.map((s) => (
            <li
              key={s.index}
              className="flex justify-between gap-3 border-b border-neutral-300 py-0.5"
            >
              <span>
                <span className="font-mono">
                  {String(s.index).padStart(2, "0")}
                </span>{" "}
                {s.title}
              </span>
              <span className="whitespace-nowrap text-right font-semibold tabular-nums">
                {s.result}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 7 — Fuß */}
      <footer className="mt-4 border-t border-black pt-2 text-[7.5pt] leading-relaxed">
        <p>
          Alle Hauptbeträge in heutiger Kaufkraft — jährlich um die Inflation
          anpassen, um real gleich zu bleiben.
        </p>
        <p className="mt-0.5">
          Realgerechnete Orientierung · Keine Anlageberatung · FinanzBot
        </p>
      </footer>
    </div>
  );
}

function KernzahlCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-black px-2 py-1.5">
      <p className="text-[7.5pt] uppercase leading-tight">{label}</p>
      <p className="mt-0.5 text-[12pt] font-bold tabular-nums">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run typecheck`
Expected: PASS — keine Typfehler. (Die Komponente ist noch nirgends eingebunden; das ist erwartet und kein Fehler.)

- [ ] **Step 3: Commit**

```bash
git add src/modules/pension/PensionPrintSheet.tsx
git commit -m "feat(pension): Druckbogen-Komponente für das Ergebnis"
```

---

## Task 3: Verdrahtung — Print-CSS, ResultStep, Wizard

Hier wird der Druckbogen eingebunden und die Druck-Sichtbarkeit umgestellt.

**Files:**
- Modify: `src/styles/globals.css:123-167`
- Modify: `src/modules/pension/steps/ResultStep.tsx`
- Modify: `src/components/Wizard.tsx:105`

- [ ] **Step 1: Print-Block in globals.css ersetzen**

Ersetze den kompletten bestehenden `@media print`-Block (`src/styles/globals.css`, beginnt bei der Kommentarzeile `/* Print stylesheet (M3) */`, Zeilen 123–167) durch:

```css
/* ──────────────────────────────────────────────────────────────────────────
 * Print — nur der Druckbogen (.print-sheet) ist sichtbar
 * ──────────────────────────────────────────────────────────────────────── */
@media print {
  body {
    visibility: hidden;
  }

  .print-sheet,
  .print-sheet * {
    visibility: visible;
  }

  .print-sheet {
    position: absolute;
    left: 0;
    top: 0;
  }
}

@page {
  size: A4;
  margin: 0;
}
```

Erläuterung: `body { visibility: hidden }` blendet die gesamte Bildschirm-Ansicht aus; `.print-sheet` und seine Kinder werden wieder sichtbar geschaltet. `position: absolute` zieht den Bogen an den Seitenanfang, unabhängig davon wie tief er im Komponentenbaum sitzt. Das `display`-Umschalten (Bildschirm `hidden` → Druck `block`) erledigt die `print:block`-Klasse an der Komponente selbst.

- [ ] **Step 2: ResultStep — Druckbogen einbinden und Helper nutzen**

In `src/modules/pension/steps/ResultStep.tsx`:

**2a.** Import ergänzen. Nach der bestehenden Zeile `import { PensionRechenweg } from "../PensionRechenweg";` einfügen:

```tsx
import { PensionPrintSheet } from "../PensionPrintSheet";
import { savingsRateMessage } from "../savingsRate";
```

**2b.** Das `data-print="hide"`-Attribut am Drucken-Button entfernen. Der Button-Block lautet aktuell:

```tsx
          <Button
            variant="tonal"
            size="sm"
            onClick={() => window.print()}
            data-print="hide"
            title="Ergebnis drucken oder als PDF speichern"
          >
            🖨 Drucken
          </Button>
```

Ersetzen durch (Zeile `data-print="hide"` gestrichen):

```tsx
          <Button
            variant="tonal"
            size="sm"
            onClick={() => window.print()}
            title="Ergebnis drucken oder als PDF speichern"
          >
            🖨 Drucken
          </Button>
```

**2c.** Den Druckbogen rendern. Im `result.kind === "ok"`-Return steht am Ende `<PensionRechenweg explanation={explanation} />`, gefolgt von der schließenden `</div>`. Den Bogen direkt nach `<PensionRechenweg ... />` und vor dem schließenden `</div>` einfügen:

```tsx
      <PensionRechenweg explanation={explanation} />

      <PensionPrintSheet
        result={result}
        explanation={explanation}
        usingDefaultStatePension={usingDefaultStatePension}
      />
    </div>
  );
}
```

(`usingDefaultStatePension` und `explanation` sind in dieser Funktion bereits als `const` definiert. Der Bogen ist `hidden` — er erzeugt am Bildschirm keine Box, das umschließende `space-y-6` wirkt sich nicht sichtbar aus.)

**2d.** In der lokalen Funktion `SparquoteEinordnung` den Inline-Ternary durch den Helper ersetzen. Aktuell:

```tsx
  const message =
    pct < avg
      ? "Liegt unter dem deutschen Durchschnitt — leicht zu erreichen. Achtung: vermutlich rechnest du mit eher optimistischen Annahmen."
      : pct < recMin
        ? "Über dem deutschen Durchschnitt, aber unter der Finanzfluss-Empfehlung für eine ausreichende Altersvorsorge."
        : pct <= recMax
          ? "Im empfohlenen Korridor — solide Altersvorsorge laut Finanzfluss."
          : "Hohe Sparquote — prüfe, ob deine Annahmen (Lücke, Bezugsdauer, Rendite) realistisch sind.";
```

Ersetzen durch:

```tsx
  const message = savingsRateMessage(pct);
```

Die Variablen `avg`, `recMin`, `recMax` weiter oben in `SparquoteEinordnung` bleiben unverändert — sie werden für den Balken (`recLeft`, `recWidth`) und für `accent`/`indicatorColor` weiterhin gebraucht.

- [ ] **Step 3: Wizard — data-print-Attribut entfernen**

In `src/components/Wizard.tsx` trägt der Navigations-Button-Container das Attribut `data-print="hide"`. Aktuell:

```tsx
      <div className="space-y-3 pt-6" data-print="hide">
```

Ersetzen durch:

```tsx
      <div className="space-y-3 pt-6">
```

(Das Attribut wird vom neuen Print-CSS nicht mehr ausgewertet — `body { visibility: hidden }` blendet die Navigation ohnehin aus.)

- [ ] **Step 4: Verify it type-checks and lints**

Run: `npm run typecheck`
Expected: PASS — keine Typfehler.

Run: `npm run lint`
Expected: PASS — keine neuen Lint-Fehler.

- [ ] **Step 5: Verify existing tests still pass**

Run: `npm test`
Expected: PASS — alle bestehenden Tests plus die 6 neuen aus Task 1.

- [ ] **Step 6: Commit**

```bash
git add src/styles/globals.css src/modules/pension/steps/ResultStep.tsx src/components/Wizard.tsx
git commit -m "feat(pension): Druckbogen verdrahten, Druck-Sichtbarkeit umstellen"
```

---

## Task 4: Visuelle Verifikation der Druckvorschau

Der Druckbogen ist eine Präsentationskomponente — die echte Prüfung ist die Druckvorschau im Browser. Ziel: genau eine A4-Seite.

**Files:** keine (nur bei Bedarf Nachjustierung in `PensionPrintSheet.tsx`)

- [ ] **Step 1: Dev-Server starten und Ergebnis-Schritt öffnen**

Dev-Server starten (`npm run dev`, Port aus `.claude/launch.json`). Im Browser durch den Wizard navigieren bis Schritt 5 („Ergebnis"). Eingaben können auf den Standardwerten bleiben.

- [ ] **Step 2: Druckvorschau prüfen**

Browser-Druckdialog öffnen (Strg+P) oder „🖨 Drucken" klicken. Prüfen:
- Der Druckbogen ist sichtbar, alles andere (Header, Wizard-Schritte, Modul-Titel, Navigation) ist ausgeblendet.
- Der Inhalt passt auf **genau eine** A4-Seite — kein Überlauf auf Seite 2, nichts abgeschnitten.
- Alle sieben Abschnitte sind vorhanden und lesbar: Kopf mit Datum, Ergebnis, Annahmen-Tabelle, Kernzahlen, Herleitung, Fuß. (Abschnitt 2 „Achtung" erscheint nur, wenn die Renteninformation per Faustformel geschätzt wurde — bei eingetragener Renteninformation fehlt er korrekterweise.)

- [ ] **Step 3: Bei Überlauf nachjustieren**

Falls der Bogen über eine Seite hinausgeht: in `PensionPrintSheet.tsx` die Schriftgrößen (`text-[9.5pt]`, `text-[8.5pt]` …), Innenabstände (`p-[14mm]`, `mt-4`) und Zeilenabstände schrittweise verkleinern, bis alles auf eine Seite passt. Nach jeder Änderung Druckvorschau erneut prüfen. Den Achtung-Fall (Abschnitt 2 sichtbar) mitberücksichtigen — er ist der platzkritischste.

- [ ] **Step 4: Commit (nur falls in Step 3 nachjustiert wurde)**

```bash
git add src/modules/pension/PensionPrintSheet.tsx
git commit -m "polish(pension): Druckbogen auf eine A4-Seite justiert"
```

---

## Self-Review

**Spec coverage:**
- Dedizierte Druckbogen-Komponente → Task 2 ✓
- `@media print`-Pattern (`body visibility:hidden`) + `@page` → Task 3, Step 1 ✓
- ResultStep rendert Bogen, reicht `result`/`explanation`/`usingDefaultStatePension` → Task 3, Step 2c ✓
- Einordnungs-Text als geteilte Funktion → Task 1 ✓
- `data-print`-Attribute entfernt (ResultStep + Wizard) → Task 3, Steps 2b/3 ✓
- Sieben Abschnitte des Bogens (Kopf, Achtung, Ergebnis, Annahmen, Kernzahlen, Herleitung, Fuß) → Task 2, Step 1 ✓
- Erfolgskriterium „genau eine A4-Seite" → Task 4 ✓

Abweichung von der Spec: Die Komponenten-Props sind `{ result, explanation, usingDefaultStatePension }` statt `{ inputs, result, explanation }`. Begründung: `inputs` wird nicht gebraucht (`explanation.inputs` deckt die Annahmen ab), `usingDefaultStatePension` kommt fürs Achtung-Banner hinzu. YAGNI.

**Placeholder scan:** Keine TBD/TODO. Jeder Code-Step enthält vollständigen Code, jeder Test-Step ausführbare Befehle mit erwartetem Ergebnis.

**Type consistency:** `savingsRateMessage(pct: number): string` — in Task 1 definiert, in Task 2 (`PensionPrintSheet`) und Task 3 (`ResultStep`) identisch aufgerufen. `PensionPrintSheet`-Props `{ result, explanation, usingDefaultStatePension }` — in Task 2 definiert, in Task 3 identisch verwendet. `Explanation` und `PensionResult` stammen aus bestehenden Modulen (`explain.ts`, `types.ts`).
