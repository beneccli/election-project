---
id: "0041"
title: "Finalize analysis-modes spec (Draft → Stable)"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_AnalysisModes
spec: docs/specs/data-pipeline/analysis-modes.md
context:
  - docs/specs/data-pipeline/analysis-modes.md
  - docs/specs/README.md
  - docs/specs/analysis/editorial-principles.md
test_command: npm run lint
depends_on: []
---

## Context

Spike `0040` produced `docs/specs/data-pipeline/analysis-modes.md` in
**Draft**. Resolve the open questions (especially Q1 on provider naming
for manual mode) and promote to **Stable** so implementation tasks
(`0042`–`0048`) build against a frozen contract.

## Objectives

1. Walk through each open question in the spec's "Open questions"
   section. For each, record the final decision (or accept "deferred"
   with rationale).
2. Decide the `provider` field convention for manual mode (proposal:
   preserve original provider name where unambiguous; `"manual"` as
   explicit fallback).
3. Update the spec header: `Version: 1.0`, `Status: Stable`.
4. Add the spec to `docs/specs/README.md` index under `data-pipeline/`
   with `[Stable]` marker.

## Acceptance Criteria

- [ ] All open questions resolved or marked deferred with reasons
- [ ] Spec status promoted to Stable
- [ ] `docs/specs/README.md` index entry added, linked correctly
- [ ] Editorial principles section in the spec unchanged from spike
      draft (verifies we didn't weaken the invariants)
- [ ] `npm run lint` passes

## Hints for Agent

- The spec's "Open questions" block is the only section that should
  shrink substantially. Everything else is content for downstream
  tasks.
- If a decision lands on "deferred", write one sentence explaining
  when it should be revisited (typically "after M_FirstCandidate").

## Editorial check

- [ ] Non-negotiable invariant (same prompt bytes across all modes)
      still stated in the overview section
- [ ] `execution_mode` field preserved as the transparency signal
- [ ] No candidate-specific branching introduced

## Notes

This task is intentionally small so downstream implementation tasks can
start in parallel.
