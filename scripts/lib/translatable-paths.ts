/**
 * TRANSLATABLE_PATHS — the canonical allowlist of JSON paths in
 * `aggregated.<lang>.json` whose string values may differ from the FR
 * canonical file. Every other path must be byte-identical (same
 * numbers, same scores, same array lengths, same identifiers, same
 * object keys, same booleans).
 *
 * This file is the **source of truth**. The spec
 * (`docs/specs/website/i18n.md` §2.1) reproduces this list for human
 * readers, but if the two ever diverge, this file wins.
 *
 * Path syntax:
 *   - dot-separated keys
 *   - `*` matches any single array index (numeric segment only)
 *   - `<key>` matches any single object key (non-numeric segment)
 *
 * Example: `dimensions.<dim>.problems_addressed.*.problem` matches
 * the `problem` field of every entry in every dimension's
 * `problems_addressed` array.
 */
export const TRANSLATABLE_PATHS: ReadonlyArray<string> = [
  // Top-level synthesis.
  "summary",

  // Positioning — 5 numeric axes + 1 categorical overall_spectrum.
  // The 5 axes share AggregatedPositioningAxisSchema.
  "positioning.<axis>.anchor_narrative",
  "positioning.<axis>.dissent.*.reasoning",
  "positioning.<axis>.per_model.*.reasoning",
  // overall_spectrum has the same translatable string fields under a
  // fixed key. Listing both forms keeps the validator simple.
  "positioning.overall_spectrum.anchor_narrative",
  "positioning.overall_spectrum.dissent.*.reasoning",
  "positioning.overall_spectrum.per_model.*.reasoning",

  // Dimensions — 5 fixed keys, all sharing AggregatedDimensionSchema.
  "dimensions.<dim>.headline.text",
  "dimensions.<dim>.headline.per_model.*.text",
  "dimensions.<dim>.summary",
  "dimensions.<dim>.problems_addressed.*.problem",
  "dimensions.<dim>.problems_addressed.*.approach",
  "dimensions.<dim>.problems_addressed.*.reasoning",
  "dimensions.<dim>.problems_ignored.*.problem",
  "dimensions.<dim>.problems_ignored.*.significance",
  "dimensions.<dim>.problems_worsened.*.problem",
  "dimensions.<dim>.problems_worsened.*.mechanism",
  "dimensions.<dim>.problems_worsened.*.reasoning",
  "dimensions.<dim>.execution_risks.*.risk",
  "dimensions.<dim>.execution_risks.*.reasoning",
  "dimensions.<dim>.key_measures.*.measure",
  "dimensions.<dim>.key_measures.*.magnitude",
  "dimensions.<dim>.risk_profile.<cat>.note",
  "dimensions.<dim>.risk_profile.<cat>.per_model.*.note",

  // Intergenerational block.
  "intergenerational.reasoning",
  "intergenerational.magnitude_estimate.value",
  "intergenerational.magnitude_estimate.units",
  "intergenerational.magnitude_estimate.caveats",
  "intergenerational.impact_on_25yo_in_2027.narrative_summary",
  "intergenerational.impact_on_25yo_in_2027.<key>.summary",
  "intergenerational.impact_on_25yo_in_2027.<key>.quantified",
  "intergenerational.impact_on_65yo_in_2027.narrative_summary",
  "intergenerational.impact_on_65yo_in_2027.<key>.summary",
  "intergenerational.impact_on_65yo_in_2027.<key>.quantified",
  "intergenerational.horizon_matrix.*.dimension_note",
  "intergenerational.horizon_matrix.*.cells.<horizon>.note",
  "intergenerational.horizon_matrix.*.cells.<horizon>.per_model.*.note",
  "intergenerational.agreement.dissenting_views.*.view",

  // Counterfactual.
  "counterfactual.status_quo_trajectory",
  "counterfactual.reasoning",

  // Top-level lists.
  "unsolved_problems.*.problem",
  "unsolved_problems.*.why_unsolved",
  "downside_scenarios.*.scenario",
  "downside_scenarios.*.trigger",
  "downside_scenarios.*.reasoning",

  // Agreement map — only contested-claim positions are prose.
  // claim_id and high_confidence_claims are identifiers.
  "agreement_map.contested_claims.*.positions.*.position",

  // Flagged for review — reviewer-facing prose.
  "flagged_for_review.*.claim",
  "flagged_for_review.*.issue",
  "flagged_for_review.*.suggested_action",
  "flagged_for_review.*.edited_text",
];

/**
 * Match a concrete JSON path (e.g. `dimensions.economic_fiscal.summary`)
 * against a pattern from {@link TRANSLATABLE_PATHS}. Returns true iff
 * the pattern's segments line up one-for-one with the path, where `*`
 * matches any array index (numeric segment only) and `<...>` matches
 * any single object key (non-numeric segment).
 */
export function matchesPattern(path: string, pattern: string): boolean {
  const pathParts = path.split(".");
  const patternParts = pattern.split(".");
  if (pathParts.length !== patternParts.length) {
    return false;
  }
  for (let i = 0; i < pathParts.length; i++) {
    const pat = patternParts[i];
    const seg = pathParts[i];
    if (pat === "*") {
      if (!/^\d+$/.test(seg)) {
        return false;
      }
      continue;
    }
    if (pat.startsWith("<") && pat.endsWith(">")) {
      if (/^\d+$/.test(seg)) {
        return false;
      }
      continue;
    }
    if (pat !== seg) {
      return false;
    }
  }
  return true;
}

/**
 * True iff a JSON path is allowed to differ between the FR canonical
 * file and a translation file. Used by the parity validator.
 */
export function isTranslatablePath(path: string): boolean {
  return TRANSLATABLE_PATHS.some((p) => matchesPattern(path, p));
}
