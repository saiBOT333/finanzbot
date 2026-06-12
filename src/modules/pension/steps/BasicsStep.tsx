import { useEffect } from "react";
import { NumberInput } from "../../../components/NumberInput";
import { Callout } from "../../../components/ui/Callout";
import { useProfile, setProfile } from "../../../lib/profile/useProfile";
import { pensionStore } from "../state";
import { RETIREMENT_AGE_DEFAULT, STATE_PENSION_MIN_CLAIM_AGE } from "../constants";
import { tooltips } from "../tooltips";

export function BasicsStep() {
  const profile = useProfile();
  const m = pensionStore.useState();

  // Das Planungsalter (Ende der Auszahlphase) muss über dem Renteneintritt
  // liegen — sonst wäre die Bezugsdauer 0 und die Annuität unberechenbar.
  // Beim Erhöhen des Renteneintritts ziehen wir es deshalb mit.
  const setRetirementAge = (v: number | undefined) => {
    setProfile({ retirementAge: v });
    if (v !== undefined && m.planningAge <= v) {
      pensionStore.set({ planningAge: v + 1 });
    }
  };

  // Den angezeigten Standard auch persistieren, sobald der Schritt sichtbar ist.
  // Sonst bleibt retirementAge `undefined`, obwohl im Feld schon "67" steht —
  // nachgelagerte Berechnungen würden dann mit einem fehlenden Wert rechnen.
  useEffect(() => {
    if (profile.retirementAge === undefined) {
      setProfile({ retirementAge: RETIREMENT_AGE_DEFAULT });
    }
  }, [profile.retirementAge]);

  const retirementAge = profile.retirementAge ?? RETIREMENT_AGE_DEFAULT;

  return (
    <div className="space-y-4">
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
          value={retirementAge}
          onChange={setRetirementAge}
          unit="Jahre"
          min={0}
          max={120}
          tooltip={tooltips.retirementAge}
          hint="Standard: 67"
        />
      </div>
      {retirementAge < STATE_PENSION_MIN_CLAIM_AGE && (
        <Callout eyebrow="Hinweis · Frühverrentung">
          <p className="font-sans text-body-sm leading-relaxed text-on-surface-variant">
            Die gesetzliche Rente gibt es frühestens ab{" "}
            <strong className="font-semibold text-on-surface">
              {STATE_PENSION_MIN_CLAIM_AGE} Jahren
            </strong>
            . Die {STATE_PENSION_MIN_CLAIM_AGE - retirementAge} Jahre davor musst du deinen vollen
            Bedarf aus eigenem Kapital decken — das Ergebnis weist dieses Brückenkapital separat
            aus.
          </p>
        </Callout>
      )}
    </div>
  );
}

export function isBasicsComplete(age?: number) {
  return age !== undefined && age > 0 && age < 120;
}
