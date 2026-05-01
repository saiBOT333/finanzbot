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
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Verwendete Werte
          </h4>
          <div className="overflow-hidden rounded-lg ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {inputs.map((it) => (
                  <tr key={it.symbol}>
                    <td className="w-10 px-3 py-2 align-top font-mono text-xs text-slate-500">
                      {it.symbol}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">{it.label}</td>
                    <td className="px-3 py-2 text-right align-top font-medium text-slate-900">
                      {it.value}
                    </td>
                    <td className="w-20 px-3 py-2 text-right align-top">
                      {it.isDefault ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          Standard
                        </span>
                      ) : (
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                          deine Eingabe
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
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rechenschritte
          </h4>
          <ol className="space-y-3">
            {steps.map((s) => (
              <li
                key={s.index}
                className="rounded-lg ring-1 ring-slate-200 bg-slate-50/50 p-3"
              >
                <div className="flex items-baseline gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                    {s.index}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{s.title}</span>
                </div>
                <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 pl-7 text-sm">
                  <dt className="text-slate-500">Formel</dt>
                  <dd className="font-mono text-[13px] text-slate-700">{s.formula}</dd>
                  <dt className="text-slate-500">Werte</dt>
                  <dd className="font-mono text-[13px] text-slate-700">{s.substituted}</dd>
                  <dt className="text-slate-500">Ergebnis</dt>
                  <dd className="font-mono text-[13px] font-semibold text-slate-900">
                    {s.result}
                  </dd>
                </dl>
                {s.note && (
                  <p className="mt-2 pl-7 text-xs leading-relaxed text-slate-500">{s.note}</p>
                )}
              </li>
            ))}
          </ol>
        </section>

        <p className="rounded-md bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
          {closing}
        </p>
      </div>
    </Disclosure>
  );
}
