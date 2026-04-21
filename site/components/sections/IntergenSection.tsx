"use client";
// See docs/specs/website/nextjs-architecture.md §5.2, §4.5
// See docs/specs/website/candidate-page-polish.md §5.3
// See docs/specs/analysis/intergenerational-audit.md
//
// EDITORIAL: measurement, not indictment. No advocacy language.
import { useState } from "react";
import type { AggregatedOutput } from "@/lib/schema";
import { SectionHead } from "@/components/chrome/SectionHead";
import { Drawer } from "@/components/chrome/Drawer";
import { IntergenSplitPanel } from "@/components/widgets/IntergenSplitPanel";
import { IntergenHorizonTable } from "@/components/widgets/IntergenHorizonTable";

const DIRECTION_LABELS: Record<string, string> = {
  young_to_old: "Des jeunes vers les aînés",
  old_to_young: "Des aînés vers les jeunes",
  neutral: "Neutre",
  mixed: "Effets contrastés",
};

export function IntergenSection({
  aggregated,
}: {
  aggregated: AggregatedOutput;
}) {
  const ig = aggregated.intergenerational;
  const direction =
    DIRECTION_LABELS[ig.net_transfer_direction] ?? ig.net_transfer_direction;
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <section
      id="intergen"
      data-screen-label="Impact intergénérationnel"
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] border-t border-rule py-14"
    >
      <SectionHead label="Impact intergénérationnel" />
      <p className="mb-6 max-w-3xl text-base leading-[1.6] text-text-secondary">
        Effet net estimé du programme sur chaque domaine, à trois horizons
        budgétaires. Les scores sont ordinaux (de −3 à +3) et mesurent la
        direction de l&apos;impact, pas son caractère désirable. Les
        libellés de cohortes sont des repères narratifs approximatifs
        qui recouvrent imparfaitement les horizons calendaires.
      </p>

      <IntergenHorizonTable matrix={ig.horizon_matrix} />

      <div className="mt-6 flex justify-start">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-sm border border-rule bg-bg px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Voir la comparaison individuelle
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        size="xl"
        eyebrow="Impact intergénérationnel"
        title="Comparaison individuelle"
        description="Projection du programme sur deux cohortes individuelles typiques : personne de 25 ans et personne de 65 ans."
      >
        <div className="mb-6 rounded-md border border-rule-light bg-bg-subtle p-4">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Transfert net
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-lg font-semibold text-text">
              {direction}
            </span>
            <span className="text-sm text-text-secondary">
              {ig.magnitude_estimate.value}{" "}
              <span className="text-text-tertiary">
                {ig.magnitude_estimate.units}
              </span>
            </span>
          </div>
          {ig.magnitude_estimate.caveats ? (
            <p className="mt-1 text-xs italic leading-[1.5] text-text-tertiary">
              {ig.magnitude_estimate.caveats}
            </p>
          ) : null}
        </div>

        <IntergenSplitPanel intergen={ig} />

        {ig.reasoning ? (
          <p className="mt-6 text-sm leading-[1.6] text-text-secondary [text-wrap:pretty]">
            {ig.reasoning}
          </p>
        ) : null}

        {ig.source_refs.length > 0 ? (
          <div className="mt-4">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Sources ({ig.source_refs.length})
            </div>
            <ul className="m-0 flex flex-wrap list-none gap-1 p-0">
              {ig.source_refs.map((ref, i) => (
                <li
                  key={`${ref}-${i}`}
                  className="inline-flex items-center rounded-sm border border-rule-light bg-bg px-1.5 py-[2px] font-mono text-[10px] text-text-tertiary"
                >
                  {ref}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Drawer>
    </section>
  );
}
