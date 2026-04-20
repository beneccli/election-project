// See docs/specs/website/nextjs-architecture.md §5.2, §4.5
// See docs/specs/analysis/intergenerational-audit.md
//
// EDITORIAL: measurement, not indictment. No advocacy language.
import type { AggregatedOutput } from "@/lib/schema";
import { SectionHead } from "@/components/chrome/SectionHead";
import { IntergenSplitPanel } from "@/components/widgets/IntergenSplitPanel";

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
  const direction = DIRECTION_LABELS[ig.net_transfer_direction] ?? ig.net_transfer_direction;

  return (
    <section
      id="intergen"
      data-screen-label="Impact intergénérationnel"
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] border-t border-rule py-14"
    >
      <SectionHead label="Impact intergénérationnel" />
      <p className="mb-6 text-base text-text-secondary">
        Impact net estimé du programme sur les deux cohortes suivantes —
        mesure, non jugement. Les valeurs quantifiées reprennent les
        estimations des modèles, vérifiées par revue humaine.
      </p>

      <div className="mb-8 rounded-md border border-rule-light bg-bg-subtle p-4">
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
    </section>
  );
}

// text-[14px] => text-base
// text-sm => text-sm
// text-xs => text-xs
// text-xs => text-xs
