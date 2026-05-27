/** Plain-language explanations for each input/output. Keys match field IDs. */
export const tooltips: Record<string, string> = {
  currentAge: "Dein aktuelles Alter in Jahren. Bestimmt, wie viel Zeit du noch zum Sparen hast.",
  retirementAge:
    "Mit wie vielen Jahren möchtest du in Rente gehen? Standard in Deutschland ist 67.",
  netIncomeMonthly: "Dein monatliches Netto-Einkommen heute (was tatsächlich aufs Konto kommt).",
  replacementRate:
    "Wie viel Prozent deines heutigen Netto-Einkommens du im Ruhestand brauchst. Faustformel: 80 %, weil viele Ausgaben (Pendeln, Sparen für die Rente, oft auch die Tilgung) wegfallen.",
  expectedStatePension:
    "Erwartete Netto-Rente in heutiger Kaufkraft — also nicht der Brutto-Wert von der Renteninformation und auch nicht das Netto in 35 Jahren, sondern was die Rente in heutigen Euro wert wäre. Nutze den Helfer darunter, der aus dem Brutto-Wert deiner Renteninformation (ohne Anpassung), deiner Steigerungs-Annahme und deinem persönlichen Steuer-/KV-Abzug die Netto-Rente in heutiger Kaufkraft rechnet.",
  inflation:
    "Jährlicher Kaufkraftverlust. Langfristig pendelt die Inflation um 2 %. Wir rechnen damit Beträge auf 'Geld in N Jahren' hoch.",
  realReturn:
    "Erwartete Rendite WÄHREND DER SPARPHASE nach Abzug der Inflation, z. B. bei einem breit gestreuten Welt-ETF. Finanzfluss rechnet mit 5 % real, Finanztip vorsichtiger mit ~3 % real (weil nicht 100 % in Aktien).",
  payoutRealReturn:
    "Erwartete Rendite IM RUHESTAND nach Inflation. Üblich ist eine geringere Rendite als in der Sparphase, weil im Alter der Aktienanteil heruntergefahren wird. Finanztip-Standard: ~1 % real (3 % nominal).",
  payoutMethod:
    "Wie das Vermögen in der Rente verbraucht wird. 'Annuität': Vermögen wird über X Jahre vollständig aufgebraucht — niedrigerer Kapitalbedarf, aber endlich. 'Sichere Entnahmerate': feste Quote pro Jahr, das Kapital lebt theoretisch unbegrenzt — höherer Kapitalbedarf, dafür kein Langlebigkeitsrisiko.",
  planningAge:
    "Bis zu welchem Lebensalter dein Kapital reichen soll. Default 90 als Puffer über die durchschnittliche Restlebenserwartung mit 67 (ca. 85–88 J.). Wer langfristig plant: 95 oder 100.",
  safeWithdrawalRate:
    "Anteil deines Anfangsvermögens, den du jedes Jahr entnimmst. 3,5 % gilt als 'sichere Entnahmerate' bei langfristigem Anlegen — Vermögen wächst weiter und reicht voraussichtlich unbegrenzt.",
  taxBufferPct:
    "Aufschlag auf den Kapitalbedarf, um die spätere Kapitalertragssteuer (26,375 % auf Gewinne) zu kompensieren. Finanzfluss-Faustformel: 10–15 % zusätzliches Vermögen einplanen. Vereinfachung: die Steuer trifft real nur die Gewinne, hier wird sie pauschal aufs Gesamtkapital gerechnet.",
  existingAssets:
    "Trag dein bestehendes Vermögen nach Anlageform getrennt ein. Jede Position wächst dann mit ihrer eigenen realen Rendite — Tagesgeld stagniert, ETF wächst kräftig. Macht die Hochrechnung deutlich realistischer als ein einzelner Mittelwert.",
  gapToday:
    "Die Differenz zwischen dem, was du im Ruhestand brauchst, und dem, was die gesetzliche Rente liefert – pro Monat, in heutiger Kaufkraft.",
  capitalNeeded:
    "Das Vermögen, das du bei Rentenbeginn brauchst, um die monatliche Lücke zu decken — angegeben in heutiger Kaufkraft (inkl. Steuer-Puffer, falls aktiviert). Der Betrag, der dann tatsächlich nominal auf dem Depotauszug stehen muss, liegt wegen der Inflation deutlich höher — siehe Hinweis unter der Zahl.",
  monthlySavings:
    "Was du ab heute jeden Monat zusätzlich zur Seite legen müsstest – in heutiger Kaufkraft. Da das Modell real rechnet, muss dieser Betrag jedes Jahr mit der Inflation angepasst werden (z. B. +2 %). Steigt dein Gehalt mit der Inflation, bleibt die Sparquote konstant.",
  fixedNominalSavings:
    "Alternativ: ein fester Nominalbetrag, den du die gesamte Sparphase gleichbleibend einzahlst – ohne jährliche Anpassung. Er liegt höher als der reale Startwert, weil frühe Zahlungen mehr Zinseszins sammeln müssen, um die inflationsbedingte Abschwächung späterer Zahlungen auszugleichen.",
  savingsRatePct: "Anteil deines aktuellen Netto-Einkommens, den du dafür sparen müsstest.",
  savingsRateContext:
    "Zum Vergleich: der deutsche Durchschnitt spart ~11 % vom Netto, Finanzfluss empfiehlt für die Altersvorsorge realistisch 15–20 %.",
};
