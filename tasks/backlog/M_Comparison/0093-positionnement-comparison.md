---
id: "0093"
title: "PositionnementComparison: overlaid radar + per-axis dot rows"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Comparison
spec: docs/specs/website/comparison-page.md
context:
  - Comparison Page.html
  - site/components/widgets/PositioningRadar.tsx
  - site/components/sections/PositionnementSection.tsx
  - site/lib/anchors.ts
  - docs/specs/website/comparison-page.md
test_command: pnpm --filter site test -- PositionnementComparison
depends_on: ["0092"]
---

## Context

The first analytical section of the comparison page. Visual contract is
in `Comparison Page.html` (`ComparisonRadar`, `PositionnementComp`). It
reuses the candidate-page radar grammar but overlays N candidate
polygons and lists per-axis dots below.

## Objectives

1. New widget `site/components/comparison/ComparisonRadar.tsx`:
   - SVG 300×300, same ring / axis construction as
     `PositioningRadar` but accepts `candidates:
     ComparisonProjection[]` and `slotColors: string[]`.
   - One polygon per candidate (fill-opacity 0.12, stroke 2 px, slot
     color). **No median polygon.**
   - Axis labels from `AXES` (FR canonical, EN from `useLang`).
2. New widget `site/components/comparison/PositionnementRows.tsx`:
   - One row per axis. Track at `[-5,+5]`, centre rule at 50 %, N
     slot-colored dots (9 px) at the candidate's axis modal.
   - Spread label "⚡ ±K" (colour `var(--risk-red)`) only when
     `max − min ≥ 2`.
   - Title/hover on each dot: `"<Candidate name>: <modal>"`.
3. New section `site/components/comparison/PositionnementComparison.tsx`
   that lays out the radar (left) + rows (right), matching prototype
   grid.

## Acceptance Criteria

- [ ] Component tests verify: N polygons rendered for N candidates
      (N in 2..4), axis labels localized, no median polygon.
- [ ] When two candidates have the same axis modal, both dots render
      with deterministic z-order (URL order).
- [ ] When modal is `null` for a candidate on an axis, that dot is
      omitted and a "—" marker appears in the row.
- [ ] Spread label appears iff `max − min ≥ 2` (test each boundary).
- [ ] Editorial: no per-axis arithmetic mean is computed.
- [ ] `pnpm --filter site typecheck` clean.

## Hints for Agent

- Do not re-implement ring math; extract to
  `site/lib/derived/radar-geometry.ts` and share with the existing
  `PositioningRadar`.
- Slot colors come from a shared module
  `site/lib/comparison-colors.ts`:
  `["oklch(0.44 0.18 264)", "oklch(0.50 0.18 25)", "oklch(0.42 0.17 145)", "oklch(0.44 0.18 300)"]`.
