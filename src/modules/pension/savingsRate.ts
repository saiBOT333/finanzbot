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
