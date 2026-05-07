import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

type Props = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: Props) {
  return (
    <Card>
      <div className="space-y-7">
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="section-number">00</span>
            <span aria-hidden className="text-ink-300">—</span>
            <p className="eyebrow-ink">Modul Vorsorge · Setup</p>
          </div>
          <h2 className="font-display text-4xl font-semibold leading-[1.02] tracking-[-0.02em] text-ink-900 sm:text-5xl">
            Wie viel musst du sparen,
            <br />
            damit die Rente reicht
            <span className="text-mustard-400">?</span>
          </h2>
          <div aria-hidden className="hairline w-full" />
          <p className="max-w-prose font-sans text-[14px] leading-[1.7] text-ink-700">
            In fünf Schritten errechnen wir deine Rentenlücke und die monatliche Sparrate, mit
            der du sie schließt — nach der konservativen Finanztip-Methodik (gemischtes
            Portfolio, real gerechnet, Annuität über 30 Jahre). Anlage-Allokation,
            Auszahlungsmethode und alle Annahmen kannst du frei anpassen.
          </p>
        </div>

        <ul className="divide-y divide-ink-100 border-y border-ink-100 font-sans text-[13px] leading-relaxed text-ink-700">
          <Spec n="01" label="Dauer">
            <strong className="font-semibold">~2 Minuten</strong> für den ersten Durchlauf.
          </Spec>
          <Spec n="02" label="Privatsphäre">
            <strong className="font-semibold">Daten bleiben lokal</strong> im Browser
            (localStorage). Nichts wird an einen Server gesendet.
          </Spec>
          <Spec n="03" label="Vorbereitung">
            Monatliches <strong className="font-semibold">Netto-Einkommen</strong>, idealerweise
            den Brief der Deutschen Rentenversicherung (Renteninformation) zur Hand.
          </Spec>
          <Spec n="04" label="Backup">
            Per <strong className="font-semibold">Export</strong> oben rechts kannst du deine
            Eingaben jederzeit als JSON-Datei sichern und später importieren.
          </Spec>
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10.5px] uppercase tracking-instrument text-ink-500">
            Keine Anlageberatung · Orientierungshilfe
          </p>
          <Button onClick={onStart} className="w-full sm:w-auto">
            Loslegen →
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Spec({
  n,
  label,
  children,
}: {
  n: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[40px_110px_1fr] items-baseline gap-3 py-3 sm:grid-cols-[44px_140px_1fr]">
      <span
        aria-hidden
        className="font-mono text-[11px] font-medium tabular-nums text-mustard-600"
      >
        {n}
      </span>
      <span className="font-mono text-[10.5px] uppercase tracking-instrument text-ink-500">
        {label}
      </span>
      <span>{children}</span>
    </li>
  );
}
