---
id: "0062"
title: "Risques section: per-risk heatmap grouped by dimension"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/analysis/aggregation.md
  - Candidate Page.html
test_command: pnpm --filter site build
depends_on: ["0057"]
---

## Context

The prototype's risk heatmap shows a 1–5 score per (dimension × risk type).
That would require cardinal aggregation across heterogeneous risks — rejected
by the spike (Q6). Replacement: rows are individual
`aggregated.dimensions.<dim>.execution_risks[]` entries, grouped by
dimension, with probability and severity rendered as confidence dots.

## Objectives

1. `site/components/widgets/RiskHeatmap.tsx`:
   - Input: array of `{ dimensionKey, label, risks: ExecutionRisk[] }`
   - Output: table with columns `Risque`, `Probabilité`, `Sévérité`,
     `Modèles` (count of `supported_by` / total covered)
   - Each row: probability and severity as `<ConfidenceDots>`; cell
     background tint on the row driven by `max(probability, severity)`
     using a 5-step color scale (same palette as prototype's risk table)
   - Dimension rows are inserted as group headers
2. `site/components/sections/RisquesSection.tsx` (server):
   - Section intro paragraph explaining the metric (probability + severity
     from model outputs, not a "risk score")
   - Renders the heatmap
   - If a dimension has zero execution risks, render the group with an
     "Aucun risque d'exécution identifié par les modèles" line instead of
     hiding it
3. Wire into `app/candidat/[id]/page.tsx`.

## Acceptance Criteria

- [ ] Every dimension appears in the table in canonical order, even with
      zero risks
- [ ] Each row shows probability + severity dots; hover displays the risk's
      `reasoning` via native tooltip
- [ ] Cell tint uses a 5-step palette from the prototype — neutral for
      low, red for critical
- [ ] No aggregate "risk score" column is computed
- [ ] `pnpm --filter site build` passes

## Hints for Agent

- Shared `<ConfidenceDots>` widget was introduced in 0058. Reuse.
- Risk count (`supported_by.length`) is surfaced in the Modèles column as
  a small pill (e.g., "3/3") — this is transparency, not averaging.

## Editorial check

- [ ] **No cardinal "risk score" computed.** Probability and severity are
      shown separately as dots.
- [ ] Every dimension row is always visible (no hiding empty groups).
- [ ] Dissent / agreement visible via the `supported_by` count pill
- [ ] Color tint is a visual aid, information is still carried by the dots
      (accessibility)
