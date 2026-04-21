"use client";

// See docs/specs/website/nextjs-architecture.md §5.2, §4.6
// See docs/specs/website/candidate-page-polish.md §5.4
// Primary: 5×4 risk summary matrix. Secondary: full per-risk heatmap in a
// right-side drawer.
import { useState } from "react";
import type { AggregatedOutput } from "@/lib/schema";
import { DIMENSION_KEYS, type DimensionKey } from "@/lib/derived/keys";
import { SectionHead } from "@/components/chrome/SectionHead";
import { Drawer } from "@/components/chrome/Drawer";
import {
  RiskHeatmap,
  type RiskGroup,
} from "@/components/widgets/RiskHeatmap";
import { RiskSummaryMatrix } from "@/components/widgets/RiskSummaryMatrix";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      <p className="mb-8 max-w-3xl text-base leading-[1.6] text-text-secondary">
        Lecture synthétique du profil de risque du programme, par domaine
        et par catégorie de risque. Les niveaux sont ordinaux (Faible,
        Limité, Modéré, Élevé) et rapportés par modèle — aucun score
        cardinal agrégé. Les divergences entre modèles sont signalées
        par ⚡.
      </p>
      <RiskSummaryMatrix dimensions={aggregated.dimensions} />

      <div className="mt-6 flex justify-start">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-sm border border-rule bg-bg px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Voir tous les risques identifiés
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        size="xl"
        eyebrow="Risques d'exécution"
        title="Liste complète"
        description="Chaque ligne est un risque identifié par au moins un modèle. Probabilité et sévérité sont rapportées séparément."
      >
        <RiskHeatmap groups={groups} />
      </Drawer>
    </section>
  );
}
