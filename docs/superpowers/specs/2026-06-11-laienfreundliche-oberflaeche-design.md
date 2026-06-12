# Design: Laienfreundliche Oberfläche

**Datum:** 2026-06-11
**Status:** Vom User freigegeben
**Umfang:** Rentenrechner-Modul + App-Shell. Portfolio-Modul, Einfach/Experten-Modus und Rechenmethodik sind explizit außerhalb des Umfangs.

## Ziel

Das Tool soll Menschen ohne Finanz-Vorwissen nicht abschrecken. Sechs Bereiche, identifiziert
durch einen UI-Durchgang (Desktop + Mobile 375 px) am 2026-06-11: Schritt 3 ist die größte
Abbruchhürde, Fachsprache an den falschen Stellen, Scheinpräzision, irreführende Farbsemantik,
kaputter Mobile-Header, Label-Lärm.

## A — Gabelung in Schritt 3 (Renteninformation)

**Neuer State:** `pensionInfoChoice: "letter" | "estimate" | null` im Pension-Store
(`src/modules/pension/state.ts`), Default `null`. Migration über den bestehenden
Defaults-Merge beim Laden. Ableitungsregel: Ist `pensionInfo.grossWithoutAdjustment`
bereits gesetzt, gilt automatisch `"letter"` (Bestandsdaten brauchen keine erneute Wahl).

**Verhalten in `PensionInformationStep.tsx`:**

- **`null` (Erstbesuch):** Statt der drei Erklärabsätze eine Frage:
  „Hast du deine Renteninformation zur Hand? Das ist der Brief, den die Deutsche
  Rentenversicherung dir jedes Jahr schickt." Darunter zwei Buttons:
  **„Ja, Wert eintragen"** (→ `"letter"`) / **„Nein, erstmal schätzen"** (→ `"estimate"`).
- **`"letter"`:** Das bestehende Formular, entschlackt:
  - Intro auf einen Satz gekürzt.
  - Label „Brutto-Rente ohne Anpassung (heutiger Rentenwert)" →
    „Monatliche Rente laut Brief (der Wert *ohne* künftige Anpassungen)".
  - Die Live-Hochrechnungstabelle wandert hinter ein aufklappbares
    „Wie rechnen wir das um?" (Disclosure, Default zu).
  - Link „Brief doch nicht zur Hand?" wechselt auf `"estimate"`.
  - Regelaltersgrenze-Hinweis und „Abweichende Erwerbsbiografie" bleiben in diesem Pfad.
- **`"estimate"`:** Ruhige Box (neutrales Hinweis-Muster):
  „Wir schätzen deine Rente auf rund X € — pauschal 48 % deines Netto-Einkommens.
  Das ist grob; mit dem echten Wert wird dein Ergebnis deutlich genauer."
  Plus Button „Wert aus dem Brief eintragen" (→ `"letter"`).
- Der bestehende Override-Block („Manueller Wert aktiv") bleibt unverändert und hat
  weiterhin Vorrang vor der Gabelung.

**Folgewirkung in `ResultStep.tsx`:** Das rote „Achtung · Renteninformation fehlt"-Banner
(error-container) erscheint nur noch bei `source === "fallback"` **und** `pensionInfoChoice === null`
(Schritt ohne Entscheidung übersprungen). Bei bewusster Wahl `"estimate"` wird daraus ein
neutraler Hinweis im Border-links + surface-container-Muster, Text sinngemäß:
„Dein Ergebnis basiert auf einer Schätzung der gesetzlichen Rente (48 % vom Netto).
Mit dem Wert aus deiner Renteninformation wird es deutlich genauer."

## B — Sprach-Durchgang (reine Textänderungen)

- **`WelcomeScreen.tsx`:** Methodik-Satz ersetzen durch:
  „Wir rechnen bewusst vorsichtig: mit gemischter Geldanlage, nach Abzug der Inflation,
  und so, dass dein Geld bis Alter 90 reicht. Alle Annahmen kannst du später anpassen."
  Die Begriffe „Annuität", „Anlage-Allokation", „real gerechnet", „Finanztip-Methodik"
  verschwinden vom ersten Screen.
- **`AssumptionsStep.tsx`:** Die Kurzschrift-Zusammenfassung
  („3 % real Anspar, 1 % real Auszahl, Annuität bis Alter 90, 12 % Steuer-Puffer")
  wird in ganze Sätze übersetzt. Fachbegriffe bleiben innerhalb der Disclosure
  („Annahmen anpassen") erhalten.
- **`ResultStep.tsx`:**
  - „MONATLICH · REAL · HEUTIGE KAUFKRAFT" → „pro Monat, in heutiger Kaufkraft".
  - „Alternativ · Nominal fix" → „Alternative: fester Betrag", Unterzeile
    „jeden Monat gleich viel, dafür ohne jährliche Erhöhung".
- **Tooltips → Hilfstexte:** Inhalte, die zum Verstehen *nötig* sind, wandern als
  sichtbarer Hilfstext unters Feld (mindestens: „Bedarf in Rente (% vom Netto)" in
  `IncomeStep.tsx`). Tooltips bleiben für Vertiefung bestehen.

## C — Rundung der Schlagzahlen

Neuer Helper in `src/lib/format.ts` (testgetrieben):

- `formatEURRounded(value, step)` — rundet auf `step` (z. B. 5 oder 1000) und stellt „≈" voran.
- **Hauptzahl** (empfohlene Sparrate): auf 5 € gerundet, z. B. „≈ 785 €".
- **Stat-Karten:** Monatsbeträge auf ganze Euro, Kapitalbeträge auf Tausender („≈ 431.000 €").
- **Unverändert exakt:** Rechenweg (`PensionRechenweg`), PDF-Druckbogen (`PensionPrintSheet`),
  alle internen Berechnungen, der gespiegelte Profilwert `recommendedMonthlySavings`.

## D — Farbsemantik

- **Lesehinweis** (`ResultStep.tsx`): raus aus der pinken `tertiary-container`-Box,
  rein ins neutrale Hinweis-Muster (Border-links + `surface-container`).
- **Sparquote-Einordnung** (`SparquoteEinordnung`): Indikator-Balken immer `primary`
  (statt `error` bei „über Empfehlung"); grüne Empfehlungszone bleibt; die Bewertung
  übernimmt der vorhandene Text (`savingsRateMessage`).
- **Error-Rot** bleibt echten Problemen vorbehalten: ungültige Eingabe,
  übersprungener Schritt 3 (siehe A).

## E — Header & Mobile

- **`App.tsx` Header:** Tagline „Modulare Finanzplanung · lokal · quelloffen" auf
  Mobile ausblenden (`hidden sm:inline`); sie bricht aktuell auf vier Zeilen um.
- **Emoji-Ersatz:** 📥 📤 🔄 (Header), 📄 („Als PDF speichern") und 💡 (Lesehinweis)
  werden Material Symbols über die vorhandene `m3-icon`-Klasse
  (`download`, `upload`, `restart_alt`, `picture_as_pdf`, `lightbulb`).
  Behebt zugleich den Überlauf der Header-Buttons am rechten Rand auf 375 px.
- **Modulkopf auf Mobile kompakter** (`App.tsx`): Headline ~28 px auf Schmal
  (Desktop unverändert 40–48 px).
- **Wizard-Fortschritt auf Mobile** (`Wizard.tsx`): auf Schmal nur Fortschrittsbalken +
  „Schritt X/5 · Name des Schritts" statt der dreizeiligen Chip-Liste. Desktop unverändert.

## F — Label-Ausdünnung & Lesbarkeit

- „OUTPUT · 01" entfällt ersatzlos. Pro Karte/Sektion maximal ein Caps-Label;
  Doppelungen (Eyebrow + Caps-Unterzeile in der Hero-Karte) werden zusammengelegt.
- `m3-eyebrow` / `m3-eyebrow-muted` in `globals.css`: 11 px → 12 px.
- Hilfstexte/Hints (NumberInput-Hints, Hinweis-Boxen): von 11–12,5 px auf einheitlich 13 px.
- Werkstatt-Stil (Caps + Letter-Spacing + Pill) bleibt erkennbar, wird nur leiser.

## Tests & Verifikation

- `formatEURRounded` testgetrieben (neue Fälle in `format.test.ts`).
- Store-Erweiterung `pensionInfoChoice` inkl. Bestandsdaten-Ableitung testgetrieben
  (`state.test.ts`).
- Banner-Logik im Ergebnis (fallback × choice) per Test der Ableitungsfunktion,
  sofern als reine Funktion extrahierbar; sonst Preview-Verifikation.
- Alle bestehenden Tests bleiben grün.
- Jede Phase wird per Vite-Preview auf Desktop (1280 px) und Mobile (375 px) visuell geprüft.

## Vorgeschlagene Phasen für den Implementierungsplan

1. **Quick Wins:** E (Header/Mobile/Icons) + D (Farbsemantik).
2. **Schritt-3-Gabelung:** A inkl. Ergebnis-Banner-Logik.
3. **Sprache & Labels:** B + F.
4. **Rundung:** C.
