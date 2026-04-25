"use client";
// See docs/specs/website/nextjs-architecture.md §5.2, §4.2
// Prototype reference: Candidate Page.html lines 446–476.
import { useState } from "react";
import type { AggregatedOutput } from "@/lib/schema";
import {
  deriveSynthese,
  type DerivedBullet,
} from "@/lib/derived/synthese-selection";
import { SectionHead } from "@/components/chrome/SectionHead";
import { ConfidenceDots } from "@/components/widgets/ConfidenceDots";
import { Tooltip } from "@/components/widgets/Tooltip";
import { dimensionLabel } from "@/lib/dimension-labels";
import { Drawer } from "@/components/chrome/Drawer";
import { useLang } from "@/lib/lang-context";
import { format, t, UI_STRINGS, type Lang } from "@/lib/i18n";

type ColumnSpec = {
  key: "strengths" | "weaknesses" | "gaps";
  color: string;
  icon: string;
  labelKey: typeof UI_STRINGS[keyof typeof UI_STRINGS];
};

const COLUMNS: ColumnSpec[] = [
  {
    key: "strengths",
    color: "oklch(0.42 0.16 145)",
    icon: "↑",
    labelKey: UI_STRINGS.SYNTHESE_STRENGTHS,
  },
  {
    key: "weaknesses",
    color: "var(--risk-red)",
    icon: "↓",
    labelKey: UI_STRINGS.SYNTHESE_WEAKNESSES,
  },
  {
    key: "gaps",
    color: "oklch(0.52 0.14 60)",
    icon: "○",
    labelKey: UI_STRINGS.SYNTHESE_GAPS,
  },
];

type Direction = "improvement" | "worsening" | "neutral" | "mixed";

function directionMeta(
  d: Direction,
  lang: Lang,
): { label: string; color: string; icon: string; aria: string } {
  switch (d) {
    case "improvement":
      return {
        label: t(UI_STRINGS.SYNTHESE_TRAJ_IMPROVED_LABEL, lang),
        color: "oklch(0.42 0.16 145)",
        icon: "↑",
        aria: t(UI_STRINGS.SYNTHESE_TRAJ_IMPROVED_ARIA, lang),
      };
    case "worsening":
      return {
        label: t(UI_STRINGS.SYNTHESE_TRAJ_WORSENED_LABEL, lang),
        color: "var(--risk-red)",
        icon: "↓",
        aria: t(UI_STRINGS.SYNTHESE_TRAJ_WORSENED_ARIA, lang),
      };
    case "mixed":
      return {
        label: t(UI_STRINGS.SYNTHESE_TRAJ_MIXED_LABEL, lang),
        color: "oklch(0.52 0.14 60)",
        icon: "↔",
        aria: t(UI_STRINGS.SYNTHESE_TRAJ_MIXED_ARIA, lang),
      };
    case "neutral":
    default:
      return {
        label: t(UI_STRINGS.SYNTHESE_TRAJ_UNCHANGED_LABEL, lang),
        color: "var(--text-secondary)",
        icon: "→",
        aria: t(UI_STRINGS.SYNTHESE_TRAJ_UNCHANGED_ARIA, lang),
      };
  }
}

export function SyntheseSection({
  aggregated,
}: {
  aggregated: AggregatedOutput;
}) {
  const { lang } = useLang();
  const bullets = deriveSynthese(aggregated);
  const coverageCount = Object.keys(
    aggregated.agreement_map.coverage,
  ).length;
  const consensusPct = Math.round(aggregated.summary_agreement * 100);
  const [cfOpen, setCfOpen] = useState(false);
  const [dsOpen, setDsOpen] = useState(false);

  return (
    <section
      id="synthese"
      data-screen-label={t(UI_STRINGS.SYNTHESE_SECTION, lang)}
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] border-t border-rule py-14"
    >
      <SectionHead label={t(UI_STRINGS.SYNTHESE_SECTION, lang)} />

      <blockquote className="m-0 mb-12 max-w-[720px] border-l-[3px] border-accent pl-6 font-display text-2xl italic leading-[1.55] text-text [text-wrap:pretty]">
        «&thinsp;{aggregated.summary}&thinsp;»
      </blockquote>

      <div className="mb-12 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        <span>
          {format(t(UI_STRINGS.SYNTHESE_CONSENSUS_LABEL, lang), { pct: consensusPct, n: coverageCount })}
        </span>
        {aggregated.coverage_warning ? (
          <span className="rounded-sm border border-risk-red/40 bg-risk-red/10 px-2 py-[2px] font-semibold uppercase tracking-wider text-risk-red">
            {t(UI_STRINGS.SYNTHESE_COVERAGE_WARNING, lang)}
          </span>
        ) : null}
      </div>

      <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <SyntheseColumn
            key={col.key}
            spec={col}
            items={bullets[col.key]}
            lang={lang}
          />
        ))}
      </div>

      <div className="mb-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setCfOpen(true)}
          className="inline-flex items-center gap-2 rounded-sm border border-rule bg-bg px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t(UI_STRINGS.SYNTHESE_IF_NOTHING_CHANGES, lang)}
          <span aria-hidden="true">›</span>
        </button>
        {aggregated.downside_scenarios.length > 0 ? (
          <button
            type="button"
            onClick={() => setDsOpen(true)}
            className="inline-flex items-center gap-2 rounded-sm border border-rule bg-bg px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t(UI_STRINGS.SYNTHESE_DOWNSIDE_TITLE, lang)}
            <span aria-hidden="true">›</span>
          </button>
        ) : null}
      </div>

      <Drawer
        open={cfOpen}
        onOpenChange={setCfOpen}
        size="xl"
        eyebrow={t(UI_STRINGS.SYNTHESE_SECTION, lang)}
        title={t(UI_STRINGS.SYNTHESE_IF_NOTHING_CHANGES, lang)}
        description={t(UI_STRINGS.SYNTHESE_CF_DRAWER_DESCRIPTION, lang)}
      >
        <Counterfactual cf={aggregated.counterfactual} lang={lang} />
      </Drawer>

      {aggregated.downside_scenarios.length > 0 ? (
        <Drawer
          open={dsOpen}
          onOpenChange={setDsOpen}
          size="md"
          eyebrow={t(UI_STRINGS.SYNTHESE_SECTION, lang)}
          title={t(UI_STRINGS.SYNTHESE_DOWNSIDE_TITLE, lang)}
        >
          <DownsideScenarios scenarios={aggregated.downside_scenarios} lang={lang} />
        </Drawer>
      ) : null}
    </section>
  );
}

function SyntheseColumn({
  spec,
  items,
  lang,
}: {
  spec: ColumnSpec;
  items: DerivedBullet[];
  lang: Lang;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span
          className="text-sm font-bold"
          style={{ color: spec.color }}
          aria-hidden="true"
        >
          {spec.icon}
        </span>
        <span className="text-sm font-bold uppercase tracking-[0.08em] text-text-secondary">
          {t(spec.labelKey, lang)}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm italic text-text-tertiary">
          {t(UI_STRINGS.SYNTHESE_EMPTY_FALLBACK, lang)}
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
              <span className="text-sm text-text [text-wrap:pretty]">
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
  lang,
}: {
  cf: AggregatedOutput["counterfactual"];
  lang: Lang;
}) {
  const dir = directionMeta(cf.direction_of_change as Direction, lang);
  const confidencePct = Math.round(cf.confidence * 100);
  const supporters = cf.supported_by ?? [];
  const dissenters = cf.dissenters ?? [];
  return (
    <div className="mb-14 rounded-md border border-rule-light bg-bg-subtle p-5">
      {/* Header: title with info tooltip + direction badge + confidence */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"></div>
        <div className="flex items-center gap-3">
          <span
            role="status"
            aria-label={dir.aria}
            className="inline-flex items-center gap-1.5 rounded-sm px-2 py-[3px] text-xs font-bold uppercase tracking-wider"
            style={{
              color: dir.color,
              background: `color-mix(in oklch, ${dir.color} 12%, transparent)`,
              border: `1px solid color-mix(in oklch, ${dir.color} 35%, transparent)`,
            }}
          >
            <span aria-hidden="true">{dir.icon}</span>
            {dir.label}
          </span>
          <Tooltip
            content={format(t(UI_STRINGS.SYNTHESE_CONFIDENCE_TOOLTIP, lang), { pct: confidencePct })}
          >
            <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
              <ConfidenceDots value={cf.confidence} label={t(UI_STRINGS.SYNTHESE_CONFIDENCE, lang)} />
              <span className="font-semibold">{confidencePct}%</span>
            </span>
          </Tooltip>
        </div>
      </div>

      {/* Body: two columns */}
      <div className="grid grid-cols-1 gap-4 text-sm text-text md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            {t(UI_STRINGS.SYNTHESE_STATUS_QUO, lang)}
          </div>
          <p className="leading-[1.5]">{cf.status_quo_trajectory}</p>
        </div>
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            {t(UI_STRINGS.SYNTHESE_PROGRAM_EFFECT, lang)}
          </div>
          <DimensionList
            label={t(UI_STRINGS.SYNTHESE_IMPACT_ON, lang)}
            keys={cf.dimensions_changed}
            accentColor={dir.color}
            filled
            lang={lang}
          />
          <DimensionList
            label={t(UI_STRINGS.SYNTHESE_NO_IMPACT_ON, lang)}
            keys={cf.dimensions_unchanged}
            accentColor="var(--text-tertiary)"
            filled={false}
            lang={lang}
          />
        </div>
      </div>

      {cf.reasoning ? (
        <div className="mt-4">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            {t(UI_STRINGS.SYNTHESE_REASONING, lang)}
          </div>
          <p className="text-sm text-text-secondary [text-wrap:pretty]">
            {cf.reasoning}
          </p>
        </div>
      ) : null}

      {/* Provenance */}
      {(supporters.length > 0 || dissenters.length > 0) ? (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule-light pt-3 text-xs">
          {supporters.length > 0 ? (
            <ProvenancePills
              label={t(UI_STRINGS.SYNTHESE_SUPPORTED_BY, lang)}
              models={supporters}
              variant="support"
            />
          ) : null}
          {dissenters.length > 0 ? (
            <ProvenancePills
              label={t(UI_STRINGS.SYNTHESE_DISSENTERS, lang)}
              models={dissenters}
              variant="dissent"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Parse an LLM-emitted dimension entry. Analysts may return either a bare
 *  canonical key (`"economic_fiscal"`) or a key-prefixed description
 *  (`"economic_fiscal: passage à un modèle..."`). We translate the key and
 *  show the optional description alongside. Non-canonical keys fall back to
 *  the raw string. */
function parseDimensionEntry(raw: string): { key: string; description: string | null } {
  const idx = raw.indexOf(":");
  if (idx === -1) return { key: raw.trim(), description: null };
  const key = raw.slice(0, idx).trim();
  const description = raw.slice(idx + 1).trim();
  return { key, description: description.length > 0 ? description : null };
}

function DimensionList({
  label,
  keys,
  accentColor,
  filled,
  lang,
}: {
  label: string;
  keys: string[];
  accentColor: string;
  filled: boolean;
  lang: Lang;
}) {
  if (keys.length === 0) return null;
  const items = keys.map(parseDimensionEntry);
  const hasDescriptions = items.some((it) => it.description !== null);
  return (
    <div className="mt-3">
      <div className="mb-1 text-xs font-semibold tracking-wider text-text-secondary">
        {label}:
      </div>
      {hasDescriptions ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((it, i) => (
            <li key={`${it.key}-${i}`} className="flex flex-wrap items-baseline gap-2 text-xs">
              <Tooltip
                as="span"
                content={
                  <span className="[text-wrap:pretty]">
                    {it.description}
                  </span>
                }
              >
              <span
                className="inline-flex flex-shrink-0 items-center rounded-sm px-2 py-[2px]"
                style={
                  filled
                    ? {
                        color: accentColor,
                        background: `color-mix(in oklch, ${accentColor} 10%, transparent)`,
                        border: `1px solid color-mix(in oklch, ${accentColor} 25%, transparent)`,
                      }
                    : {
                        color: "var(--text-secondary)",
                        border: "1px dashed var(--rule)",
                      }
                }
              >
                {dimensionLabel(it.key, lang)}
              </span>
              </Tooltip>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="m-0 flex flex-wrap list-none gap-1.5 p-0">
          {items.map((it, i) => (
            <li
              key={`${it.key}-${i}`}
              className="inline-flex items-center rounded-sm px-2 py-[2px] text-xs"
              style={
                filled
                  ? {
                      color: accentColor,
                      background: `color-mix(in oklch, ${accentColor} 10%, transparent)`,
                      border: `1px solid color-mix(in oklch, ${accentColor} 25%, transparent)`,
                    }
                  : {
                      color: "var(--text-secondary)",
                      border: "1px dashed var(--rule)",
                    }
              }
            >
              {dimensionLabel(it.key, lang)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProvenancePills({
  label,
  models,
  variant,
}: {
  label: string;
  models: string[];
  variant: "support" | "dissent";
}) {
  const isDissent = variant === "dissent";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-semibold uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      {models.map((m) => (
        <span
          key={m}
          className={[
            "inline-flex items-center rounded-full border px-2 py-[2px]",
            isDissent
              ? "border-risk-red/40 text-risk-red"
              : "border-rule text-text-secondary",
          ].join(" ")}
          style={
            isDissent
              ? { background: "color-mix(in oklch, var(--risk-red) 8%, transparent)" }
              : undefined
          }
        >
          {m}
        </span>
      ))}
    </div>
  );
}

function DownsideScenarios({
  scenarios,
  lang,
}: {
  scenarios: AggregatedOutput["downside_scenarios"];
  lang: Lang;
}) {
  return (
    <div>
      <div className="mb-4 text-sm font-bold uppercase tracking-[0.08em] text-text-secondary">
        {t(UI_STRINGS.SYNTHESE_DOWNSIDE_TITLE, lang)}
      </div>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {scenarios.map((s, i) => (
          <li
            key={`${s.scenario}-${i}`}
            className="rounded-md border border-rule-light p-4"
          >
            <div className="mb-1 text-sm font-semibold text-text">
              {s.scenario}
            </div>
            <div className="mb-2 text-sm text-text-secondary">
              {t(UI_STRINGS.SYNTHESE_DOWNSIDE_TRIGGER, lang)} {s.trigger}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-text-tertiary">
              <span className="inline-flex items-center gap-2">
                {t(UI_STRINGS.SYNTHESE_PROBABILITY, lang)} <ConfidenceDots value={s.probability} label={t(UI_STRINGS.SYNTHESE_PROBABILITY, lang)} />
              </span>
              <span className="inline-flex items-center gap-2">
                {t(UI_STRINGS.SYNTHESE_SEVERITY, lang)} <ConfidenceDots value={s.severity} label={t(UI_STRINGS.SYNTHESE_SEVERITY, lang)} />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
