import type { PensionResult } from "./types";
import type { Explanation } from "./explain";
import { formatEUR, formatPercent } from "../../lib/format";
import { savingsRateMessage } from "./savingsRate";

type Props = {
  result: Extract<PensionResult, { kind: "ok" }>;
  explanation: Explanation;
  usingDefaultStatePension: boolean;
};

/**
 * Druckbogen — ein fürs Papier gebautes 1-Seiten-Dokument. Am Bildschirm
 * `hidden`, im Druck per `print:block` + dem @media-print-Block in globals.css
 * das einzig sichtbare Element.
 */
export function PensionPrintSheet({
  result,
  explanation,
  usingDefaultStatePension,
}: Props) {
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="print-sheet hidden print:block w-[210mm] bg-white p-[14mm] text-[9.5pt] leading-snug text-black">
      {/* 1 — Kopf */}
      <header className="flex items-baseline justify-between border-b-2 border-black pb-2">
        <h1 className="text-[15pt] font-bold">
          Vorsorge · Rentenlücke &amp; Sparrate
        </h1>
        <span className="text-[9pt]">Stand: {today}</span>
      </header>

      {/* 2 — Achtung (bedingt) */}
      {usingDefaultStatePension && (
        <p className="mt-3 border border-black px-3 py-2 text-[8.5pt]">
          <strong>Achtung:</strong> Die gesetzliche Rente wurde per Faustformel
          (48 % vom Netto) geschätzt. Mit dem echten Wert aus der
          Renteninformation kann die Sparrate deutlich abweichen.
        </p>
      )}

      {/* 3 — Ergebnis */}
      <section className="mt-4">
        <p className="text-[8pt] font-semibold uppercase tracking-wide">
          Empfohlene monatliche Sparrate
        </p>
        <div className="flex items-end justify-between gap-4">
          <p className="text-[26pt] font-bold leading-none tabular-nums">
            {formatEUR(result.monthlySavings, true)}
          </p>
          <div className="text-right text-[9pt]">
            <p>
              Sparquote:{" "}
              <strong>{formatPercent(result.savingsRatePct / 100)}</strong> vom
              Netto
            </p>
            <p>
              Alternativ fix nominal:{" "}
              <strong>{formatEUR(result.fixedNominalSavings, true)}</strong>
            </p>
          </div>
        </div>
        <p className="mt-1 text-[8.5pt]">
          {savingsRateMessage(result.savingsRatePct)}
        </p>
      </section>

      {/* 4 — Annahmen & Eingaben */}
      <section className="mt-4">
        <h2 className="mb-1 text-[8pt] font-semibold uppercase tracking-wide">
          Annahmen &amp; Eingaben
        </h2>
        <table className="w-full border-collapse text-[8.5pt]">
          <tbody>
            {explanation.inputs.map((it) => (
              <tr key={it.symbol} className="border-b border-neutral-300">
                <td className="py-0.5 pr-2 font-mono">{it.symbol}</td>
                <td className="py-0.5 pr-2">{it.label}</td>
                <td className="py-0.5 pr-2 text-right font-semibold tabular-nums">
                  {it.value}
                </td>
                <td className="py-0.5 text-right text-[7.5pt] uppercase text-neutral-600">
                  {it.isDefault ? "Standard" : "Eingabe"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 5 — Kernzahlen */}
      <section className="mt-4 grid grid-cols-3 gap-2">
        <KernzahlCell
          label="Rentenlücke / Monat (heute)"
          value={formatEUR(result.gapToday)}
        />
        <KernzahlCell
          label="Kapitalbedarf bei Renteneintritt"
          value={formatEUR(result.capitalNeeded)}
        />
        <KernzahlCell
          label="Vorhandenes Vermögen berücksichtigt"
          value={formatEUR(result.existingFV)}
        />
      </section>

      {/* 6 — Herleitung kompakt */}
      <section className="mt-4">
        <h2 className="mb-1 text-[8pt] font-semibold uppercase tracking-wide">
          Herleitung
        </h2>
        <ol className="text-[8.5pt]">
          {explanation.steps.map((s) => (
            <li
              key={s.index}
              className="flex justify-between gap-3 border-b border-neutral-300 py-0.5"
            >
              <span>
                <span className="font-mono">
                  {String(s.index).padStart(2, "0")}
                </span>{" "}
                {s.title}
              </span>
              <span className="whitespace-nowrap text-right font-semibold tabular-nums">
                {s.result}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 7 — Fuß */}
      <footer className="mt-4 border-t border-black pt-2 text-[7.5pt] leading-relaxed">
        <p>
          Alle Hauptbeträge in heutiger Kaufkraft — jährlich um die Inflation
          anpassen, um real gleich zu bleiben.
        </p>
        <p className="mt-0.5">
          Realgerechnete Orientierung · Keine Anlageberatung · FinanzBot
        </p>
      </footer>
    </div>
  );
}

function KernzahlCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-black px-2 py-1.5">
      <p className="text-[7.5pt] uppercase leading-tight">{label}</p>
      <p className="mt-0.5 text-[12pt] font-bold tabular-nums">{value}</p>
    </div>
  );
}
