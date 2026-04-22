---
id: "0100"
title: "Zod schema: add overall_spectrum to positioning (analysis + aggregated), bump schema_version to 1.2"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_PoliticalSpectrum
spec: docs/specs/analysis/political-spectrum-label.md
context:
  - scripts/lib/schema.ts
  - scripts/lib/schema.test.ts
  - site/lib/schema.ts
  - candidates/test-omega/current/
depends_on: []
---

## Context

Add the additive `overall_spectrum` field to both the per-model
`PositioningSchema` and the aggregated
`AggregatedPositioningSchema`, and bump the top-level
`schema_version` literal from `"1.1"` to `"1.2"`. See spec §3, §4.1,
§5, §7.

Existing `.strict()` guardrails on aggregated positioning must be
mirrored on the new object: no `score`, `mean`, `index`, or
`numeric_value` key may be accepted.

## Objectives

1. In `scripts/lib/schema.ts`:
   - Export `SpectrumLabelSchema` as a Zod enum over the 8
     snake_case values from spec §3.
   - Export `SpectrumAxisKeySchema` for `derived_from_axes`.
   - Add `OverallSpectrumSchema` (per-model) with fields `label`,
     `derived_from_axes` (min 1), `evidence` (min 1), `confidence`,
     `reasoning` (min 60, max 600 chars).
   - Extend `PositioningSchema` with `overall_spectrum:
     OverallSpectrumSchema` while keeping `.strict()`.
   - Add `AggregatedOverallSpectrumSchema` with `modal_label`
     (nullable), `label_distribution` (record of enum → int ≥ 0),
     `anchor_narrative`, `confidence`, `dissent[]`, `per_model[]`,
     optional `human_edit`.
   - Extend `AggregatedPositioningSchema` with
     `overall_spectrum: AggregatedOverallSpectrumSchema` under
     `.strict()`.
   - Extend the `agreement_map.positioning_consensus` shape with
     `overall_spectrum: { modal_label, distribution, dissent_count }`.
   - Change `schema_version: z.literal("1.1")` to
     `z.literal("1.2")` in both `AnalysisOutputSchema` and the
     aggregated output.
2. Mirror the new types in `site/lib/schema.ts` (loader-facing
   schema). Keep the split the site already uses.
3. Write unit tests in `scripts/lib/schema.test.ts`:
   - A minimal v1.2 analysis example parses.
   - A minimal v1.2 aggregated example parses.
   - `.strict()` rejects an extra `score` key on per-model
     `overall_spectrum`.
   - `.strict()` rejects an extra `mean` / `index` / `numeric_value`
     key on aggregated `overall_spectrum`.
   - `derived_from_axes: []` is rejected.
   - `label_distribution` with a negative count is rejected.
4. Do **not** regenerate fixtures in this task — task 0104 handles
   `candidates/test-omega/` fixture updates. Pre-existing fixture
   tests may break and should be temporarily skipped with a
   `// TODO(0104)` annotation pointing to the fixture regen task,
   or the tests may be updated inline if the change is mechanical.

## Acceptance Criteria

- [ ] `schema_version` literal is `"1.2"` in both analysis and
      aggregated schemas
- [ ] `OverallSpectrumSchema` exported from `scripts/lib/schema.ts`
- [ ] `AggregatedOverallSpectrumSchema` exported, `.strict()`
      enforced
- [ ] `positioning.overall_spectrum` present in both schemas
- [ ] `agreement_map.positioning_consensus.overall_spectrum`
      present in aggregated schema
- [ ] Matching types exported from `site/lib/schema.ts`
- [ ] New unit tests in `scripts/lib/schema.test.ts` pass
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean

## Hints

- Precedent for `.strict()` positioning guardrail is at
  `scripts/lib/schema.ts` line ~729 comment
  ("1. Aggregated positioning has NO `score` field…").
- `z.record(SpectrumLabelSchema, z.number().int().nonnegative())`
  models `label_distribution`.
- Use `.nullable()` on `modal_label` in the aggregated schema; the
  per-model `label` is never null.

## Editorial check

- [ ] Per-model `reasoning` has a min-length bound so terse
      placeholders ("droite.") cannot pass
- [ ] No `score`, `mean`, `index`, `numeric_value` key is accepted
      on the spectrum object at either level
- [ ] `derived_from_axes` is required non-empty — a label with no
      axis support is a schema error

## Notes

Task 0101 depends on this task for the canonical prompt update to
match the wire format.
