// See docs/specs/website/candidate-page-polish.md §5.3
// See docs/specs/analysis/intergenerational-audit.md
// Visual design mirrors Candidate Page.html `IntergenerationPanel`: a single
// wide table with horizon columns, a trailing per-row note column, and a
// horizontal bar + signed score per cell.
// EDITORIAL: measurement only. Cell notes describe mechanism, not moral weight.
import type { AggregatedOutput } from "@/lib/schema";
import { Tooltip } from "@/components/widgets/Tooltip";

type HorizonMatrix =
  AggregatedOutput["intergenerational"]["horizon_matrix"];
type HorizonRow = HorizonMatrix[number];
type HorizonCell = HorizonRow["cells"]["h_2027_2030"];

const HORIZON_KEYS = ["h_2027_2030", "h_2031_2037", "h_2038_2047"] as const;
type HorizonKey = (typeof HORIZON_KEYS)[number];

const HORIZON_COL_LABELS: Record<
  HorizonKey,
  { range: string; cohort: string }
> = {
  h_2027_2030: { range: "2027–2030", cohort: "Actifs 35–55 ans" },
  h_2031_2037: {
    range: "2031–2037",
    cohort: "Jeunes actifs & retraités",
  },
  h_2038_2047: { range: "2038–2047", cohort: "Génération Z & Alpha" },
};

const ROW_LABELS: Record<HorizonRow["row"], string> = {
  pensions: "Retraites",
  public_debt: "Dette publique",
  climate: "Climat",
  health: "Santé",
  education: "Éducation",
  housing: "Logement",
};

// Palette mirroring Candidate Page.html `IntergenerationPanel` `sc(s)`.
function scoreColor(score: number | null): string {
  if (score === null) return "var(--text-tertiary)";
  if (score >= 2) return "oklch(0.44 0.17 145)";
  if (score === 1) return "oklch(0.60 0.12 145)";
  if (score === 0) return "var(--text-secondary)";
  if (score === -1) return "oklch(0.60 0.13 30)";
  return "oklch(0.46 0.19 20)";
}

function formatScore(score: number | null): string {
  if (score === null) return "?";
  if (score === 0) return "0";
  return score > 0 ? `+${score}` : `−${Math.abs(score)}`;
}

export function IntergenHorizonTable({
  matrix,
}: {
  matrix: HorizonMatrix;
}) {
  return (
    <div>
      <table
        className="w-full min-w-[480px] border-collapse"
        aria-label="Matrice d'impact intergénérationnel par domaine et horizon"
      >
        <thead>
          <tr>
            <th
              scope="col"
              className="pr-4 pb-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-text-secondary"
            >
              Domaine
            </th>
            {HORIZON_KEYS.map((k) => (
              <th
                key={k}
                scope="col"
                className="px-2 pb-3 text-center text-xs"
              >
                <div className="text-sm font-bold text-text">
                  {HORIZON_COL_LABELS[k].range}
                </div>
                <div className="mt-0.5 text-xs text-text-secondary">
                  {HORIZON_COL_LABELS[k].cohort}
                </div>
              </th>
            ))}
            <th
              scope="col"
              className="pl-4 pb-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-text-secondary"
            >
              Note
            </th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.row} className="border-t border-rule-light">
              <th
                scope="row"
                className="whitespace-nowrap py-2.5 pr-4 text-left text-[13px] font-medium text-text"
              >
                {ROW_LABELS[row.row]}
              </th>
              {HORIZON_KEYS.map((hk) => (
                <td key={hk} className="px-2 py-2.5 text-center">
                  <HorizonCellView cell={row.cells[hk]} />
                </td>
              ))}
              <td className="max-w-[220px] py-2.5 pl-4 text-xs leading-[1.4] text-text-secondary">
                <Tooltip as="span" content={<RowTooltipContent row={row} />}>
                  <span>{row.dimension_note}</span>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Legend />
    </div>
  );
}

function HorizonCellView({ cell }: { cell: HorizonCell }) {
  const score = cell.modal_score;
  const color = scoreColor(score);
  const absScore = score === null ? 0 : Math.abs(score);
  // Width follows CP.html: max(|score|*16, 2) px. Zero scores render a
  // faded 2px dot; non-zero scale linearly so ±3 = 48px.
  const barWidth = Math.max(absScore * 16, 2);
  const _hasDissent = cell.dissenters.length > 0;
  const label = formatScore(score);

  return (
    <Tooltip
      as="div"
      content={<CellTooltipContent cell={cell} />}
      className="inline-block"
    >
      <div className="relative flex items-center justify-center gap-1.5">
        <div
          aria-hidden="true"
          className="h-[6px] rounded-[3px]"
          style={{
            width: `${barWidth}px`,
            background: color,
            opacity: score === 0 ? 0.3 : 1,
          }}
        />
        <span
          className="min-w-[16px] text-xs font-semibold"
          style={{ color }}
          aria-label={`Score modal ${label}`}
        >
          {label}
        </span>
        {/* {hasDissent ? (
          <span
            aria-label={`Dissensus : ${cell.dissenters.length} modèle(s)`}
            className="absolute -right-2 -top-1 text-xs font-bold text-risk-red"
          >
            ⚡
          </span>
        ) : null} */}
      </div>
    </Tooltip>
  );
}

function RowTooltipContent({ row }: { row: HorizonRow }) {
  return (
    <div className="space-y-1 text-left">
      <div className="font-semibold leading-[1.4]">
        {ROW_LABELS[row.row]}
      </div>
      <div className="leading-[1.4]">{row.dimension_note}</div>
    </div>
  );
}

function CellTooltipContent({ cell }: { cell: HorizonCell }) {
  const [lo, hi] = cell.score_interval;
  const intervalLabel =
    lo === hi
      ? `score : ${formatScore(lo)}`
      : `intervalle : ${formatScore(lo)} → ${formatScore(hi)}`;
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
              <span className="font-semibold">{formatScore(r.score)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Legend() {
  const items: { label: string; score: -3 | -1 | 0 | 1 | 3 }[] = [
    { label: "Très positif", score: 3 },
    { label: "Positif", score: 1 },
    { label: "Neutre", score: 0 },
    { label: "Négatif", score: -1 },
    { label: "Très négatif", score: -3 },
  ];
  return (
    <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-text-secondary">
      {items.map((it) => (
        <span key={it.score} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-[5px] rounded-[2px]"
            style={{
              width: `${Math.max(Math.abs(it.score) * 5, 2)}px`,
              background: scoreColor(it.score),
            }}
          />
          {it.label}
        </span>
      ))}
      {/* <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="font-bold text-risk-red">
          ⚡
        </span>
        dissensus entre modèles
      </span> */}
    </div>
  );
}
