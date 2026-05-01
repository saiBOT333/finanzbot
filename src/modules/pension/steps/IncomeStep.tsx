import { NumberInput } from "../../../components/NumberInput";
import { useProfile, setProfile } from "../../../lib/profile/useProfile";
import { pensionStore } from "../state";
import { tooltips } from "../tooltips";

export function IncomeStep() {
  const profile = useProfile();
  const m = pensionStore.useState();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NumberInput
        label="Netto-Einkommen pro Monat"
        value={profile.netIncomeMonthly}
        onChange={(v) => setProfile({ netIncomeMonthly: v })}
        unit="€"
        min={0}
        required
        tooltip={tooltips.netIncomeMonthly}
        placeholder="z. B. 3.000"
      />
      <NumberInput
        label="Bedarf in Rente (% vom Netto)"
        value={m.replacementRate * 100}
        onChange={(v) =>
          v !== undefined && pensionStore.set({ replacementRate: v / 100 })
        }
        unit="%"
        min={0}
        max={150}
        tooltip={tooltips.replacementRate}
        hint="Faustformel: 80 %"
      />
    </div>
  );
}

export function isIncomeComplete(netIncome?: number) {
  return netIncome !== undefined && netIncome > 0;
}
