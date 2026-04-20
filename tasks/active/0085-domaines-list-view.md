---
id: "0085"
title: "DomainesSection: headline list with inline deep-dive"
type: task
status: open
priority: medium
created: 2026-04-20
milestone: M_CandidatePagePolish
spec: docs/specs/website/candidate-page-polish.md
context:
  - site/components/sections/DomainesSection.tsx
  - site/components/widgets/GradeBadge.tsx
  - site/components/widgets/ConfidenceDots.tsx
  - site/components/widgets/Tooltip.tsx
  - Candidate Page.html
test_command: pnpm --filter site test -- DomainesSection
depends_on: ["0083"]
---

## Context

The current `DomainesSection` renders a compact 5-tile grid with only
grade + confidence dots. The prototype (screenshots
`analyse-par-domaine.PNG` and `analyse-par-domaine-dimension-expanded.PNG`)
uses a list layout where every dimension shows a concise headline and
a confidence bar by default; rows expand to reveal full deep-dive
content. Schema v1.1 now carries `dimensions[k].headline` feeding this
layout.

See spec §5.2.

## Objectives

1. Restructure `DomainesSection` from a tile grid to a vertical list.
   Each row contains, in order:
   - `GradeBadge` (consensus, size `md`)
   - Dimension label (e.g. "Finances publiques")
   - Dissent chip `⚡ DISSENT` (when `grade.dissent` has any divergent
     entry) wrapped in the existing tooltip
   - Headline text from `aggregated.dimensions[k].headline.text`
   - Linear horizontal confidence bar (not dots) labeled "N% confiance"
   - Per-model grade micro-row (e.g. `C+ · C · C− · C+ · D+`) derived
     from `grade.dissent` + consensus
   - Right-aligned chevron `›` indicating expandable
2. Clicking a row (or the chevron) expands it; the existing
   `DimensionDeepDive` content renders **inline directly beneath the
   row**, indented, not collapsed to a separate panel below the grid.
3. Multiple rows may be expanded simultaneously. State:
   `Set<DimensionKey>`.
4. Preserve keyboard accessibility: each row is a `<button>` with
   `aria-expanded` and `aria-controls`. Deep-link support (`#dim=<key>`)
   keeps working.
5. Create a small `<ConfidenceBar>` widget at
   `site/components/widgets/ConfidenceBar.tsx` (linear variant of
   `ConfidenceDots`; token-based color; tested).
6. The `DimensionDeepDive` content is preserved unchanged — only its
   parent container changes.

## Acceptance Criteria

- [ ] Default view: every dimension visible with grade, label,
      headline, confidence bar, dissent chip (when applicable), per-
      model grade row, chevron.
- [ ] Clicking a row toggles its inline deep-dive panel.
- [ ] Multiple rows can be expanded at once.
- [ ] Deep-link `#dim=economic_fiscal` auto-expands the corresponding
      row.
- [ ] `aria-expanded` tracks state; screen readers announce the
      expanded content.
- [ ] `<ConfidenceBar>` unit-tested (0.0, 0.5, 1.0 renders).
- [ ] Headline text truncates gracefully on narrow viewports (≤140
      chars).
- [ ] Per-model grade micro-row shows each model's grade in stable
      `modelId` order.
- [ ] All tests pass: `pnpm --filter site test`
- [ ] No lint errors.
- [ ] No type errors.

## Hints for Agent

- Keep `DimensionDeepDive` as a separate exported component; just
  change where it's rendered.
- The confidence bar visual: a 96px × 4px horizontal track, filled from
  left at `value * 100 %`, token `var(--accent)`, label inline to the
  right.
- Row spacing: mimic the prototype — `border-b border-rule` between
  rows, generous vertical padding (`py-5`).
- Dissent chip already exists as `⚡ N` (tooltip-wrapped); extract it
  into a `<DissentChip>` widget if that simplifies reuse.

## Editorial check

- [ ] Headline displayed verbatim from aggregated data; no paraphrasing
      at render time.
- [ ] Dissent still signaled; per-model grade row reinforces
      transparency.
- [ ] Neutral empty-state copy when a dimension has zero deep-dive
      content (unlikely, but possible for `NOT_ADDRESSED`).
- [ ] No asymmetric styling — every dimension gets the same visual
      template.

## Notes

- This task covers Point 2 of spec §1.
- Visual ref: `analyse-par-domaine.PNG` (collapsed) +
  `analyse-par-domaine-dimension-expanded.PNG` (the prototype expansion
  is too simple — keep the `DimensionDeepDive` depth content).
