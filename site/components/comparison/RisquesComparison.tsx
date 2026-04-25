"use client";
// See docs/specs/website/comparison-page.md §4 (Risques).
//
// Stacked per-candidate risk matrices. One block per selected candidate,
// each block is a (DIMENSION_KEYS × RISK_CATEGORY_KEYS) heatmap whose
// cells are driven ONLY by `projection.risks[dim][catIndex]`
// (a `RiskLevelIndex` in [-1, 3] — already the aggregated modal).
//
// EDITORIAL: no composite/summed risk score, no cross-candidate ranking.
// Rendering is identical across blocks; order = URL order (picker slot).

import Link from "next/link";
import {
  RISK_CATEGORY_KEYS,
  RISK_LEVEL_ORDER,
  type RiskCategoryKey,
  type RiskLevel,
  type ComparisonProjection,
} from "@/lib/derived/comparison-projection";
import { DIMENSION_KEYS, type DimensionKey } from "@/lib/derived/keys";
import { DIMENSION_LABELS } from "@/lib/dimension-labels";
import { COMPARISON_COLORS } from "@/lib/comparison-colors";
import { useLang } from "@/lib/lang-context";
import { format, t, UI_STRINGS, type Lang } from "@/lib/i18n";
import { useComparison } from "./ComparisonBody";
import { SectionHead } from "../chrome/SectionHead";

// Palette + labels mirror the candidate-page RiskSummaryMatrix so the
// reader recognises the same cells. Only 4 levels exist in the real
// schema — there is no "critical".
const LEVEL_BG: Record<RiskLevel, string> = {
  low: "oklch(0.88 0.06 145)",
  limited: "oklch(0.82 0.10 90)",
  moderate: "oklch(0.74 0.15 60)",
  high: "oklch(0.60 0.19 30)",
};
const LEVEL_FG: Record<RiskLevel, string> = {
  low: "#333",
  limited: "#333",
  moderate: "#fff",
  high: "#fff",
};
const LEVEL_LABELS: Record<RiskLevel, { fr: string; en: string }> = {
  low: UI_STRINGS.RISK_LEVEL_LOW,
  limited: UI_STRINGS.RISK_LEVEL_LIMITED,
  moderate: UI_STRINGS.RISK_LEVEL_MODERATE,
  high: UI_STRINGS.RISK_LEVEL_HIGH,
};
const CATEGORY_LABELS: Record<RiskCategoryKey, { fr: string; en: string }> = {
  budgetary: UI_STRINGS.RISK_CATEGORY_BUDGETARY,
  implementation: UI_STRINGS.RISK_CATEGORY_IMPLEMENTATION,
  dependency: UI_STRINGS.RISK_CATEGORY_DEPENDENCY,
  reversibility: UI_STRINGS.RISK_CATEGORY_REVERSIBILITY,
};

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

export function RisquesComparison() {
  const { entries, selectedIds } = useComparison();
  const { lang } = useLang();
  if (selectedIds.length < 2) return null;
  const selected: ComparisonProjection[] = selectedIds
    .map((id) => entries.find((e) => e.analyzable && e.id === id))
    .filter((e): e is ComparisonProjection =>
      Boolean(e && e.analyzable === true),
    );
  if (selected.length < 2) return null;
  return <RisquesStack selected={selected} lang={lang} />;
}

export function RisquesStack({
  selected,
  lang,
}: {
  selected: ComparisonProjection[];
  lang: Lang;
}) {
  return (
    <section id="risques" className="mb-16">
      <header className="mb-12">
        <SectionHead label={t(UI_STRINGS.COMPARISON_RISKS_TITLE, lang)} />
      </header>
      <div className="space-y-12">
        {selected.map((c, slot) => (
          <RisquesBlock
            key={c.id}
            projection={c}
            slot={slot}
            lang={lang}
          />
        ))}
      </div>
      <Legend lang={lang} />
    </section>
  );
}

function RisquesBlock({
  projection,
  slot,
  lang,
}: {
  projection: ComparisonProjection;
  slot: number;
  lang: Lang;
}) {
  const color = COMPARISON_COLORS[slot % COMPARISON_COLORS.length];
  return (
    <div
      data-candidate={projection.id}
    >
      <header className="mb-3 flex items-center gap-3">
        <span
          aria-hidden
          className="inline-block h-[3px] w-8 rounded"
          style={{ backgroundColor: color }}
        />
        <Link
          href={`/candidat/${projection.id}#risques`}
          className="text-sm font-semibold hover:underline"
        >
          {firstName(projection.displayName)}
        </Link>
        <span className="text-xs text-text-tertiary">
          {projection.partyShort}
        </span>
      </header>
      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[420px] border-collapse"
          aria-label={format(t(UI_STRINGS.COMPARISON_RISKS_MATRIX_ARIA, lang), { name: projection.displayName })}
        >
          <thead>
            <tr>
              <th
                scope="col"
                className="w-[200px] pr-3 pb-2 text-left text-xs font-semibold uppercase tracking-[0.06em] text-text-secondary"
              >
                {t(UI_STRINGS.COMPARISON_RISKS_DOMAIN_LABEL, lang)}
              </th>
              {RISK_CATEGORY_KEYS.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="px-1 pb-2 text-center text-xs font-semibold uppercase tracking-[0.05em] text-text-secondary"
                >
                  {t(CATEGORY_LABELS[c], lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIMENSION_KEYS.map((dk) => (
              <tr key={dk}>
                <th
                  scope="row"
                  className="whitespace-nowrap py-1 pr-3 text-left text-sm font-medium text-text"
                >
                  {t(DIMENSION_LABELS[dk], lang)}
                </th>
                {RISK_CATEGORY_KEYS.map((ck, idx) => {
                  const levelIdx = projection.risks[dk as DimensionKey][idx];
                  return (
                    <td
                      key={ck}
                      className="p-1 text-center"
                      data-dim={dk}
                      data-cat={ck}
                      data-level-index={levelIdx}
                    >
                      <RiskCell levelIndex={levelIdx} lang={lang} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskCell({
  levelIndex,
  lang,
}: {
  levelIndex: number;
  lang: Lang;
}) {
  const level =
    levelIndex >= 0 && levelIndex < RISK_LEVEL_ORDER.length
      ? RISK_LEVEL_ORDER[levelIndex]
      : null;
  if (level === null) {
    return (
      <div
        className="mx-auto flex w-full items-center justify-center rounded px-1 py-[5px] text-xs font-semibold"
        style={{
          background:
            "color-mix(in oklch, var(--text-tertiary) 12%, transparent)",
          color: "var(--text-secondary)",
        }}
        aria-label={t(UI_STRINGS.COMPARISON_RISKS_LEVEL_UNKNOWN, lang)}
      >
        ?
      </div>
    );
  }
  const label = t(LEVEL_LABELS[level], lang);
  return (
    <div
      className="mx-auto flex w-full items-center justify-center rounded px-1 py-[5px] text-xs font-semibold"
      style={{ background: LEVEL_BG[level], color: LEVEL_FG[level] }}
      aria-label={format(t(UI_STRINGS.COMPARISON_RISKS_LEVEL_TEMPLATE, lang), { label })}
    >
      {label}
    </div>
  );
}

function Legend({ lang }: { lang: Lang }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
      <span className="font-bold uppercase tracking-[0.06em]">
        {t(UI_STRINGS.LEGEND_LABEL, lang)}
      </span>
      {RISK_LEVEL_ORDER.map((lvl) => (
        <span key={lvl} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-3 w-5 rounded-[3px]"
            style={{ background: LEVEL_BG[lvl] }}
          />
          {t(LEVEL_LABELS[lvl], lang)}
        </span>
      ))}
    </div>
  );
}
