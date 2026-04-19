// See docs/specs/website/nextjs-architecture.md §3.2
import type { AggregatedOutput } from "../schema";
import { DIMENSION_KEYS, type DimensionKey } from "./keys";

export interface DerivedBullet {
  text: string;
  sourceDimension: DimensionKey | null;
  supportedBy: string[];
  dissenters: string[];
}

export interface SyntheseBullets {
  strengths: DerivedBullet[];
  weaknesses: DerivedBullet[];
  gaps: DerivedBullet[];
}

/** Neutral empty-list fallback copy. Do NOT change without editorial review. */
export const SYNTHESE_EMPTY_FALLBACK =
  "Aucun élément marquant identifié dans cette analyse";

const SEVERITY_RANK: Record<"high" | "medium" | "low", number> = {
  high: 2,
  medium: 1,
  low: 0,
};

/**
 * Deterministic synthèse selection.
 *
 * Rules (identical for every candidate):
 *  - strengths: flatten `dimensions.*.problems_addressed`, filter
 *    strength >= 0.7, sort descending by strength, take top 3.
 *  - weaknesses: flatten `dimensions.*.problems_worsened`, sort descending
 *    by severity, take top 3.
 *  - gaps: `unsolved_problems`, sort by `severity_if_unsolved`
 *    (high > medium > low), take top 3.
 *  - All ties break alphabetically by `sourceDimension` then by `text` so
 *    outputs are stable across builds.
 *  - Empty results are NOT rendered as success. Caller surfaces
 *    SYNTHESE_EMPTY_FALLBACK.
 *
 * Editorial note: identical filter + sort for every candidate. Absence is a
 * finding, never softpedaled into positive framing.
 */
export function deriveSynthese(agg: AggregatedOutput): SyntheseBullets {
  type WithStrength = { text: string; score: number; dim: DimensionKey; sb: string[]; ds: string[] };
  const strengthsPool: WithStrength[] = [];
  const weaknessesPool: WithStrength[] = [];

  for (const dim of DIMENSION_KEYS) {
    for (const p of agg.dimensions[dim].problems_addressed) {
      if (p.strength >= 0.7) {
        strengthsPool.push({
          text: p.problem,
          score: p.strength,
          dim,
          sb: [...p.supported_by],
          ds: [...p.dissenters],
        });
      }
    }
    for (const p of agg.dimensions[dim].problems_worsened) {
      weaknessesPool.push({
        text: p.problem,
        score: p.severity,
        dim,
        sb: [...p.supported_by],
        ds: [...p.dissenters],
      });
    }
  }

  const strengths = pickTop3(strengthsPool, (a, b) => b.score - a.score);
  const weaknesses = pickTop3(weaknessesPool, (a, b) => b.score - a.score);

  const gapsPool = agg.unsolved_problems.map((u) => ({
    text: u.problem,
    score: SEVERITY_RANK[u.severity_if_unsolved],
    dim: null as DimensionKey | null,
    sb: [...u.supported_by],
    ds: [...u.dissenters],
  }));
  const gaps = pickTop3(gapsPool, (a, b) => b.score - a.score);

  return {
    strengths: strengths.map(toBullet),
    weaknesses: weaknesses.map(toBullet),
    gaps: gaps.map(toBullet),
  };
}

function pickTop3<T extends { text: string; dim: DimensionKey | null; score: number }>(
  pool: T[],
  primary: (a: T, b: T) => number,
): T[] {
  return [...pool]
    .sort((a, b) => {
      const p = primary(a, b);
      if (p !== 0) return p;
      // stable tie-break by dim (null last) then by text
      const da = a.dim ?? "\uffff";
      const db = b.dim ?? "\uffff";
      if (da !== db) return da < db ? -1 : 1;
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    })
    .slice(0, 3);
}

function toBullet(r: {
  text: string;
  dim: DimensionKey | null;
  sb: string[];
  ds: string[];
}): DerivedBullet {
  return {
    text: r.text,
    sourceDimension: r.dim,
    supportedBy: r.sb,
    dissenters: r.ds,
  };
}
