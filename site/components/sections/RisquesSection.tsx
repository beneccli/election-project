// See docs/specs/website/nextjs-architecture.md §5.2, §4.6
// Per-risk heatmap grouped by dimension.
import type { AggregatedOutput } from "@/lib/schema";
import { DIMENSION_KEYS, type DimensionKey } from "@/lib/derived/keys";
import { SectionHead } from "@/components/chrome/SectionHead";
import {
  RiskHeatmap,
  type RiskGroup,
} from "@/components/widgets/RiskHeatmap";

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  economic_fiscal: "Économique & fiscal",
  social_demographic: "Social & démographique",
  security_sovereignty: "Sécurité & souveraineté",
  institutional_democratic: "Institutionnel & démocratique",
  environmental_long_term: "Environnemental & long terme",
};

export function RisquesSection({
  aggregated,
}: {
  aggregated: AggregatedOutput;
}) {
  const totalCoverage = Object.keys(aggregated.agreement_map.coverage).length;
  const groups: RiskGroup[] = DIMENSION_KEYS.map((key) => ({
    dimensionKey: key,
    label: DIMENSION_LABELS[key],
    risks: aggregated.dimensions[key].execution_risks,
    totalCoverage,
  }));

  return (
    <section
      id="risques"
      data-screen-label="Risques"
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] border-t border-rule py-14"
    >
      <SectionHead label="Risques d'exécution" />
      <p className="mb-8 max-w-[640px] text-[13px] leading-[1.6] text-text-secondary">
        Chaque ligne est un risque d&apos;exécution individuel identifié par au
        moins un modèle. Les axes <strong>Probabilité</strong> et{" "}
        <strong>Sévérité</strong> sont rapportés séparément — aucun score
        agrégé n&apos;est calculé. La colonne <em>Modèles</em> indique combien
        de modèles sur le total ont soulevé le risque.
      </p>
      <RiskHeatmap groups={groups} />
    </section>
  );
}
