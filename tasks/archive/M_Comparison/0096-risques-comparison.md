---
id: "0096"
title: "RisquesComparison: stacked per-candidate 6×4 risk matrices"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Comparison
spec: docs/specs/website/comparison-page.md
context:
  - Comparison Page.html
  - site/components/widgets/RiskSummaryMatrix.tsx
  - site/components/sections/RisquesSection.tsx
  - docs/specs/website/comparison-page.md
test_command: pnpm --filter site test -- RisquesComparison
depends_on: ["0092"]
---

## Context

Risks comparison block. Prototype in `Comparison Page.html`
(`RisquesComp`). One block per candidate, stacked top-to-bottom; each
block is a 6×4 heatmap identical in shape to the candidate page's
`RiskSummaryMatrix` but rendered inline (no drawer).

## Objectives

1. New component `site/components/comparison/RisquesComparison.tsx`:
   - Iterates selected candidates in URL order.
   - Per candidate: slot-color bar + name header, then the 6×4 matrix
     (rows = `RISK_DIM_ROWS` from prototype: finance/social/env/
     sante/sec/inst; cols = 4 risk categories in canonical order).
2. Cell color ramp: 5 OKLCH levels matching the prototype
   (`["", "oklch(0.88 0.06 145)", "oklch(0.82 0.10 90)", "oklch(0.74
   0.15 60)", "oklch(0.60 0.19 30)", "oklch(0.50 0.20 20)"]`). Label
   "Faible/Limité/Modéré/Élevé/Critique" (FR) / "Low/Limited/
   Moderate/High/Critical" (EN).
3. Source: `proj.risks[dim][categoryIndex]` (already a
   `RiskLevelIndex`). No cross-candidate arithmetic.

## Acceptance Criteria

- [ ] N blocks for N selected candidates (2..4), identical rendering
      across blocks.
- [ ] Color and label come from the RiskLevelIndex only — no composite
      scoring.
- [ ] Order = URL order (no re-sorting by "most risky").
- [ ] Test fixture covers every level (Low..Critical) at least once.
- [ ] Localized category headers + level labels.

## Hints for Agent

- If an existing helper in `site/lib/` already maps
  `RiskLevel ↔ color/label` reuse it; otherwise put a new one next to
  the widget.
- Editorial check: comparison page must NOT rank candidates by "total
  risk" or any summed metric.
