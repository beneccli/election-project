---
id: "0059"
title: "Positionnement section: 5-axis radar + per-axis agreement bars"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/analysis/political-positioning.md
  - Candidate Page.html
test_command: pnpm --filter site build
depends_on: ["0057", "0055", "0056"]
---

## Context

Render the political positioning section. Baseline quality is sufficient for
M_WebsiteCore — polish (animations, hover tooltips, dissent-marker
interactivity) is deferred to M_VisualComponents.

Visual reference: `Candidate Page.html` sections rendered by
`PositionnementSection` + `RadarChart` + `ModelAgreementBars`.

## Objectives

1. `site/components/widgets/PositioningRadar.tsx`:
   - Server component rendering a static SVG pentagon (5 axes)
   - Accepts output of `deriveRadarShape` — plot `radarValue` per axis
   - Render the consensus interval as a shaded band behind the shape per
     axis (as per spec §4.3 — baseline quality, no animation)
   - Axis labels at each vertex using `axes` labels from anchors
   - Badge `⚠ dissent` on axes where `hasDissent === true`
   - Accessible via `role="img"` + `aria-label` summarizing axes
2. `site/components/widgets/AxisAgreementBars.tsx`:
   - One row per axis
   - Each row: axis label + poles (Gauche/Droite etc from anchors) + a
     horizontal -5..+5 track
   - Show: shaded consensus interval band, filled modal marker, hollow
     dissent markers with model ID tooltip (native `title=` in v1)
   - Anchor labels rendered as small ticks at their positions
3. `site/components/sections/PositionnementSection.tsx` (server):
   - Two-column grid: `PositioningRadar` left, `AxisAgreementBars` right
   - Pull data from `aggregated.positioning`
   - Section intro: single descriptive paragraph citing that positioning is
     ordinal (see `political-positioning.md`) and that the radar shape is
     a summary; the canonical view is the per-axis row
4. Wire into `app/candidat/[id]/page.tsx`.

## Acceptance Criteria

- [ ] Radar pentagon renders with correct vertex count and labels
- [ ] Axis with `modal_score === null` shows the dissent badge
- [ ] Agreement bars render all 5 axes for test-omega with visible
      consensus bands and modal markers
- [ ] Hovering a dissent marker shows model ID via native tooltip
- [ ] No cardinal "average" score is ever displayed as text
- [ ] `pnpm --filter site build` passes

## Hints for Agent

- The prototype's `RadarChart` SVG math is a good reference — copy the
  coordinate transforms (polar → cartesian with `angle(i) = (2π·i)/N - π/2`)
  but parameterize it from `deriveRadarShape` output rather than hardcoded
  data.
- `SVG`-native; no charting library. The text inside the shape is optional
  — keep the pentagon clean and push labels to the vertices.
- Anchors come from `site/lib/anchors.ts` (task 0056). If anchors aren't
  enumerated yet, the bar is still renderable — just draw the -5..+5 track.

## Editorial check

- [ ] **No `score` text label anywhere.** The radar's underlying
      `radarValue` is a shape input only. The axis rows show `modal_score`
      (ordinal) and `consensus_interval` (ordinal range) — never averaged.
- [ ] Dissent is visible on both the radar (badge) and the axis row
      (hollow markers). Never hidden.
- [ ] Anchors are identical across candidates (data source is
      `site/lib/anchors.ts` not `aggregated.*`)
