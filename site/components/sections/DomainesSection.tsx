"use client";

// See docs/specs/website/nextjs-architecture.md §5.2, §4.4
// Dimensions tile grid + expandable deep-dive. Client because of toggle.
import { useEffect, useState } from "react";
import type { AggregatedOutput } from "@/lib/schema";
import { DIMENSION_KEYS, type DimensionKey } from "@/lib/derived/keys";
import { SectionHead } from "@/components/chrome/SectionHead";
import { GradeBadge } from "@/components/widgets/GradeBadge";
import { ConfidenceDots } from "@/components/widgets/ConfidenceDots";
import type { GradeLetter } from "@/lib/grade-color";

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  economic_fiscal: "Économique & fiscal",
  social_demographic: "Social & démographique",
  security_sovereignty: "Sécurité & souveraineté",
  institutional_democratic: "Institutionnel & démocratique",
  environmental_long_term: "Environnemental & long terme",
};

const MAX_ITEMS = 5;

export function DomainesSection({
  aggregated,
}: {
  aggregated: AggregatedOutput;
}) {
  const [active, setActive] = useState<DimensionKey | null>(null);

  // Deep-link support: #dim=<key>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const parse = () => {
      const hash = window.location.hash;
      const match = /#dim=([a-z_]+)/.exec(hash);
      if (
        match &&
        (DIMENSION_KEYS as readonly string[]).includes(match[1])
      ) {
        setActive(match[1] as DimensionKey);
      }
    };
    parse();
    window.addEventListener("hashchange", parse);
    return () => window.removeEventListener("hashchange", parse);
  }, []);

  const toggle = (key: DimensionKey) => {
    setActive((cur) => (cur === key ? null : key));
  };

  return (
    <section
      id="dimensions"
      data-screen-label="Domaines"
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] border-t border-rule py-14"
    >
      <SectionHead label="Analyse par domaine" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {DIMENSION_KEYS.map((key) => {
          const dim = aggregated.dimensions[key];
          const dissentCount = Object.values(dim.grade.dissent).filter(
            (g) => g !== dim.grade.consensus,
          ).length;
          return (
            <DimensionTile
              key={key}
              dimKey={key}
              label={DIMENSION_LABELS[key]}
              grade={dim.grade.consensus}
              dissentCount={dissentCount}
              confidence={dim.confidence}
              isActive={active === key}
              onToggle={() => toggle(key)}
            />
          );
        })}
      </div>

      {active ? (
        <DimensionDeepDive
          dimKey={active}
          dim={aggregated.dimensions[active]}
        />
      ) : null}
    </section>
  );
}

function DimensionTile({
  dimKey,
  label,
  grade,
  dissentCount,
  confidence,
  isActive,
  onToggle,
}: {
  dimKey: DimensionKey;
  label: string;
  grade: GradeLetter;
  dissentCount: number;
  confidence: number;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isActive}
      aria-controls={`deep-dive-${dimKey}`}
      className={[
        "flex flex-col items-start gap-3 rounded-md border p-4 text-left transition-colors",
        isActive
          ? "border-accent bg-accent-subtle"
          : "border-rule bg-bg hover:border-accent hover:bg-bg-subtle",
      ].join(" ")}
    >
      <GradeBadge grade={grade} size="sm" />
      <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
        {label}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
        <ConfidenceDots value={confidence} label="Confiance" />
        {dissentCount > 0 ? (
          <span className="font-semibold text-risk-red">
            ⚡ {dissentCount}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function DimensionDeepDive({
  dimKey,
  dim,
}: {
  dimKey: DimensionKey;
  dim: AggregatedOutput["dimensions"][DimensionKey];
}) {
  const modelGrades = Object.entries(dim.grade.dissent);
  return (
    <div
      id={`deep-dive-${dimKey}`}
      className="mt-8 rounded-md border border-rule-light bg-bg-subtle p-6"
    >
      <h3 className="mb-3 font-display text-2xl font-bold text-text">
        {DIMENSION_LABELS[dimKey]}
      </h3>
      <p className="mb-6 max-w-[640px] text-[13px] leading-[1.55] text-text-secondary [text-wrap:pretty]">
        {dim.summary}
      </p>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <ProblemBlock
          icon="✓"
          color="oklch(0.42 0.16 145)"
          heading="Problèmes adressés"
          empty="Aucun problème identifié comme adressé."
          items={dim.problems_addressed.slice(0, MAX_ITEMS).map((p) => ({
            text: p.problem,
            supportedBy: p.supported_by,
            dissenters: p.dissenters,
            sourceCount: p.source_refs.length,
          }))}
          overflow={dim.problems_addressed.length - MAX_ITEMS}
        />
        <ProblemBlock
          icon="—"
          color="var(--text-tertiary)"
          heading="Problèmes non adressés"
          empty="Aucun problème identifié comme ignoré par les modèles."
          items={dim.problems_ignored.slice(0, MAX_ITEMS).map((p) => ({
            text: p.problem,
            supportedBy: p.supported_by,
            dissenters: p.dissenters,
            sourceCount: p.source_refs.length,
          }))}
          overflow={dim.problems_ignored.length - MAX_ITEMS}
        />
        <ProblemBlock
          icon="⚠"
          color="var(--risk-red)"
          heading="Problèmes aggravés"
          empty="Aucun aggravement identifié par les modèles."
          items={dim.problems_worsened.slice(0, MAX_ITEMS).map((p) => ({
            text: p.problem,
            supportedBy: p.supported_by,
            dissenters: p.dissenters,
            sourceCount: p.source_refs.length,
          }))}
          overflow={dim.problems_worsened.length - MAX_ITEMS}
        />
      </div>

      {dim.execution_risks.length > 0 ? (
        <div className="mb-6">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            Risques d&apos;exécution
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {dim.execution_risks.map((r, i) => (
              <li
                key={`${r.risk}-${i}`}
                className="flex flex-wrap items-center gap-3 text-[12px] text-text"
              >
                <span className="flex-1 min-w-[12rem]">{r.risk}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary">
                  Prob. <ConfidenceDots value={r.probability} label="Probabilité" />
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary">
                  Sév. <ConfidenceDots value={r.severity} label="Sévérité" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {dim.key_measures.length > 0 ? (
        <div className="mb-6">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            Mesures clés
          </div>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {dim.key_measures.map((m, i) => (
              <li
                key={`${m.measure}-${i}`}
                className="text-[12px] leading-[1.5] text-text"
              >
                <span>{m.measure}</span>
                <span className="ml-2 text-[11px] text-text-tertiary">
                  {m.quantified && m.magnitude
                    ? `— ${m.magnitude}`
                    : "— non quantifié"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Notes par modèle
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-sm border border-accent/30 bg-accent-subtle px-2 py-1 font-semibold text-accent">
            Consensus → {dim.grade.consensus}
          </span>
          {modelGrades.map(([model, g]) => (
            <span
              key={model}
              className={[
                "rounded-sm border px-2 py-1",
                g === dim.grade.consensus
                  ? "border-rule text-text-secondary"
                  : "border-risk-red/40 bg-risk-red/10 text-risk-red",
              ].join(" ")}
            >
              {model} → {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProblemBlock({
  icon,
  color,
  heading,
  empty,
  items,
  overflow,
}: {
  icon: string;
  color: string;
  heading: string;
  empty: string;
  items: {
    text: string;
    supportedBy: string[];
    dissenters: string[];
    sourceCount: number;
  }[];
  overflow: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="text-[13px] font-bold"
          style={{ color }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-secondary">
          {heading}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] italic text-text-tertiary">{empty}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((item, i) => (
            <li
              key={`${item.text}-${i}`}
              className="text-[12px] leading-[1.5] text-text [text-wrap:pretty]"
            >
              <span>{item.text}</span>
              <div className="mt-0.5 text-[10px] text-text-tertiary">
                {item.supportedBy.length > 0
                  ? `Soutenu par ${item.supportedBy.join(", ")}`
                  : null}
                {item.dissenters.length > 0 ? (
                  <span className="ml-1 text-risk-red">
                    · désaccord : {item.dissenters.join(", ")}
                  </span>
                ) : null}
                {item.sourceCount > 0 ? (
                  <span className="ml-1 text-text-tertiary">
                    · {item.sourceCount} source{item.sourceCount > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
          {overflow > 0 ? (
            <li className="cursor-not-allowed text-[11px] italic text-text-tertiary">
              + {overflow} autre{overflow > 1 ? "s" : ""}
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
