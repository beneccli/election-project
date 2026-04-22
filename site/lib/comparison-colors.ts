// See docs/specs/website/comparison-page.md §5
//
// Candidate slot colors for the /comparer page. Slot assignment is by
// URL query order only; no slot is "primary" (editorial principle:
// symmetric rendering).

export const COMPARISON_COLORS = [
  "oklch(0.44 0.18 264)", // blue
  "oklch(0.50 0.18 25)", // red
  "oklch(0.42 0.17 145)", // green
  "oklch(0.44 0.18 300)", // purple
] as const;

export const MAX_COMPARISON_CANDIDATES = 4;
export const MIN_COMPARISON_CANDIDATES = 2;
