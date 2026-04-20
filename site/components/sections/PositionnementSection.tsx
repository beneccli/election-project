// See docs/specs/website/nextjs-architecture.md §5.2, §4.3
// See docs/specs/analysis/political-positioning.md (positioning is ordinal).
// See docs/specs/website/candidate-page-polish.md §5.1 — per-model overlay.
import type { AggregatedOutput } from "@/lib/schema";
import { deriveRadarShape } from "@/lib/derived/positioning-shape";
import { SectionHead } from "@/components/chrome/SectionHead";
import { InteractivePositioningRadar } from "@/components/widgets/InteractivePositioningRadar";
import { AxisAgreementBars } from "@/components/widgets/AxisAgreementBars";
import { PositioningLegend } from "@/components/widgets/PositioningLegend";

export function PositionnementSection({
  aggregated,
}: {
  aggregated: AggregatedOutput;
}) {
  const shape = deriveRadarShape(aggregated.positioning);

  return (
    <section
      id="positionnement"
      data-screen-label="Positionnement"
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] border-t border-rule py-14"
    >
      <SectionHead label="Positionnement politique" />
      <p className="mb-8 text-base text-text-secondary">
        Le positionnement est <strong>ordinal</strong> — il reflète l&apos;ordre
        relatif entre ancrages historiques plutôt qu&apos;une mesure cardinale.
        Le pentagone ci-dessous résume la forme. La lecture canonique reste
        la ligne par axe, avec intervalle de consensus et points de
        désaccord.
      </p>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[340px_1fr]">
        <div className="flex flex-col items-center lg:items-start">
          {/* Radar hidden below sm: at narrow widths the 280x280 SVG
              is unreadably small; the axis list below (AxisAgreementBars)
              is the mobile fallback. See visual-components.md §4.1. */}
          <InteractivePositioningRadar shape={shape} />
        </div>
        <div>
          <AxisAgreementBars positioning={aggregated.positioning} />
          <PositioningLegend positioning={aggregated.positioning} />
        </div>
      </div>
    </section>
  );
}
