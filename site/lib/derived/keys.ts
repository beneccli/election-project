// See docs/specs/website/nextjs-architecture.md §3
//
// Shared dimension-key ordering (canonical across candidates, per
// editorial principle: symmetric scrutiny). Code must iterate via this
// array, NOT via Object.keys() which yields insertion order.
export const DIMENSION_KEYS = [
  "economic_fiscal",
  "social_demographic",
  "security_sovereignty",
  "institutional_democratic",
  "environmental_long_term",
] as const;

export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export const AXIS_KEYS = [
  "economic",
  "social_cultural",
  "sovereignty",
  "institutional",
  "ecological",
] as const;

export type AxisKey = (typeof AXIS_KEYS)[number];
