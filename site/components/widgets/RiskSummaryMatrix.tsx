// See docs/specs/website/candidate-page-polish.md §5.4
// Visual design mirrors Candidate Page.html `RiskHeatmap` (flat colored pills
// with the level label inside, 4-step ordinal palette).
// EDITORIAL: ordinal levels only; text label is the primary signal.
import type { AggregatedOutput } from "@/lib/schema";
import { DIMENSION_KEYS, type DimensionKey } from "@/lib/derived/keys";
import { Tooltip } from "@/components/widgets/Tooltip";

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

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  budgetary: "Budgétaire",
  implementation: "Mise en œuvre",
  dependency: "Dépendance",
  reversibility: "Réversibilité",
};

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  economic_fiscal: "Économique & fiscal",
  social_demographic: "Social & démographique",
  security_sovereignty: "Sécurité & souveraineté",
  institutional_democratic: "Institutionnel & démocratique",
  environmental_long_term: "Environnemental & long terme",
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Faible",
  limited: "Limité",
  moderate: "Modéré",
  high: "Élevé",
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

function levelLabel(level: RiskLevel | null): string {
  if (level === null) return "?";
  return LEVEL_LABELS[level];
}

export function RiskSummaryMatrix({
  dimensions,
}: {
  dimensions: AggregatedOutput["dimensions"];
}) {
  return (
    <div>
      <table
        className="w-full min-w-[420px] border-collapse"
        aria-label="Matrice des risques par domaine et catégorie"
      >
        <thead>
          <tr>
            <th
              scope="col"
              className="w-[200px] pr-3 pb-2.5 text-left text-xs font-semibold uppercase tracking-[0.06em] text-text-secondary"
            >
              Domaine
            </th>
            {CATEGORY_KEYS.map((c) => (
              <th
                key={c}
                scope="col"
                className="px-1 pb-2.5 text-center text-xs font-semibold uppercase tracking-[0.05em] text-text-secondary"
              >
                {CATEGORY_LABELS[c]}
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
                  {DIMENSION_LABELS[dk]}
                </th>
                {CATEGORY_KEYS.map((ck) => (
                  <td key={ck} className="p-1 text-center">
                    <RiskCell cell={profile[ck]} />
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

function RiskCell({ cell }: { cell: RiskCategory }) {
  const level = cell.modal_level as RiskLevel | null;
  const label = levelLabel(level);
  const hasDissent = cell.dissenters.length > 0;

  const bg = level
    ? LEVEL_BG[level]
    : "color-mix(in oklch, var(--text-tertiary) 12%, transparent)";
  const fg = level ? LEVEL_FG[level] : "var(--text-secondary)";

  return (
    <Tooltip
      as="div"
      content={<CellTooltipContent cell={cell} />}
      className="block w-full"
    >
      <div
        className="relative mx-auto flex w-full items-center justify-center rounded px-1 py-[5px] text-xs font-semibold"
        style={{ background: bg, color: fg }}
        aria-label={`Niveau de risque : ${label}`}
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

function CellTooltipContent({ cell }: { cell: RiskCategory }) {
  const [lo, hi] = cell.level_interval;
  const intervalLabel =
    lo === hi
      ? `niveau : ${LEVEL_LABELS[lo as RiskLevel]}`
      : `intervalle : ${LEVEL_LABELS[lo as RiskLevel]} → ${LEVEL_LABELS[hi as RiskLevel]}`;
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
                {LEVEL_LABELS[r.level as RiskLevel]}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Legend() {
  const items: RiskLevel[] = ["low", "limited", "moderate", "high"];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
      <span className="font-bold uppercase tracking-[0.06em]">Légende</span>
      {items.map((lvl) => (
        <span key={lvl} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-5 rounded-[3px]"
            style={{ background: LEVEL_BG[lvl] }}
          />
          {LEVEL_LABELS[lvl]}
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
