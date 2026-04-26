"use client";

// See docs/specs/website/candidate-page-polish.md §5.2
// Vertical list of dimensions with inline-expanding deep-dive content.
// Headline is rendered verbatim from aggregated.dimensions[k].headline.text.
import { useEffect, useState } from "react";
import type { AggregatedOutput } from "@/lib/schema";
import { DIMENSION_KEYS, type DimensionKey } from "@/lib/derived/keys";
import { SectionHead } from "@/components/chrome/SectionHead";
import { GradeBadge } from "@/components/widgets/GradeBadge";
import { ConfidenceDots } from "@/components/widgets/ConfidenceDots";
import { ConfidenceBar } from "@/components/widgets/ConfidenceBar";
import { Tooltip } from "@/components/widgets/Tooltip";
import { SourceRef } from "@/components/widgets/SourceRef";
import type { GradeLetter } from "@/lib/grade-color";
import { useLang } from "@/lib/lang-context";
import { format, t, UI_STRINGS, type Lang } from "@/lib/i18n";

function dimensionLabel(key: DimensionKey, lang: Lang): string {
  switch (key) {
    case "economic_fiscal":
      return t(UI_STRINGS.DIMENSION_LABEL_ECONOMIC_FISCAL, lang);
    case "social_demographic":
      return t(UI_STRINGS.DIMENSION_LABEL_SOCIAL_DEMOGRAPHIC, lang);
    case "security_sovereignty":
      return t(UI_STRINGS.DIMENSION_LABEL_SECURITY_SOVEREIGNTY, lang);
    case "institutional_democratic":
      return t(UI_STRINGS.DIMENSION_LABEL_INSTITUTIONAL_DEMOCRATIC, lang);
    case "environmental_long_term":
      return t(UI_STRINGS.DIMENSION_LABEL_ENVIRONMENTAL_LONG_TERM, lang);
  }
}

const MAX_ITEMS = 5;

export function DomainesSection({
  aggregated,
}: {
  aggregated: AggregatedOutput;
}) {
  const { lang } = useLang();
  const [expanded, setExpanded] = useState<Set<DimensionKey>>(
    () => new Set(),
  );

  // Deep-link support: #dim=<key> auto-expands the corresponding row.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const parse = () => {
      const hash = window.location.hash;
      const match = /#dim=([a-z_]+)/.exec(hash);
      if (
        match &&
        (DIMENSION_KEYS as readonly string[]).includes(match[1])
      ) {
        const key = match[1] as DimensionKey;
        setExpanded((cur) => {
          if (cur.has(key)) return cur;
          const next = new Set(cur);
          next.add(key);
          return next;
        });
      }
    };
    parse();
    window.addEventListener("hashchange", parse);
    return () => window.removeEventListener("hashchange", parse);
  }, []);

  const toggle = (key: DimensionKey) => {
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section
      id="dimensions"
      data-screen-label={t(UI_STRINGS.DOMAINES_SECTION, lang)}
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] border-t border-rule py-14"
    >
      <SectionHead label={t(UI_STRINGS.DOMAINES_SECTION_HEAD, lang)} />
      <ul className="m-0 flex list-none flex-col p-0">
        {DIMENSION_KEYS.map((key) => {
          const dim = aggregated.dimensions[key];
          const isOpen = expanded.has(key);
          return (
            <li key={key} className="border-b border-rule last:border-b-0">
              <DimensionRow
                dimKey={key}
                label={dimensionLabel(key, lang)}
                dim={dim}
                isOpen={isOpen}
                onToggle={() => toggle(key)}
                lang={lang}
              />
              {isOpen ? (
                <DimensionDeepDive dimKey={key} dim={dim} lang={lang} />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DimensionRow({
  dimKey,
  label,
  dim,
  isOpen,
  onToggle,
  lang,
}: {
  dimKey: DimensionKey;
  label: string;
  dim: AggregatedOutput["dimensions"][DimensionKey];
  isOpen: boolean;
  onToggle: () => void;
  lang: Lang;
}) {
  const consensus = dim.grade.consensus;
  const dissentEntries = Object.entries(dim.grade.dissent);
  const dissentCount = dissentEntries.filter(
    ([, g]) => g !== consensus,
  ).length;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={`deep-dive-${dimKey}`}
      className="flex w-full flex-wrap items-center gap-4 py-5 text-left transition-colors hover:bg-bg-subtle focus:outline-none focus-visible:bg-bg-subtle"
    >
      <GradeBadge grade={consensus} size="md" />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-base font-bold text-text">
            {label}
          </span>
          {dissentCount > 0 ? (
            // The tooltip is informational; prevent row toggle on click.
            <span onClick={(e) => e.stopPropagation()}>
              <Tooltip
                as="span"
                content={
                  <GradeDissentList
                    consensus={consensus}
                    dissent={dim.grade.dissent}
                    lang={lang}
                  />
                }
              >
                <span className="px-1.5 text-[10px] font-bold uppercase tracking-wider text-risk-red">
                  {t(UI_STRINGS.DOMAINES_DISSENT_BADGE, lang)}
                </span>
              </Tooltip>
            </span>
          ) : null}
        </div>
        <p className="m-0 text-sm leading-[1.45] text-text-secondary [text-wrap:pretty]">
          {dim.headline.text}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
        <ConfidenceBar value={dim.confidence} label={t(UI_STRINGS.DOMAINES_CONFIDENCE, lang)} />
        {/* <ModelGradeRow
          consensus={consensus}
          dissent={dim.grade.dissent}
        /> */}
      </div>

      <span
        aria-hidden="true"
        className="mr-3 text-xl leading-none text-text-tertiary transition-transform"
        style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
      >
        ›
      </span>
    </button>
  );
}

function _ModelGradeRow({
  consensus,
  dissent,
}: {
  consensus: GradeLetter;
  dissent: Record<string, GradeLetter>;
}) {
  const entries = Object.entries(dissent).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  if (entries.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-1 font-mono">
      {entries.map(([model, g], i) => {
        const diverges = g !== consensus;
        return (
          <span key={model} className="inline-flex items-center gap-1">
            {i > 0 ? (
              <span aria-hidden="true" className="opacity-40">
                ·
              </span>
            ) : null}
            <Tooltip as="span" content={model}>
              <span
                className={
                  diverges
                    ? "font-semibold text-risk-red"
                    : "text-text-tertiary"
                }
              >
                {g === "NOT_ADDRESSED" ? "—" : g}
              </span>
            </Tooltip>
          </span>
        );
      })}
    </span>
  );
}

function GradeDissentList({
  consensus,
  dissent,
  lang,
}: {
  consensus: GradeLetter;
  dissent: Record<string, GradeLetter>;
  lang: Lang;
}) {
  const rows = Object.entries(dissent).sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="space-y-1">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
        {t(UI_STRINGS.DOMAINES_PER_MODEL_GRADES, lang)}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] opacity-70">consensus</span>
        <span className="font-semibold">{consensus}</span>
      </div>
      {rows.map(([modelId, g]) => {
        const diverges = g !== consensus;
        return (
          <div
            key={modelId}
            className="flex items-center justify-between gap-3"
          >
            <span className="font-mono text-[11px]">{modelId}</span>
            <span className={diverges ? "font-bold" : "opacity-80"}>
              {g}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DimensionDeepDive({
  dimKey,
  dim,
  lang,
}: {
  dimKey: DimensionKey;
  dim: AggregatedOutput["dimensions"][DimensionKey];
  lang: Lang;
}) {
  const modelGrades = Object.entries(dim.grade.dissent);
  return (
    <div
      id={`deep-dive-${dimKey}`}
      className="mb-6 ml-[72px] mt-1 rounded-md border border-rule-light bg-bg-subtle p-6"
    >
      <p className="mb-6 text-sm leading-[1.55] text-text-secondary [text-wrap:pretty]">
        {dim.summary}
      </p>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <ProblemBlock
          icon="✓"
          color="oklch(0.42 0.16 145)"
          heading={t(UI_STRINGS.DOMAINES_PROBLEMS_ADDRESSED, lang)}
          empty={t(UI_STRINGS.DOMAINES_PROBLEMS_ADDRESSED_EMPTY, lang)}
          items={dim.problems_addressed.slice(0, MAX_ITEMS).map((p) => ({
            text: p.problem,
            supportedBy: p.supported_by,
            dissenters: p.dissenters,
            sourceRefs: p.source_refs,
          }))}
          overflow={dim.problems_addressed.length - MAX_ITEMS}
          lang={lang}
        />
        <ProblemBlock
          icon="—"
          color="var(--text-tertiary)"
          heading={t(UI_STRINGS.DOMAINES_PROBLEMS_IGNORED, lang)}
          empty={t(UI_STRINGS.DOMAINES_PROBLEMS_IGNORED_EMPTY, lang)}
          items={dim.problems_ignored.slice(0, MAX_ITEMS).map((p) => ({
            text: p.problem,
            supportedBy: p.supported_by,
            dissenters: p.dissenters,
            sourceRefs: p.source_refs,
          }))}
          overflow={dim.problems_ignored.length - MAX_ITEMS}
          lang={lang}
        />
        <ProblemBlock
          icon="⚠"
          color="var(--risk-red)"
          heading={t(UI_STRINGS.DOMAINES_PROBLEMS_WORSENED, lang)}
          empty={t(UI_STRINGS.DOMAINES_PROBLEMS_WORSENED_EMPTY, lang)}
          items={dim.problems_worsened.slice(0, MAX_ITEMS).map((p) => ({
            text: p.problem,
            supportedBy: p.supported_by,
            dissenters: p.dissenters,
            sourceRefs: p.source_refs,
          }))}
          overflow={dim.problems_worsened.length - MAX_ITEMS}
          lang={lang}
        />
      </div>

      {dim.execution_risks.length > 0 ? (
        <div className="mb-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
            {t(UI_STRINGS.DOMAINES_EXECUTION_RISKS, lang)}
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {dim.execution_risks.map((r, i) => (
              <li
                key={`${r.risk}-${i}`}
                className="flex flex-wrap items-center gap-3 text-sm text-text"
              >
                <span className="flex-1 min-w-[12rem]">{r.risk}</span>
                <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                  {t(UI_STRINGS.DOMAINES_PROB_SHORT, lang)} <ConfidenceDots value={r.probability} label={t(UI_STRINGS.DOMAINES_PROB_LONG, lang)} />
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                  {t(UI_STRINGS.DOMAINES_SEV_SHORT, lang)} <ConfidenceDots value={r.severity} label={t(UI_STRINGS.DOMAINES_SEV_LONG, lang)} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {dim.key_measures.length > 0 ? (
        <div className="mb-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
            {t(UI_STRINGS.DOMAINES_KEY_MEASURES, lang)}
          </div>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {dim.key_measures.map((m, i) => (
              <li
                key={`${m.measure}-${i}`}
                className="text-sm leading-[1.5] text-text"
              >
                <span>{m.measure}</span>
                <span className="ml-2 text-xs text-text-tertiary">
                  {m.quantified && m.magnitude
                    ? `— ${m.magnitude}`
                    : t(UI_STRINGS.DOMAINES_NOT_QUANTIFIED_INLINE, lang)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
          {t(UI_STRINGS.DOMAINES_PER_MODEL_GRADES, lang)}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-sm border border-accent/30 bg-accent-subtle px-2 py-1 font-semibold text-accent">
            {t(UI_STRINGS.DOMAINES_CONSENSUS_PREFIX, lang)} {dim.grade.consensus}
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
  lang,
}: {
  icon: string;
  color: string;
  heading: string;
  empty: string;
  items: {
    text: string;
    supportedBy: string[];
    dissenters: string[];
    sourceRefs: readonly string[];
  }[];
  overflow: number;
  lang: Lang;
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
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">
          {heading}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm italic text-text-tertiary">{empty}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((item, i) => (
            <li
              key={`${item.text}-${i}`}
              className="text-sm leading-[1.5] text-text [text-wrap:pretty]"
            >
              <span>{item.text}</span>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-tertiary">
                {item.supportedBy.length > 0 ? (
                  <span>{t(UI_STRINGS.DOMAINES_SUPPORTED_BY, lang)} {item.supportedBy.join(", ")}</span>
                ) : null}
                {item.dissenters.length > 0 ? (
                  <span className="text-risk-red">
                    · {t(UI_STRINGS.DOMAINES_DISSENTERS_PREFIX, lang)} {item.dissenters.join(", ")}
                  </span>
                ) : null}
                {item.sourceRefs.length > 0 ? (
                  <span className="flex flex-wrap items-center gap-1">
                    <span aria-hidden="true">·</span>
                    {item.sourceRefs.map((ref, idx) => (
                      <SourceRef key={`${ref}-${idx}`}>{ref}</SourceRef>
                    ))}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
          {overflow > 0 ? (
            <li className="cursor-not-allowed text-xs italic text-text-tertiary">
              {format(t(UI_STRINGS.DOMAINES_PROBLEMS_OVERFLOW, lang), { n: overflow, s: overflow > 1 ? "s" : "" })}
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
