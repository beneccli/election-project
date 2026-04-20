---
id: "0087"
title: "RisquesSection: summary matrix primary + Drawer with full list"
type: task
status: open
priority: medium
created: 2026-04-20
milestone: M_CandidatePagePolish
spec: docs/specs/website/candidate-page-polish.md
context:
  - site/components/sections/RisquesSection.tsx
  - site/components/widgets/RiskHeatmap.tsx
  - site/components/widgets/Tooltip.tsx
  - Candidate Page.html
test_command: pnpm --filter site test -- RiskSummaryMatrix Drawer
depends_on: ["0083"]
---

## Context

The current `RisquesSection` shows the per-risk expandable table
(`RiskHeatmap`) inline — dense but not screenshot-worthy. The prototype
(screenshot `risques.PNG`) shows a 5-row (dimensions) × 4-column (risk
categories) matrix of ordinal levels as the primary view, with a
secondary action to see the full risk list.

This task delivers **both** the new primary matrix AND the reusable
right-side `<Drawer>` primitive. The drawer is designed to be reused
by `M_Transparency`.

See spec §5.4 and §5.5.

## Objectives

### Drawer primitive

1. Install `@radix-ui/react-dialog` in the `site/` workspace if not
   present. Create `site/components/chrome/Drawer.tsx` exporting
   `<Drawer>` with:
   - Props: `open`, `onOpenChange`, `title`, `description?`, `children`.
   - Slides in from the right; width `min(90vw, 640px)`.
   - `role="dialog"`, `aria-modal`, `aria-labelledby`.
   - Focus trap; ESC + backdrop click close.
   - Respects `prefers-reduced-motion` (crossfade rather than slide).
   - Tailwind-styled; uses project OKLCH tokens.
2. Unit test the Drawer open/close lifecycle + ESC behavior + focus
   return.

### RiskSummaryMatrix widget

3. Create `site/components/widgets/RiskSummaryMatrix.tsx`:
   - 5 rows (dimensions) × 4 columns (`budgetary`, `implementation`,
     `dependency`, `reversibility`).
   - Column headers in FR: `Budgétaire`, `Mise en œuvre`, `Dépendance`,
     `Réversibilité`.
   - Cell renders `modal_level` as a pill with the FR label
     (`Faible`, `Limité`, `Modéré`, `Élevé`) on a 4-step ordinal color
     palette (green → orange → red).
   - Dissent badge when cell has dissenters.
   - Hover tooltip: aggregated `note`, per-model
     `model → level` mini-table.
   - Legend row at the bottom mapping the 4 levels to colors.

### Section restructure

4. Restructure `RisquesSection`:
   - **Primary**: section head + measurement-framed lead paragraph
     (keep existing copy) + `<RiskSummaryMatrix>`.
   - **Secondary action**: a `<button>` "Voir tous les risques identifiés"
     below the matrix. Clicking opens the `<Drawer>` containing the
     existing `<RiskHeatmap>` (per-risk expandable table).
5. The existing `<RiskHeatmap>` is **kept** — it is rendered inside the
   Drawer unchanged.

## Acceptance Criteria

- [ ] `@radix-ui/react-dialog` added to `site/package.json` (if new).
- [ ] `<Drawer>` renders with correct a11y attributes; ESC closes;
      focus returns to trigger on close.
- [ ] `<RiskSummaryMatrix>` renders 5×4 grid from
      `aggregated.dimensions[k].risk_profile`.
- [ ] Every cell shows the level label text; color is supplementary.
- [ ] Dissent badge appears when a cell has dissenters.
- [ ] Hover tooltip shows `note` + per-model levels.
- [ ] "Voir tous les risques identifiés" opens the Drawer with the
      existing per-risk heatmap inside.
- [ ] Existing `<RiskHeatmap>` behavior unchanged when rendered inside
      Drawer (expand/collapse rows still work).
- [ ] Responsive: matrix horizontally scrolls below `sm`.
- [ ] A11y: matrix uses `<table>` semantics; Drawer meets WAI-ARIA
      dialog pattern.
- [ ] Unit tests for `<Drawer>` (open/close, ESC, focus return) and
      `<RiskSummaryMatrix>` (cell rendering, dissent, tooltip content).
- [ ] All tests pass: `pnpm --filter site test`
- [ ] No lint errors.
- [ ] No type errors.

## Hints for Agent

- 4-step palette: `low` = soft green, `limited` = sand, `moderate` =
  orange, `high` = red. Mirror the prototype `risques.PNG`.
- For the Drawer, use `@radix-ui/react-dialog`'s `Root` / `Portal` /
  `Overlay` / `Content` primitives; style via Tailwind + `data-state`
  attributes for animations. Keep the API surface minimal.
- Keep the Drawer framework-agnostic — do not assume it will only wrap
  the risk heatmap. M_Transparency will reuse it.
- When rendering `<RiskHeatmap>` inside the Drawer, make sure it
  doesn't regress (grouping headers, expandable rows, keyboard
  behavior).

## Editorial check

- [ ] Cell pills carry the level text — color is never the only
      signal.
- [ ] Matrix is symmetric: 5 dimensions × 4 categories for every
      candidate.
- [ ] Dissent preserved via ⚡ badge + per-model tooltip.
- [ ] The existing per-risk `RiskHeatmap` is preserved inside the
      Drawer — no transparency regression.
- [ ] Section lead copy remains measurement-framed.

## Notes

- This task covers Point 4 of spec §1.
- Visual ref: `risques.PNG`.
- The Drawer will be reused by `M_Transparency` — do not over-couple
  to the risk use case.
