---
id: "0095"
title: "IntergenComparison: 2047-horizon ordinal table"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Comparison
spec: docs/specs/website/comparison-page.md
context:
  - Comparison Page.html
  - site/components/widgets/IntergenHorizonTable.tsx
  - site/components/sections/IntergenSection.tsx
  - docs/specs/website/comparison-page.md
  - docs/specs/analysis/intergenerational-audit.md
test_command: pnpm --filter site test -- IntergenComparison
depends_on: ["0092"]
---

## Context

Per-horizon-row intergenerational comparison. Prototype in
`Comparison Page.html` (`IntergenComp`). Rows = horizon row keys,
columns = candidates, cell = `h_2038_2047` modal score in `[-3,+3]` +
colored bar.

## Objectives

1. New component `site/components/comparison/IntergenComparison.tsx`:
   - Rows = `HORIZON_ROW_KEYS` in fixed order (pensions, public_debt,
     climate, health, education, housing).
   - Columns = selected candidates.
   - Cell renders: horizontal bar (width = `max(|score|·12, 2) px`)
     + signed integer. Green scale for positive, red scale for
     negative, grey at 0.
   - Intro paragraph (FR + EN) quotes the prototype verbatim: "Impact
     net estimé sur les générations futures (−3 très négatif, +3 très
     positif) à l'horizon 2047."
2. Cell source: `proj.intergen[row]` (already
   `h_2038_2047.modal_score`). **No cross-horizon arithmetic.**
3. Each row label is clickable → navigates to the candidate page's
   full horizon matrix anchor
   (`/candidat/<first-selected-id>#horizon-<row>`). Rationale: the
   comparison view is a summary; detail is one click away on the
   candidate page.

## Acceptance Criteria

- [ ] Regression test: inject a differing `h_2027_2030` modal into a
      fixture → component output byte-identical (only `h_2038_2047`
      is consumed).
- [ ] `null` modal renders as "—" with no bar.
- [ ] No row or column totals.
- [ ] Colour scale mirrors the prototype palette exactly.
- [ ] Localized headers and intro copy.

## Hints for Agent

- The "link to the candidate page" affordance can be the row label
  itself; if multiple candidates are selected, link to the first in
  URL order.
- Editorial check: the comparison page MUST NOT embed cohort-specific
  advocacy language ("sacrifice", "rob"). Copy is measurement-only.
