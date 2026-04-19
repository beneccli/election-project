---
id: "0060"
title: "Domaines section: dimension tiles + expandable deep-dive"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/analysis/dimensions.md
  - Candidate Page.html
test_command: pnpm --filter site build
depends_on: ["0057"]
---

## Context

Render the five dimension tiles (grade + consensus annotation) in a grid,
each expandable into a full deep-dive showing problems_addressed,
problems_ignored, problems_worsened, execution_risks, key_measures, and the
per-model grade dissent map.

## Objectives

1. `site/components/widgets/GradeBadge.tsx`:
   - Accepts `grade: "A" | "B" | "C" | "D" | "F" | "NOT_ADDRESSED"` and
     `size: "sm" | "md" | "lg"`
   - Renders the letter with the prototype's bordered-box style using
     `site/lib/grade-color.ts` (create it)
   - `NOT_ADDRESSED` renders as a neutral "—" with a "Non abordé" aria label
2. `site/components/widgets/DimensionTile.tsx`:
   - Props: `dimensionKey`, `label: I18nString`, `grade` consensus letter,
     `dissentCount` (number of models whose grade differs from consensus),
     `confidence`
   - Shows the tile per spec §4.4
   - Clickable — emits a toggle event to the parent section
3. `site/components/sections/DomainesSection.tsx` (client, because of the
   expand/collapse):
   - Grid of 5 tiles — server-rendered initially, interactivity layered on
     top via `"use client"`
   - When a tile is active, a deep-dive panel renders below the grid
     (full-width) containing:
     - Dimension summary
     - Three sub-blocks: ✓ Problèmes adressés, — Problèmes non adressés,
       ⚠ Problèmes aggravés — each a list of problems with source ref
       count and supported_by/dissenters attribution badges
     - Execution risks list (name + probability/severity dots)
     - Key measures list (measure + magnitude if quantified, else "non
       quantifié")
     - Per-model grade dissent: `aggregated.dimensions.<dim>.grade.dissent`
       rendered as a compact pill list: `claude-opus-4-6 → B, gemini → C`
4. Use `deriveTopLevelGrade` logic only for the top-level grade in the
   Hero — within this section the per-dimension `grade.consensus` is shown
   verbatim.

## Acceptance Criteria

- [ ] Tile grid renders 5 tiles for the 5 dimensions in a fixed order
      (Économique, Social & démographique, Sécurité & souveraineté,
      Institutionnel & démocratique, Environnemental & long terme)
- [ ] Clicking a tile expands it; clicking again (or another tile)
      collapses
- [ ] Deep-dive shows all three problem sub-blocks even when some are empty
      (neutral "Aucun problème identifié" where applicable)
- [ ] Per-model grade map shows the consensus grade and every dissenting
      model's grade
- [ ] `pnpm --filter site build` passes

## Hints for Agent

- Use a URL hash (`#dim=economic_fiscal`) for the active tile so state is
  deep-linkable and survives reloads. Fallback to first tile if invalid.
- Problem sub-blocks: limit item count to 5 per list in v1 with a "+ N
  autres" link that (in M_Transparency) will open a drawer. For now,
  "+ N autres" renders as disabled text.

## Editorial check

- [ ] All three sub-blocks render **always**, even when empty. An empty
      "problems_worsened" list does not hide the heading — that would softpedal
      absence. Show "Aucun aggravement identifié par les modèles."
- [ ] Per-model grade dissent is exposed — dissent preservation principle
- [ ] Dimensions order is identical for every candidate (enforced by a
      constant array, not derived from `aggregated` key iteration)
