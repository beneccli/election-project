// See docs/specs/website/nextjs-architecture.md §5.2, §4.2
// Prototype reference: Candidate Page.html lines 446–476.
// Server component — all deterministic derivation, no client state.
import type { AggregatedOutput } from "@/lib/schema";
import {
  deriveSynthese,
  SYNTHESE_EMPTY_FALLBACK,
  type DerivedBullet,
} from "@/lib/derived/synthese-selection";
import { SectionHead } from "@/components/chrome/SectionHead";
import { ConfidenceDots } from "@/components/widgets/ConfidenceDots";

type ColumnSpec = {
  key: "strengths" | "weaknesses" | "gaps";
  color: string;
  icon: string;
  label: string;
};

const COLUMNS: ColumnSpec[] = [
  {
    key: "strengths",
    color: "oklch(0.42 0.16 145)",
    icon: "↑",
    label: "Points forts",
  },
  {
    key: "weaknesses",
    color: "var(--risk-red)",
    icon: "↓",
    label: "Points faibles",
  },
  {
    key: "gaps",
    color: "oklch(0.52 0.14 60)",
    icon: "○",
    label: "Absences notables",
  },
];

const DIRECTION_LABELS: Record<string, string> = {
  improvement: "Amélioration",
  worsening: "Détérioration",
  neutral: "Trajectoire inchangée",
  mixed: "Effets contrastés",
};

export function SyntheseSection({
  aggregated,
}: {
  aggregated: AggregatedOutput;
}) {
  const bullets = deriveSynthese(aggregated);
  const coverageCount = Object.keys(
    aggregated.agreement_map.coverage,
  ).length;
  const consensusPct = Math.round(aggregated.summary_agreement * 100);

  return (
    <section
      id="synthese"
      data-screen-label="Synthèse"
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] border-t border-rule py-14"
    >
      <SectionHead label="Synthèse" />

      <blockquote className="m-0 mb-12 max-w-[720px] border-l-[3px] border-accent pl-6 font-display text-xl italic leading-[1.55] text-text [text-wrap:pretty]">
        «&thinsp;{aggregated.summary}&thinsp;»
      </blockquote>

      <div className="mb-12 flex flex-wrap items-center gap-3 text-[11px] text-text-secondary">
        <span>
          Consensus {consensusPct} % — {coverageCount} modèle
          {coverageCount > 1 ? "s" : ""} couvert
          {coverageCount > 1 ? "s" : ""}
        </span>
        {aggregated.coverage_warning ? (
          <span className="rounded-sm border border-risk-red/40 bg-risk-red/10 px-2 py-[2px] font-semibold uppercase tracking-wider text-risk-red">
            ⚠ couverture limitée
          </span>
        ) : null}
      </div>

      <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <SyntheseColumn
            key={col.key}
            spec={col}
            items={bullets[col.key]}
          />
        ))}
      </div>

      <Counterfactual cf={aggregated.counterfactual} />

      {aggregated.downside_scenarios.length > 0 ? (
        <DownsideScenarios scenarios={aggregated.downside_scenarios} />
      ) : null}
    </section>
  );
}

function SyntheseColumn({
  spec,
  items,
}: {
  spec: ColumnSpec;
  items: DerivedBullet[];
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span
          className="text-[13px] font-bold"
          style={{ color: spec.color }}
          aria-hidden="true"
        >
          {spec.icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-secondary">
          {spec.label}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-[13px] italic text-text-tertiary">
          {SYNTHESE_EMPTY_FALLBACK}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {items.map((item, i) => (
            <li
              key={`${item.text}-${i}`}
              className="flex items-start gap-2.5"
            >
              <span
                className="mt-[7px] h-[3px] w-[3px] flex-shrink-0 rounded-full"
                style={{ background: spec.color }}
                aria-hidden="true"
              />
              <span className="text-[13px] leading-[1.55] text-text [text-wrap:pretty]">
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Counterfactual({
  cf,
}: {
  cf: AggregatedOutput["counterfactual"];
}) {
  const directionLabel =
    DIRECTION_LABELS[cf.direction_of_change] ?? cf.direction_of_change;
  return (
    <div className="mb-14 rounded-md border border-rule-light bg-bg-subtle p-5">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-text-secondary">
        Trajectoire contrefactuelle
      </div>
      <div className="grid grid-cols-1 gap-4 text-[13px] text-text md:grid-cols-2">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            Statu quo
          </div>
          <p className="leading-[1.5]">{cf.status_quo_trajectory}</p>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
            Effet du programme
          </div>
          <p className="leading-[1.5]">
            <span className="font-semibold">{directionLabel}</span>
            {cf.dimensions_changed.length > 0 ? (
              <>
                {" "}
                sur {cf.dimensions_changed.join(", ")}
              </>
            ) : null}
            {cf.dimensions_unchanged.length > 0 ? (
              <span className="text-text-secondary">
                {" "}
                — inchangée sur {cf.dimensions_unchanged.join(", ")}
              </span>
            ) : null}
            .
          </p>
        </div>
      </div>
      {cf.reasoning ? (
        <p className="mt-4 text-[12px] leading-[1.55] text-text-secondary [text-wrap:pretty]">
          {cf.reasoning}
        </p>
      ) : null}
    </div>
  );
}

function DownsideScenarios({
  scenarios,
}: {
  scenarios: AggregatedOutput["downside_scenarios"];
}) {
  return (
    <div>
      <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-text-secondary">
        Scénarios défavorables
      </div>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {scenarios.map((s, i) => (
          <li
            key={`${s.scenario}-${i}`}
            className="rounded-md border border-rule-light p-4"
          >
            <div className="mb-1 text-[13px] font-semibold text-text">
              {s.scenario}
            </div>
            <div className="mb-2 text-[12px] leading-[1.5] text-text-secondary">
              Déclencheur : {s.trigger}
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] text-text-tertiary">
              <span className="inline-flex items-center gap-2">
                Probabilité <ConfidenceDots value={s.probability} label="Probabilité" />
              </span>
              <span className="inline-flex items-center gap-2">
                Sévérité <ConfidenceDots value={s.severity} label="Sévérité" />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
