---
id: "0021"
title: "Finalize the 5 analysis specs (Draft → Stable)"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_AnalysisPrompts
spec: docs/specs/analysis/editorial-principles.md
context:
  - docs/specs/analysis/analysis-prompt.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/dimensions.md
  - docs/specs/analysis/political-positioning.md
  - docs/specs/analysis/intergenerational-audit.md
  - tasks/archive/M_AnalysisPrompts/0020-spike-analysis-prompts.md
test_command: npm run lint
depends_on: []
---

## Context

M_DataPipeline left five analysis specs as `Draft`. The M_AnalysisPrompts spike (`0020`) resolved their open questions. This task promotes them to `Stable` and applies the resolved decisions. No code changes.

## Objectives

1. In each of the 5 specs, change the status header from `Draft` to `Stable`.
2. Remove or rewrite the `Open questions` section to reflect the decisions from the spike:
   - Adversarial pass is inline in `analyze-candidate.md` (not a separate file in v1).
   - Retries on schema validation: 2.
   - Positioning scores: integers only in `[-5, +5]`.
   - Anchors per axis: 4, fixed across all candidates (list them explicitly per axis in `political-positioning.md`).
   - Intergenerational horizon: 2027–2047 central.
   - Dimension clusters: 6 (unchanged).
   - Temperature: 0.
   - Candidates without legislative records: program + rhetoric, confidence ≤ 0.6.
   - No clarification requests: single-shot call.
   - Grade semantics: coherence + evidence, not ideology.
3. Update `docs/specs/README.md` status table to reflect the new `Stable` entries.
4. Cross-link the specs: every spec's "Related Specs" list mentions the others (already mostly in place).

## Acceptance Criteria

- [ ] All 5 analysis specs show `Status: Stable`
- [ ] No `Open questions` sections remain (or they are explicitly marked "deferred to <future milestone>")
- [ ] `docs/specs/README.md` status table updated
- [ ] Anchor lists per axis are concrete figures/parties with example scores
- [ ] No lint errors: `npm run lint`

## Hints for Agent

- Do not rewrite content the spike already approved — just freeze wording.
- If you find contradictions between specs while finalizing (e.g. positioning score range differs), stop and flag — do not silently resolve.
- Keep all `source_refs`, `agreement_map`, `adversarial_pass` field shapes exactly as in current Draft; the spike endorsed them.

## Editorial check

- [x] Prompts in `prompts/` — N/A (no prompt changes here)
- [x] Schemas — N/A (covered by task 0022)
- [x] Aggregation — N/A (M_Aggregation handles)
- [x] Website copy — N/A
- [x] Asymmetry between candidates — confirm none introduced by spec edits
