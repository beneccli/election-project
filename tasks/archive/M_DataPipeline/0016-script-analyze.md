---
id: "0016"
title: "Script skeleton: analyze.ts (sources.md → raw-outputs/)"
type: task
status: open
priority: medium
created: 2026-04-19
milestone: M_DataPipeline
spec: docs/specs/data-pipeline/overview.md
context:
  - docs/specs/data-pipeline/overview.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/candidates/repository-structure.md
test_command: npm run test -- analyze
depends_on: ["0011", "0012", "0013", "0014"]
---

## Context

Stage 3 of the pipeline: run all configured LLMs in parallel against `sources.md` + the analysis prompt, producing one `raw-outputs/<model>.json` per model. This is the core analytical step. The analysis prompt is deferred to M_AnalysisPrompts — use a placeholder prompt for now.

## Objectives

1. **`scripts/analyze.ts`** — CLI entry point
   - CLI: `npm run analyze -- --candidate <id> --version <date> [--force] [--models model1,model2] [--verbose]`
   - Validates that `sources.md` exists (not `.draft` — the human gate must have been cleared)
   - Reads analysis prompt from `prompts/analyze-candidate.md` (or placeholder)
   - For each configured model (in parallel):
     - Call model with prompt + `sources.md` content
     - Parse response as JSON
     - Validate against `AnalysisOutputSchema` (placeholder schema for now)
     - On validation failure: retry up to 2 times
     - On success: write to `raw-outputs/<exact-model-version>.json`
     - On persistent failure: write `raw-outputs/<model>.FAILED.json` with error details
   - Skip models that already have output files (unless `--force`)
   - Record per-model metadata in version `metadata.json`:
     - Exact model version, provider, temperature
     - Tokens in/out, cost estimate, duration
     - Status (success/failed)
   - Record prompt SHA256 in metadata

2. **Parallel execution** — use `Promise.allSettled()` for concurrent model calls

3. **Placeholder prompt** — `prompts/analyze-candidate.md`
   - Minimal placeholder with correct frontmatter
   - Instructs model to return a simple JSON structure (enough for integration testing)

4. **Tests** — `analyze.test.ts`
   - Mock providers return valid JSON fixtures
   - All models run in parallel (verify via mock call tracking)
   - Valid output written to `raw-outputs/`
   - Failed model produces `.FAILED.json`
   - Existing output is skipped (idempotency)
   - `--force` re-runs existing models
   - Metadata records all models and their status
   - Script refuses to run if `sources.md` does not exist

## Acceptance Criteria

- [ ] CLI parses arguments correctly
- [ ] Validates `sources.md` exists before running
- [ ] Runs all models in parallel
- [ ] Writes `raw-outputs/<exact-model-version>.json` per model
- [ ] Handles failures gracefully (`.FAILED.json`)
- [ ] Retries up to 2 times on validation failure
- [ ] Records per-model metadata
- [ ] Records prompt SHA256
- [ ] Skips existing outputs unless `--force`
- [ ] All tests pass (with mock providers): `npm run test -- analyze`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- Use `Promise.allSettled()`, not `Promise.all()` — one failure should not block others
- JSON parsing should be wrapped in try/catch with clear error context
- The placeholder `AnalysisOutputSchema` from task 0012 (`z.any()`) is sufficient for now
- The `--models` flag allows running a subset (for debugging or cost control)

## Editorial check (if applicable)

- [ ] Prompts in `prompts/` — does this change analysis behavior? → Placeholder only
- [ ] Any asymmetry introduced between candidates? → No, same prompt and models for all
