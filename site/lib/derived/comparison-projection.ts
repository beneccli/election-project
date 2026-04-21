// See docs/specs/website/comparison-page.md §4.1
//
// Pure projection of an already-aggregated candidate bundle to a flat
// view-model consumed by the comparison widgets. No averaging, no
// composites — every field is traceable to a single aggregated ordinal
// field (editorial principle: no cardinal averaging).
//
// Test coverage + the `listComparisonProjections` wrapper are delivered
// by task 0092. This file ships the minimum needed by the /comparer
// route shell (task 0091).

import {
  AXIS_KEYS,
  DIMENSION_KEYS,
  type AxisKey,
  type DimensionKey,
} from "@/lib/derived/keys";
import type { CandidateBundle } from "@/lib/candidates";
import {
  deriveTopLevelGrade,
  type TopGradeLetter,
  type GradeModifier,
} from "@/lib/derived/top-level-grade";

// ---------------------------------------------------------------------------
// Shared enumerations
// ---------------------------------------------------------------------------

export const RISK_CATEGORY_KEYS = [
  "budgetary",
  "implementation",
  "dependency",
  "reversibility",
] as const;
export type RiskCategoryKey = (typeof RISK_CATEGORY_KEYS)[number];

export const RISK_LEVEL_ORDER = [
  "low",
  "limited",
  "moderate",
  "high",
] as const;
export type RiskLevel = (typeof RISK_LEVEL_ORDER)[number];
/** Index into RISK_LEVEL_ORDER (0..3). `-1` denotes a null modal (unknown). */
export type RiskLevelIndex = -1 | 0 | 1 | 2 | 3;

export const HORIZON_ROW_KEYS = [
  "pensions",
  "public_debt",
  "climate",
  "health",
  "education",
  "housing",
] as const;
export type HorizonRowKey = (typeof HORIZON_ROW_KEYS)[number];

// ---------------------------------------------------------------------------
// View-model shape
// ---------------------------------------------------------------------------

export interface ComparisonProjection {
  id: string;
  displayName: string;
  party: string;
  partyShort: string;
  /** Updated-at timestamp from root candidate metadata. */
  updatedAt: string;
  /** Mirrors `meta.is_fictional`. Used by the picker to filter at build
   *  time when `EXCLUDE_FICTIONAL=1`. */
  isFictional: boolean;
  /** Always true in this type; non-analyzable candidates are represented
   *  by the sibling `NonAnalyzableCandidate`. */
  analyzable: true;

  overallGrade: TopGradeLetter;
  overallGradeModifier: GradeModifier;

  /** Axis modal in [-5, +5] or null. Order = AXIS_KEYS. */
  positioning: Array<number | null>;

  /** One dimension consensus grade per DIMENSION_KEYS. */
  dimGrades: Record<DimensionKey, "A" | "B" | "C" | "D" | "F" | "NOT_ADDRESSED">;

  /** 4 risk levels per dimension, in RISK_CATEGORY_KEYS order. */
  risks: Record<DimensionKey, RiskLevelIndex[]>;

  /** One signed int in [-3, +3] (or null) per horizon row. Collapsed from
   *  the `h_2038_2047` modal — no cross-horizon arithmetic. */
  intergen: Record<HorizonRowKey, number | null>;
}

export interface NonAnalyzableCandidate {
  id: string;
  displayName: string;
  updatedAt: string;
  analyzable: false;
  reason: string;
}

export type ComparisonEntry = ComparisonProjection | NonAnalyzableCandidate;

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

function partyShort(party: string): string {
  const letters = party
    .split(/\s+/)
    .map((w) => w[0])
    .filter((c): c is string => typeof c === "string" && /[A-Za-zÀ-ÿ]/.test(c))
    .join("")
    .toUpperCase();
  return letters.slice(0, 4) || party.slice(0, 3).toUpperCase();
}

function riskLevelIndex(level: RiskLevel | null): RiskLevelIndex {
  if (level === null) return -1;
  return RISK_LEVEL_ORDER.indexOf(level) as RiskLevelIndex;
}

export function deriveComparisonProjection(
  bundle: CandidateBundle,
): ComparisonProjection {
  const { meta, aggregated } = bundle;
  const topGrade = deriveTopLevelGrade(aggregated);

  const positioning: Array<number | null> = AXIS_KEYS.map(
    (axis: AxisKey) => aggregated.positioning[axis].modal_score,
  );

  const dimGrades = {} as ComparisonProjection["dimGrades"];
  const risks = {} as ComparisonProjection["risks"];
  for (const dim of DIMENSION_KEYS) {
    dimGrades[dim] = aggregated.dimensions[dim].grade.consensus;
    const profile = aggregated.dimensions[dim].risk_profile;
    risks[dim] = RISK_CATEGORY_KEYS.map((cat) =>
      riskLevelIndex(profile[cat].modal_level as RiskLevel | null),
    );
  }

  const intergen = {} as ComparisonProjection["intergen"];
  for (const row of HORIZON_ROW_KEYS) {
    intergen[row] = null;
  }
  for (const matrixRow of aggregated.intergenerational.horizon_matrix) {
    intergen[matrixRow.row] = matrixRow.cells.h_2038_2047.modal_score;
  }

  return {
    id: meta.id,
    displayName: meta.display_name,
    party: meta.party,
    partyShort: partyShort(meta.party),
    updatedAt: meta.updated,
    isFictional: meta.is_fictional === true,
    analyzable: true,
    overallGrade: topGrade.letter,
    overallGradeModifier: topGrade.modifier,
    positioning,
    dimGrades,
    risks,
    intergen,
  };
}
