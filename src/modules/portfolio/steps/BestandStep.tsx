import { AssetsManager } from "../../../components/AssetsManager";
import { useProfile, setProfile } from "../../../lib/profile/useProfile";
import { computeBreakdown } from "../classify";
import { formatEUR } from "../../../lib/format";

export function BestandStep() {
  const profile = useProfile();
  const assets = profile.assets ?? [];
  const breakdown = computeBreakdown(assets);

  return (
    <div className="space-y-4">
      <p className="font-sans text-sm leading-relaxed text-on-surface-variant">
        Erfasse alle Anlagen, die in deine Risiko-Betrachtung einfließen sollen.
        Positionen, die nicht eindeutig in „riskant" oder „sicher" passen
        (z.&nbsp;B. selbstgenutzte Immobilie, bAV/Riester), kannst du pro Asset
        manuell zuordnen.
      </p>

      <AssetsManager
        assets={assets}
        onChange={(next) => setProfile({ assets: next })}
        showRiskOverride
      />

      {breakdown.excludedEuro > 0 && (
        <p className="border border-outline-variant bg-surface-container p-3 font-sans text-[13px] leading-relaxed text-on-surface-variant">
          Hinweis: {formatEUR(breakdown.excludedEuro)} sind als „außerhalb der
          Quote" eingestuft (z.&nbsp;B. Immobilie, bAV). Diese Anlagen werden
          separat ausgewiesen, fließen aber nicht in die Aktien-/Sicher-Quote
          ein.
        </p>
      )}
    </div>
  );
}

export function isBestandComplete(assetCount: number): boolean {
  return assetCount > 0;
}
