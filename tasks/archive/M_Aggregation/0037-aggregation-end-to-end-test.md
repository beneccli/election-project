---
id: "0037"
title: "End-to-end mock-provider test: analyze → aggregate → review → publish"
type: task
status: done
priority: medium
created: 2026-04-19
milestone: M_Aggregation
spec: docs/specs/data-pipeline/overview.md
context:
  - docs/specs/analysis/aggregation.md
  - docs/specs/data-pipeline/overview.md
  - scripts/analyze.ts
  - scripts/aggregate.ts
  - scripts/publish.ts
  - scripts/pipeline.integration.test.ts
  - scripts/lib/mock-provider.ts
  - scripts/lib/fixtures/aggregated-output/valid-full.json
test_command: npm run test -- pipeline
depends_on: ["0032", "0033", "0034", "0036"]
---

## Context

The existing `scripts/pipeline.integration.test.ts` exercises the pipeline against placeholder schemas. After tasks `0032`/`0033`/`0036` land real schemas, a real aggregator prompt, and `review.ts`, we need an end-to-end test that wires it all together against the real `AggregatedOutputSchema`.

## Objectives

1. Extend `scripts/pipeline.integration.test.ts` (or add `scripts/aggregate.integration.test.ts`) to cover:
   - **Happy path:** two analyst mock providers return valid per-model outputs → `aggregate.ts` produces `aggregated.draft.json` matching `AggregatedOutputSchema` → `review.ts` approves all flagged items → `aggregated.json` written + `metadata.human_review_completed: true` → `publish.ts --dry-run` validates successfully.
   - **Coverage warning path:** one analyst succeeds, one returns `.FAILED.json` → `aggregated.draft.json` has `coverage_warning: true` and `agreement_map.coverage` records the failure; aggregation still completes.
   - **Schema-drift path:** aggregator mock provider returns a positioning block with a `"score"` field → `AggregatedOutputSchema.parse` rejects → retry loop → `aggregated.FAILED.json` written.
   - **Publish-gate path:** `aggregated.draft.json` exists but `review.ts` has not been run → `publish.ts` exits non-zero with a clear error.
   - **Skipped-items path:** `review.ts` run with a scripted `s` answer on any item → refuses to write `aggregated.json`.
2. Verify via assertion that `aggregate.ts` uses the **real** `AggregatedOutputSchema`, not `z.any()` (mirror the assertion from task `0026`).
3. Use `tmp`-directory isolation; do not touch real `candidates/`.
4. Reuse `valid-full.json` aggregated fixture from task `0034` as the expected aggregator response in the happy path. Reuse synthetic per-model fixtures from `scripts/lib/fixtures/analysis-output/` as the analyst inputs.

## Acceptance Criteria

- [ ] All five paths above have a passing test
- [ ] `aggregated.FAILED.json` on schema drift carries structured `ZodError.issues`
- [ ] Publish-gate path asserts a non-zero exit (or thrown error) and no symlink change
- [ ] `npm run test -- pipeline` passes
- [ ] Full suite `npm run test` passes
- [ ] `npm run typecheck` + `npm run lint` clean

## Hints for Agent

- Extend `scripts/lib/mock-provider.ts` with a scripted-response queue if it does not already support one (similar extension was done in task `0026`).
- For `review.ts` in tests, use the pure `reviewLoop` entry point exposed by task `0036` and feed it a scripted `Prompter` — do not spawn an editor process.
- Keep fixture coupling loose: import the JSON files, don't hardcode their contents in the test.

## Editorial check

- [ ] Tests assert that `aggregated.FAILED.json` surfaces as a public artifact (no silent swallow)
- [ ] Tests assert that the publish gate cannot be bypassed without `human_review_completed: true`
- [ ] Tests assert that a per-model failure does not cascade to aggregation failure — dissent-preservation-by-default
- [ ] No real candidate name appears in any test fixture or assertion
