// See docs/specs/website/comparison-page.md §4 (Domaines).
//
// Ordinal value map for dimension grades. Used ONLY by DomainesComparison
// to compute `max − min` per-row and detect the unique-max cell.
//
// NOT a cardinal score. Never displayed to the user. Never averaged.

import type { GradeLetter } from "@/lib/grade-color";

/** Higher number = better grade. NOT_ADDRESSED has no value. */
const MAP: Record<GradeLetter, number | null> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0,
  NOT_ADDRESSED: null,
};

export function gradeValue(letter: GradeLetter): number | null {
  return MAP[letter];
}
