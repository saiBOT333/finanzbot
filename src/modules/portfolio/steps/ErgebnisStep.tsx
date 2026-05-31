import { useProfile } from "../../../lib/profile/useProfile";
import { portfolioStore } from "../state";
import { computeBreakdown } from "../classify";
import { computeRebalance } from "../rebalance";
import { formatEUR } from "../../../lib/format";

function StackedBar({ riskyPercent }: { riskyPercent: number }) {
  const safePercent = 100 - riskyPercent;
  return (
    <div className="flex h-6 w-full overflow-hidden border border-outline-variant">
      <div
        className="bg-primary"
        style={{ width: `${riskyPercent}%` }}
        aria-label={`Aktien ${riskyPercent.toFixed(0)} %`}
      />
      <div
        className="bg-surface-variant"
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
        <h3 className="mb-2 font-serif text-lg">Rebalancing-Empfehlung</h3>
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
