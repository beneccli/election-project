// See docs/specs/website/nextjs-architecture.md §3.1
import type { AggregatedOutput } from "../schema";
import { DIMENSION_KEYS } from "./keys";

export type TopGradeLetter = "A" | "B" | "C" | "D" | "F";
export type GradeModifier = "+" | "-" | null;

export interface TopLevelGrade {
  letter: TopGradeLetter;
  modifier: GradeModifier;
}

const GRADE_ORDER: readonly TopGradeLetter[] = ["A", "B", "C", "D", "F"];
const GRADE_RANK: Record<TopGradeLetter, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  F: 4,
};

/**
 * Top-level grade derivation.
 *
 * - `letter` = modal of the 5 dimension consensus grades. `NOT_ADDRESSED`
 *   contributes as `F` (worst letter) because the candidate failed to
 *   address the dimension. Ties break to the lower (more conservative)
 *   letter.
 * - `modifier` describes consensus strength only:
 *     summary_agreement >= 0.80  →  "+"
 *     summary_agreement <  0.50  →  "-"
 *     otherwise                  →  null
 *
 * Editorial note: the modifier is NOT a substantive judgement. It only
 * describes how much the source models agree on the overall picture. See
 * docs/specs/website/nextjs-architecture.md §3.1.
 */
export function deriveTopLevelGrade(agg: AggregatedOutput): TopLevelGrade {
  const counts: Record<TopGradeLetter, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  };
  for (const key of DIMENSION_KEYS) {
    const g = agg.dimensions[key].grade.consensus;
    const letter: TopGradeLetter = g === "NOT_ADDRESSED" ? "F" : g;
    counts[letter] += 1;
  }

  let best: TopGradeLetter = "F";
  let bestCount = -1;
  for (const letter of GRADE_ORDER) {
    const c = counts[letter];
    if (c > bestCount) {
      best = letter;
      bestCount = c;
    } else if (c === bestCount && GRADE_RANK[letter] > GRADE_RANK[best]) {
      // tie → lower letter (more conservative)
      best = letter;
    }
  }

  const a = agg.summary_agreement;
  let modifier: GradeModifier = null;
  if (a >= 0.8) modifier = "+";
  else if (a < 0.5) modifier = "-";

  return { letter: best, modifier };
}
