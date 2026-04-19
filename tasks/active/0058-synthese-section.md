---
id: "0058"
title: "Synthèse section: headline + strengths/weaknesses/gaps + counterfactual + downside scenarios"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - Candidate Page.html
  - candidates/test-omega/current/aggregated.json
test_command: pnpm --filter site build
depends_on: ["0057"]
---

## Context

Implement the first candidate-page section. Visual design follows the
prototype's Synthèse section verbatim; data sources follow spec §4.2.

## Objectives

1. `site/components/sections/SyntheseSection.tsx` (server component):
   - Accepts `aggregated: AggregatedOutput` prop
   - Renders:
     - Headline paragraph from `aggregated.summary`
     - Confidence note: "Consensus X% — N modèles couverts" from
       `summary_agreement` and `agreement_map.coverage`; if
       `coverage_warning === true`, append a "⚠ couverture limitée" badge
     - Three-column layout (Strengths / Weaknesses / Gaps) populated from
       `deriveSynthese(aggregated)` — use the prototype's visual styling
       for the column headers and bullet lists
     - Counterfactual block: renders
       `aggregated.counterfactual.status_quo_trajectory`,
       `direction_of_change`, `dimensions_changed[]`, `dimensions_unchanged[]`
       as a compact two-row summary; `reasoning` as a secondary paragraph
     - Downside scenarios: list of `aggregated.downside_scenarios[]` with
       scenario, trigger, probability + severity confidence dots via
       `<ConfidenceDots>` (introduce this shared widget here if not already
       present)
2. `site/components/widgets/ConfidenceDots.tsx` — pure presentational
   widget taking a `value: number` in `[0, 1]` and rendering 5 dots filled
   proportionally (`●●●○○` = 0.6). No interactivity.
3. Wire `SyntheseSection` into `app/candidat/[id]/page.tsx`, replacing the
   placeholder.

## Acceptance Criteria

- [ ] Section renders without runtime errors for `test-omega`
- [ ] Empty-list fallback text appears correctly if e.g.
      `unsolved_problems` is empty (use the neutral string from 0055's
      `synthese-selection`)
- [ ] Counterfactual direction ("improvement" / "worsening" / "neutral" /
      "mixed") is surfaced as a neutral label — not "good/bad"
- [ ] `<ConfidenceDots value={0}>` renders 5 empty dots; `value={1}`
      renders 5 filled; accessible via `aria-label="Confiance : 60 %"`
- [ ] `pnpm --filter site build` passes

## Hints for Agent

- The prototype uses coloured dots (green filled, grey empty). Keep the
  same rendering — accessible via `aria-label` carrying the numeric value.
- Counterfactual icons can be ✓/—/⚠ matching the "Problems columns" pattern
  from `structure.md`, but stay neutral in color.

## Editorial check

- [ ] No advocacy framing. Weaknesses list uses the label from the prototype
      — `problems_worsened` items are surfaced as "affaiblissements" or
      equivalent descriptive French, NOT "échecs" / "dangers"
- [ ] Downside scenarios render `scenario` / `trigger` verbatim; no added
      commentary
- [ ] Counterfactual `direction_of_change === "worsening"` is rendered as
      "Détérioration de la trajectoire sur les dimensions X, Y" — a
      descriptive statement, not an indictment
