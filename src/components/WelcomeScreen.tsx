import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

type Props = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: Props) {
  return (
    <Card className="ring-brand-100">
      <div className="space-y-5">
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            FinanzBot · Modul Renten­lücke
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Wie viel musst du sparen, damit die Rente reicht?
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            In fünf Schritten errechnen wir deine Rentenlücke und die monatliche
            Sparrate, mit der du sie schließt — nach der Methodik aus den
            Finanztip- und Finanzfluss-Videos. Du kannst zwischen einem konservativen
            (Finanztip-Faustformel) und einem investorischen Profil (Welt-ETF) wählen
            und siehst sofort, wie sich deine Sparrate ändert.
          </p>
        </div>

        <ul className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200">
          <Bullet>Dauert ungefähr <strong>2 Minuten</strong>.</Bullet>
          <Bullet>
            <strong>Deine Daten bleiben in diesem Browser.</strong> Wir speichern sie
            nur lokal (localStorage), nichts wird an einen Server gesendet.
          </Bullet>
          <Bullet>
            Du brauchst dein <strong>monatliches Netto-Einkommen</strong> und idealerweise
            den Brief der Deutschen Rentenversicherung (Renten­information) zur Hand.
          </Bullet>
          <Bullet>
            Per <strong>Export</strong> oben rechts kannst du deine Eingaben jederzeit
            als JSON-Datei sichern und später importieren.
          </Bullet>
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Keine Anlageberatung. Empfehlung dient zur Orientierung.
          </p>
          <Button onClick={onStart} className="w-full sm:w-auto">
            Loslegen →
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
      <span>{children}</span>
    </li>
  );
}
