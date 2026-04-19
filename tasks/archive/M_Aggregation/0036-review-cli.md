---
id: "0036"
title: "Implement scripts/review.ts (human review CLI for flagged_for_review)"
type: task
status: done
priority: high
created: 2026-04-19
milestone: M_Aggregation
spec: docs/specs/analysis/aggregation.md
context:
  - docs/specs/analysis/aggregation.md
  - docs/specs/data-pipeline/overview.md
  - docs/specs/analysis/editorial-principles.md
  - scripts/aggregate.ts
  - scripts/publish.ts
  - scripts/lib/schema.ts
  - scripts/lib/paths.ts
  - package.json
test_command: npm run test -- review
depends_on: ["0032"]
---

## Context

Stage 4 produces `aggregated.draft.json` with a `flagged_for_review[]` list. The second human review gate (the pipeline's last gate before publication) is `scripts/review.ts` — referenced by [`docs/specs/data-pipeline/overview.md`](../../../docs/specs/data-pipeline/overview.md) but not yet implemented (removed from `package.json` scripts during M_DataPipeline pending this milestone).

`scripts/publish.ts` already hard-fails when `metadata.aggregation.human_review_completed !== true`. This task makes that flag meaningful by providing the CLI that sets it.

## Objectives

1. Create `scripts/review.ts` matching the CLI contract from `aggregation.md` Q8:

   ```
   review.ts --candidate <id> --version <date> [--reviewer <id>]
   ```

   Behavior:
   - Load `aggregated.draft.json` from `candidates/<id>/versions/<date>/`. Error if missing.
   - Parse via `AggregatedOutputSchema` (strict).
   - Iterate `flagged_for_review[]`. For each item with no existing `resolution` field:
     - Display: `claim`, `issue`, `claimed_by[]`, `suggested_action`, and the nearest matching excerpt(s) from `sources.md` (simple keyword match, ±N characters of context).
     - Prompt: `[a]pprove / [r]eject / [e]dit / [s]kip / [q]uit` (single-key input; use `readline` — no TUI dependency).
     - On `a`: mark `resolution: "approved"`, merge claim into the appropriate aggregated section (preserving its `supported_by` list).
     - On `r`: mark `resolution: "rejected"`, do not merge.
     - On `e`: open `$EDITOR` on a temp file with the claim prose; on save, store the edited prose and mark `resolution: "edited"` with `human_edit: true`.
     - On `s`: mark `resolution: "skipped"`.
     - On `q`: write progress back to `aggregated.draft.json` and exit without producing `aggregated.json`.
   - Record each decision with `reviewed_at` (ISO-8601) and `reviewer_id` (from `--reviewer` or `git config user.email`).
2. On clean completion (no `skipped` items remaining):
   - Write `aggregated.json` (final). Approved items merged; rejected removed; edited rewritten with `human_edit: true`.
   - Append a "## Flagged item resolutions" section to `aggregation-notes.md` listing each item + decision + reviewer + timestamp.
   - Update `metadata.json`: `aggregation.human_review_completed: true`, `aggregation.review_at: <ISO>`, `aggregation.reviewer_id: <id>`. Validate via `VersionMetadataSchema` before writing.
3. Refuse to write `aggregated.json` while any flagged item is still `resolution: "skipped"`. Print a summary and exit non-zero.
4. Idempotency: re-running after a `q` exit picks up at the first unresolved item. Existing `resolution` values are preserved.
5. Update `package.json` `scripts`: add `"review": "tsx scripts/review.ts"`.
6. Update `scripts/README.md` with a short entry documenting the CLI.
7. Add `scripts/review.test.ts` with unit tests:
   - All-approved run produces `aggregated.json` and flips metadata flag
   - Any-skipped run refuses to write final and exits non-zero
   - Quit-midway preserves partial progress in `aggregated.draft.json`
   - Re-run after quit resumes from first unresolved item
   - Reject removes the claim from the final output
   - Edit produces a claim with `human_edit: true`
8. Extend `VersionMetadataSchema` in `scripts/lib/schema.ts` if needed to type `aggregation.review_at` and `aggregation.reviewer_id` (strict types, optional fields; they become required only when `human_review_completed: true`).

## Acceptance Criteria

- [ ] `scripts/review.ts` implements the CLI as specified
- [ ] `npm run review -- --candidate <id> --version <date>` works end-to-end against a draft containing flagged items
- [ ] Publish gate in `scripts/publish.ts` still hard-fails when `human_review_completed !== true` (regression test)
- [ ] Idempotent re-run after `q`: verified by unit test
- [ ] Refuses final write with any item `skipped`: verified by unit test
- [ ] `VersionMetadataSchema` accommodates `review_at` + `reviewer_id` fields
- [ ] `package.json` exposes the `review` script
- [ ] `npm run test -- review` passes
- [ ] `npm run typecheck` + `npm run lint` clean

## Hints for Agent

- No TUI library; `readline` from `node:readline/promises` is sufficient and keeps dependencies minimal.
- For `$EDITOR` handling, spawn the editor with `node:child_process.spawn(process.env.EDITOR ?? "vi", [tmpPath], { stdio: "inherit" })` and read the file back after process exit.
- Unit tests should stub stdin/stdout — do not launch a real editor. Pattern: expose the core review loop as a pure function `async function reviewLoop(input: FlaggedItem[], prompter: Prompter): Promise<Resolution[]>` and test that.
- Re-use `candidateDir` / `versionDir` from `scripts/lib/paths.ts`.
- Be careful writing `aggregated.json`: validate against `AggregatedOutputSchema` before writing (use `validateAndWrite`).

## Editorial check

- [ ] Review CLI cannot accidentally bypass the gate (no `--force` flag that approves all)
- [ ] Edited claims are marked `human_edit: true` so transparency is preserved downstream (the website can show which claims were human-edited)
- [ ] Reviewer identity is recorded (accountability)
- [ ] Skipped items block publication — the CLI does not quietly ship partial reviews
- [ ] `raw-outputs/*.json` remain untouched throughout review
