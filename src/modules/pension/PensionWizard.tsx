import { Wizard, type WizardStep } from "../../components/Wizard";
import { useProfile } from "../../lib/profile/useProfile";
import { BasicsStep, isBasicsComplete } from "./steps/BasicsStep";
import { IncomeStep, isIncomeComplete } from "./steps/IncomeStep";
import { AssumptionsStep } from "./steps/AssumptionsStep";
import { ResultStep } from "./steps/ResultStep";

export function PensionWizard() {
  const profile = useProfile();

  const steps: WizardStep[] = [
    {
      id: "basics",
      title: "1. Basisdaten",
      content: <BasicsStep />,
      canProceed: isBasicsComplete(profile.age),
      blockReason: isBasicsComplete(profile.age) ? undefined : "Bitte gültiges Alter eintragen.",
    },
    {
      id: "income",
      title: "2. Einkommen & Bedarf",
      content: <IncomeStep />,
      canProceed: isIncomeComplete(profile.netIncomeMonthly),
      blockReason: isIncomeComplete(profile.netIncomeMonthly)
        ? undefined
        : "Bitte Netto-Einkommen pro Monat eintragen.",
    },
    {
      id: "assumptions",
      title: "3. Annahmen",
      content: <AssumptionsStep />,
      canProceed: true,
    },
    {
      id: "result",
      title: "4. Ergebnis",
      content: <ResultStep />,
      canProceed: true,
    },
  ];

  return <Wizard steps={steps} finishLabel="Fertig" />;
}
