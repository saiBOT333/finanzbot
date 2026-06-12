import { Disclosure } from "../../components/Disclosure";
import { Callout } from "../../components/ui/Callout";
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
            <span aria-hidden className="h-[3px] w-6 bg-primary" />
            <h4 className="text-label-sm font-medium uppercase tracking-[0.04em] text-on-surface-variant">
              Verwendete Werte
            </h4>
          </div>
          <div className="overflow-hidden rounded-m3-md border border-on-surface-variant bg-surface">
            <table className="w-full font-sans text-body-sm">
              <tbody className="divide-y divide-outline-variant">
                {inputs.map((it) => (
                  <tr key={it.symbol}>
                    <td className="w-10 px-3 py-2 align-top text-label-md font-medium text-primary">
                      {it.symbol}
                    </td>
                    <td className="px-3 py-2 align-top text-on-surface-variant">{it.label}</td>
                    <td className="px-3 py-2 text-right align-top font-medium tabular-nums text-on-surface">
                      {it.value}
                    </td>
                    <td className="w-24 px-3 py-2 text-right align-top">
                      {it.isDefault ? (
                        <span className="rounded-m3-pill border border-outline-variant bg-surface-container px-1.5 py-0.5 text-[10px] uppercase tracking-[0.04em] text-on-surface-variant">
                          Standard
                        </span>
                      ) : (
                        <span className="rounded-m3-pill border border-primary bg-primary-container px-1.5 py-0.5 text-[10px] uppercase tracking-[0.04em] text-primary">
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
            <span aria-hidden className="h-[3px] w-6 bg-primary" />
            <h4 className="text-label-sm font-medium uppercase tracking-[0.04em] text-on-surface-variant">
              Rechenschritte
            </h4>
          </div>
          <ol className="divide-y divide-outline-variant overflow-hidden rounded-m3-md border border-on-surface-variant bg-surface">
            {steps.map((s) => (
              <li key={s.index} className="px-4 py-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-label-sm font-medium tabular-nums text-primary">
                    {String(s.index).padStart(2, "0")}
                  </span>
                  <span aria-hidden className="text-outline">—</span>
                  <span className="text-body-md font-semibold text-on-surface">
                    {s.title}
                  </span>
                </div>
                <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 pl-9 font-sans text-body-sm">
                  <dt className="text-label-sm uppercase tracking-[0.04em] text-on-surface-variant">
                    Formel
                  </dt>
                  <dd className="text-on-surface-variant">{s.formula}</dd>
                  <dt className="text-label-sm uppercase tracking-[0.04em] text-on-surface-variant">
                    Werte
                  </dt>
                  <dd className="text-on-surface-variant">{s.substituted}</dd>
                  <dt className="text-label-sm uppercase tracking-[0.04em] text-on-surface-variant">
                    Ergebnis
                  </dt>
                  <dd className="font-semibold text-on-surface">{s.result}</dd>
                </dl>
                {s.note && (
                  <p className="mt-2 pl-9 font-sans text-body-sm leading-relaxed text-on-surface-variant">
                    {s.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>

        <Callout tone="info">
          <p className="font-sans text-body-sm leading-relaxed text-on-surface-variant">
            {closing}
          </p>
        </Callout>
      </div>
    </Disclosure>
  );
}
