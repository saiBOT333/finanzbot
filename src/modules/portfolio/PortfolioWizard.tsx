import { Wizard, type WizardStep } from "../../components/Wizard";
import { useProfile } from "../../lib/profile/useProfile";
import { BestandStep, isBestandComplete } from "./steps/BestandStep";

export function PortfolioWizard() {
  const profile = useProfile();
  const assetCount = profile.assets?.length ?? 0;

  const steps: WizardStep[] = [
    {
      id: "bestand",
      title: "1. Bestand",
      content: <BestandStep />,
      canProceed: isBestandComplete(assetCount),
      blockReason: isBestandComplete(assetCount)
        ? undefined
        : "Bitte mindestens eine Position eintragen.",
    },
    {
      id: "zielquote",
      title: "2. Zielquote",
      content: <div>Schritt Zielquote — Platzhalter</div>,
      canProceed: true,
    },
    {
      id: "ergebnis",
      title: "3. Ergebnis",
      content: <div>Schritt Ergebnis — Platzhalter</div>,
      canProceed: true,
    },
  ];

  return <Wizard steps={steps} />;
}
