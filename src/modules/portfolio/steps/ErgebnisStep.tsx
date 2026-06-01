import { useProfile } from "../../../lib/profile/useProfile";
import { portfolioStore } from "../state";
import { computeBreakdown } from "../classify";
import { computeRebalance } from "../rebalance";
import { formatEUR } from "../../../lib/format";

function StackedBar({ riskyPercent }: { riskyPercent: number }) {
  const safePercent = 100 - riskyPercent;
  return (
    <div className="flex h-6 w-full overflow-hidden rounded-m3-pill border border-outline-variant">
      <div
        className="bg-error"
        style={{ width: `${riskyPercent}%` }}
        aria-label={`Aktien ${riskyPercent.toFixed(0)} %`}
      />
      <div
        className="bg-success"
        style={{ width: `${safePercent}%` }}
        aria-label={`Sicher ${safePercent.toFixed(0)} %`}
      />
    </div>
  );
}

export function ErgebnisStep() {
  const profile = useProfile();
  const state = portfolioStore.useState();
  const breakdown = computeBreakdown(profile.assets ?? []);
  const rebalance = computeRebalance(breakdown, state.targetEquityPercent);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-serif text-lg">Ist-Aufteilung</h3>
        {breakdown.consideredEuro > 0 ? (
          <>
            <StackedBar riskyPercent={breakdown.currentEquityPercent} />
            <p className="mt-2 font-sans text-sm">
              <strong>{breakdown.currentEquityPercent.toFixed(1)}&nbsp;%</strong> Aktien
              ({formatEUR(breakdown.riskyEuro)}) · {formatEUR(breakdown.safeEuro)} Sicherheitsbaustein
            </p>
          </>
        ) : (
          <p className="font-sans text-sm text-on-surface-variant">
            Keine Anlagen in der Risikobetrachtung. Trage liquide Positionen
            (Cash, Anleihen, ETFs …) in Schritt 1 ein.
          </p>
        )}
        {breakdown.excludedEuro > 0 && (
          <p className="mt-2 text-xs text-on-surface-variant">
            Zusätzlich {formatEUR(breakdown.excludedEuro)} außerhalb der Quote (z.&nbsp;B. Immobilie, bAV).
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-serif text-lg">Ziel-Aufteilung</h3>
        <StackedBar riskyPercent={state.targetEquityPercent} />
        <p className="mt-2 font-sans text-sm">
          <strong>{state.targetEquityPercent}&nbsp;%</strong> Aktien · {100 - state.targetEquityPercent}&nbsp;% sicher
        </p>
      </section>

      <section className="border border-outline-variant bg-surface-container p-4">
        <h3 className="mb-3 font-serif text-lg">Rebalancing-Empfehlung</h3>

        {breakdown.consideredEuro > 0 && (() => {
          const targetRiskyEuro = (breakdown.consideredEuro * state.targetEquityPercent) / 100;
          const targetSafeEuro = breakdown.consideredEuro - targetRiskyEuro;
          const deltaRisky = targetRiskyEuro - breakdown.riskyEuro;
          const deltaSafe = targetSafeEuro - breakdown.safeEuro;
          const fmtDelta = (v: number) =>
            (v > 0 ? "+" : v < 0 ? "−" : "±") + formatEUR(Math.round(Math.abs(v)));
          const safePercent = 100 - state.targetEquityPercent;
          const currentSafePercent = 100 - breakdown.currentEquityPercent;
          return (
            <table className="mb-4 w-full font-sans text-sm tabular-nums">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.04em] text-on-surface-variant">
                  <th className="pb-2 text-left font-medium"></th>
                  <th className="pb-2 text-right font-medium">Aktuell</th>
                  <th className="pb-2 text-right font-medium">Ziel</th>
                  <th className="pb-2 text-right font-medium">Differenz</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-outline-variant">
                  <td className="py-2 text-error">Aktien</td>
                  <td className="py-2 text-right">
                    {formatEUR(breakdown.riskyEuro)}{" "}
                    <span className="text-on-surface-variant">({breakdown.currentEquityPercent.toFixed(1)}&nbsp;%)</span>
                  </td>
                  <td className="py-2 text-right">
                    {formatEUR(Math.round(targetRiskyEuro))}{" "}
                    <span className="text-on-surface-variant">({state.targetEquityPercent.toFixed(1)}&nbsp;%)</span>
                  </td>
                  <td className="py-2 text-right font-medium">{fmtDelta(deltaRisky)}</td>
                </tr>
                <tr className="border-t border-outline-variant">
                  <td className="py-2 text-success">Sicher</td>
                  <td className="py-2 text-right">
                    {formatEUR(breakdown.safeEuro)}{" "}
                    <span className="text-on-surface-variant">({currentSafePercent.toFixed(1)}&nbsp;%)</span>
                  </td>
                  <td className="py-2 text-right">
                    {formatEUR(Math.round(targetSafeEuro))}{" "}
                    <span className="text-on-surface-variant">({safePercent.toFixed(1)}&nbsp;%)</span>
                  </td>
                  <td className="py-2 text-right font-medium">{fmtDelta(deltaSafe)}</td>
                </tr>
              </tbody>
            </table>
          );
        })()}

        {rebalance.direction === "balanced" && breakdown.consideredEuro > 0 && (
          <p className="font-sans text-sm">
            Dein Portfolio liegt im Zielkorridor (Abweichung unter 1&nbsp;Prozentpunkt). Nichts zu tun.
          </p>
        )}
        {rebalance.direction === "balanced" && breakdown.consideredEuro === 0 && (
          <p className="font-sans text-sm">
            Noch keine Empfehlung möglich — trag in Schritt 1 mindestens eine
            liquide Anlage ein.
          </p>
        )}
        {rebalance.direction === "shift-to-safe" && (
          <p className="font-sans text-sm">
            Du liegst <strong>{Math.abs(rebalance.deltaPercent).toFixed(1)}&nbsp;Pp</strong>{" "}
            über deinem Ziel. Verschiebe ca. <strong>{formatEUR(rebalance.deltaAmount)}</strong>{" "}
            aus Aktien in den Sicherheitsbaustein (Cash, Anleihen, Geldmarkt).
          </p>
        )}
        {rebalance.direction === "shift-to-equity" && (
          <p className="font-sans text-sm">
            Du liegst <strong>{Math.abs(rebalance.deltaPercent).toFixed(1)}&nbsp;Pp</strong>{" "}
            unter deinem Ziel. Verschiebe ca. <strong>{formatEUR(rebalance.deltaAmount)}</strong>{" "}
            in Aktien (z.&nbsp;B. Welt-ETF).
          </p>
        )}
      </section>
    </div>
  );
}
