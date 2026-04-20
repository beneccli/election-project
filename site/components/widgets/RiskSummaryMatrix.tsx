// See docs/specs/website/candidate-page-polish.md §5.4
// 5 dimensions × 4 risk categories matrix with ordinal level pills.
// EDITORIAL: 4-step ordinal palette; level labels are primary signal.
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

function levelPalette(level: RiskLevel | null): {
  bg: string;
  border: string;
  fg: string;
} {
  if (level === null) {
    return {
      bg: "color-mix(in oklch, var(--text-tertiary) 8%, transparent)",
      border: "var(--text-tertiary)",
      fg: "var(--text-tertiary)",
    };
  }
  const map: Record<RiskLevel, { bg: string; border: string; fg: string }> = {
    low: {
      bg: "color-mix(in oklch, oklch(0.66 0.10 145) 14%, transparent)",
      border: "oklch(0.48 0.16 145)",
      fg: "oklch(0.38 0.16 145)",
    },
    limited: {
      bg: "color-mix(in oklch, oklch(0.80 0.12 90) 20%, transparent)",
      border: "oklch(0.60 0.14 90)",
      fg: "oklch(0.44 0.14 75)",
    },
    moderate: {
      bg: "color-mix(in oklch, oklch(0.72 0.16 55) 22%, transparent)",
      border: "oklch(0.58 0.18 45)",
      fg: "oklch(0.46 0.18 40)",
    },
    high: {
      bg: "color-mix(in oklch, oklch(0.62 0.22 25) 22%, transparent)",
      border: "oklch(0.52 0.22 25)",
      fg: "oklch(0.44 0.22 25)",
    },
  };
  return map[level];
}

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
    <div className="overflow-x-auto">
      <table
        className="w-full min-w-[640px] border-separate border-spacing-0 text-sm"
        aria-label="Matrice des risques par domaine et catégorie"
      >
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-[1] min-w-[12rem] bg-bg py-2 pr-3 text-left align-bottom text-xs font-bold uppercase tracking-wider text-text-tertiary"
            >
              Domaine
            </th>
            {CATEGORY_KEYS.map((c) => (
              <th
                key={c}
                scope="col"
                className="px-2 py-2 text-left align-bottom font-display text-sm font-semibold text-text"
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
                  className="sticky left-0 z-[1] bg-bg py-2 pr-3 align-top text-sm font-semibold text-text"
                >
                  {DIMENSION_LABELS[dk]}
                </th>
                {CATEGORY_KEYS.map((ck) => (
                  <td key={ck} className="px-1 py-1 align-top">
                    <RiskCell cell={profile[ck]} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <Legend />
    </div>
  );
}

function RiskCell({ cell }: { cell: RiskCategory }) {
  const level = cell.modal_level as RiskLevel | null;
  const palette = levelPalette(level);
  const label = levelLabel(level);
  const hasDissent = cell.dissenters.length > 0;

  return (
    <Tooltip
      as="div"
      content={<CellTooltipContent cell={cell} />}
      className="block w-full"
    >
      <div className="flex items-center justify-between gap-2 rounded-sm border px-2 py-1.5"
        style={{ background: palette.bg, borderColor: palette.border }}
      >
        <span
          className="font-semibold"
          style={{ color: palette.fg }}
          aria-label={`Niveau de risque : ${label}`}
        >
          {label}
        </span>
        {hasDissent ? (
          <span
            className="text-[10px] font-bold text-risk-red"
            aria-label={`Dissensus : ${cell.dissenters.length} modèle(s)`}
          >
            ⚡
          </span>
        ) : null}
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
      <div className="font-mono text-[10px] opacity-70">{intervalLabel}</div>
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
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-tertiary">
      <span className="font-bold uppercase tracking-wider">Légende</span>
      {items.map((lvl) => {
        const p = levelPalette(lvl);
        return (
          <span key={lvl} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-5 rounded-sm border"
              style={{ background: p.bg, borderColor: p.border }}
            />
            {LEVEL_LABELS[lvl]}
          </span>
        );
      })}
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="font-bold text-risk-red">
          ⚡
        </span>
        dissensus entre modèles
      </span>
    </div>
  );
}
