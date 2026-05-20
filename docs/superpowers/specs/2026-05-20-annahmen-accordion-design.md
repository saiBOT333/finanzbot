# Annahmen-Schritt als 4-Bereich-Accordion

Datum: 2026-05-20
Modul: `pension` · Datei: `src/modules/pension/steps/AssumptionsStep.tsx`

## Problem

Der Annahmen-Schritt im Rentenrechner-Wizard ist aktuell eine durchgehende, fließende Liste aus sechs Sektionen. Beim Scrollen verliert man schnell den Überblick, welcher Bereich gerade angepasst wird (Ansparen, Auszahlung oder Vermögen).

## Lösung

Die sechs bestehenden Sektionen werden zu **vier thematischen, aufklappbaren Bereichen** umgruppiert. Jeder Bereich hat einen kompakten Header mit Status-Vorschau und klappt unabhängig auf/zu.

## Bereichsstruktur

| Bereich | Inhalt (aus heutigem Stand) | Status-Vorschau im Header |
|---|---|---|
| **Ansparen** | Anlage-Allokation Sparphase | `ø {gewichtete reale Rendite} real` |
| **Auszahlung** | Berechnungsmethode (Annuität / sichere Entnahmerate), Rentenbezugsdauer **oder** Entnahmerate, Anlage-Allokation Rente (nur bei Annuität) | `Annuität · 30 J.` **oder** `Sichere Entnahme · 3,5 %` |
| **Bestehendes Vermögen** | `AssetsManager` (Liste der Vermögensposten) | `{n} Posten` bzw. `Keine` |
| **Rahmen-Annahmen** | Erwartete gesetzliche Rente, Inflation p. a., Steuer-Puffer | `Inflation 2 % · Steuer 12 %` |

## Verhalten

- **Outer Toggle bleibt**: Der bestehende „Annahmen anpassen"-Schalter blendet wie heute den gesamten Block ein/aus.
- **Default**: Alle vier Bereiche sind **zugeklappt**, sobald der Outer Toggle geöffnet wird.
- **Mehrfach offen erlaubt**: Klick auf einen Header toggelt nur diesen Bereich; mehrere können gleichzeitig offen sein (kein Exklusiv-Modus).
- **State ist lokal**: Welche Bereiche offen sind, lebt im Komponenten-State (`useState`), wird nicht persistiert.
- **Standard-Banner** oben und **„Auf Standard zurücksetzen"** unten bleiben unverändert.

## Komponenten-Design

- Die bestehende lokale `Section`-Komponente in `AssumptionsStep.tsx` wird zu `AccordionSection` umgebaut.
- Props: `title: string`, `summary?: ReactNode` (rechtsbündiger Status-Text), `defaultOpen?: boolean` (Default `false`), `children: ReactNode`.
- Header-Zeile: bestehender Eyebrow-Style (Primary-Akzentstrich + Caps-Titel) plus Chevron `▾`/`▸` links und `summary` rechts.
- Button mit `aria-expanded` und passender Region-Verknüpfung für Screenreader.
- Keine neue Bibliothek, kein neuer Store-Eintrag.

## Status-Vorschau-Logik

Berechnet jeweils on the fly aus dem aktuellen `pensionStore`-State und Profil:

- **Ansparen**: `weightedRealReturn(savingsAllocation)` über `formatPercent`.
- **Auszahlung**: bei `payoutMethod === "annuity"` → `Annuität · {payoutYears} J.`; sonst → `Sichere Entnahme · {safeWithdrawalRate * 100} %`.
- **Bestehendes Vermögen**: Anzahl Einträge in `profile.assets`. Bei `0` → `Keine`.
- **Rahmen-Annahmen**: `Inflation {inflation * 100} % · Steuer {taxBufferPct * 100} %`.

Formatierung über bestehende `formatPercent`-Helfer aus `lib/format.ts`.

## Was sich nicht ändert

- Keine Änderung an Logik, Berechnungen, Defaults oder Persistenz.
- Keine Änderung an `Wizard.tsx`, anderen Steps oder Stores.
- Alle Tooltips, Hints und Inputs bleiben identisch.
- Reset-Button und Standard-Banner bleiben.

## Akzeptanzkriterien

1. Beim Öffnen von „Annahmen anpassen" sind alle vier Bereiche zugeklappt und nur die Header sichtbar.
2. Jeder Header zeigt rechts seine Status-Vorschau auf Basis des aktuellen States.
3. Klick auf einen Header öffnet/schließt nur diesen Bereich, andere bleiben unverändert.
4. Ändert man einen Wert (z. B. Inflation), aktualisiert sich der Status-Text im Header sofort.
5. Bestehende Tests (`calculations.test.ts`, `presets.test.ts`, `savingsRate.test.ts`, `explain.test.ts`) bleiben grün — keine Logikänderung.
