// See docs/specs/website/nextjs-architecture.md §4.6
// Per-risk table grouped by dimension. NO cardinal risk score.
import type { AggregatedOutput } from "@/lib/schema";
import type { DimensionKey } from "@/lib/derived/keys";
import { ConfidenceDots } from "./ConfidenceDots";

type Risk = AggregatedOutput["dimensions"][DimensionKey]["execution_risks"][number];

export interface RiskGroup {
  dimensionKey: DimensionKey;
  label: string;
  risks: Risk[];
  /** Number of model runs covering this candidate — used for the "k/n" pill. */
  totalCoverage: number;
}

export function RiskHeatmap({ groups }: { groups: RiskGroup[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] border-collapse">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.06em] text-text-secondary">
            <th className="w-[42%] pb-3 pr-3 font-semibold">Risque</th>
            <th className="pb-3 pr-3 font-semibold">Probabilité</th>
            <th className="pb-3 pr-3 font-semibold">Sévérité</th>
            <th className="pb-3 font-semibold">Modèles</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <GroupBody key={g.dimensionKey} group={g} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupBody({ group }: { group: RiskGroup }) {
  return (
    <>
      <tr className="border-t border-rule">
        <td
          colSpan={4}
          className="bg-bg-subtle px-3 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-text-secondary"
        >
          {group.label}
        </td>
      </tr>
      {group.risks.length === 0 ? (
        <tr className="border-t border-rule-light">
          <td
            colSpan={4}
            className="px-3 py-3 text-[12px] italic text-text-tertiary"
          >
            Aucun risque d&apos;exécution identifié par les modèles.
          </td>
        </tr>
      ) : (
        group.risks.map((r, i) => (
          <RiskRow
            key={`${group.dimensionKey}-${i}`}
            risk={r}
            totalCoverage={group.totalCoverage}
          />
        ))
      )}
    </>
  );
}

/** 5-step palette keyed on max(probability, severity) in [0, 1]. */
function tintFor(max: number): string {
  if (max >= 0.85) return "oklch(0.50 0.20 20 / 0.18)";
  if (max >= 0.65) return "oklch(0.60 0.19 30 / 0.14)";
  if (max >= 0.45) return "oklch(0.74 0.15 60 / 0.12)";
  if (max >= 0.25) return "oklch(0.82 0.10 90 / 0.10)";
  return "transparent";
}

function RiskRow({
  risk,
  totalCoverage,
}: {
  risk: Risk;
  totalCoverage: number;
}) {
  const max = Math.max(risk.probability, risk.severity);
  const supported = risk.supported_by.length;
  return (
    <tr
      className="border-t border-rule-light align-top"
      style={{ background: tintFor(max) }}
      title={risk.reasoning}
    >
      <td className="px-3 py-3 text-[13px] leading-[1.5] text-text [text-wrap:pretty]">
        {risk.risk}
      </td>
      <td className="px-3 py-3">
        <ConfidenceDots value={risk.probability} label="Probabilité" />
      </td>
      <td className="px-3 py-3">
        <ConfidenceDots value={risk.severity} label="Sévérité" />
      </td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center rounded-sm border border-rule px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
          {supported}/{totalCoverage || supported}
        </span>
      </td>
    </tr>
  );
}
