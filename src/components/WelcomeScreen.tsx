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
          <span className="m3-eyebrow">Modul Vorsorge · Setup</span>
          <h2 className="text-[44px] sm:text-[56px] font-bold leading-[1.05] tracking-[-0.02em] text-on-surface max-w-[18ch]">
            Wie viel musst du sparen,
            <br />
            damit die Rente reicht
            <span className="text-primary">?</span>
          </h2>
          <p className="max-w-prose text-body-lg leading-[1.6] text-on-surface-variant">
            In fünf Schritten errechnen wir deine Rentenlücke und die monatliche Sparrate, mit
            der du sie schließt. Wir rechnen bewusst vorsichtig: mit gemischter Geldanlage, nach
            Abzug der Inflation, und so, dass dein Geld bis Alter 90 reicht. Alle Annahmen
            kannst du später anpassen.
          </p>
        </div>

        <ul className="rounded-m3-md bg-surface-container">
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
          <p className="text-label-md tracking-[0.04em] text-on-surface-variant">
            Keine Anlageberatung · Orientierungshilfe
          </p>
          <Button onClick={onStart} className="w-full sm:w-auto">
            Loslegen
            <span aria-hidden className="m3-icon text-[18px]">arrow_forward</span>
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
    <li className="grid grid-cols-[40px_140px_1fr] items-baseline gap-3 px-6 py-4 text-body-md text-on-surface border-b border-outline-variant last:border-b-0 sm:grid-cols-[44px_160px_1fr]">
      <span aria-hidden className="font-semibold text-primary text-body-md tabular-nums">
        {n}
      </span>
      <span className="text-label-sm font-medium uppercase tracking-[0.08em] text-on-surface-variant">
        {label}
      </span>
      <span>{children}</span>
    </li>
  );
}
