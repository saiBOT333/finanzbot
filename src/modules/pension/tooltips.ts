/** Plain-language explanations for each input/output. Keys match field IDs. */
export const tooltips: Record<string, string> = {
  currentAge: "Dein aktuelles Alter in Jahren. Bestimmt, wie viel Zeit du noch zum Sparen hast.",
  retirementAge:
    "Mit wie vielen Jahren möchtest du in Rente gehen? Standard in Deutschland ist 67.",
  netIncomeMonthly: "Dein monatliches Netto-Einkommen heute (was tatsächlich aufs Konto kommt).",
  replacementRate:
    "Wie viel Prozent deines heutigen Netto-Einkommens du im Ruhestand brauchst. Faustformel: 80 %, weil viele Ausgaben (Pendeln, Sparen für die Rente, oft auch die Tilgung) wegfallen.",
  expectedStatePension:
    "Was die gesetzliche Rente nach Abzug von Steuern und Krankenversicherung voraussichtlich monatlich bringt – in heutiger Kaufkraft. Den Wert findest du auf deiner Renteninformation. Tipp: Aus dem Brutto-Wert dort einfach 20 % abziehen (Faustformel Finanztip).",
  inflation:
    "Jährlicher Kaufkraftverlust. Langfristig pendelt die Inflation um 2 %. Wir rechnen damit Beträge auf 'Geld in N Jahren' hoch.",
  realReturn:
    "Erwartete Rendite WÄHREND DER SPARPHASE nach Abzug der Inflation, z. B. bei einem breit gestreuten Welt-ETF. Finanzfluss rechnet mit 5 % real, Finanztip vorsichtiger mit ~3 % real (weil nicht 100 % in Aktien).",
  payoutRealReturn:
    "Erwartete Rendite IM RUHESTAND nach Inflation. Üblich ist eine geringere Rendite als in der Sparphase, weil im Alter der Aktienanteil heruntergefahren wird. Finanztip-Standard: ~1 % real (3 % nominal).",
  payoutMethod:
    "Wie das Vermögen in der Rente verbraucht wird. 'Annuität': Vermögen wird über X Jahre aufgebraucht (Finanztip). 'Sichere Entnahmerate': feste Quote pro Jahr, das Vermögen lebt theoretisch unbegrenzt (Finanzfluss).",
  payoutYears:
    "Wie viele Jahre dein Rentenkapital reichen soll. Finanztip empfiehlt 30 Jahre (rechne lieber bis 100 Lebensjahre).",
  safeWithdrawalRate:
    "Anteil deines Anfangsvermögens, den du jedes Jahr entnimmst. 3,5 % gilt als 'sichere Entnahmerate' bei langfristigem Anlegen — Vermögen wächst weiter und reicht voraussichtlich unbegrenzt.",
  taxBufferPct:
    "Aufschlag auf den Kapitalbedarf, um die spätere Kapitalertragssteuer (26,375 % auf Gewinne) zu kompensieren. Finanzfluss-Faustformel: 10–15 % zusätzliches Vermögen einplanen.",
  existingAssets:
    "Trag dein bestehendes Vermögen nach Anlageform getrennt ein. Jede Position wächst dann mit ihrer eigenen realen Rendite — Tagesgeld stagniert, ETF wächst kräftig. Macht die Hochrechnung deutlich realistischer als ein einzelner Mittelwert.",
  gapToday:
    "Die Differenz zwischen dem, was du im Ruhestand brauchst, und dem, was die gesetzliche Rente liefert – pro Monat, in heutiger Kaufkraft.",
  capitalNeeded:
    "Das Vermögen, das du bei Rentenbeginn brauchst, damit du die monatliche Lücke decken kannst — inklusive Steuer-Puffer, falls aktiviert.",
  monthlySavings:
    "Was du ab heute jeden Monat zusätzlich zur Seite legen müsstest, um diese Lücke zu schließen – schon bestehendes Vermögen ist berücksichtigt.",
  savingsRatePct: "Anteil deines aktuellen Netto-Einkommens, den du dafür sparen müsstest.",
  savingsRateContext:
    "Zum Vergleich: der deutsche Durchschnitt spart ~11 % vom Netto, Finanzfluss empfiehlt für die Altersvorsorge realistisch 15–20 %.",
};
