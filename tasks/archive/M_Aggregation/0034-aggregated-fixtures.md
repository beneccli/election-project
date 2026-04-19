---
id: "0034"
title: "Aggregated output fixtures and round-trip validation tests"
type: task
status: done
priority: medium
created: 2026-04-19
milestone: M_Aggregation
spec: docs/specs/analysis/aggregation.md
context:
  - docs/specs/analysis/aggregation.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/political-positioning.md
  - scripts/lib/schema.ts
  - scripts/lib/schema.test.ts
  - scripts/lib/fixtures/analysis-output/
test_command: npm run test -- fixture
depends_on: ["0032"]
---

## Context

Task `0032` implements `AggregatedOutputSchema`. This task ships concrete fixture JSON files that serve both as regression tests and as living documentation of the schema. Pattern reference: task `0024` did this for per-model outputs.

## Objectives

1. Create `scripts/lib/fixtures/aggregated-output/`:
   - `valid-full.json` — three per-model synthetic inputs aggregated into one full output. Populate:
     - Every dimension cluster
     - `positioning` on all 5 axes with at least one axis having dissent (one model outside the plurality)
     - `agreement_map.high_confidence_claims[]` and `contested_claims[]` both non-empty
     - `coverage: { "<model-a>": "complete", "<model-b>": "complete", "<model-c>": "partial" }`
     - `flagged_for_review[]` with at least one item showing a claim unsupported by sources.md
     - `coverage_warning: false`
   - `valid-single-model.json` — only one per-model output contributed:
     - `coverage: { "<model-a>": "complete", "<model-b>": "failed", "<model-c>": "failed" }`
     - `agreement_map.high_confidence_claims: []` (N-1 rule collapses when N=1)
     - `coverage_warning: true`
     - Every claim's `supported_by` contains only the one model
   - `invalid-cardinal-positioning.json` — regression fixture for the forbidden-cardinal guardrail:
     - Economic axis contains a `"score": -2.5` field
     - Must be rejected by `AggregatedOutputSchema.parse`
   - Optional additions if convenient:
     - `invalid-empty-supported-by.json` — a claim with `supported_by: []`
     - `invalid-reversed-interval.json` — `consensus_interval: [3, 1]`
2. Header comment in every fixture:
   - Synthetic candidate only: `candidate_id: "test-candidate"` (match convention from per-model fixtures)
   - `source_refs` point to `sources.md#fictional-section` — never real sources
3. Create `scripts/lib/fixtures.aggregated.test.ts` (or extend `scripts/lib/fixtures.test.ts`):
   - Every `valid-*.json` parses via `AggregatedOutputSchema.parse`
   - Every `invalid-*.json` throws `ZodError` whose `.issues[]` points at the expected field
4. The `valid-full.json` fixture will be consumed by task `0037` (end-to-end mock test).

## Acceptance Criteria

- [ ] `valid-full.json`, `valid-single-model.json`, `invalid-cardinal-positioning.json` all present
- [ ] Every valid fixture round-trips through the schema
- [ ] Every invalid fixture is rejected with a `ZodError` pointing at the expected issue
- [ ] No real candidate name appears in any fixture
- [ ] `npm run test -- fixture` passes
- [ ] `npm run typecheck` + `npm run lint` clean

## Hints for Agent

- Reuse the synthetic candidate from `scripts/lib/fixtures/analysis-output/valid-full.json`: same `test-candidate` id, same fictional party, same `sources.md#fictional-section` refs.
- Model version strings in fixtures: pick three from `scripts/config/models.ts` `DEFAULT_MODELS` (e.g., `claude-opus-4-0-20250514`, `gpt-4.1-2025-04-14`, `gemini-2.5-pro`).
- Keep `invalid-cardinal-positioning.json` minimal — only the rejecting field needs to be wrong; surrounding structure can be valid.

## Editorial check

- [ ] No real candidate in any fixture
- [ ] `valid-full.json` prose (summary, anchor_narrative, reasoning) uses measurement framing, not moral verbs — this fixture teaches every future contributor the editorial bar
- [ ] `invalid-cardinal-positioning.json` stands as permanent documentation of the "no aggregated score field" rule
