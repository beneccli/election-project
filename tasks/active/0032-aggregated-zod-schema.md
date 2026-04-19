---
id: "0032"
title: "Implement AggregatedOutputSchema (replace z.any() placeholder)"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_Aggregation
spec: docs/specs/analysis/aggregation.md
context:
  - docs/specs/analysis/aggregation.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/political-positioning.md
  - docs/specs/analysis/editorial-principles.md
  - scripts/lib/schema.ts
  - scripts/lib/schema.test.ts
test_command: npm run test -- schema
depends_on: ["0031"]
---

## Context

Today `scripts/lib/schema.ts` exports:

```ts
export const AggregatedOutputSchema: z.ZodType<any> = z.any();
```

`scripts/aggregate.ts` already calls `AggregatedOutputSchema.parse(parsed)` so tightening this schema tightens the aggregation pipeline automatically. This task implements the real schema per [`docs/specs/analysis/aggregation.md`](../../../docs/specs/analysis/aggregation.md) — specifically the "Decisions finalized by spike `0030`" section.

## Objectives

1. Replace `AggregatedOutputSchema` placeholder with a full Zod schema covering:
   - `schema_version: "1.0"`
   - `candidate_id`, `version_date`
   - `source_models: { provider, version }[]` (≥1)
   - `aggregation_method: { type: "meta_llm", model, prompt_sha256, prompt_version, run_at }`
   - `summary: string` + `summary_agreement: number [0,1]`
   - `positioning` — per axis: `consensus_interval: [int, int]` tuple, `modal_score: int | null` in `[-5, +5]`, `anchor_narrative`, `evidence[]`, `confidence [0,1]`, `dissent: { model, position: int, reasoning }[]`. **No `score` field.**
   - `dimensions` — per cluster: `grade: { consensus: GradeEnum, dissent: Record<string, GradeEnum> }`, `summary`, each claim array (`problems_addressed`, `problems_ignored`, etc.) with inline `supported_by: string[]` / `dissenters: string[]`, `confidence`
   - `intergenerational` — standard fields + `agreement: { direction_consensus: boolean, magnitude_consensus: "interval" | "point" | "contested", dissenting_views[] }`
   - `counterfactual`, `unsolved_problems[]`, `downside_scenarios[]` — same shape as per-model with inline `supported_by` / `dissenters`
   - `agreement_map`:
     - `high_confidence_claims: { claim_id, models }[]`
     - `contested_claims: { claim_id, positions }[]`
     - `coverage: Record<string, "complete" | "partial" | "failed">`
     - `positioning_consensus: Record<axis, { interval: [int, int], modal: int | null, dissent_count: number }>`
   - `flagged_for_review: { claim, claimed_by[], issue, suggested_action, resolution? }[]`
   - `coverage_warning: boolean` (true when < 3 successful models per Q3)
2. Export the inferred type: `export type AggregatedOutput = z.infer<typeof AggregatedOutputSchema>;`
3. Reuse shared sub-schemas already in `schema.ts` (`EvidenceRef`, `ConfidenceSchema`, `sha256Pattern`, `isoDatetime`, `isoDateString`, `candidateIdPattern`, `GradeEnum`). Do NOT duplicate.
4. Extend `scripts/lib/schema.test.ts` with ≥7 valid + ≥7 invalid test cases:
   - Valid full aggregated output parses
   - Valid single-model aggregated output with `coverage_warning: true` parses
   - Rejects positioning with a `score` field (the forbidden-cardinal guardrail)
   - Rejects `modal_score: 2.5` (integer-only)
   - Rejects `consensus_interval: [3, 1]` (reversed) — add a `.refine` if needed
   - Rejects `consensus_interval` values outside `[-5, +5]`
   - Rejects a claim with empty `supported_by[]`
   - Rejects a flagged item missing `issue`
   - Rejects unknown top-level fields (`.strict()`)
   - `source_refs` required on every aggregated claim, same rule as per-model

## Acceptance Criteria

- [ ] `AggregatedOutputSchema` no longer uses `z.any()`
- [ ] Every field from aggregation.md "Decisions finalized" section is represented
- [ ] Positioning has no `score` field (the cardinal-averaging guardrail)
- [ ] `consensus_interval` is a two-tuple of integers in `[-5, +5]` with `min ≤ max`
- [ ] All confidences constrained to `[0, 1]`
- [ ] `AggregatedOutput` type exported
- [ ] Test suite covers ≥7 valid + ≥7 invalid cases
- [ ] `npm run test -- schema` passes
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean

## Hints for Agent

- Pattern reference: task `0022` implemented `AnalysisOutputSchema` the same way. Reuse that file's idioms.
- Use `z.tuple([z.number().int(), z.number().int()])` for `consensus_interval`, plus `.refine((t) => t[0] <= t[1])`.
- Axis keys are `economic | social_cultural | sovereignty | institutional | ecological` — import from `political-positioning.md` anchor set (or replicate if no exported constant exists yet).
- `GradeEnum` already includes `NOT_ADDRESSED`.

## Editorial check

- [ ] **No `score` field on aggregated positioning.** This is the red-flag gate. Test `0032` must cover it.
- [ ] Every aggregated claim carries provenance (`supported_by`) — no claim can appear with empty provenance
- [ ] `source_refs` required on claims exactly as per-model schema
