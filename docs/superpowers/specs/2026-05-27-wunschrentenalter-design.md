# Wunschrentenalter sauber im Rentenrechner berücksichtigen

**Status:** Design
**Datum:** 2026-05-27
**Modul:** `pension`

## Problem

Das Wunschrentenalter (`retirementAge`) beeinflusst aktuell nur die Sparphase
(weniger Jahre → höhere Sparrate). Drei reale Effekte eines früheren Eintritts
werden ignoriert:

1. **Abschläge** auf die gesetzliche Rente: 0,3 % pro Monat vorzeitig
   (max. 14,4 % bei 4 Jahren früher).
2. **Fehlende Beitragsjahre**: die Renteninfo-Hochrechnung („wenn Sie wie
   bisher Beiträge zahlen") gilt bis zur Regelaltersgrenze. Wer früher
   aufhört, sammelt weniger Entgeltpunkte.
3. **Längere Bezugsdauer**: `payoutYears` ist ein konstanter Input. Wer mit 63
   statt 67 in Rente geht, braucht in Wirklichkeit 4 Jahre länger Geld — das
   passt im UI heute niemand an.

Folge: das Modell unterschätzt die Rentenlücke bei früherem Eintritt
systematisch.

## Lösung im Überblick

Drei orthogonale Bausteine, die alle vom bereits eingegebenen `retirementAge`
abgeleitet werden:

| Baustein | Was es tut | Wo |
|---|---|---|
| **Regelaltersgrenze** aus Geburtsjahr | Bezugspunkt für Abschläge | neue Funktion in `defaults.ts` |
| **Renten-Korrektur** (Abschläge + Beitragsjahre) | reduziert die Brutto-Rente bevor Brutto→Netto→Real läuft | erweitert `projectedNetPensionToday` |
| **Planungsalter statt Bezugsdauer** | UI-Feld „bis Alter X planen" (Default 90), `payoutYears` wird abgeleitet | State + AssumptionsStep |

Die Kernrechnung in `calculations.ts` bleibt unangetastet — sie konsumiert
weiterhin `expectedStatePension` und `payoutYears`. Die Ableitung passiert
eine Ebene höher (im Renteninfo-Schritt bzw. beim Mapping vom Store auf die
`PensionInputs`).

## Baustein 1: Regelaltersgrenze aus Geburtsjahr

Neue reine Funktion in `defaults.ts`:

```ts
/**
 * Regelaltersgrenze nach SGB VI § 235. Gestaffelt für Jahrgänge 1947–1963,
 * ab Jahrgang 1964 fix 67. Vor 1947 fix 65.
 *
 * Quelle: https://www.deutsche-rentenversicherung.de/.../regelaltersgrenze.html
 */
export function regelaltersgrenze(birthYear: number): number {
  if (birthYear <= 1946) return 65;
  if (birthYear >= 1964) return 67;
  // Jahrgänge 1947–1958: +1 Monat pro Jahr (65y 1m … 66y 0m)
  // Jahrgänge 1959–1963: +2 Monate pro Jahr (66y 2m … 66y 10m)
  const monthsExtra = birthYear <= 1958
    ? (birthYear - 1946)            // 1 → 12 Monate
    : 12 + (birthYear - 1958) * 2;  // 14, 16, 18, 20, 22 Monate
  return 65 + monthsExtra / 12;
}
```

Geburtsjahr wird aus `currentAge` + aktuellem Jahr berechnet
(`new Date().getFullYear() - currentAge`). Vereinfachung: Geburtstag innerhalb
des Jahres wird ignoriert — Fehler maximal 1 Jahrgang, irrelevant für die
Renten-Hochrechnung.

Tests in `defaults.test.ts`: Eckwerte 1946, 1947, 1958, 1959, 1963, 1964.

## Baustein 2: Renten-Korrektur (Abschläge + Beitragsjahre)

### Neue Funktion `adjustGrossForEarlyRetirement`

```ts
/**
 * Reduziert die Renteninfo-Brutto-Rente um:
 *  - Abschläge: 0,3 % pro Monat zwischen retirementAge und regelaltersgrenze
 *  - Beitragsjahre-Faktor: tatsächliche / geplante Beitragsmonate
 *
 * Bei Eintritt zur Regelaltersgrenze oder später: Brutto bleibt unverändert
 * (Zuschläge für späteren Eintritt explizit NICHT modelliert — separater Scope).
 */
export function adjustGrossForEarlyRetirement(
  grossWithoutAdjustment: number,
  retirementAge: number,
  regelalter: number,
  contributionStartAge: number,
): { adjustedGross: number; abschlagPct: number; beitragsFaktor: number } {
  if (retirementAge >= regelalter) {
    return { adjustedGross: grossWithoutAdjustment, abschlagPct: 0, beitragsFaktor: 1 };
  }
  const monthsEarly = (regelalter - retirementAge) * 12;
  const abschlagPct = Math.min(0.144, monthsEarly * 0.003);

  const plannedContributionMonths = (regelalter - contributionStartAge) * 12;
  const actualContributionMonths = (retirementAge - contributionStartAge) * 12;
  const beitragsFaktor = Math.max(0, actualContributionMonths / plannedContributionMonths);

  const adjustedGross = grossWithoutAdjustment * (1 - abschlagPct) * beitragsFaktor;
  return { adjustedGross, abschlagPct, beitragsFaktor };
}
```

### Integration in `projectedNetPensionToday`

Die bestehende Funktion bekommt drei zusätzliche Parameter
(`retirementAge`, `regelalter`, `contributionStartAge`) und wendet die
Korrektur als allerersten Schritt an. Die Rückgabe wird um die
Diagnose-Felder erweitert, damit das UI die Pipeline anzeigen kann:

```ts
{
  grossBeforeAdjustment: number;  // Eingabe vom Renteninfo-Brief
  abschlagPct: number;            // 0…0,144
  beitragsFaktor: number;         // 0…1
  grossAdjusted: number;          // nach Abschlag + Beitragsjahre
  grossNominal: number;           // grossAdjusted × (1+raise)^n
  netNominal: number;             // grossNominal × (1−deduction)
  netReal: number;                // netNominal / (1+inflation)^n
}
```

### Beitragsbeginn-Default

`contributionStartAge` = 20 als Default in `constants.ts`. Override-Feld im
Renteninfo-Schritt (collapsible „Abweichende Erwerbsbiografie?"), für Nutzer
mit Studium, Kinderpause oder Spätstart in Selbstständigkeit.

### UI-Erweiterung im Renteninfo-Schritt

Die bestehende Hochrechnungs-Box bekommt zusätzliche `CalcRow`-Zeilen oben
drauf:

```
Brutto ohne Anpassung               1.988 €
− 14,4 % Abschlag (4 J. vorzeitig)  1.702 €
× 91,5 % Beitragsjahre (43/47)      1.557 €
─────────────────────────────────────────
× (1 + 1,5 %)^27                    2.325 € brutto in 27 J.
− 20 % Steuern + KV/PV              1.860 € netto in 27 J.
÷ Inflation 2 % · 27 J.             1.087 € heute
```
(Beispiel: aktuelles Alter 36, Renteneintritt 63, Regelalter 67, Beitragsbeginn 20.)

Wenn `retirementAge >= regelalter`: die zwei oberen Zeilen erscheinen nicht
(Korrektur ist Identität).

### Tests

In `defaults.test.ts`:

- Eintritt zur Regelaltersgrenze: `adjustedGross === grossWithoutAdjustment`
- 4 Jahre vorzeitig, contributionStart 20, regelalter 67: `abschlagPct = 0,144`,
  `beitragsFaktor = 43/47 ≈ 0,915`
- Späterer Eintritt: Korrektur bleibt Identität (keine Zuschläge)

## Baustein 3: Planungsalter statt Bezugsdauer

### State-Änderung

In `state.ts` (`pensionStore`):
- ersetzen: `payoutYears: number` → `planningAge: number` (Default 90)
- ergänzen: `contributionStartAge: number` (Default 20)

### Mapping zur Rechnung

Beim Bauen der `PensionInputs` (`withDefaults` oder direkt an der Aufrufstelle):

```ts
payoutYears: Math.max(0, planningAge - retirementAge)
```

Die `PensionInputs.payoutYears`-Semantik bleibt unverändert — `calculations.ts`
kennt nur Jahre. Sauberer als der Rechnung das Planungsalter beizubringen.

### UI-Änderung in `AssumptionsStep`

Im Annahmen-Accordion, Bereich „Auszahlung":
- Label „Bezugsdauer in Jahren" → „Planen bis Alter"
- Default 90 statt PAYOUT_YEARS_DEFAULT (30 Jahre fix)
- Hinweistext: „Default 90 — sicherer Puffer über die Restlebenserwartung mit
  67 (≈ 85–88). Wer langfristig plant: 95 oder 100."
- Anzeige der abgeleiteten Bezugsdauer als kleiner Hinweis darunter:
  „Bei Renteneintritt mit 63 = 27 Jahre Rentenzeit"

### Konstante

In `constants.ts`:
- `PAYOUT_YEARS_DEFAULT` entfällt
- Neu: `PLANNING_AGE_DEFAULT = 90`, `CONTRIBUTION_START_AGE_DEFAULT = 20`

## Migration des persistierten States

`pensionStore` wird via `lib/moduleStore.ts` in `localStorage` gespeichert.
Alte Stände enthalten `payoutYears`, neue `planningAge`.

Migration im Store-Loader: wenn `planningAge` fehlt und `payoutYears` existiert,
einmalig konvertieren als `planningAge = retirementAge + payoutYears`
(retirementAge aus Profil, Fallback 67). Danach `payoutYears` aus dem
gespeicherten Objekt löschen. Stille Migration, kein UI-Hinweis nötig.

Selbe Migration für JSON-Importe (siehe bestehender Import-Pfad in `App.tsx`
mit der Error-Boundary aus `d758cff`).

## Was NICHT in diesem Scope ist

- **Zuschläge bei späterem Eintritt** (0,5 %/Monat). Eigene Frage,
  betrifft nur Edge-Case-Nutzer.
- **Geschlechtsspezifische Lebenserwartung**. Erfordert Profil-Feld,
  separater Vorschlag.
- **Echte DRV-Sterbetafeln statt Pauschal-90**. Statistische Korrektheit
  vs. mentaler Klarheit — Default 90 mit Override ist bewusst einfach.
- **Lebenslauf-Lücken** (Arbeitslosigkeit, Teilzeit). Der lineare
  Beitragsjahre-Faktor mit Override-Feld deckt 90 % der Fälle.

## Dateien, die geändert werden

| Datei | Änderung |
|---|---|
| `src/modules/pension/constants.ts` | `PAYOUT_YEARS_DEFAULT` raus, `PLANNING_AGE_DEFAULT` + `CONTRIBUTION_START_AGE_DEFAULT` rein |
| `src/modules/pension/defaults.ts` | `regelaltersgrenze()` + `adjustGrossForEarlyRetirement()` neu; `projectedNetPensionToday()` erweitert |
| `src/modules/pension/defaults.test.ts` | Tests für beide neuen Funktionen + erweiterte Pipeline |
| `src/modules/pension/state.ts` | `payoutYears` → `planningAge`, neu `contributionStartAge`, Migrations-Logik |
| `src/modules/pension/steps/PensionInformationStep.tsx` | Korrektur-Parameter durchreichen, neue Hochrechnungs-Zeilen, Override-Feld für Beitragsbeginn |
| `src/modules/pension/steps/AssumptionsStep.tsx` | Label/Default/Hint umstellen, abgeleitete Bezugsdauer anzeigen |
| `src/modules/pension/PensionWizard.tsx` (oder Mapping-Stelle zu `PensionInputs`) | `payoutYears = max(0, planningAge − retirementAge)` |

## Erfolgs-Kriterien

1. Mit Default-Werten (retirementAge 67, planningAge 90): identische Ergebnisse
   wie heute (Regressions-Test).
2. retirementAge 63 statt 67, sonst identisch: gesetzliche Rente sinkt um
   Abschlag × Beitragsjahre-Faktor, payoutYears steigt um 4, Lücke und
   benötigtes Kapital wachsen entsprechend — in einem Test mit
   nachgerechnetem Erwartungswert verifiziert.
3. Alle bestehenden Tests in `calculations.test.ts`, `presets.test.ts`,
   `savingsRate.test.ts`, `explain.test.ts` laufen unverändert grün.
4. JSON-Export aus alter Version lädt sauber (Migrations-Pfad).
