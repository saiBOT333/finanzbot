import { useProfile } from "../../../lib/profile/useProfile";
import { Card } from "../../../components/ui/Card";
import { portfolioStore } from "../state";
import { computeBreakdown } from "../classify";
import { computeRebalance } from "../rebalance";
import { formatEUR, formatEURRounded } from "../../../lib/format";

function StackedBar({ riskyPercent }: { riskyPercent: number }) {
  const safePercent = 100 - riskyPercent;
  return (
    <div className="flex h-6 w-full overflow-hidden rounded-m3-pill border border-outline-variant">
      <div
        className="bg-primary"
        style={{ width: `${riskyPercent}%` }}
        aria-label={`Aktien ${riskyPercent.toFixed(0)} %`}
      />
      <div
        className="bg-outline-variant"
        style={{ width: `${safePercent}%` }}
        aria-label={`Sicher ${safePercent.toFixed(0)} %`}
      />
    </div>
  );
}

/** „15 Prozentpunkte" bzw. „2,5 Prozentpunkte" — ohne Nachkommastelle, wenn ganzzahlig. */
function formatPp(pp: number): string {
  const rounded = Math.round(Math.abs(pp) * 10) / 10;
  const text = Number.isInteger(rounded)
    ? rounded.toFixed(0)
    : rounded.toFixed(1).replace(".", ",");
  return `${text} Prozentpunkte`;
}

/** Kleiner Farbpunkt, der Tabellenzeile und Balkenfarbe verknüpft. */
function ColorDot({ tone }: { tone: "equity" | "safe" }) {
  return (
    <span
      aria-hidden
      className={`mr-2 inline-block h-2.5 w-2.5 rounded-[3px] align-middle ${
        tone === "equity" ? "bg-primary" : "bg-outline-variant"
      }`}
    />
  );
}

export function ErgebnisStep() {
  const profile = useProfile();
  const state = portfolioStore.useState();
  const breakdown = computeBreakdown(profile.assets ?? []);
  const rebalance = computeRebalance(breakdown, state.targetEquityPercent);
  const hasAssets = breakdown.consideredEuro > 0;

  const targetRiskyEuro = (breakdown.consideredEuro * state.targetEquityPercent) / 100;
  const targetSafeEuro = breakdown.consideredEuro - targetRiskyEuro;
  const deltaRisky = targetRiskyEuro - breakdown.riskyEuro;
  const deltaSafe = targetSafeEuro - breakdown.safeEuro;
  const fmtDelta = (v: number) =>
    (v > 0 ? "+" : v < 0 ? "−" : "±") + formatEUR(Math.round(Math.abs(v)));
  const safePercent = 100 - state.targetEquityPercent;
  const currentSafePercent = 100 - breakdown.currentEquityPercent;

  return (
    <div className="space-y-6">
      {!hasAssets && (
        <Card>
          <p className="m3-eyebrow-muted">Hinweis</p>
          <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-on-surface-variant">
            Noch keine Empfehlung möglich — trag in Schritt 1 mindestens eine Position ein
            (Tagesgeld, ETF-Depot, Festgeld …).
          </p>
        </Card>
      )}

      {hasAssets && rebalance.direction === "shift-to-safe" && (
        <Card variant="hero">
          <p className="text-[12px] uppercase tracking-[0.08em] opacity-85">Deine Empfehlung</p>
          <p className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[34px]">
            Verschiebe {formatEURRounded(rebalance.deltaAmount, 100)} von Aktien in den
            sicheren Teil.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed opacity-85">
            Du liegst {formatPp(rebalance.deltaPercent)} über deiner Wunsch-Aktienquote.
            Sicherer Teil = Tagesgeld, Anleihen, Geldmarkt.
          </p>
        </Card>
      )}

      {hasAssets && rebalance.direction === "shift-to-equity" && (
        <Card variant="hero">
          <p className="text-[12px] uppercase tracking-[0.08em] opacity-85">Deine Empfehlung</p>
          <p className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[34px]">
            Verschiebe {formatEURRounded(rebalance.deltaAmount, 100)} in Aktien
            (z. B. Welt-ETF).
          </p>
          <p className="mt-3 text-[13px] leading-relaxed opacity-85">
            Du liegst {formatPp(rebalance.deltaPercent)} unter deiner Wunsch-Aktienquote.
          </p>
        </Card>
      )}

      {hasAssets && rebalance.direction === "balanced" && (
        <Card>
          <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-success">
            ◯ Alles im Lot
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-on-surface">
            Nichts zu tun.
          </p>
          <p className="mt-3 font-sans text-[13.5px] leading-relaxed text-on-surface-variant">
            Deine Aufteilung weicht weniger als 1 Prozentpunkt von deinem Wunsch ab.
          </p>
        </Card>
      )}

      {hasAssets && (
        <section>
          <p className="m3-eyebrow-muted">Ist-Aufteilung</p>
          <div className="mt-3">
            <StackedBar riskyPercent={breakdown.currentEquityPercent} />
          </div>
          <p className="mt-2 font-sans text-[14px] text-on-surface">
            <strong className="tabular-nums">{breakdown.currentEquityPercent.toFixed(1)} %</strong>{" "}
            Aktien ({formatEUR(breakdown.riskyEuro)}) · {formatEUR(breakdown.safeEuro)} sicherer
            Teil
          </p>
          {breakdown.excludedEuro > 0 && (
            <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">
              Zusätzlich {formatEUR(breakdown.excludedEuro)} außerhalb der Aufteilung
              (z. B. Immobilie, bAV) — lässt sich nicht einfach umschichten und wird deshalb
              separat ausgewiesen.
            </p>
          )}
        </section>
      )}

      {hasAssets && (
        <section>
          <p className="m3-eyebrow-muted">Wunsch-Aufteilung</p>
          <div className="mt-3">
            <StackedBar riskyPercent={state.targetEquityPercent} />
          </div>
          <p className="mt-2 font-sans text-[14px] text-on-surface">
            <strong className="tabular-nums">{state.targetEquityPercent} %</strong> Aktien ·{" "}
            {100 - state.targetEquityPercent} % sicherer Teil
          </p>
        </section>
      )}

      {hasAssets && (
        <section className="border border-outline-variant bg-surface-container p-4">
          <p className="m3-eyebrow-muted">Die Rechnung dahinter</p>
          <table className="mt-3 w-full font-sans text-sm tabular-nums">
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
                <td className="py-2 text-on-surface">
                  <ColorDot tone="equity" />
                  Aktien
                </td>
                <td className="py-2 text-right">
                  {formatEUR(breakdown.riskyEuro)}{" "}
                  <span className="text-on-surface-variant">
                    ({breakdown.currentEquityPercent.toFixed(1)} %)
                  </span>
                </td>
                <td className="py-2 text-right">
                  {formatEUR(Math.round(targetRiskyEuro))}{" "}
                  <span className="text-on-surface-variant">
                    ({state.targetEquityPercent.toFixed(1)} %)
                  </span>
                </td>
                <td className="py-2 text-right font-medium">{fmtDelta(deltaRisky)}</td>
              </tr>
              <tr className="border-t border-outline-variant">
                <td className="py-2 text-on-surface">
                  <ColorDot tone="safe" />
                  Sicherer Teil
                </td>
                <td className="py-2 text-right">
                  {formatEUR(breakdown.safeEuro)}{" "}
                  <span className="text-on-surface-variant">
                    ({currentSafePercent.toFixed(1)} %)
                  </span>
                </td>
                <td className="py-2 text-right">
                  {formatEUR(Math.round(targetSafeEuro))}{" "}
                  <span className="text-on-surface-variant">({safePercent.toFixed(1)} %)</span>
                </td>
                <td className="py-2 text-right font-medium">{fmtDelta(deltaSafe)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
