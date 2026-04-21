---
id: "0084"
title: "PositioningRadar: per-model selectable overlay"
type: task
status: open
priority: medium
created: 2026-04-20
milestone: M_CandidatePagePolish
spec: docs/specs/website/candidate-page-polish.md
context:
  - site/components/widgets/PositioningRadar.tsx
  - site/components/widgets/PositioningLegend.tsx
  - site/components/sections/PositionnementSection.tsx
  - site/lib/derived/positioning-shape.ts
  - site/lib/model-color.ts
  - site/lib/anchors.ts
  - Candidate Page.html
test_command: pnpm --filter site test -- PositioningRadar
depends_on: ["0083"]
---

## Context

The current `PositioningRadar` renders only the consensus polygon. The
prototype (`Candidate Page.html`, screenshot `positionnement-politique.PNG`)
allows selecting one or more models to overlay their individual
positioning polygons on top of the consensus. The aggregated schema
v1.1 now carries the complete `positioning[axis].per_model` list
required to render per-model polygons.

See spec §5.1.

## Objectives

1. Extend `deriveRadarShape` in `site/lib/derived/positioning-shape.ts`
   to emit a `models: Array<{ id, label, values: Record<AxisKey,number>,
   colorToken }>` array fed from `positioning[axis].per_model`.
2. Make `PositioningRadar` a client component (`"use client"`) with
   state `enabledModels: Set<string>`, initially empty (only consensus
   visible).
3. Render each enabled model as an SVG `<polygon fill="none" stroke>`
   overlay at reduced opacity (~0.55) and thinner stroke than consensus.
   Stroke color per `modelColor(modelId)` from `site/lib/model-color.ts`.
4. Convert `PositioningLegend` into an interactive toggle panel:
   - "Consensus" row is non-interactive and always marked active.
   - One row per model with a click-to-toggle swatch; aria-pressed
     semantics.
   - Keyboard: space / enter toggles; tab cycles.
   - "Tous" / "Aucun" shortcut buttons at the top.
5. Preserve all existing axis hover behavior on the radar.
6. Preserve the mobile fallback (radar hidden `<sm`, `AxisAgreementBars`
   remains the primary readable form).

## Acceptance Criteria

- [ ] Consensus polygon always rendered, regardless of toggle state.
- [ ] Toggling a model overlays its polygon; untoggling removes it.
- [ ] Multiple models can be enabled simultaneously.
- [ ] "Tous" enables every model; "Aucun" disables every model (consensus
      still visible).
- [ ] Each model's polygon uses its canonical color from
      `site/lib/model-color.ts`.
- [ ] Axis hover tooltips still work.
- [ ] ARIA: each swatch is a `<button>` with `aria-pressed`; radar has
      an `aria-label` summarizing the consensus (unchanged).
- [ ] Mobile fallback preserved.
- [ ] Unit tests cover: shape derivation (per-model list non-empty when
      aggregated has per_model data), radar render with 0 / 1 / all
      models enabled.
- [ ] All tests pass: `pnpm --filter site test`
- [ ] No lint errors: `pnpm --filter site lint`
- [ ] No type errors: `pnpm --filter site typecheck`

## Hints for Agent

- Per-model polygon points use the existing `toXY(i, score, n)` helper.
- Pentagonal shape order comes from `AXES` in `site/lib/anchors.ts`.
- Use CSS variables for the overlay opacity so dark mode adjusts.
- Avoid heavy re-renders: memoize the per-model points arrays.
- For the toggle panel, fewer-than-5 models shouldn't force layout
  changes — use a consistent list with `flex-wrap`.

## Editorial check

- [ ] Per-model polygons are visibly secondary to the consensus
      (thinner stroke, lower opacity). Aggregated view remains the
      headline.
- [ ] No cardinal averaging introduced. Per-model scores are raw
      integer positions, not derived.
- [ ] Dissent preserved: the radar + legend now directly surface every
      per-model stance, which *strengthens* the dissent-preserved
      principle.

## Notes

- Model color palette exists in `site/lib/model-color.ts` — reuse, do
  not introduce a new one.
- This task covers Point 1 of spec §1.
