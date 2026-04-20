---
id: "0083"
title: "Migrate test-omega to schema v1.1 (raw-outputs, aggregated, fixtures)"
type: task
status: open
priority: high
created: 2026-04-20
milestone: M_CandidatePagePolish
spec: docs/specs/website/candidate-page-polish.md
context:
  - candidates/test-omega/current/aggregated.json
  - candidates/test-omega/current/raw-outputs/
  - scripts/prepare-manual-analysis.ts
  - scripts/prepare-manual-aggregation.ts
  - scripts/ingest-raw-output.ts
  - scripts/ingest-aggregated.ts
  - scripts/lib/fixtures/
  - .github/prompts/analyze-candidate-via-copilot.prompt.md
  - .github/prompts/aggregate-analyses-via-copilot.prompt.md
test_command: pnpm test && pnpm --filter site test
depends_on: ["0081", "0082"]
---

## Context

`test-omega` is the only candidate and is the reference input for every
site integration test. After schema v1.1 lands, both the aggregated JSON
and the raw per-model outputs must satisfy the new shape, along with
every test fixture under `scripts/lib/fixtures/`.

## Objectives

1. Regenerate `candidates/test-omega/current/raw-outputs/*.json` with
   v1.1 shape:
   - Option A (preferred): use `scripts/prepare-manual-analysis.ts` to
     build a Copilot-agent bundle, then run the Copilot analyst prompt
     with the v1.1 `prompts/analyze-candidate.md`; ingest back via
     `scripts/ingest-raw-output.ts`.
   - Option B (fallback if LLM regeneration isn't feasible): extend the
     existing files in place, hand-adding the new fields with
     realistic synthetic content consistent with the existing
     `sources.md`. Mark `human_edit: true` where applicable.
2. Regenerate `candidates/test-omega/current/aggregated.json` and
   `aggregated.draft.json` via `prepare-manual-aggregation.ts` + the
   Copilot aggregator prompt; ingest via
   `scripts/ingest-aggregated.ts`. Update `metadata.json` fields
   `analysis.prompt_sha256` and `aggregation.prompt_sha256` to the new
   hashes, and re-complete human review.
3. Update all fixtures under `scripts/lib/fixtures/`:
   - `analysis-output/valid-full.json`, `valid-minimal.json`, plus any
     malformed/adversarial fixtures — add the 4 new fields.
   - `aggregated-output/valid-full.json`, `valid-single-model.json`,
     `valid-with-dissent.json`, plus failure fixtures — add the 4
     aggregated counterparts.
4. Delete any `scripts/lib/fixtures/legacy/` folder introduced during
   the 0081 transition.
5. Re-run all test suites (unit + integration + site).

## Acceptance Criteria

- [ ] `candidates/test-omega/current/aggregated.json` parses cleanly via
      `AggregatedOutputSchema.parse()` with `schema_version: "1.1"`.
- [ ] All three per-model outputs under `raw-outputs/` parse via
      `AnalysisOutputSchema.parse()` with `schema_version: "1.1"`.
- [ ] Every fixture in `scripts/lib/fixtures/analysis-output/` and
      `/aggregated-output/` parses with v1.1 (happy + malformed; the
      malformed ones still fail for their original reasons, not for
      missing v1.1 fields).
- [ ] `scripts/lib/fixtures.test.ts` and `fixtures.aggregated.test.ts`
      pass.
- [ ] `scripts/pipeline.integration.test.ts` passes (end-to-end mock
      pipeline still green).
- [ ] `site/app/candidat/[id]/page.test.tsx` (or equivalent) still
      renders without error from `test-omega`.
- [ ] `metadata.json` at `candidates/test-omega/versions/<date>/`
      reflects refreshed prompt hashes; `human_review_completed: true`.
- [ ] All tests pass: `pnpm test && pnpm --filter site test`
- [ ] No lint errors: `pnpm lint`
- [ ] No type errors: `pnpm typecheck`

## Hints for Agent

- The fictional candidate's existing `sources.md` is unchanged — new
  fields must cite existing anchors. No new sources-raw material.
- For the horizon matrix, use `sources.md#31-retraites-et-transferts-fictif`
  / housing / climate / etc. anchors already present. Where a row has
  no direct source anchor, set `source_refs: []` only on fields that
  allow it (many don't — see schema); otherwise cite the reasoning
  section of `sources.md`.
- Integer scores in horizon-matrix cells should reflect the
  fictional-candidate program's ordinal tilt. Don't make them all `+3`
  or all `−3`.
- For Option B (hand-editing): use deterministic per-model variation
  (e.g. 2 models score `−2`, 1 model scores `−3`) so the aggregated
  `modal_score` and `dissenters` lists are non-trivial — this exercises
  the UI properly.

## Editorial check

- [ ] Horizon-matrix `note` strings describe mechanism, not moral
      weight. No advocacy words.
- [ ] Risk-profile `note` strings explain the risk source, not blame.
- [ ] Dissent is preserved (at least one dissenter on at least one
      cell, so the UI paths are exercised).
- [ ] `metadata.json` records new prompt hashes; provenance preserved.

## Notes

If the Copilot-agent regeneration path (Option A) proves unreliable,
document the fallback used in `candidates/test-omega/versions/<date>/aggregation-notes.md`.
This is the last gate before UI tasks can land.
