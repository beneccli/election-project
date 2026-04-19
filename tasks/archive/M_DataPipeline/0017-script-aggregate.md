---
id: "0017"
title: "Script skeleton: aggregate.ts (raw-outputs → aggregated.draft.json)"
type: task
status: open
priority: medium
created: 2026-04-19
milestone: M_DataPipeline
spec: docs/specs/data-pipeline/overview.md
context:
  - docs/specs/data-pipeline/overview.md
  - docs/specs/analysis/aggregation.md
  - docs/specs/candidates/repository-structure.md
test_command: npm run test -- aggregate
depends_on: ["0011", "0012", "0013", "0014"]
---

## Context

Stage 4 of the pipeline: take all `raw-outputs/*.json` files for a version and produce an `aggregated.draft.json` + `aggregation-notes.md` via an aggregator LLM call. The aggregation prompt and schema are deferred to M_Aggregation — use placeholders for now.

## Objectives

1. **`scripts/aggregate.ts`** — CLI entry point
   - CLI: `npm run aggregate -- --candidate <id> --version <date> [--force] [--verbose]`
   - Reads all `raw-outputs/*.json` (excluding `.FAILED.json`) from the version folder
   - Validates at least 1 successful model output exists (warns if <3)
   - Reads `sources.md` (for contradiction checking by the aggregator)
   - Reads aggregation prompt from `prompts/aggregate-analyses.md` (or placeholder)
   - Calls aggregator LLM with all raw outputs + sources.md + prompt
   - Validates output against `AggregatedOutputSchema` (placeholder for now)
   - Writes `aggregated.draft.json` and `aggregation-notes.md`
   - Records aggregation metadata in version `metadata.json`
   - Logs: "Draft produced. Human review of flagged items required."

2. **Placeholder prompt** — `prompts/aggregate-analyses.md`
   - Minimal placeholder with correct frontmatter
   - Good enough for integration testing

3. **Tests** — `aggregate.test.ts`
   - Mock provider returns valid aggregated JSON
   - Script reads all non-failed raw outputs
   - Script refuses to run with 0 successful outputs
   - Script warns with <3 successful outputs
   - Writes `aggregated.draft.json` (not `aggregated.json`)
   - Records metadata correctly

## Acceptance Criteria

- [ ] CLI parses arguments correctly
- [ ] Reads all successful raw outputs
- [ ] Refuses to run with zero valid outputs
- [ ] Warns when fewer than 3 models succeeded
- [ ] Calls aggregator LLM with all inputs
- [ ] Writes `aggregated.draft.json`
- [ ] Writes `aggregation-notes.md`
- [ ] Records metadata
- [ ] All tests pass: `npm run test -- aggregate`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- The aggregator receives a LOT of content (all raw outputs + sources.md). Be mindful of context window limits in the provider call.
- For v1, `aggregation-notes.md` can be a basic template populated with model coverage info
- The real aggregation prompt and schema come from M_Aggregation

## Editorial check (if applicable)

- [ ] Aggregation — does this preserve dissent? → Placeholder only; real logic is M_Aggregation scope
- [ ] Prompts in `prompts/` — does this change analysis behavior? → Placeholder only
