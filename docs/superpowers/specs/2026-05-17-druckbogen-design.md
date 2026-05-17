# Druckbogen für den Rentenrechner — Designspezifikation

**Datum:** 2026-05-17
**Modul:** `pension` (Rentenlücke & Sparrate)
**Status:** Design abgenommen

## Problem

Die aktuelle Druckausgabe ist die Bildschirm-Ansicht des Ergebnis-Schritts mit
weggeblendeten Teilen (`@media print` in `globals.css`). Sie passt nicht auf eine
Seite:

- Karten-Padding, Balkendiagramm und große Display-Schrift sind fürs Web gebaut.
- Der detaillierte Rechenweg liegt im aufklappbaren `Disclosure` und ist nur im
  DOM, wenn er vorher angeklickt wurde — der Druckumfang ist dadurch
  unvorhersehbar.

## Ziel

Eine übersichtliche, auf **genau eine DIN-A4-Seite** passende Druckausgabe des
Berechnungsergebnisses — als Mini-Report zum Abheften im privaten Ordner.

## Ansatz

Ein **dedizierter Druckbogen**: eine eigene, fürs Papier gebaute Komponente, die
am Bildschirm unsichtbar ist und nur beim Drucken erscheint. Die Bildschirm-
Ansicht bleibt unverändert. Der Bogen wird bewusst auf A4 layoutet, statt die
Web-Ansicht umzubiegen.

## Komponenten

### Neu: `src/modules/pension/PensionPrintSheet.tsx`

Eigenständiges 1-Seiten-Dokument. Schwarzer Text auf Weiß, dünne Rahmen,
Schriftgröße ~9–10 pt, A4-Breite mit ~14 mm Innenrand. Hängt **nicht** an den
M3-Web-Tokens — bringt sein eigenes, druckfertiges Styling mit (Tailwind-Klassen
mit konkreten Werten, keine `bg-primary`/`text-on-surface`-Tokens).

Props:

```ts
type PensionPrintSheetProps = {
  inputs: PensionInputs;
  result: Extract<PensionResult, { kind: "ok" }>;
  explanation: Explanation;
};
```

Wurzelelement trägt die Klasse `print-sheet` und ist am Bildschirm `hidden`.

### Geändert: `src/modules/pension/steps/ResultStep.tsx`

- `ResultStep` berechnet `inputs`, `result` und `explanation` bereits. Im
  `result.kind === "ok"`-Zweig wird zusätzlich `<PensionPrintSheet>` gerendert
  und bekommt diese drei Werte gereicht. Keine Neuberechnung.
- Nur der `"ok"`-Fall erhält einen Druckbogen. Bei `no-gap`, `invalid`,
  `already-retired` gibt es keinen Bogen (dort ist auch kein Drucken-Button).
- Die Einordnungs-Logik der Sparquote (Vergleich gegen Durchschnitt und
  empfohlenen Korridor) steckt aktuell hartcodiert in der lokalen Funktion
  `SparquoteEinordnung`. Die Ableitung des Einordnungs-**Texts** wird in eine
  kleine geteilte Funktion extrahiert, damit Bildschirm und Druckbogen dieselbe
  Aussage zeigen. Der Balken bleibt exklusiv in `SparquoteEinordnung`.

### Geändert: `src/styles/globals.css`

Der bisherige `@media print`-Block wird ersetzt durch das robuste Standard-
Pattern:

```css
@media print {
  body { visibility: hidden; }
  .print-sheet, .print-sheet * { visibility: visible; }
  .print-sheet { position: absolute; left: 0; top: 0; width: 100%; }
}
@page { size: A4; margin: 0; }
```

Damit verschwindet beim Drucken automatisch alles außer dem Bogen — unabhängig
davon, wie tief er im Komponentenbaum sitzt. Die bisherigen Surface-Umfärbungen
und `[data-print="hide"]`-Regeln werden nicht mehr gebraucht.

`data-print="hide"` wird damit überflüssig: an [Wizard.tsx](../../../src/components/Wizard.tsx)
(Navigations-Buttons) und an [ResultStep.tsx](../../../src/modules/pension/steps/ResultStep.tsx)
(Drucken-Button). Die Attribute werden entfernt.

## Aufbau des Druckbogens

Sechs Blöcke, von oben nach unten:

1. **Kopf** — Titel „Vorsorge · Rentenlücke & Sparrate" und das aktuelle Datum
   (`new Date()`, Format `TT.MM.JJJJ`). Das Datum dokumentiert, mit welchem
   Stand gerechnet wurde.
2. **Achtung-Hinweis (bedingt)** — falls die gesetzliche Rente per Faustformel
   geschätzt wurde (`m.expectedStatePension === null`, in `ResultStep` als
   `usingDefaultStatePension`). Kurzer Warnhinweis, dass die Zahl grob ist.
3. **Ergebnis** — empfohlene monatliche Sparrate groß (`result.monthlySavings`),
   daneben Sparquote (`result.savingsRatePct`) und Alternativ-Nominalbetrag
   (`result.fixedNominalSavings`). Darunter eine Einordnungs-Textzeile (geteilte
   Funktion, kein Balken).
4. **Annahmen-Tabelle** — alle Eingaben und Annahmen aus `explanation.inputs`
   (~12 Zeilen): Symbol, Label, Wert, Kennzeichnung Eingabe/Standard.
5. **Kernzahlen** — Rentenlücke pro Monat (`result.gapToday`), Kapitalbedarf bei
   Renteneintritt (`result.capitalNeeded`), mitberücksichtigtes vorhandenes
   Vermögen (`result.existingFV`).
6. **Herleitung kompakt** — aus `explanation.steps` (11 Schritte): je Schritt
   eine Zeile mit Schrittnummer, Titel und Ergebnis (`step.result`). **Ohne**
   Formel- und Einsetzungszeilen — diese bleiben dem Detail-Rechenweg auf dem
   Bildschirm vorbehalten.
7. **Fuß** — Disclaimer „Keine Anlageberatung" sowie der Kaufkraft-Hinweis als
   kleine Fußnote.

## Bewusst weggelassen

- Das Sparquoten-Balkendiagramm → ersetzt durch eine Textzeile.
- Die Tipp-Card „Lesehinweis" als eigener Block → in die Fußnote verschoben.
- Die Prosa-Begründung „So entsteht die Empfehlung" → inhaltlich vom kompakten
  Herleitungs-Block (6) abgedeckt.
- Formel- und Einsetzungszeilen des Detail-Rechenwegs.

## Erfolgskriterien

- Die Druckvorschau (Browser-Druckdialog / PDF-Export) zeigt **genau eine**
  A4-Seite.
- Der Bogen enthält alle sechs Blöcke, lesbar und nicht abgeschnitten.
- Die Bildschirm-Ansicht des Ergebnis-Schritts ist unverändert.
- Der „🖨 Drucken"-Button löst weiterhin `window.print()` aus.

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/modules/pension/PensionPrintSheet.tsx` | neu |
| `src/modules/pension/steps/ResultStep.tsx` | Druckbogen rendern, Einordnungs-Helper extrahieren, `data-print`-Attribut entfernen |
| `src/components/Wizard.tsx` | `data-print="hide"`-Attribut entfernen |
| `src/styles/globals.css` | `@media print`-Block ersetzen, `@page` ergänzen |
