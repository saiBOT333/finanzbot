import { createPortal } from "react-dom";
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
 * Druckbogen — ein fürs Papier gebautes 1-Seiten-A4-Dokument. Wird per Portal
 * direkt an `document.body` gehängt: am Bildschirm `hidden`, im Druck per
 * `print:block` sichtbar, während globals.css `#root` ausblendet — so ist der
 * Bogen beim `window.print()` das einzige Element auf der Seite.
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

  return createPortal(
    <div className="print-sheet hidden w-[210mm] bg-white text-[9pt] leading-snug text-neutral-800 print:block">
      {/* Kopfband — vollflächig Indigo */}
      <header className="bg-[#2E4BAE] px-[14mm] pb-[4mm] pt-[5mm] text-white">
        <p className="text-[8pt] font-semibold uppercase tracking-[0.28em] text-white/70">
          FinanzBot
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-4">
          <h1 className="text-[16pt] font-bold leading-tight">
            Vorsorge · Rentenlücke &amp; Sparrate
          </h1>
          <span className="whitespace-nowrap text-[8.5pt] text-white/75">
            Stand: {today}
          </span>
        </div>
      </header>

      <div className="px-[14mm] pb-[5mm] pt-[6mm]">
        {/* Achtung (bedingt) — weiche, getönte Box */}
        {usingDefaultStatePension && (
          <p className="mb-4 rounded-xl bg-[#FFE9E6] px-5 py-2.5 text-[8pt] leading-relaxed text-neutral-800">
            <strong className="font-semibold">Achtung:</strong> Die gesetzliche
            Rente wurde per Faustformel (48 % vom Netto) geschätzt. Mit dem
            echten Wert aus der Renteninformation kann die Sparrate deutlich
            abweichen.
          </p>
        )}

        {/* Ergebnis — Blickfang auf blassem Indigo-Panel */}
        <section className="rounded-2xl bg-[#EEF0FF] px-6 py-3.5">
          <p className="text-[8pt] font-semibold uppercase tracking-[0.18em] text-[#2E4BAE]">
            Empfohlene monatliche Sparrate
          </p>
          <p className="mt-1 text-[28pt] font-bold leading-none tracking-tight tabular-nums text-[#2E4BAE]">
            {formatEUR(result.monthlySavings, true)}
          </p>
          <p className="mt-2 text-[8.5pt] leading-relaxed text-neutral-600">
            {savingsRateMessage(result.savingsRatePct)}
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-5 border-t border-[#2E4BAE]/15 pt-2.5">
            <div>
              <p className="text-[7.5pt] font-medium uppercase tracking-[0.08em] text-neutral-500">
                Sparquote vom Netto
              </p>
              <p className="mt-1 text-[12pt] font-semibold tabular-nums text-neutral-900">
                {formatPercent(result.savingsRatePct / 100)}
              </p>
            </div>
            <div>
              <p className="text-[7.5pt] font-medium uppercase tracking-[0.08em] text-neutral-500">
                Alternativ · fix nominal
              </p>
              <p className="mt-1 text-[12pt] font-semibold tabular-nums text-neutral-900">
                {formatEUR(result.fixedNominalSavings, true)}
              </p>
            </div>
          </div>
        </section>

        {/* Kernzahlen — weiche Tint-Kacheln */}
        <section className="mt-3 grid grid-cols-3 gap-3">
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

        {/* Annahmen & Eingaben */}
        <section className="mt-4">
          <h2 className="text-[10.5pt] font-semibold text-[#2E4BAE]">
            Annahmen &amp; Eingaben
          </h2>
          <table className="mt-1.5 w-full border-separate border-spacing-y-[2px] text-[8.5pt]">
            <tbody>
              {explanation.inputs.map((it, i) => (
                <tr
                  key={it.symbol}
                  className={i % 2 === 1 ? "bg-[#F4F5FB]" : undefined}
                >
                  <td className="rounded-l-md py-0.5 pl-2.5 pr-2 font-mono font-medium text-[#2E4BAE]">
                    {it.symbol}
                  </td>
                  <td className="py-0.5 pr-2 text-neutral-700">{it.label}</td>
                  <td className="py-0.5 pr-3 text-right font-semibold tabular-nums text-neutral-900">
                    {it.value}
                  </td>
                  <td className="rounded-r-md py-0.5 pr-2.5 text-right">
                    <Flag isDefault={it.isDefault} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Herleitung */}
        <section className="mt-4">
          <h2 className="text-[10.5pt] font-semibold text-[#2E4BAE]">
            Herleitung
          </h2>
          <ol className="mt-1.5 flex flex-col gap-y-[2px] text-[8.5pt]">
            {explanation.steps.map((s, i) => (
              <li
                key={s.index}
                className={`flex items-baseline justify-between gap-3 rounded-md px-2.5 py-0.5 ${
                  i % 2 === 1 ? "bg-[#F4F5FB]" : ""
                }`}
              >
                <span className="text-neutral-700">
                  <span className="font-mono font-medium text-[#2E4BAE]">
                    {String(s.index).padStart(2, "0")}
                  </span>{" "}
                  {s.title}
                </span>
                <span className="whitespace-nowrap text-right font-semibold tabular-nums text-neutral-900">
                  {s.result}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Fuß */}
      <footer className="border-t border-neutral-200 px-[14mm] py-[4mm] text-[7.5pt] leading-relaxed text-neutral-500">
        <p>
          Alle Hauptbeträge in heutiger Kaufkraft — jährlich um die Inflation
          anpassen, um real gleich zu bleiben.
        </p>
        <p className="mt-1">
          Realgerechnete Orientierung · Keine Anlageberatung ·{" "}
          <span className="font-semibold text-[#2E4BAE]">FinanzBot</span>
        </p>
      </footer>
    </div>,
    document.body,
  );
}

function KernzahlCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F4F5FB] px-4 py-2">
      <p className="text-[7.5pt] font-medium uppercase leading-tight tracking-[0.04em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-[12pt] font-bold tabular-nums text-[#00105C]">
        {value}
      </p>
    </div>
  );
}

function Flag({ isDefault }: { isDefault: boolean }) {
  return (
    <span
      className={`text-[7pt] font-semibold uppercase tracking-wide ${
        isDefault ? "text-neutral-400" : "text-[#2E4BAE]"
      }`}
    >
      {isDefault ? "Standard" : "Eingabe"}
    </span>
  );
}
