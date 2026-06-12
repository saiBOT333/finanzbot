import { Wizard, type WizardStep } from "../../components/Wizard";
import { useProfile } from "../../lib/profile/useProfile";
import { BestandStep, isBestandComplete } from "./steps/BestandStep";
import { ZielquoteStep } from "./steps/ZielquoteStep";
import { ErgebnisStep } from "./steps/ErgebnisStep";

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
      title: "2. Wunsch-Aufteilung",
      content: <ZielquoteStep />,
      canProceed: true,
    },
    {
      id: "ergebnis",
      title: "3. Ergebnis",
      content: <ErgebnisStep />,
      canProceed: true,
    },
  ];

  return <Wizard steps={steps} />;
}
