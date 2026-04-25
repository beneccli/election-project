// See docs/specs/website/candidate-page-polish.md §5.4
// Visual design mirrors Candidate Page.html `RiskHeatmap` (flat colored pills
// with the level label inside, 4-step ordinal palette).
// EDITORIAL: ordinal levels only; text label is the primary signal.
import type { AggregatedOutput } from "@/lib/schema";
import { DIMENSION_KEYS, type DimensionKey } from "@/lib/derived/keys";
import { Tooltip } from "@/components/widgets/Tooltip";
import { format, t, UI_STRINGS, type Lang, type I18nString } from "@/lib/i18n";
import { dimensionLabel } from "@/lib/dimension-labels";

type RiskProfile =
  AggregatedOutput["dimensions"][DimensionKey]["risk_profile"];
type RiskCategory = RiskProfile["budgetary"];
type RiskLevel = "low" | "limited" | "moderate" | "high";

const CATEGORY_KEYS = [
  "budgetary",
  "implementation",
  "dependency",
  "reversibility",
] as const;
type CategoryKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_LABELS: Record<CategoryKey, I18nString> = {
  budgetary: UI_STRINGS.RISK_CATEGORY_BUDGETARY,
  implementation: UI_STRINGS.RISK_CATEGORY_IMPLEMENTATION,
  dependency: UI_STRINGS.RISK_CATEGORY_DEPENDENCY,
  reversibility: UI_STRINGS.RISK_CATEGORY_REVERSIBILITY,
};

const LEVEL_LABELS: Record<RiskLevel, I18nString> = {
  low: UI_STRINGS.RISK_LEVEL_LOW,
  limited: UI_STRINGS.RISK_LEVEL_LIMITED,
  moderate: UI_STRINGS.RISK_LEVEL_MODERATE,
  high: UI_STRINGS.RISK_LEVEL_HIGH,
};

// Flat palette mirroring Candidate Page.html `RiskHeatmap` `rc(v)`.
// Dark cells (moderate/high) use white text; light cells use near-black
// so the label stays readable in both light and dark themes.
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

function levelLabel(level: RiskLevel | null, lang: Lang): string {
  if (level === null) return "?";
  return t(LEVEL_LABELS[level], lang);
}

export function RiskSummaryMatrix({
  dimensions,
  lang = "fr",
}: {
  dimensions: AggregatedOutput["dimensions"];
  lang?: Lang;
}) {
  return (
    <div>
      <table
        className="w-full min-w-[420px] border-collapse"
        aria-label={t(UI_STRINGS.A11Y_RISK_MATRIX, lang)}
      >
        <thead>
          <tr>
            <th
              scope="col"
              className="w-[200px] pr-3 pb-2.5 text-left text-xs font-semibold uppercase tracking-[0.06em] text-text-secondary"
            >
              {t(UI_STRINGS.INTERGEN_HORIZON_DOMAIN_LABEL, lang)}
            </th>
            {CATEGORY_KEYS.map((c) => (
              <th
                key={c}
                scope="col"
                className="px-1 pb-2.5 text-center text-xs font-semibold uppercase tracking-[0.05em] text-text-secondary"
              >
                {t(CATEGORY_LABELS[c], lang)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIMENSION_KEYS.map((dk) => {
            const profile = dimensions[dk].risk_profile;
            return (
              <tr key={dk}>
                <th
                  scope="row"
                  className="whitespace-nowrap py-1 pr-3 text-left text-sm font-medium text-text"
                >
                  {dimensionLabel(dk, lang)}
                </th>
                {CATEGORY_KEYS.map((ck) => (
                  <td key={ck} className="p-1 text-center">
                    <RiskCell cell={profile[ck]} lang={lang} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* <Legend /> */}
    </div>
  );
}

function RiskCell({ cell, lang }: { cell: RiskCategory; lang: Lang }) {
  const level = cell.modal_level as RiskLevel | null;
  const label = levelLabel(level, lang);
  const _hasDissent = cell.dissenters.length > 0;

  const bg = level
    ? LEVEL_BG[level]
    : "color-mix(in oklch, var(--text-tertiary) 12%, transparent)";
  const fg = level ? LEVEL_FG[level] : "var(--text-secondary)";

  return (
    <Tooltip
      as="div"
      content={<CellTooltipContent cell={cell} lang={lang} />}
      className="block w-full"
    >
      <div
        className="relative mx-auto flex w-full items-center justify-center rounded px-1 py-[5px] text-xs font-semibold"
        style={{ background: bg, color: fg }}
        aria-label={format(t(UI_STRINGS.COMPARISON_RISKS_LEVEL_TEMPLATE, lang), { label })}
      >
        {label}
        {/* {hasDissent ? (
          <span
            aria-label={`Dissensus : ${cell.dissenters.length} modèle(s)`}
            className="absolute -right-1 -top-1 text-xs font-bold text-risk-red"
          >
            ⚡
          </span>
        ) : null} */}
      </div>
    </Tooltip>
  );
}

function CellTooltipContent({ cell, lang }: { cell: RiskCategory; lang: Lang }) {
  const [lo, hi] = cell.level_interval;
  const intervalLabel =
    lo === hi
      ? `niveau : ${t(LEVEL_LABELS[lo as RiskLevel], lang)}`
      : `intervalle : ${t(LEVEL_LABELS[lo as RiskLevel], lang)} → ${t(LEVEL_LABELS[hi as RiskLevel], lang)}`;
  const rows = [...cell.per_model].sort((a, b) =>
    a.model.localeCompare(b.model),
  );
  return (
    <div className="space-y-1 text-left">
      <div className="font-semibold leading-[1.4]">{cell.note}</div>
      <div className="font-mono text-xs opacity-70">{intervalLabel}</div>
      {rows.length > 0 ? (
        <div className="mt-1 space-y-0.5 border-t border-bg/30 pt-1">
          {rows.map((r) => (
            <div
              key={r.model}
              className="flex items-baseline justify-between gap-3 text-[11px]"
            >
              <span className="font-mono opacity-80">{r.model}</span>
              <span className="font-semibold">
                {t(LEVEL_LABELS[r.level as RiskLevel], lang)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function _Legend() {
  const items: RiskLevel[] = ["low", "limited", "moderate", "high"];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
      <span className="font-bold uppercase tracking-[0.06em]">{t(UI_STRINGS.LEGEND_LABEL, "fr")}</span>
      {items.map((lvl) => (
        <span key={lvl} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-5 rounded-[3px]"
            style={{ background: LEVEL_BG[lvl] }}
          />
          {t(LEVEL_LABELS[lvl], "fr")}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="font-bold text-risk-red">
          ⚡
        </span>
        dissensus entre modèles
      </span>
    </div>
  );
}
