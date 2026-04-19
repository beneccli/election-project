---
id: "0048"
title: "Quick-start docs and integration smoke test for analysis modes"
type: task
status: open
priority: medium
created: 2026-04-19
milestone: M_AnalysisModes
spec: docs/specs/data-pipeline/analysis-modes.md
context:
  - docs/specs/data-pipeline/analysis-modes.md
  - docs/specs/data-pipeline/overview.md
  - scripts/pipeline.integration.test.ts
  - scripts/README.md
  - README.md
test_command: npm run test -- pipeline.integration
depends_on: ["0043", "0044", "0045", "0046", "0047"]
---

## Context

With all the plumbing in place, the operator needs a single page that
walks through the full zero-API flow end-to-end, and an integration
test that exercises mixed-mode ingestion to prevent regressions.

## Objectives

1. Add `docs/specs/data-pipeline/overview.md` section "Execution
   modes" (short) that references the detailed spec at
   `analysis-modes.md`.
2. Add a new top-level doc
   `docs/quick-start-zero-api.md` walking through:
   - Scaffolding a fictional candidate
   - Generating fake sources via the web-chat prompt
   - Running `prepare-manual-analysis` + ingesting 1 output per mode
     (manual-webchat × 2, copilot-agent × 1 to hit ≥3 models)
   - Running `prepare-manual-aggregation` + ingesting aggregated draft
   - Running review CLI (unchanged from M_Aggregation)
   - Attempting publish (blocked) → publishing with `--allow-fictional`
3. Link the quick-start from `README.md` and `scripts/README.md`.
4. Extend `scripts/pipeline.integration.test.ts` with a new scenario:
   **mixed-mode ingestion**
   - Scaffold a fictional candidate via programmatic call to
     `scaffoldCandidate({ isFictional: true, ... })`.
   - Write `sources.md` directly (bypass consolidate for the test).
   - Call `ingestRawOutput` three times with different modes
     (`manual-webchat`, `manual-webchat`, `copilot-agent`) using
     valid fixture JSON.
   - Call `ingestAggregated` with a fixture aggregated output and
     `--mode copilot-agent`.
   - Run the review CLI in auto-approve test harness mode.
   - Call `publish` and assert it fails without `--allow-fictional`.
   - Call `publish` with `--allow-fictional` and assert success.
   - Assert `metadata.json` contains the three model entries with the
     correct `execution_mode`, `attested_by`, and
     `attested_model_version` values.

## Acceptance Criteria

- [ ] `docs/quick-start-zero-api.md` exists and walks the full flow
- [ ] README files link to it
- [ ] Integration test covers mixed-mode ingestion + publish guard
- [ ] All tests pass: `npm run test -- pipeline.integration`
- [ ] No regressions on existing tests: `npm run test`
- [ ] `npm run lint` and `npm run typecheck` clean

## Hints for Agent

- Existing `scripts/pipeline.integration.test.ts` already tests the
  five M_Aggregation scenarios — add a sixth scenario, do not
  rewrite.
- For the copilot-agent ingest in tests, use `--already-written:
  false` (i.e. let the ingest script write the file) to simplify
  fixture wiring.
- Reuse fixtures from `scripts/lib/fixtures/analysis-output/` and
  `scripts/lib/fixtures/aggregated-output/`.

## Editorial check

- [ ] Quick-start does not present manual/copilot modes as the
      recommended production path — they are explicitly labelled
      "testing / low-cost operation"
- [ ] Mixed-mode runs preserve `execution_mode` per model; the test
      asserts that
- [ ] Publish guard is exercised and verified

## Notes

This task closes M_AnalysisModes. After it merges, M_FirstCandidate
can start.
