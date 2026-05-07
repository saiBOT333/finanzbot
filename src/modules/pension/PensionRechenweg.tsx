import { Disclosure } from "../../components/Disclosure";
import type { Explanation } from "./explain";

type Props = {
  explanation: Explanation;
};

export function PensionRechenweg({ explanation }: Props) {
  const { inputs, steps, closing } = explanation;

  return (
    <Disclosure
      title="Rechenweg im Detail"
      hint="Jeder Schritt mit Formel, eingesetzten Werten und Zwischenergebnis"
    >
      <div className="space-y-6">
        <section>
          <div className="mb-3 flex items-baseline gap-2">
            <span aria-hidden className="h-[3px] w-6 bg-mustard-400" />
            <h4 className="font-mono text-[10.5px] font-medium uppercase tracking-instrument text-ink-700">
              Verwendete Werte
            </h4>
          </div>
          <div className="border border-ink-900 bg-white">
            <table className="w-full font-sans text-[13px]">
              <tbody className="divide-y divide-ink-100">
                {inputs.map((it) => (
                  <tr key={it.symbol}>
                    <td className="w-10 px-3 py-2 align-top font-mono text-[12px] font-medium text-mustard-600">
                      {it.symbol}
                    </td>
                    <td className="px-3 py-2 align-top text-ink-700">{it.label}</td>
                    <td className="px-3 py-2 text-right align-top font-mono font-medium tabular-nums text-ink-900">
                      {it.value}
                    </td>
                    <td className="w-24 px-3 py-2 text-right align-top">
                      {it.isDefault ? (
                        <span className="border border-ink-200 bg-paper-50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-instrument text-ink-500">
                          Standard
                        </span>
                      ) : (
                        <span className="border border-mustard-400 bg-mustard-50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-instrument text-mustard-700">
                          Eingabe
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-baseline gap-2">
            <span aria-hidden className="h-[3px] w-6 bg-mustard-400" />
            <h4 className="font-mono text-[10.5px] font-medium uppercase tracking-instrument text-ink-700">
              Rechenschritte
            </h4>
          </div>
          <ol className="divide-y divide-ink-100 border border-ink-900 bg-white">
            {steps.map((s) => (
              <li key={s.index} className="px-4 py-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] font-medium tabular-nums text-mustard-600">
                    {String(s.index).padStart(2, "0")}
                  </span>
                  <span aria-hidden className="text-ink-300">—</span>
                  <span className="font-display text-[14px] font-semibold text-ink-900">
                    {s.title}
                  </span>
                </div>
                <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 pl-9 font-sans text-[12.5px]">
                  <dt className="font-mono text-[10.5px] uppercase tracking-instrument text-ink-500">
                    Formel
                  </dt>
                  <dd className="font-mono text-ink-700">{s.formula}</dd>
                  <dt className="font-mono text-[10.5px] uppercase tracking-instrument text-ink-500">
                    Werte
                  </dt>
                  <dd className="font-mono text-ink-700">{s.substituted}</dd>
                  <dt className="font-mono text-[10.5px] uppercase tracking-instrument text-ink-500">
                    Ergebnis
                  </dt>
                  <dd className="font-mono font-semibold text-ink-900">{s.result}</dd>
                </dl>
                {s.note && (
                  <p className="mt-2 pl-9 font-sans text-[12px] leading-relaxed text-ink-500">
                    {s.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>

        <p className="border-l-[3px] border-mustard-400 bg-paper-50 px-4 py-3 font-sans text-[12.5px] leading-relaxed text-ink-700">
          {closing}
        </p>
      </div>
    </Disclosure>
  );
}
