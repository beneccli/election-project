---
id: "0026"
title: "End-to-end mock-provider test for analyze.ts against real schema"
type: task
status: done
priority: medium
created: 2026-04-19
milestone: M_AnalysisPrompts
spec: docs/specs/data-pipeline/overview.md
context:
  - docs/specs/analysis/output-schema.md
  - scripts/analyze.ts
  - scripts/analyze.test.ts
  - scripts/lib/mock-provider.ts
  - scripts/lib/fixtures/analysis-output/valid-full.json
  - scripts/pipeline.integration.test.ts
test_command: npm run test -- analyze
depends_on: ["0022", "0023", "0024"]
---

## Context

Today `scripts/analyze.ts` calls `AnalysisOutputSchema.parse()` against a placeholder (`z.any()`), so every mock response trivially validates. After task `0022` tightens the schema and task `0024` lands a full fixture, we need an end-to-end test that:

- Wires the real schema into `analyze.ts`
- Confirms a fixture-shaped mock response passes validation and is written to `raw-outputs/<model>.json`
- Confirms a malformed mock response triggers the retry loop, and persistent failure produces `<model>.FAILED.json`
- Confirms the retry count matches the spike decision (2 retries / 3 attempts)

## Objectives

1. Update or extend `scripts/analyze.test.ts` and/or `scripts/pipeline.integration.test.ts`:
   - Happy path: mock provider returns `valid-full.json` → written unchanged to `raw-outputs/<model>.json`.
   - Schema drift path: mock provider returns a JSON missing `source_refs` on a claim → retries 2 more times with the same error → final failure produces `<model>.FAILED.json` with `ZodError` details.
   - Non-JSON path: mock provider returns `"not json"` → retry → failure.
   - Partial success: one of two models fails → aggregation-ready directory has one valid and one `.FAILED.json`.
2. Verify via a test assertion that `analyze.ts` uses the **real** `AnalysisOutputSchema`, not a mocked `z.any()`. (e.g., import the same symbol used by `analyze.ts` and assert it is not `z.ZodAny`.)
3. Log structure: on failure, the error log in `<model>.FAILED.json` should include the Zod `issues[]` array (not just a string).

## Acceptance Criteria

- [ ] Happy-path test passes: valid mock response round-trips through `analyze.ts` and matches the fixture on disk
- [ ] Retry-on-schema-violation test: 3 total attempts, `<model>.FAILED.json` written
- [ ] Retry-on-parse-error test: 3 total attempts, `<model>.FAILED.json` written
- [ ] `FAILED.json` contains structured Zod issues (not just a `toString()`)
- [ ] Partial-success test: one success + one failure in the same run, both files present
- [ ] Tests pass: `npm run test -- analyze`
- [ ] `npm run test` (full suite) passes
- [ ] `npm run typecheck` + `npm run lint` clean

## Hints for Agent

- Reuse `scripts/lib/mock-provider.ts`. Extend it with a scripted response queue if it doesn't already support one.
- Use `vitest` `tmp` dir utilities for test workspace isolation — don't pollute `candidates/`.
- Do NOT change `MAX_RETRIES` in `analyze.ts` — it's already 2 per spike decision Q2.
- If `<model>.FAILED.json` currently contains only a string error, extending it to carry structured issues is an explicit part of this task.

## Editorial check

- [ ] Schemas — failure modes preserved as data (FAILED.json), not hidden. Verify tests assert presence of the FAILED file.
- [ ] Transparency — no test should cause analyze.ts to swallow a failure silently.
- [ ] Dissent preservation (downstream) — confirmed by the partial-success test: a single model failure does not block the run; aggregation will proceed with remaining valid outputs.
