---
id: "0073"
title: "DimensionTile: per-model grade reveal on hover/focus"
type: task
status: open
priority: low
created: 2026-04-20
milestone: M_VisualComponents
spec: docs/specs/website/visual-components.md
context:
  - site/components/sections/DomainesSection.tsx
  - site/components/widgets/GradeBadge.tsx
  - site/components/widgets/Tooltip.tsx
depends_on: []
test_command: pnpm --filter @election-2027/site build
---

## Context

Each `DimensionTile` shows the consensus grade and a `⚡ N` dissent
indicator when at least one model's grade differs. The per-model grade
map (`dim.grade.dissent`) is available but not surfaced. Spec §4.7
requires a hover/focus tooltip listing every model's grade.

## Objectives

1. Wrap the `⚡ N` badge (or the whole tile header if cleaner) in a
   `<Tooltip>` showing a two-column list: model id → grade letter.
2. Sort rows by model id for stable ordering.
3. Also show the consensus grade at the top of the tooltip, marked
   "consensus".
4. When there is no dissent (`dissentCount === 0`) the tooltip is not
   rendered — the tile stays quiet.

## Acceptance Criteria

- [ ] When `dissentCount > 0`, hovering or focusing the dissent
      indicator reveals the per-model grade list.
- [ ] Consensus grade labeled and listed first.
- [ ] Tooltip does not interfere with the tile's expand/collapse
      click (use `onClick` stop-propagation if needed on the indicator).
- [ ] All tests pass: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] Site builds: `pnpm --filter @election-2027/site build`

## Hints for Agent

- The tile is already `"use client"` (via its parent section).
- Use `Object.entries(dim.grade.dissent).sort()`; model ids are lowercase
  kebab-case.
- Reuse `GradeBadge size="sm"` inside the tooltip for visual
  consistency.

## Editorial check

- [ ] Dissent is surfaced, not hidden — this task increases
      transparency.
- [ ] No re-interpretation of grades; the letter displayed is the
      letter in `aggregated.json`.
