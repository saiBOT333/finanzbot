import { useState } from "react";
import { QUESTIONS, recommendEquityPercent, isComplete } from "../questionnaire";
import type { FragebogenAntworten, FragebogenSchluessel } from "../types";
import { Button } from "../../../components/ui/Button";
import { ChoiceChip } from "../../../components/ui/ChoiceChip";

type Props = {
  initial?: FragebogenAntworten;
  onApply: (antworten: FragebogenAntworten, empfehlung: number) => void;
};

/**
 * Inline-Risiko-Fragebogen (ersetzt das frühere Modal — die App ist sonst
 * modalfrei). Startet bewusst ohne Vorauswahl: Die Empfehlung erscheint erst,
 * wenn alle fünf Fragen beantwortet sind — kein Anker-Effekt.
 */
export function FragebogenSection({ initial, onApply }: Props) {
  const [antworten, setAntworten] = useState<Partial<FragebogenAntworten>>(initial ?? {});

  const setAnswer = (key: FragebogenSchluessel, punkte: number) =>
    setAntworten({ ...antworten, [key]: punkte });

  const complete = isComplete(antworten);
  const offen = QUESTIONS.filter((q) => antworten[q.key] === undefined).length;

  return (
    <div className="space-y-5 border border-outline-variant bg-surface p-4">
      <ol className="space-y-5">
        {QUESTIONS.map((q) => (
          <li key={q.key}>
            <p className="mb-2 font-sans text-[14px] font-medium text-on-surface">{q.title}</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => (
                <ChoiceChip
                  key={o.label}
                  selected={antworten[q.key] === o.punkte}
                  onClick={() => setAnswer(q.key, o.punkte)}
                >
                  {o.label}
                </ChoiceChip>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
        {complete ? (
          <p className="font-sans text-[14px] text-on-surface">
            Empfohlene Aktienquote:{" "}
            <strong className="tabular-nums">{recommendEquityPercent(antworten)} %</strong>
          </p>
        ) : (
          <p className="font-sans text-[13px] text-on-surface-variant">
            Noch {offen} {offen === 1 ? "Frage" : "Fragen"} offen.
          </p>
        )}
        <Button
          disabled={!complete}
          onClick={() => {
            if (isComplete(antworten)) {
              onApply(antworten, recommendEquityPercent(antworten));
            }
          }}
        >
          Übernehmen
        </Button>
      </div>
    </div>
  );
}
