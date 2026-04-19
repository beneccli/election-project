// See docs/specs/website/nextjs-architecture.md §5.2, §4.3
// See docs/specs/analysis/political-positioning.md (positioning is ordinal).
import type { AggregatedOutput } from "@/lib/schema";
import { deriveRadarShape } from "@/lib/derived/positioning-shape";
import { SectionHead } from "@/components/chrome/SectionHead";
import { PositioningRadar } from "@/components/widgets/PositioningRadar";
import { AxisAgreementBars } from "@/components/widgets/AxisAgreementBars";

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
      <p className="mb-8 max-w-[640px] text-[12px] leading-[1.6] text-text-secondary">
        Le positionnement est <strong>ordinal</strong> — il reflète l&apos;ordre
        relatif entre ancrages historiques plutôt qu&apos;une mesure cardinale.
        Le pentagone ci-dessous résume la forme. La lecture canonique reste
        la ligne par axe, avec intervalle de consensus et points de
        désaccord.
      </p>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[280px_1fr]">
        <div className="flex justify-center lg:justify-start">
          <PositioningRadar shape={shape} />
        </div>
        <AxisAgreementBars positioning={aggregated.positioning} />
      </div>
    </section>
  );
}
