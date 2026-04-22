---
id: "0113"
title: "Landing: `<StakesAreaChart>` reusable pure-SVG area chart"
type: task
status: open
priority: medium
created: 2026-04-22
milestone: M_Landing
spec: docs/specs/website/landing-page.md
context:
  - docs/specs/website/landing-page.md
  - Landing Page.html
test_command: pnpm --filter site test -- StakesAreaChart
depends_on: ["0111"]
---

## Context

The hero row shows two France-level area charts. Port the prototype's
`makeAreaChart()` helper to a React client component that reads OKLCH
CSS variables, supports a `projectionFrom` dashed segment, and a
horizontal reference line. See spec §5.4.

## Objectives

1. Create `site/components/landing/StakesAreaChart.tsx` (client).
2. Props: `{ series: ContextSeries; heightPx?: number; labelYears?: number[] }`.
3. Read colors via `getComputedStyle(document.documentElement)` on
   mount and whenever `data-theme` on `<html>` changes (MutationObserver).
4. Render:
   - filled area (solid gradient up to `projectionFrom`, dashed-light
     gradient beyond)
   - line path (1.5 px stroke)
   - reference line with inline `<title>` for a11y
   - year tick labels
   - projection separator + FR/EN "projection →" label
5. Source pill (`<a href={series.source.url}>…</a>`) rendered BELOW
   the SVG, not inside it.
6. Honors `prefers-reduced-motion`: no entry transition.

## Acceptance Criteria

- [ ] Component renders for both `debt` and `demographics` series from
      `landing-context.ts` without runtime errors
- [ ] Test: path has `N` line segments where `N = series.points.length − 1`
- [ ] Test: projection separator rendered iff `series.projectionFrom`
- [ ] Test: reference line `<title>` matches the FR source label
- [ ] Accessible: `<svg role="img" aria-label="…">` populated from
      the series label
- [ ] Lint + typecheck + test clean

## Hints for Agent

- Keep the OKLCH color read logic in a small `useThemeColors()` hook;
  re-used by other landing components in task `0114`.
- Do NOT introduce a charting library. Pure SVG + React elements only.

## Editorial check

- [ ] Color is never the sole carrier of information (reference line
      also has a rendered label).
