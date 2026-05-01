import { NumberInput } from "../../../components/NumberInput";
import { useProfile, setProfile } from "../../../lib/profile/useProfile";
import { tooltips } from "../tooltips";

export function BasicsStep() {
  const profile = useProfile();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NumberInput
        label="Aktuelles Alter"
        value={profile.age}
        onChange={(v) => setProfile({ age: v })}
        unit="Jahre"
        min={0}
        max={120}
        required
        tooltip={tooltips.currentAge}
        placeholder="z. B. 35"
      />
      <NumberInput
        label="Geplanter Renteneintritt"
        value={profile.retirementAge ?? 67}
        onChange={(v) => setProfile({ retirementAge: v })}
        unit="Jahre"
        min={0}
        max={120}
        tooltip={tooltips.retirementAge}
        hint="Standard: 67"
      />
    </div>
  );
}

export function isBasicsComplete(age?: number) {
  return age !== undefined && age > 0 && age < 120;
}
