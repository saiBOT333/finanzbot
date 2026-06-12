# Design: Laienfreundliches Portfolio-Modul

**Datum:** 2026-06-12
**Status:** Vom User freigegeben
**Umfang:** Portfolio-Modul + ein App-Shell-Fix. Keine neuen Features, keine Änderungen an der Rebalance-/Fragebogen-Mathematik, Wizard bleibt bei 3 Schritten.

## Ziel

Die im Rentenrechner etablierten Muster (Spec 2026-06-11) auf das Portfolio-Modul übertragen:
Farben ohne falsche Signale, Klartext statt Jargon, Antwort zuerst, Werkstatt-Designsprache
durchgängig. Befund vom UI-Durchgang am 2026-06-12: Aktien in Error-Rot, „Pp"-Kürzel,
roher Radio-Fragebogen im Modal mit Anker-Vorauswahl, Handlungsempfehlung versteckt unter
der Tabelle, Serif-Überschriften, hartkodiertes „Modul Vorsorge"-Eyebrow.

## A — Farben: Indigo vs. Grau

Aktien/Risiko = **Primary-Indigo**, sicherer Teil = **neutrales Grau** (`outline-variant`).
Rot/Grün bleibt App-weit Fehlern/Erfolg vorbehalten.

- `ErgebnisStep.tsx` / `StackedBar`: `bg-error` → `bg-primary`, `bg-success` → `bg-outline-variant`.
- `ZielquoteStep.tsx` Slider-Gradient: `var(--m3-error)`/`var(--m3-success)` →
  `var(--m3-primary)`/`var(--m3-outline-variant)`. Beschriftung „Aktien (Risiko)/Sicher"
  verliert `text-error`/`text-success` (neutral `text-on-surface-variant`).
- Tabellenzeilen „Aktien"/„Sicher": `text-error`/`text-success` → `text-on-surface` mit
  vorangestelltem Farbpunkt (kleines `inline-block`-Quadrat in `bg-primary` bzw.
  `bg-outline-variant`), damit die Zuordnung zu den Balken erhalten bleibt.

## B — Klartext-Durchgang

- **Schritt-Titel:** „2. Zielquote" → „2. Wunsch-Aufteilung" (`PortfolioWizard.tsx`).
- **„Pp" abschaffen:** „Du liegst 15.0 Pp über deinem Ziel" → „Du liegst
  15 Prozentpunkte über deiner Wunsch-Aktienquote" (Zahl ohne Nachkommastelle, wenn ganzzahlig,
  sonst eine Dezimale).
- **„Sicherheitsbaustein"** → überall „sicherer Teil (Tagesgeld, Anleihen, Geldmarkt)";
  bei Wiederholungen im selben Text kurz „sicherer Teil".
- **BestandStep-Intro** vereinfachen: „Trag hier dein Erspartes ein — jede Position einzeln.
  Was nicht eindeutig riskant oder sicher ist (z. B. selbstgenutzte Immobilie, bAV/Riester),
  kannst du pro Position selbst zuordnen."
- **„Außerhalb der Quote"-Hinweis** erklärt das Warum: „X € zählen nicht in die Aufteilung —
  z. B. Immobilie oder bAV, weil du sie nicht einfach umschichten kannst. Sie werden separat
  ausgewiesen."
- **ZielquoteStep-Intro:** „Wie viel Prozent deines Geldes soll in Aktien stecken? Der Rest
  bleibt im sicheren Teil (Tagesgeld, Anleihen, Geldmarkt). Mehr Aktien = mehr erwartete
  Rendite, aber stärkere Schwankungen."
- **AssetsManager:** Das Feld „Risiko-Einstufung" bekommt einen sichtbaren Hilfssatz:
  „Standard ordnet automatisch zu: ETFs/Aktien/Krypto = riskant, Tagesgeld/Anleihen = sicher.
  Nur ändern, wenn eine Position nicht passt." Gilt nur, wenn `showRiskOverride` aktiv ist
  (also im Portfolio-Kontext).

## C — Fragebogen: inline statt Modal, ohne Vorauswahl

Das Modal (`FragebogenModal.tsx`) entfällt. Stattdessen klappt in `ZielquoteStep` ein
Inline-Bereich auf — gleiches Muster wie „Annahmen anpassen" im Rentenrechner
(Toggle-Button mit ▸/▾, kein `Disclosure`-Border nötig).

- **Neue Komponente** `src/modules/portfolio/steps/FragebogenSection.tsx`:
  - Lokaler State `Partial<FragebogenAntworten>` — startet leer (keine Vorauswahl),
    initialisiert aus `state.fragebogen`, falls vorhanden.
  - Jede Frage rendert ihre Optionen als **ChoiceChips** (vorhandene Komponente).
  - Die Empfehlung („Empfohlene Aktienquote: X %") erscheint erst, wenn alle fünf Fragen
    beantwortet sind; vorher steht dort „Noch N Fragen offen".
  - „Übernehmen" ist bis dahin deaktiviert; bei Klick: `portfolioStore.set({ fragebogen,
    targetEquityPercent: empfehlung })` und Bereich schließt.
- **`questionnaire.ts`:** neue, testgetriebene Helper-Funktion
  `isComplete(a: Partial<FragebogenAntworten>): a is FragebogenAntworten` — prüft, ob alle
  fünf Schlüssel beantwortet sind. `recommendEquityPercent` bleibt unverändert.
- In den Store wandern weiterhin nur vollständige Antworten (`FragebogenAntworten`) —
  keine Typ-/Migrationsänderung am persistierten State.
- `FragebogenModal.tsx` wird gelöscht.

## D — Ergebnis führt mit der Antwort

`ErgebnisStep.tsx` wird umgebaut (Reihenfolge):

1. **Hero-Karte** (gleiches `Card variant="hero"`-Muster wie die Sparrate):
   - `shift-to-safe`: „Verschiebe **≈ 6.000 €** von Aktien in den sicheren Teil" —
     `formatEURRounded(deltaAmount, 100)`. Unterzeile: „Du liegst X Prozentpunkte über
     deiner Wunsch-Aktienquote."
   - `shift-to-equity`: analog „… in Aktien (z. B. Welt-ETF)".
   - `balanced` mit Beständen: „Alles im Lot — nichts zu tun." mit Success-Akzent,
     Unterzeile „Abweichung unter 1 Prozentpunkt."
   - Keine Bestände: bestehender Hinweis, keine Hero-Karte.
2. **Ist/Ziel-Aufteilung** als zwei Balken (Indigo/Grau) mit Eyebrow-Labels statt
   Serif-`h3` („Ist-Aufteilung"/„Ziel-Aufteilung" als `m3-eyebrow-muted`).
3. **Tabelle** (Aktuell/Ziel/Differenz) als Beleg darunter — exakte Beträge bleiben,
   Überschrift „Rebalancing-Empfehlung" entfällt (steht jetzt im Hero), stattdessen
   Eyebrow „Die Rechnung dahinter".

Alle `font-serif`-Überschriften im Modul verschwinden.

## E — Eyebrow-Fix App-Shell

Das hartkodierte `<span className="m3-eyebrow">Modul Vorsorge</span>` über dem Modulkopf
in `App.tsx` ist bei Portfolio falsch und wird **ersatzlos gestrichen** (Label-Ausdünnung:
Modulname steht groß darunter, die Chips zeigen den Kontext).

## Tests & Verifikation

- `isComplete()` testgetrieben in `questionnaire.test.ts` (leer / teilweise / vollständig /
  Punktwert 0 zählt als beantwortet).
- Bestehende Tests (questionnaire, rebalance, classify) bleiben grün; `npm run build` fehlerfrei.
- Preview-Durchklick Desktop (1280 px) + Mobile (375 px): alle drei Schritte, Fragebogen
  auf-/zuklappen, alle drei Hero-Varianten (über Ziel / unter Ziel / im Lot), Eyebrow-Fix
  in beiden Modulen.

## Nicht im Umfang

- Neue Features (Sparplan-Empfehlung, Verknüpfung mit dem Rentenmodul).
- Änderungen an `rebalance.ts`-/`classify.ts`-Logik oder dem Scoring in `questionnaire.ts`.
- Der 1-Prozentpunkt-Toleranzkorridor bleibt wie er ist.
