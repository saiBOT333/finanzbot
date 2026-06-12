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
      <p className="font-sans text-body-md leading-relaxed text-on-surface-variant">
        Trag hier dein Erspartes ein — jede Position einzeln. Was nicht eindeutig riskant
        oder sicher ist (z.&nbsp;B. selbstgenutzte Immobilie, bAV/Riester), kannst du pro
        Position selbst zuordnen.
      </p>

      <AssetsManager
        assets={assets}
        onChange={(next) => setProfile({ assets: next })}
        showRiskOverride
      />

      {breakdown.excludedEuro > 0 && (
        <p className="rounded-m3-sm border border-outline-variant bg-surface-container p-3 font-sans text-body-sm leading-relaxed text-on-surface-variant">
          Hinweis: {formatEUR(breakdown.excludedEuro)} zählen nicht in die Aufteilung —
          z.&nbsp;B. Immobilie oder bAV, weil du sie nicht einfach umschichten kannst.
          Sie werden separat ausgewiesen.
        </p>
      )}
    </div>
  );
}

export function isBestandComplete(assetCount: number): boolean {
  return assetCount > 0;
}
