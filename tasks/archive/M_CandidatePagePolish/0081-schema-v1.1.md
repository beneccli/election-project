---
id: "0081"
title: "Schema v1.1: headline, risk_profile, horizon_matrix, positioning per-model"
type: task
status: open
priority: high
created: 2026-04-20
milestone: M_CandidatePagePolish
spec: docs/specs/website/candidate-page-polish.md
context:
  - scripts/lib/schema.ts
  - scripts/lib/schema.test.ts
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/aggregation.md
  - docs/specs/analysis/intergenerational-audit.md
test_command: pnpm test -- schema
depends_on: []
---

## Context

The four candidate-page polish points all need additive schema surface.
See spec §3. Every field is additive; no existing field changes shape.
`schema_version` bumps from `"1.0"` to `"1.1"` on both
`AnalysisOutputSchema` and `AggregatedOutputSchema`.

## Objectives

1. Extend `AnalysisOutputSchema` in `scripts/lib/schema.ts`:
   - `dimensions[k].headline: z.string().min(1).max(140)`
   - `dimensions[k].risk_profile` — 4 fixed keys (`budgetary`,
     `implementation`, `dependency`, `reversibility`), each
     `{ level: RiskLevel, note: z.string().min(1).max(180), source_refs: SourceRef[] }`
     where `RiskLevel = z.enum(["low","limited","moderate","high"])`.
   - `intergenerational.horizon_matrix: HorizonRow[]` — fixed length 6,
     rows keyed by `HorizonRowKey = z.enum(["pensions","public_debt","climate","health","education","housing"])`.
     Each row: `{ row, dimension_note: string(<=200), cells: Record<HorizonKey, { impact_score: int in [-3,3], note: string(<=160), source_refs: SourceRef[] }> }`
     with `HorizonKey = z.enum(["h_2027_2030","h_2031_2037","h_2038_2047"])`.
2. Extend `AggregatedOutputSchema` with aggregated counterparts (all
   ordinal): headline provenance wrapper, per-category risk aggregation
   (`modal_level` + `level_interval` ordered, `supported_by`,
   `dissenters`, `per_model`), horizon matrix cell aggregation
   (`modal_score` int ∈ [−3,3] or null, `score_interval` min≤max,
   `supported_by`, `dissenters`, `per_model`).
3. Add `positioning[axis].per_model: Array<{model, score: -5..+5, reasoning}>`
   to `AggregatedPositioningAxisSchema`.
4. Bump `schema_version` default / validator expectation from `"1.0"` to
   `"1.1"`.
5. Add Zod `.refine()` guarding: row shape fixed to all 6
   `HorizonRowKey`s exactly once; all 3 `HorizonKey`s present in every
   row; all 4 risk categories present on every dimension.
6. Update `docs/specs/analysis/output-schema.md`, `aggregation.md`, and
   `intergenerational-audit.md` to v1.1 (prose companion; add new fields
   to JSON samples; add "Horizon bands and cohort framing" subsection to
   intergen audit).

## Acceptance Criteria

- [ ] `AnalysisOutputSchema` parses a v1.1 sample with all new fields.
- [ ] `AggregatedOutputSchema` parses a v1.1 sample with all new fields.
- [ ] Negative test: missing one of the 6 `horizon_matrix` rows → parse
      fails.
- [ ] Negative test: missing one of the 4 risk categories → parse fails.
- [ ] Negative test: `impact_score` outside `[-3, 3]` → parse fails.
- [ ] Negative test: `level_interval` with `low > high` (unordered) →
      parse fails.
- [ ] Negative test: `positioning[axis].per_model` entry missing
      `reasoning` → parse fails.
- [ ] `dimensions[k].summary` still mandatory and unchanged.
- [ ] `impact_on_25yo_in_2027` / `impact_on_65yo_in_2027` unchanged.
- [ ] `schema_version` strict equality on `"1.1"`.
- [ ] Spec docs updated with new field documentation and `Version: 1.1`
      header.
- [ ] All tests pass: `pnpm test`
- [ ] No lint errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`

## Hints for Agent

- Reuse the positioning ordinal pattern (modal + interval + per-model) —
  it is already the enforced pattern in `AggregatedPositioningAxisSchema`.
- `RiskLevel` needs a canonical order for the interval; implement as
  `const RISK_LEVEL_ORDER = ["low","limited","moderate","high"] as const`
  and refine `level_interval` via index comparison.
- Consider extracting a reusable `withProvenance<T>(schema)` helper for
  the aggregated wrapper (supported_by + dissenters + per_model) — it is
  used in 3 new places plus the existing aggregated claim shapes.
- `fixtures/` files will be updated by task 0083; don't touch them here
  unless a *schema-fixture* pair needs to go in together. If the test
  suite relies on fixtures pre-existing at v1.0, keep a v1.0 copy under
  `scripts/lib/fixtures/legacy/` during transition — delete in 0083.

## Editorial check

- [ ] No cardinal averaging introduced: all new aggregated numeric
      fields are `modal_*` + interval + per-model verbatim.
- [ ] Symmetry preserved: fixed key sets (4 risk categories, 6 horizon
      rows, 3 horizons) enforced by Zod enums + `.refine`.
- [ ] No candidate-specific branches.
- [ ] `schema_version` bump documented; existing fields untouched.

## Notes

This task is schema-only. Prompts (task 0082) and fixtures (task 0083)
follow separately so review can proceed in stages.
