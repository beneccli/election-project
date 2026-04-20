// See docs/specs/website/candidate-page-polish.md §5.3
// See docs/specs/analysis/intergenerational-audit.md
// Renders aggregated.intergenerational.horizon_matrix as a 6×3 grid.
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

/** 7-step ordinal palette for modal_score ∈ [-3, +3]. */
function cellBackground(score: number | null): string {
  if (score === null) return "color-mix(in oklch, var(--text-tertiary) 8%, transparent)";
  // Symmetric palette: red-ish negative, neutral, green-ish positive.
  // OKLCH chroma saturates with |score|.
  const map: Record<number, string> = {
    [-3]: "color-mix(in oklch, oklch(0.58 0.22 25) 20%, transparent)",
    [-2]: "color-mix(in oklch, oklch(0.62 0.16 30) 14%, transparent)",
    [-1]: "color-mix(in oklch, oklch(0.70 0.10 35) 10%, transparent)",
    [0]: "color-mix(in oklch, var(--text-tertiary) 6%, transparent)",
    [1]: "color-mix(in oklch, oklch(0.66 0.10 145) 10%, transparent)",
    [2]: "color-mix(in oklch, oklch(0.58 0.14 145) 16%, transparent)",
    [3]: "color-mix(in oklch, oklch(0.50 0.18 145) 22%, transparent)",
  };
  return map[score] ?? map[0];
}

function cellAccent(score: number | null): string {
  if (score === null) return "var(--text-tertiary)";
  if (score < 0) return "var(--risk-red)";
  if (score > 0) return "oklch(0.48 0.16 145)";
  return "var(--text-tertiary)";
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
  // Preserve schema order: matrix is an array of 6 rows in a defined order.
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full min-w-[680px] border-separate border-spacing-0 text-sm"
        aria-label="Matrice d'impact intergénérationnel par domaine et horizon"
      >
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-[1] min-w-[9rem] bg-bg py-2 pr-3 text-left align-bottom text-xs font-bold uppercase tracking-wider text-text-tertiary"
            >
              Domaine
            </th>
            {HORIZON_KEYS.map((k) => (
              <th
                key={k}
                scope="col"
                className="px-2 py-2 text-left align-bottom"
              >
                <div className="font-display text-sm font-semibold text-text">
                  {HORIZON_COL_LABELS[k].range}
                </div>
                <div className="mt-0.5 text-[10px] font-normal text-text-tertiary">
                  {HORIZON_COL_LABELS[k].cohort}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.row}>
              <th
                scope="row"
                className="sticky left-0 z-[1] bg-bg py-2 pr-3 align-top"
              >
                <div className="font-semibold text-text">
                  {ROW_LABELS[row.row]}
                </div>
                <Tooltip as="span" content={row.dimension_note}>
                  <div className="mt-0.5 hidden text-[11px] italic leading-[1.4] text-text-tertiary sm:line-clamp-2 sm:block">
                    {row.dimension_note}
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-[11px] italic text-text-tertiary sm:hidden"
                  >
                    note ›
                  </span>
                </Tooltip>
              </th>
              {HORIZON_KEYS.map((hk) => (
                <td
                  key={hk}
                  className="px-1 py-1 align-top"
                >
                  <HorizonCellView cell={row.cells[hk]} />
                </td>
              ))}
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
  const accent = cellAccent(score);
  const bg = cellBackground(score);
  const absScore = score === null ? 0 : Math.abs(score);
  const barPct = `${(absScore / 3) * 100}%`;
  const hasDissent = cell.dissenters.length > 0;
  const label = formatScore(score);

  return (
    <Tooltip
      as="div"
      content={<CellTooltipContent cell={cell} />}
      className="block w-full"
    >
      <div
        className="rounded-sm border border-rule-light p-2"
        style={{ background: bg }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex min-w-[2.25rem] items-center justify-center rounded-full px-2 py-0.5 font-mono text-sm font-bold tabular-nums"
            style={{
              color: accent,
              border: `1px solid ${accent}`,
              background: "color-mix(in oklch, var(--bg) 60%, transparent)",
            }}
            aria-label={`Score modal ${label}`}
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
        <div className="mt-1.5 h-[4px] w-full rounded-full bg-rule overflow-hidden" aria-hidden="true">
          <div
            className="h-full rounded-full"
            style={{ width: barPct, background: accent }}
          />
        </div>
      </div>
    </Tooltip>
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
      <div className="font-mono text-[10px] opacity-70">
        {intervalLabel}
      </div>
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
  const items: { label: string; score: -3 | -2 | 0 | 2 | 3 }[] = [
    { label: "Très négatif", score: -3 },
    { label: "Négatif", score: -2 },
    { label: "Neutre", score: 0 },
    { label: "Positif", score: 2 },
    { label: "Très positif", score: 3 },
  ];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-tertiary">
      <span className="font-bold uppercase tracking-wider">Légende</span>
      {items.map((it) => (
        <span key={it.score} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-5 rounded-sm border border-rule-light"
            style={{ background: cellBackground(it.score) }}
          />
          {it.label}
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
