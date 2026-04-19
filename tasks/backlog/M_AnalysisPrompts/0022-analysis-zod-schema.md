---
id: "0022"
title: "Implement AnalysisOutputSchema (replace z.any() placeholder)"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_AnalysisPrompts
spec: docs/specs/analysis/output-schema.md
context:
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/dimensions.md
  - docs/specs/analysis/political-positioning.md
  - docs/specs/analysis/intergenerational-audit.md
  - docs/specs/analysis/editorial-principles.md
  - scripts/lib/schema.ts
  - scripts/lib/schema.test.ts
test_command: npm run test -- schema
depends_on: ["0021"]
---

## Context

Today `scripts/lib/schema.ts` exports:

```ts
export const AnalysisOutputSchema: z.ZodType<any> = z.any();
```

This task implements the real schema, matching [`docs/specs/analysis/output-schema.md`](../../../docs/specs/analysis/output-schema.md) exactly.

`scripts/analyze.ts` already imports `AnalysisOutputSchema` and runs `.parse()` on each model response, with retry. Tightening the schema here tightens the pipeline automatically.

## Objectives

1. In `scripts/lib/schema.ts`, replace the `AnalysisOutputSchema` placeholder with a full Zod schema covering:
   - `schema_version`, `candidate_id`, `version_date`
   - `model` (provider + version)
   - `run_metadata` (run_at, prompt_sha256, temperature)
   - `summary` (string, length bounds)
   - `positioning` — the 5 axes, each with integer score `[-5, +5]`, `anchor_comparison`, `evidence[]`, `confidence [0,1]`, `reasoning`
   - `dimensions` — the 6 clusters (see `dimensions.md`), each with `grade` enum, `problems_addressed[]`, `problems_ignored[]`, `problems_worsened[]`, `execution_risks[]`, `key_measures[]`, `confidence`
   - `intergenerational` — structured per `intergenerational-audit.md` with `impact_on_25yo_in_2027` and `impact_on_65yo_in_2027`
   - `counterfactual`
   - `unsolved_problems[]`
   - `downside_scenarios[]` (probability and severity in `[0,1]`)
   - `adversarial_pass` (inline, per spike decision Q1)
   - `confidence_self_assessment` in `[0,1]`
2. Export the inferred TS type: `export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;`
3. Shared sub-schemas (EvidenceRef, Confidence, SourceRefs) should be factored out for reuse — but only if used ≥2 times. No speculative abstraction.
4. Extend `scripts/lib/schema.test.ts` with unit tests covering:
   - A valid full fixture (see task `0024`) parses
   - Missing `source_refs` on a claim is rejected
   - Positioning score of `6` or `-6` is rejected
   - Positioning score of `2.5` is rejected (integer-only)
   - `grade` outside the enum is rejected
   - `confidence` outside `[0, 1]` is rejected
   - Unknown top-level fields do not silently succeed (`z.strict()` where appropriate)

## Acceptance Criteria

- [ ] `AnalysisOutputSchema` no longer uses `z.any()`
- [ ] Every field from `output-schema.md` is represented
- [ ] Positioning scores constrained to `z.number().int().min(-5).max(5)`
- [ ] All confidences constrained to `z.number().min(0).max(1)`
- [ ] Test suite covers ≥7 valid + ≥7 invalid fixtures
- [ ] `AnalysisOutput` type exported
- [ ] Tests pass: `npm run test -- schema`
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean

## Hints for Agent

- Match existing patterns in `schema.ts` (e.g., `sha256Pattern`, `isoDatetime`, `isoDateString`).
- Use `z.enum([...])` for `grade` and `net_transfer_direction`.
- For arrays that must be non-empty (e.g., positioning `evidence`), use `.min(1)`.
- Do NOT change `AggregatedOutputSchema` — that is M_Aggregation territory, keep the placeholder.
- Do not auto-coerce. Prefer strict parse so silent drift is impossible.

## Editorial check

- [ ] Schemas — every claim carries `source_refs`? Verify by type-searching the schema: any "claim-shaped" object (problem, risk, measure, dissent item) must require `source_refs: z.array(...).min(1)` or have explicit rationale if empty allowed.
- [ ] No cardinal averaging enabled — positioning `score` is `int`, not `number`.
- [ ] No advocacy-biased enums (e.g., `net_transfer_direction` uses neutral labels `young_to_old`/`old_to_young`/`neutral`/`mixed`, not `fair`/`unfair`).
