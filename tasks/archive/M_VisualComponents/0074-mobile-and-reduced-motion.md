---
id: "0074"
title: "Mobile responsive pass + prefers-reduced-motion"
type: task
status: open
priority: medium
created: 2026-04-20
milestone: M_VisualComponents
spec: docs/specs/website/visual-components.md
context:
  - site/components/widgets/PositioningRadar.tsx
  - site/components/widgets/AxisAgreementBars.tsx
  - site/components/widgets/Tooltip.tsx
  - site/styles/globals.css
depends_on: []
test_command: pnpm --filter @election-2027/site build
---

## Context

The candidate page renders correctly on desktop widths. Two responsive
gaps remain (spec §4.1 and §7):

1. Below `sm` (< 640 px), the 280×280 SVG radar becomes unreadably
   small. The spec calls for replacing it with a vertical list of
   axes reusing `AxisAgreementBars`.
2. There is no global `prefers-reduced-motion` handling. Tooltip
   fade-in transitions and row-hover color transitions should be
   disabled for users who opt out of motion.

## Objectives

1. In `PositioningRadar` (or in `PositionnementSection`), render the
   radar inside a `hidden sm:block` wrapper and render a fallback
   `<PositioningAxisList>` inside a `sm:hidden` wrapper. The fallback is
   a stacked vertical list of compact `AxisAgreementBars`, one per
   axis.
2. Add a global `@media (prefers-reduced-motion: reduce)` block in
   `site/styles/globals.css` that sets `transition-duration: 0ms !important;`
   and `animation-duration: 0ms !important;` on every element. Verify
   tooltips still toggle instantly (they should — they rely on opacity
   transitions, which become instant).
3. Verify the risk table's `overflow-x-auto` still yields readable
   mobile UX; if not, stack the chevron under the provenance column
   (acceptable fallback).

## Acceptance Criteria

- [ ] Viewport widths < 640 px show the axis list, not the radar.
- [ ] Viewport widths ≥ 640 px show the radar as today.
- [ ] `prefers-reduced-motion: reduce` disables all CSS transitions
      site-wide; visual manual check via DevTools emulation.
- [ ] No regression in Tooltip hover/focus behavior.
- [ ] Lighthouse mobile run (manual) shows no new a11y violations.
- [ ] All tests pass: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] Site builds: `pnpm --filter @election-2027/site build`

## Hints for Agent

- `PositioningSection` already lays out legend + radar vertically on
  mobile; the fallback can slot where the radar used to be.
- `AxisAgreementBars` is already a horizontal DOM strip — it degrades
  well at small widths.
- Place the `prefers-reduced-motion` media query after the Tailwind
  layer imports in `globals.css`.

## Editorial check

- [ ] Mobile rendering preserves dissent visibility (model-colored
      dissent markers remain).
- [ ] No information hidden on mobile — only reorganized.
