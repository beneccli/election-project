---
id: "0094"
title: "DomainesComparison: grades table with spread + unique-max marker"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Comparison
spec: docs/specs/website/comparison-page.md
context:
  - Comparison Page.html
  - site/components/sections/DomainesSection.tsx
  - site/components/widgets/GradeBadge.tsx
  - site/lib/dimension-labels.ts
  - docs/specs/website/comparison-page.md
test_command: pnpm --filter site test -- DomainesComparison
depends_on: ["0092"]
---

## Context

Per-dimension grade comparison table. Prototype in `Comparison Page.html`
(`DomainesComp`). One row per dimension, N+1 columns (candidates +
Écart), `<GradeBadge size="sm">` per cell, neutral ↑ marker on the
uniquely-highest cell per row.

## Objectives

1. New component `site/components/comparison/DomainesComparison.tsx`:
   - Rows = `DIMENSION_IDS` in fixed order.
   - Columns = selected candidates + trailing "Écart" / "Spread" column
     (shown only when ≥ 2 candidates).
   - Cell renders `<GradeBadge>` from `proj.dimGrades[dim]`.
   - Column header: 3 px slot-color bar above first-name header
     (`name.split(" ")[0]`).
2. Grade-to-value helper (shared): map
   `{A:9, A-:8, B+:7, B:6, B-:5, C+:4, C:3, C-:2, D+:1, D:0}`.
3. Unique-max marker: small neutral `↑` glyph after the badge **iff**
   `argmax` is strictly unique. `title` attribute = "Meilleure note de
   la sélection" / "Top grade in this selection".
4. Écart cell: integer `max − min`. Text color red when ≥ 3, amber
   when 2, tertiary when < 2. Prefixed with `⚡` when ≥ 2.

## Acceptance Criteria

- [ ] Unique-max marker rendered only when the max value is strictly
      unique (test: two candidates tied at top → no marker on either).
- [ ] Écart column hidden when only one candidate is selected.
- [ ] `Écart` value equals `max(grade-values) − min(grade-values)`;
      never a mean.
- [ ] No row frames a candidate as "loser" / "worst"; only the top
      cell carries a neutral arrow.
- [ ] Localized headers (FR canonical, EN via `useLang`).
- [ ] Test coverage: 2, 3, and 4-candidate selections; all-equal row;
      unique-top row; two-way tie at top.

## Hints for Agent

- Put the grade-to-value map in `site/lib/grade-value.ts` — the
  `IntergenComparison` task does NOT reuse it (ordinal only within this
  widget).
- Editorial check: the component must not render a totals row, an
  averages row, or any per-candidate summary.
