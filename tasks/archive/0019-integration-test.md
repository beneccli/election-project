---
id: "0019"
title: "End-to-end pipeline integration test with mock LLMs"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_DataPipeline
spec: docs/specs/data-pipeline/overview.md
context:
  - docs/specs/data-pipeline/overview.md
  - docs/specs/candidates/repository-structure.md
  - docs/specs/analysis/editorial-principles.md
test_command: npm run test:pipeline
depends_on: ["0015", "0016", "0017", "0018"]
---

## Context

The pipeline must be testable end-to-end without live LLM calls. This task creates integration tests that exercise the full flow: scaffold → ingest fixtures → consolidate → analyze → aggregate → publish, using mock providers and fixture data.

## Objectives

1. **Test fixtures** in `scripts/test-fixtures/`:
   - `test-candidate/` — a minimal but realistic candidate folder
   - `sources-raw/` with a small text-based "manifesto" and its `.meta.json`
   - Mock LLM responses for consolidation, analysis (per-model), and aggregation
   - Both valid responses and intentionally broken responses (for error path testing)

2. **Integration test** — `scripts/pipeline.integration.test.ts`:
   - **Happy path**: full pipeline produces all expected artifacts
     - `sources.md.draft` from consolidate
     - `raw-outputs/<model>.json` from analyze (multiple mock models)
     - `aggregated.draft.json` from aggregate
     - `current` symlink from publish (after simulating human review)
   - **Error paths**:
     - One model returns malformed JSON → `.FAILED.json` written, others succeed
     - Models disagree on a key claim → dissent preserved in aggregated output (placeholder for now)
     - Consolidate refuses to run on empty `sources-raw/`
     - Analyze refuses to run without `sources.md`
     - Publish refuses without human review flag
   - **Idempotency**: re-running analyze skips existing outputs

3. **npm script**: `npm run test:pipeline` runs only integration tests

## Acceptance Criteria

- [ ] Happy path: full pipeline completes with all artifacts present
- [ ] Malformed model JSON handled gracefully
- [ ] Pipeline refuses to skip human review gates
- [ ] Re-running scripts is idempotent
- [ ] All fixture files validated against schemas
- [ ] Version `metadata.json` records all model runs
- [ ] Prompt SHA256s recorded in metadata
- [ ] `npm run test:pipeline` passes
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- Use Vitest's `beforeAll` to scaffold temp directories, `afterAll` to clean up
- Mock providers should be injected, not patched — use the abstraction from task 0014
- The integration test should run in a temp directory (not in the real `candidates/` folder)
- This test is the proof that the pipeline skeleton works end-to-end before real prompts and schemas are created

## Editorial check (if applicable)

- [ ] Does the test verify human review gates are enforced? → YES, required
- [ ] Does the test verify schema validation halts on bad data? → YES, required
