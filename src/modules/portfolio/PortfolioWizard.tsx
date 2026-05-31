import { Wizard, type WizardStep } from "../../components/Wizard";

export function PortfolioWizard() {
  const steps: WizardStep[] = [
    {
      id: "bestand",
      title: "1. Bestand",
      content: <div>Schritt Bestand — Platzhalter</div>,
      canProceed: true,
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
