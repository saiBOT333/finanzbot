# Rentenrechner-Fixes Implementation Plan

> **For agentic workers:** Dieser Plan ist auf VIER SESSIONS ausgelegt — eine Phase pro Session, in Reihenfolge. Jede Phase ist einzeln testbar und wird separat committet/gepusht. Vor Beginn einer Phase: diesen Plan lesen, Status-Checkboxen prüfen, nur die eigene Phase umsetzen, am Ende die Checkboxen der Phase abhaken und den Plan mitcommitten.

**Goal:** Die im Review vom 2026-06-09 gefundenen Fehler und Ungereimtheiten des Rentenrechners sauber beheben: (1) veraltender Renteninfo-Snapshot, (2) fehlende Frühverrentungs-Brücke, (3) Profil-Überschreiben durch die Empfehlung, plus konzeptionelle Verfeinerungen (sinkende Realrente, Entnahme-Timing, bAV-Behandlung).

**Architektur-Leitplanken:** Die Hauptrechnung bleibt strikt real (heutige Kaufkraft). `explain.ts` spiegelt `calculations.ts` exakt — jede Mathe-Änderung zieht den Rechenweg synchron mit (Definition of Done). Magic-Numbers nur in `constants.ts`. Die Referenz-Szenarien in `calculations.test.ts` (Daniela/Finanztip, Carlotta/Finanzfluss) bleiben als Invarianten bestehen.

**Tech Stack:** React + TypeScript, Vitest, Vite, Tailwind/Material You.

---

## Review-Befunde (Kontext für alle Sessions)

1. **Snapshot-Problem (dringend):** `PensionInformationStep` berechnet `netReal` einmalig und speichert die Zahl eingefroren in `expectedStatePension`. Ändert der Nutzer danach Renteneintritt/Inflation, rechnet das Ergebnis mit veralteten Annahmen. Die Roheingaben (Brutto, Anpassung, Abzug) liegen nur in lokalem `useState` und gehen verloren.
2. **Frührente zu günstig (dringend):** Gesetzliche Rente fließt im Modell ab `retirementAge` — real frühestens ab 63. Die volle Bedarfslücke zwischen Renteneintritt und Rentenbeginn fehlt im Kapitalbedarf. Der Abschlag nutzt `retirementAge` statt Anspruchsalter.
3. **Profil-Überschreiben (dringend):** `ResultStep` spiegelt die *empfohlene* Sparrate nach `profile.monthlySavingsCapacity` („was ich mir leisten kann") und überschreibt damit fremde Werte.
4. **Konstante reale Lücke:** Rentenanpassung (1,5 %) < Inflation (2 %) ⇒ reale Rente sinkt während des Bezugs weiter; das Modell hält die Lücke konstant → Kapitalbedarf leicht unterschätzt.
5. **Entnahme-Timing:** Auszahl-Annuität ist nachschüssig (Monatsende); Rentenbedarf fällt am Monatsanfang an → ~0,3 % Unterschätzung.
6. **bAV/Riester/Rürup:** wird wie freies Depotkapital aufgezinst + mit Kapitalertragssteuer-Puffer belegt; real illiquide, Rentenauszahlung, nachgelagerte Besteuerung.
7. **Kleinkram:** `AssumptionsStep` Fallback `retirementAge ?? 0`; `payoutYears = 0`-Fehlermeldung ohne Lösungshinweis; UI-Sperre `yearsToRetirement > 0` blockiert den unterstützten `== 0`-Fall; Geburtsjahr aus `currentYear − age` (±1 Jahr Unschärfe, nur dokumentieren).

---

## Phase 1 — Quick Wins (Session 1) ✅

Kein Einfluss auf die Rechenlogik. Befunde 3 + 7.

**Files:** `src/lib/profile/types.ts`, `src/modules/pension/steps/ResultStep.tsx`, `src/modules/pension/steps/AssumptionsStep.tsx`, `src/modules/pension/steps/BasicsStep.tsx`, `src/modules/pension/steps/PensionInformationStep.tsx`, `src/modules/pension/calculations.ts`

- [x] **1a. Profil-Überschreiben fixen:** Neues Profilfeld `recommendedMonthlySavings?: number` (Doku-Kommentar: Empfehlung aus dem Rentenrechner, ≠ Sparfähigkeit). `ResultStep`-Effekt schreibt dorthin statt nach `monthlySavingsCapacity`. Kein anderer Konsument vorhanden (per Grep verifiziert), keine Migration nötig.
- [x] **1b. `AssumptionsStep:29`:** Fallback `profile.retirementAge ?? 0` → `?? PENSION_DEFAULTS.retirementAge`.
- [x] **1c. Planungsalter mitziehen:** In `BasicsStep` beim Erhöhen des Renteneintritts `planningAge = max(planningAge, retirementAge + 1)` im pensionStore nachziehen, damit `payoutYears = 0` nicht entsteht.
- [x] **1d. Fehlermeldung:** `calculations.ts` Annuitäts-Guard um Lösungshinweis ergänzen („Planungsalter in Schritt 04 über den Renteneintritt setzen").
- [x] **1e. UI-Sperre lockern:** `PensionInformationStep` erlaubt Übernahme auch bei `yearsToRetirement === 0` (der Branch in `projectedNetPensionToday` existiert dafür); irreführenden Warnblock entfernen.
- [x] **1f. Geburtsjahr-Unschärfe** als Hint dokumentieren (Regelalter-Box + Code-Kommentar), kein neues Eingabefeld.
- [x] **Verify:** `npx vitest run` komplett grün; `npx tsc -p tsconfig.app.json --noEmit` sauber.

---

## Phase 2 — Renteninfo entkoppeln (Session 2) ✅

Befund 1. State-Refactoring: persistierte Rohwerte + Live-Ableitung statt eingefrorenem Snapshot.

**Files:** `state.ts`, `presets.ts`, `defaults.ts` (+ Tests), `steps/PensionInformationStep.tsx`, `steps/AssumptionsStep.tsx`, `steps/ResultStep.tsx`, ggf. `tooltips.ts`

- [x] **2a. State erweitern:** `PensionModuleState` bekommt `pensionInfo: { grossWithoutAdjustment: number | null; raise: number; deduction: number }` (Defaults: `null`, `PENSION_RAISE_DEFAULT`, `PENSION_GROSS_TO_NET_DEDUCTION`). Die drei lokalen `useState` in `PensionInformationStep` entfallen.
- [x] **2b. Selector:** `deriveExpectedStatePension(profile, moduleState)` in `defaults.ts` als reine Funktion. Präzedenz: manueller Override (`expectedStatePension !== null`) → Live-Berechnung via `projectedNetPensionToday` aus `pensionInfo` (mit aktuellen Werten für Renteneintritt, Inflation, Regelalter, Beitragsbeginn) → 48-%-Faustformel. Rückgabe inkl. Quelle (`"override" | "renteninfo" | "fallback"`), damit das UI den Zustand benennen kann. *(`currentYear` wird als Parameter übergeben — Testbarkeit.)*
- [x] **2c. Konsumenten umstellen:** `ResultStep` und `AssumptionsStep` beziehen die Rente nur noch über den Selector. „Wert übernehmen"-Button entfällt; der grüne Kasten in Schritt 3 zeigt die live berechnete Projektion samt Eingangswerten. *(Abweichung: das Formular bleibt neben dem grünen Kasten sichtbar — ein Umschalten beim ersten Tastendruck würde die Eingabe unterbrechen. „Zurücksetzen" leert `grossWithoutAdjustment`; der separate „Manueller Wert aktiv"-Kasten ersetzt den alten „Wert übernommen"-Kasten für migrierte Overrides.)*
- [x] **2d. Migration:** Bestehendes `expectedStatePension` bleibt als manueller Override gültig (kein Datenverlust); `pensionInfo` startet leer. In `migrate()` in `state.ts` ergänzt (für Tests exportiert).
- [x] **2e. Warnbox dreistufig:** Faustformel aktiv (rot, wie heute) / Renteninfo aktiv (neutral, Eckdaten der Ableitung) / manueller Override (Hinweis, dass Schritt-3-Daten ignoriert werden).
- [x] **Verify:** Tests: Präzedenz-Matrix des Selectors, Migration alter States, Regression „Renteneintritt ändern → abgeleitete Rente ändert sich mit". `vitest run` (236 Tests grün) + `tsc --noEmit` sauber + manueller Wizard-Smoke-Test (Dev-Server): Live-Ableitung 67→63 ändert 1.386 € → 1.107 €, Override-Pfad und Migration verifiziert.

---

## Phase 3 — Frühverrentungs-Brücke (Session 3)

Befund 2. Baut auf Phase 2 auf (Anspruchsalter fließt in die Renten-Ableitung ein).

**Files:** `constants.ts`, `defaults.ts` (+ Tests), `types.ts`, `calculations.ts` (+ Tests), `explain.ts` (+ Tests), `steps/BasicsStep.tsx`, `steps/ResultStep.tsx`, `PensionPrintSheet.tsx`

- [ ] **3a. Anspruchsalter:** Konstante `STATE_PENSION_MIN_CLAIM_AGE = 63`; `claimAge = max(retirementAge, 63)`. `adjustGrossForEarlyRetirement` rechnet den Abschlag aus `regelalter − claimAge` (14,4-%-Cap bleibt als Sicherheitsnetz); der Beitragsfaktor nutzt weiterhin `retirementAge` (Beiträge enden mit dem Arbeitsende).
- [ ] **3b. Zweiphasiger Kapitalbedarf in `calculatePension`:** Brückenphase (`retirementAge`→`claimAge`): voller Bedarf B als Annuität über `bridgeYears`. Hauptphase (`claimAge`→`planningAge`): Lücke L = B − R, Barwert auf Rentenbeginn, mit Auszahlrendite um `bridgeYears` auf Renteneintritt abgezinst. Bei `retirementAge ≥ 63` kollabiert alles exakt auf die heutige Formel (zentrales Testkriterium). SWR: Brücken-Annuität zusätzlich zum SWR-Kapital, SWR-Kapital bewusst NICHT abgezinst (konservativ, im Code dokumentieren).
- [ ] **3c. Result-Typ:** `bridgeYears`, `bridgeCapital`, `mainCapital` in `PensionResult`; `explain.ts` bekommt bedingten Brücken-Schritt; `ResultStep`-Argumentkette und `PensionPrintSheet` zeigen die Brücke nur, wenn `bridgeYears > 0`.
- [ ] **3d. UI-Hinweis** in `BasicsStep` bei Renteneintritt < 63 („gesetzliche Rente frühestens ab 63 — die Lücke davor wird voll aus Kapital gedeckt").
- [ ] **Verify:** Tests: Brücke = 0 bei 67 (Regressionen unverändert grün), Handrechnung 55er-Szenario (Brücke + abgezinste Hauptphase), SWR-Variante, Abschlag basiert auf 63 statt 55.

---

## Phase 4 — Konzeptionelle Verfeinerungen (Session 4)

Befunde 4, 5, 6 + Dokumentation. Erwartungswerte einzelner Tests ändern sich bewusst.

**Files:** `src/lib/finance.ts` (+ Tests), `calculations.ts` (+ Tests), `explain.ts` (+ Tests), `steps/ResultStep.tsx`, `steps/AssumptionsStep.tsx`, `tooltips.ts`

- [ ] **4a. Sinkende Realrente (umsetzen):** `presentValueGrowingAnnuity` in `lib/finance.ts`. Hauptphasen-Lücke als wachsende Annuität: B real konstant, R schrumpft real mit `(1+raise)/(1+inflation) − 1` (Default −0,5 % p. a.). Bei `raise = inflation` kollabiert sie auf die heutige Formel (Testkriterium). `raise` kommt aus `pensionInfo` (Phase 2).
- [ ] **4b. Entnahme-Timing (umsetzen):** Auszahl-Annuität auf vorschüssig umstellen (Faktor `× (1 + rₐₘ)`), Sparseite bleibt nachschüssig (konservativ). Code-Kommentar + Testanpassung (~0,3 % höhere Erwartungswerte).
- [ ] **4c. bAV/Riester/Rürup (filtern + hinweisen):** `company-pension`-Assets in `ResultStep` aus `existingAssets` herausfiltern; Hinweis im Vermögens-Accordion, die erwartete bAV-Monatsrente stattdessen auf die gesetzliche Rente aufzuschlagen. (Ausbaustufe `additionalPensionMonthly` nur nach explizitem Nutzer-Go.)
- [ ] **4d. Rebalancing-Annahme (nur dokumentieren):** Per-Bucket-Aufzinsung = „kein Rebalancing" explizit in Tooltip + Formel-Stammtisch-Kommentar benennen. Kein Umschalter.
- [ ] **Verify:** `vitest run`; Referenz-Szenarien prüfen (greifen bei `raise = inflation` weiter exakt); manueller Wizard-Smoke-Test; Rechenweg (`explain.ts`) zeigt wachsende Annuität + vorschüssige Entnahme korrekt.

---

## Querschnitt (gilt für jede Session)

- Branch: jeweils dedizierter `claude/…`-Branch laut Session-Auftrag; Commits klein und sprechend.
- Nach jeder Phase: `npx vitest run` komplett + `npx tsc -p tsconfig.app.json --noEmit`.
- `explain.ts` synchron zu `calculations.ts` halten — erklärtes Designziel des Moduls.
- Diesen Plan nach Abschluss einer Phase aktualisieren (Checkboxen + ggf. Erkenntnisse) und mitcommitten.
