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
    "Trag dein bestehendes Vermögen nach Anlageform getrennt ein. Jede Position wächst dann mit ihrer eigenen realen Rendite — Tagesgeld stagniert, ETF wächst kräftig. Macht die Hochrechnung deutlich realistischer als ein einzelner Mittelwert. Annahme dabei: kein Rebalancing — jede Position läuft mit ihrer eigenen Rendite weiter, Umschichtungen zwischen Anlageklassen sind nicht modelliert. bAV / Riester / Rürup zählt nicht als Depotkapital (illiquide, Auszahlung als Rente) — schlage die erwartete Monatsrente daraus stattdessen auf die gesetzliche Rente auf.",
  gapToday:
    "Die monatliche Lücke zwischen Bedarf und gesetzlicher Rente, ausgedrückt in heutiger Kaufkraft. Real (heute) = gemessen in heutigen Preisen, also direkt vergleichbar mit deinem jetzigen Lebensniveau. Die Zahl im Hinweis ist derselbe Betrag nominal — die Euro-Summe, die du in N Jahren tatsächlich überweisen musst, weil bis dahin alles teurer geworden ist. Beide Zahlen beschreiben dasselbe Lebensniveau.",
  capitalNeeded:
    "Das Vermögen, das du bei Rentenbeginn brauchst, um die monatliche Lücke zu decken — in heutiger Kaufkraft (inkl. Steuer-Puffer, falls aktiviert). Real (heute) = ausgedrückt in heutigen Preisen, damit du den Betrag einschätzen kannst. Die Zahl im Hinweis ist derselbe Wert nominal — also was am Tag X tatsächlich auf dem Depotauszug stehen muss. Klingt nach mehr, ist durch die Inflation aber derselbe Kaufkraft-Wert.",
  existingFV:
    "Was dein heutiges Vermögen bis zum Renteneintritt mit seiner realen Rendite wert sein wird — ausgedrückt in heutiger Kaufkraft. Real (heute) = vergleichbar mit heutigen Preisen, sodass du es direkt gegen den Kapitalbedarf halten kannst. Die Zahl im Hinweis ist derselbe Wert nominal — die Euro-Summe, die dann tatsächlich auf dem Depotauszug steht.",
  monthlySavings:
    "Was du ab heute jeden Monat zusätzlich sparen müsstest — in heutiger Kaufkraft. Real (heute) heißt: das Modell rechnet inflationsbereinigt, deshalb musst du diesen Betrag jedes Jahr um die Inflation anpassen (z. B. +2 %). Steigt dein Gehalt mit der Inflation, bleibt deine Sparquote konstant. Die Alternative rechts daneben (Nominal fix) ist derselbe Plan ohne jährliche Anpassung — höherer Startbetrag, dafür einmal eingerichtet und vergessen.",
  fixedNominalSavings:
    "Nominale Variante: ein gleichbleibender Euro-Betrag über die gesamte Sparphase, ohne jährliche Inflationsanpassung. Er liegt höher als der reale Startwert, weil die frühen Zahlungen mehr Zinseszins sammeln müssen, um die inflationsbedingte Abschwächung der späteren Zahlungen auszugleichen. Vorteil: einmal als Dauerauftrag einrichten und nicht mehr anfassen.",
  savingsRatePct: "Anteil deines aktuellen Netto-Einkommens, den du dafür sparen müsstest.",
  savingsRateContext:
    "Zum Vergleich: der deutsche Durchschnitt spart ~11 % vom Netto, Finanzfluss empfiehlt für die Altersvorsorge realistisch 15–20 %.",
};
