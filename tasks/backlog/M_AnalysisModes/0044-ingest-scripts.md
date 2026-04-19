---
id: "0044"
title: "Drop-in ingest scripts: ingest-raw-output and ingest-aggregated"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_AnalysisModes
spec: docs/specs/data-pipeline/analysis-modes.md
context:
  - docs/specs/data-pipeline/analysis-modes.md
  - scripts/analyze.ts
  - scripts/aggregate.ts
  - scripts/lib/schema.ts
  - scripts/lib/validate.ts
  - scripts/lib/hash.ts
test_command: npm run test -- ingest
depends_on: ["0042"]
---

## Context

Once an operator produces a JSON output (via manual web chat or via
Copilot), they need a single entry point that validates it and wires it
into the repo, including metadata. This replicates the bookkeeping
`scripts/analyze.ts` and `scripts/aggregate.ts` do internally for API
mode.

## Objectives

1. Create `scripts/ingest-raw-output.ts`:
   - CLI:
     ```
     --candidate <id> --version <date> --model <slug>
     --mode <manual-webchat|copilot-agent>
     --attested-version "<string>" --attested-by "<string>"
     --file <path> [--provider <name>] [--force] [--already-written]
     ```
   - Reads JSON from `--file`.
   - **Convenience:** if the content starts with a fenced block
     (` ```json ... ``` `), strip one layer of fences.
   - Validates against `AnalysisOutputSchema`. On failure: print Zod
     issues and exit 1 without writing anything.
   - Computes SHA256 of `prompts/analyze-candidate.md`.
   - Writes output to
     `candidates/<id>/versions/<date>/raw-outputs/<model>.json` unless
     `--already-written` was passed (used by Copilot mode, which has
     already written the file).
   - Reads existing `metadata.json`, appends or updates the
     `analysis.models[<model>]` entry with:
     - `provider`: value of `--provider` if given, else `"manual"` for
       manual-webchat mode, `"copilot"` for copilot-agent mode.
     - `exact_version`: value of `--attested-version`.
     - `execution_mode`: value of `--mode`.
     - `attested_by`: value of `--attested-by`.
     - `attested_model_version`: value of `--attested-version`.
     - `provider_metadata_available`: `false`.
     - `temperature`: `0` (documented default for manual/copilot modes;
       operators using non-zero temperature should note it in
       `attested_model_version`).
     - `run_at`: current ISO timestamp.
     - `status`: `"success"`.
   - Also updates `analysis.prompt_sha256`, `analysis.prompt_version`,
     `analysis.prompt_file` if unset (first ingest for this version).
     If already set and the SHA differs, **halt with an error** —
     mixing prompts across ingests within one version is forbidden.
   - Refuses to overwrite an existing `raw-outputs/<model>.json` without
     `--force`.
2. Create `scripts/ingest-aggregated.ts`:
   - Same pattern for `aggregated.draft.json` + metadata
     `aggregation.aggregator_model` block.
   - Validates against `AggregatedOutputSchema`.
   - Writes `aggregated.draft.json` (never `aggregated.json` — the
     human review CLI from task `0036` remains the only path to
     `aggregated.json`).
3. Add an npm script `validate-raw` that takes a file path and reports
   whether it validates (used by the Copilot agent for self-check).
4. Tests cover: happy path each mode, invalid JSON rejected, fence
   stripping, prompt-hash mismatch across ingests rejected, overwrite
   protection, `--already-written` skipping the file-copy step.

## Acceptance Criteria

- [ ] Both ingest scripts exist and are exposed via `npm run`
- [ ] `npm run validate-raw -- <file>` exits 0 on valid, non-zero on
      invalid
- [ ] All tests pass: `npm run test -- ingest`
- [ ] Prompt-hash mismatch protection works (cannot ingest two
      different prompt versions in one version folder)
- [ ] Metadata rows reflect spec-defined `execution_mode` and
      attestation fields
- [ ] `npm run lint` and `npm run typecheck` clean

## Hints for Agent

- Reuse `AnalysisOutputSchema` and `AggregatedOutputSchema` from
  `scripts/lib/schema.ts`.
- For fence stripping, use a simple regex; do not try to be clever.
- The `--already-written` flag is required for Copilot mode: Copilot
  has agent-level write access and prefers to `write_file` directly
  before calling a tool.

## Editorial check

- [ ] Ingest always validates — there is no "accept malformed JSON"
      path
- [ ] `execution_mode` is always recorded, never defaulted silently
- [ ] Aggregated outputs still go through the human-review CLI before
      becoming `aggregated.json` (publish gate from M_Aggregation
      unchanged)

## Notes

The publish guard from M_Aggregation (`human_review_completed`) still
applies, so ingesting an aggregated draft does not bypass the review
gate.
