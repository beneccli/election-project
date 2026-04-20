---
id: "0086"
title: "IntergenSection: horizon matrix primary, 25yo/65yo secondary"
type: task
status: open
priority: medium
created: 2026-04-20
milestone: M_CandidatePagePolish
spec: docs/specs/website/candidate-page-polish.md
context:
  - site/components/sections/IntergenSection.tsx
  - site/components/widgets/IntergenSplitPanel.tsx
  - site/components/widgets/Tooltip.tsx
  - docs/specs/analysis/intergenerational-audit.md
  - Candidate Page.html
test_command: pnpm --filter site test -- IntergenHorizonTable
depends_on: ["0083"]
---

## Context

The current `IntergenSection` leads with `IntergenSplitPanel`
(25yo / 65yo). The prototype (screenshot `impact-intergénérationnel.PNG`)
leads with a domain × 3-horizon table that communicates net effect at a
glance. Schema v1.1 now carries
`intergenerational.horizon_matrix` — 6 rows × 3 horizons of ordinal
impact scores in [−3, +3].

See spec §5.3.

## Objectives

1. Create `site/components/widgets/IntergenHorizonTable.tsx`:
   - 6 rows × 3 columns (horizons `h_2027_2030`, `h_2031_2037`,
     `h_2038_2047`).
   - Column headers show the year range on top and the cohort
     annotation below:
     - `2027–2030` / `Actifs 35–55 ans`
     - `2031–2037` / `Jeunes actifs & retraités`
     - `2038–2047` / `Génération Z & Alpha`
   - Row labels (FR): `Retraites`, `Dette publique`, `Climat`,
     `Santé`, `Éducation`, `Logement`.
   - Each cell renders:
     - A pill with the signed integer (`+3`, `+2`, `+1`, `0`, `−1`,
       `−2`, `−3`) as the primary signal.
     - A length-only mini-bar proportional to `|modal_score|` (4px
       track height, length = `|modal_score|/3 * cellWidth`).
     - A colored background using a 7-level ordinal palette (very
       negative → very positive); neutral neutral-tinted.
     - A ⚡ dissent badge when `dissenters.length > 0`.
     - Tooltip on hover revealing: the aggregated `note`, the
       `score_interval`, and a per-model mini-table
       (`model → score`).
   - Row-level `dimension_note` rendered as a small italic line under
     the row label (collapsed into a tooltip on narrow viewports).
   - Legend at the bottom: "Très négatif / Négatif / Neutre / Positif
     / Très positif" with matching swatches.
2. Restructure `IntergenSection` into two blocks:
   - **Primary**: section head `"Impact intergénérationnel"` + a short
     measurement-framed lead paragraph + `<IntergenHorizonTable>`.
   - **Secondary** (below, `<h3>`-level): `"Comparaison individuelle"`
     + the existing `net_transfer_direction` + `magnitude_estimate`
     block + `<IntergenSplitPanel>` + the existing `reasoning` and
     `source_refs` blocks.
3. The lead paragraph explicitly states that scores reflect the
   **estimated net effect of the program on the domain over the
   horizon**, independent of ideology. Mention the cohort labels are
   approximate narrative anchors overlapping imperfectly with the
   calendar horizons.

## Acceptance Criteria

- [ ] `<IntergenHorizonTable>` renders a 6×3 grid from
      `aggregated.intergenerational.horizon_matrix`.
- [ ] Every cell shows the modal_score with its signed integer visible;
      color supplementary.
- [ ] Cells with dissent display the ⚡ badge.
- [ ] Hover reveals per-model scores and notes.
- [ ] Secondary `IntergenSplitPanel` still renders, unchanged in shape.
- [ ] Section lead paragraph present; cohort approximation noted.
- [ ] Responsive: below `sm`, table becomes horizontally scrollable;
      row labels stay sticky on the left.
- [ ] A11y: table uses `<table>` semantics with `<thead>` / `<tbody>`
      and scoped headers.
- [ ] Unit tests cover rendering with: all-positive cells, mixed cells,
      a cell with `modal_score === null`, a cell with active dissent.
- [ ] All tests pass: `pnpm --filter site test`
- [ ] No lint errors.
- [ ] No type errors.

## Hints for Agent

- 7-level ordinal palette: reuse OKLCH tokens; something like
  `very_neg / neg / slight_neg / neutral / slight_pos / pos / very_pos`
  mapped to `-3..-2..-1..0..+1..+2..+3` respectively. The palette from
  the prototype screenshot `impact-intergénérationnel.PNG` is the
  target.
- For `modal_score === null` (no plurality across models), render a `?`
  pill with neutral tint and make dissent indicator prominent.
- The mini-bar should be length-only (no cardinal meaning between
  cells); it's a within-cell visual, not a comparison across cells.
- Don't remove `IntergenSplitPanel`; keep its existing unit tests
  passing.

## Editorial check

- [ ] Cell notes describe mechanism, not moral weight (enforced by
      prompt v1.1; re-verified visually against `test-omega`).
- [ ] Row labels are measurement-framed ("Dette publique", not "Fardeau
      de la dette").
- [ ] Column labels put the year range first; cohort annotation is
      secondary.
- [ ] Dissent preserved via ⚡ badge + per-model tooltip.
- [ ] Symmetric: every candidate × every row × every horizon present.
      No hidden rows.

## Notes

- This task covers Point 3 of spec §1.
- Visual ref: `impact-intergénérationnel.PNG`.
