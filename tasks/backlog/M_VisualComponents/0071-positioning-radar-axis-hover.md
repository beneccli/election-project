---
id: "0071"
title: "PositioningRadar: per-axis hover tooltip"
type: task
status: open
priority: medium
created: 2026-04-20
milestone: M_VisualComponents
spec: docs/specs/website/visual-components.md
context:
  - site/components/widgets/PositioningRadar.tsx
  - site/components/widgets/Tooltip.tsx
  - site/lib/derived/positioning-shape.ts
  - site/lib/anchors.ts
test_command: pnpm --filter @election-2027/site build
depends_on: []
---

## Context

`PositioningRadar` is a pure-SVG static component that renders the
5-axis consensus polygon. The visual-components spec §4.1 requires
per-axis hover interactivity revealing the consensus interval, modal
value, and dissent state. Currently the radar has only an `aria-label`
summary — no pointer or focus affordance on individual axes.

## Objectives

1. Add an invisible per-axis hit-area at each vertex (sized ≥ 24×24 px)
   that carries focus and hover.
2. Wrap each hit-area in a `<Tooltip>` whose content is:
   - axis label (canonical from `AXES`),
   - consensus interval `[min, max]`,
   - modal value,
   - dissent indicator (`Désaccord: N modèles` when `hasDissent`, else
     "Consensus").
3. Ensure keyboard focus traverses the axes in a stable order and the
   focused hit-area is visible (outline via `focus-visible`).

## Acceptance Criteria

- [ ] Hovering any axis vertex shows an instant tooltip with the four
      fields above.
- [ ] Tab order visits each axis hit-area once; focus ring visible.
- [ ] No regression in the radar's visual output (concentric grid,
      spokes, consensus polygon unchanged).
- [ ] `aria-label` summary still present on the outer `<svg>`.
- [ ] All tests pass: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] Site builds: `pnpm --filter @election-2027/site build`

## Hints for Agent

- The radar is currently a server component. Adding `<Tooltip>` wrappers
  is fine without `"use client"` because Tooltip is pure CSS.
- Compute vertex screen coordinates once using the existing `toXY`
  helper.
- Consider a `<foreignObject>` or sibling DOM overlay to host the
  tooltip triggers; SVG + HTML Tooltip coexistence is simpler if the
  radar is wrapped in a `relative` div and triggers are absolutely
  positioned over the SVG.

## Editorial check

- [ ] No per-candidate customization — same behavior for every radar.
- [ ] No cardinal score displayed — only the consensus interval +
      modal + dissent label.
