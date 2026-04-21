---
id: "0092"
title: "deriveComparisonProjection: build-time view-model for /comparer"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Comparison
spec: docs/specs/website/comparison-page.md
context:
  - site/lib/candidates.ts
  - site/lib/schema.ts
  - scripts/lib/schema.ts
  - site/lib/derived/
  - docs/specs/website/comparison-page.md
test_command: pnpm --filter site test -- comparison-projection
depends_on: ["0091"]
---

## Context

Every comparison section reads from the same per-candidate projection.
Centralizing the derivation in `site/lib/derived/comparison-projection.ts`
keeps widgets dumb and makes the editorial guarantees (no averaging, no
composites) auditable in one place.

## Objectives

1. Implement `deriveComparisonProjection(bundle: CandidateBundle):
   ComparisonProjection` matching the shape in spec §4.1.
2. Derivation rules (verbatim from spec §4.1):
   - `positioning[axis]` = `aggregated.positioning.axes[axis].modal`
     (integer `[-5,5]` or `null`).
   - `dimGrades[dim]` = `aggregated.dimensions[dim].overall.grade`.
   - `risks[dim][k]` = index into
     `["low","limited","moderate","high","critical"]` from
     `aggregated.dimensions[dim].risk_profile[category].modal_level`.
     Category order = `["budgetary","implementation","dependency",
     "reversibility"]`.
   - `intergen[row]` =
     `aggregated.intergenerational.horizon_matrix[row].cells.h_2038_2047.modal_score`.
3. Provide `listComparisonProjections(): {projection,
   analyzable:true} | {id, displayName, analyzable:false}` that iterates
   `listCandidates()` and calls `loadCandidate()` + derivation, catching
   and marking failures.
4. **Do not average anything across horizons, models, or candidates.**
   When a modal is `null`, pass `null` through; the UI renders it as "—".

## Acceptance Criteria

- [ ] Unit tests against the `test-omega` fixture verify the derived
      projection matches aggregated fields byte-for-byte (except for
      the derived `partyShort`).
- [ ] Regression test: mutating `h_2027_2030` in a fixture leaves
      `intergen[row]` unchanged (i.e., only `h_2038_2047` is consumed).
- [ ] Regression test: no helper in this file computes any mean / sum /
      average (grep-style test).
- [ ] A failing-to-load candidate yields `{analyzable:false}` without
      throwing.
- [ ] `pnpm --filter site typecheck` clean; no `any`.

## Hints for Agent

- Reuse `DIMENSION_IDS`, `AXIS_KEYS`, and `HORIZON_ROW_KEYS` that
  already exist under `site/lib/derived/keys.ts` (or add the missing
  one following the existing convention).
- `partyShort` fallback: `party.split(/\s+/).map(w=>w[0]).join("").toUpperCase()`.
- Editorial check: every field of `ComparisonProjection` must be
  traceable to a single aggregated ordinal field; none is a composite.
