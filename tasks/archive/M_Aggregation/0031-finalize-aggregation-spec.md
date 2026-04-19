---
id: "0031"
title: "Finalize aggregation.md (promote Draft → Stable)"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_Aggregation
spec: docs/specs/analysis/aggregation.md
context:
  - docs/specs/analysis/aggregation.md
  - docs/specs/analysis/editorial-principles.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/political-positioning.md
  - docs/specs/README.md
  - tasks/archive/M_Aggregation/0030-spike-aggregation.md
test_command: npm run lint
depends_on: []
---

## Context

Spike `0030` resolved the open design questions and appended a "Decisions finalized by spike `0030`" section to [`docs/specs/analysis/aggregation.md`](../../../docs/specs/analysis/aggregation.md). The file is still marked `Status: Draft`. This task promotes it to **Stable** after a line-by-line reconciliation against the spike decisions.

`docs/specs/README.md` still lists aggregation as `[Draft]` in its status table.

## Objectives

1. Read `aggregation.md` end-to-end. Reconcile any prose above the "Decisions finalized by spike `0030`" section with those decisions. Where the earlier prose and the decisions conflict, the decisions win — rewrite the prose.
2. Ensure the schema sketch in `## Aggregated output schema` matches Q4/Q5 exactly:
   - Inline `supported_by` / `dissenters` on every aggregated claim
   - No aggregated `score` field on positioning (only `consensus_interval`, `modal_score`, `dissent[]`)
   - Top-level `agreement_map` carries `coverage` and `positioning_consensus`
3. Flip status header: `Status: Draft` → `Status: Stable (finalized by M_Aggregation spike 0030, 2026-04-19)`.
4. Update `docs/specs/README.md`: change the aggregation row status from `[Draft]` to `[Stable]`.
5. Cross-link: confirm `output-schema.md` "Aggregated output schema" section still points to `aggregation.md` (it does — verify no drift).
6. No code changes in this task.

## Acceptance Criteria

- [ ] `aggregation.md` is internally consistent end-to-end with spike `0030` decisions
- [ ] Status header flipped to **Stable**
- [ ] `specs/README.md` updated
- [ ] No broken cross-links: `grep -R "aggregation.md" docs/ scripts/ prompts/` all resolve
- [ ] `npm run lint` clean (no markdown lint in project yet, but confirm link integrity)

## Editorial check

- [ ] No advocacy framing introduced into the spec prose
- [ ] No cardinal averaging language introduced anywhere
- [ ] Dissent preservation language intact
- [ ] Transparency language intact (raw outputs untouched during aggregation)

## Hints for Agent

- Pattern reference: task `0021` promoted the five analysis specs — same shape of edit.
- Do NOT change the "Decisions finalized by spike `0030`" section; it is the source of truth for this pass. Reconcile the earlier prose to match it.
