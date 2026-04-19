---
id: "0061"
title: "Impact intergénérationnel section: two-column split panel"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/analysis/intergenerational-audit.md
  - docs/specs/website/visual-components.md
  - Candidate Page.html
test_command: pnpm --filter site build
depends_on: ["0057"]
---

## Context

The intergenerational panel is the signature editorial component. The full
hover-affordance version ships in M_VisualComponents; M_WebsiteCore delivers
the two-column static panel with confidence dots and narrative summaries.

## Objectives

1. `site/components/widgets/IntergenSplitPanel.tsx`:
   - Two equal columns, left = "À 25 ans (né en 2002)", right = "À 65 ans
     (né en 1962)"
   - Left column rows: `fiscal`, `housing`, `pension_outlook`,
     `labor_market`, `environmental_debt` (order from
     `Impact25YoSchema`)
   - Right column rows: `fiscal`, `pension`, `healthcare` (order from
     `Impact65YoSchema`)
   - Each cell shows: sub-dimension label (FR), `<ConfidenceDots
     value={agg.intergenerational.confidence}>`, the quantified value
     (`quantified ?? summary`)
   - Narrative summary at the bottom of each column
   - No hover affordances in v1 (documented as deferred)
2. `site/components/sections/IntergenSection.tsx` (server):
   - Section intro paragraph: "Impact net estimé sur les générations
     futures" — neutral framing; measurement, not indictment
   - Net transfer direction header: "Transfert net : <young_to_old |
     old_to_young | neutral | mixed>" rendered as a neutral statement
     with the magnitude estimate value + units + caveats
   - The `IntergenSplitPanel` below
   - A reasoning paragraph from
     `aggregated.intergenerational.reasoning`
3. Wire into `app/candidat/[id]/page.tsx`.

## Acceptance Criteria

- [ ] Both columns always render, even if one cohort has fewer rows than
      the other (visual weight remains balanced; empty cells use "Non
      quantifié")
- [ ] `quantified === null` cells render the qualitative `summary` string
      with no numeric formatting
- [ ] Net transfer direction appears once with its neutral label
- [ ] `pnpm --filter site build` passes

## Hints for Agent

- The prototype uses the label "Cette génération supporte une hausse
  nette…" as a narrative summary — we render
  `impact_on_25yo_in_2027.narrative_summary` / `impact_on_65yo_in_2027.narrative_summary`
  verbatim (produced by the aggregator, reviewed by human).
- Do NOT color one column red and the other green (spec §4 and
  `visual-components.md`). Both columns get neutral treatment.

## Editorial check

- [ ] No adjectives added. The component renders
      `narrative_summary`, `summary`, and `quantified` values **verbatim**
      from the aggregated JSON
- [ ] Both cohorts always visible even if one is more affected
- [ ] No red/green asymmetry
- [ ] Section intro language is measurement-focused — avoid words like
      "sacrifice", "vol", "injuste" (see `intergenerational-audit.md`)
