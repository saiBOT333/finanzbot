import { useState } from "react";
import { QUESTIONS, recommendEquityPercent } from "../questionnaire";
import type { FragebogenAntworten, FragebogenSchluessel } from "../types";
import { Button } from "../../../components/ui/Button";

type Props = {
  initial?: FragebogenAntworten;
  onCancel: () => void;
  onApply: (antworten: FragebogenAntworten, empfehlung: number) => void;
};

const EMPTY: FragebogenAntworten = {
  horizont: 0,
  schwankung: 0,
  notgroschen: 0,
  erfahrung: 0,
  einkommen: 0,
};

export function FragebogenModal({ initial, onCancel, onApply }: Props) {
  const [antworten, setAntworten] = useState<FragebogenAntworten>(initial ?? EMPTY);

  const setAnswer = (key: FragebogenSchluessel, punkte: number) => {
    setAntworten({ ...antworten, [key]: punkte } as FragebogenAntworten);
  };

  const empfehlung = recommendEquityPercent(antworten);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto bg-surface p-6">
        <h2 className="mb-4 font-serif text-xl">Risiko-Fragebogen</h2>

        <ol className="space-y-5">
          {QUESTIONS.map((q) => (
            <li key={q.key}>
              <p className="mb-2 font-sans text-sm font-medium">{q.title}</p>
              <div className="flex flex-col gap-1">
                {q.options.map((o) => (
                  <label key={o.label} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.key}
                      checked={antworten[q.key] === o.punkte}
                      onChange={() => setAnswer(q.key, o.punkte)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 border-t border-outline-variant pt-4">
          <p className="font-sans text-sm">
            Empfohlene Aktienquote: <strong>{empfehlung}&nbsp;%</strong>
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outlined" onClick={onCancel}>Abbrechen</Button>
          <Button onClick={() => onApply(antworten, empfehlung)}>Übernehmen</Button>
        </div>
      </div>
    </div>
  );
}
