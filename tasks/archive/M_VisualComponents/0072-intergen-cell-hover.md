---
id: "0072"
title: "IntergenSplitPanel: per-cell hover reveal with source_refs"
type: task
status: open
priority: medium
created: 2026-04-20
milestone: M_VisualComponents
spec: docs/specs/website/visual-components.md
context:
  - site/components/widgets/IntergenSplitPanel.tsx
  - site/components/widgets/Tooltip.tsx
  - docs/specs/analysis/intergenerational-audit.md
test_command: pnpm --filter @election-2027/site build
depends_on: []
---

## Context

`IntergenSplitPanel` currently shows each cell's label, `ConfidenceDots`,
and quantified/qualitative text. The full `reasoning` and `source_refs`
for each cell live in `aggregated.json` but are not surfaced. Spec §4.4
requires a per-cell hover that reveals reasoning and raw source-ref
strings.

Source-ref navigation into `sources.md` is deferred to M_Transparency;
this task only surfaces the strings as plain text.

## Objectives

1. Wrap each cell in a `<Tooltip>` whose content shows:
   - the full `reasoning` paragraph,
   - the list of `source_refs` rendered as monospaced pills (e.g.
     `REF:social:42`) — **no links, no onClick**. Plain text only.
2. Empty / "Non quantifié" padding rows do not get a tooltip.
3. Cell hit-area covers the whole cell (label + dots + text), not just
   the text node.

## Acceptance Criteria

- [ ] Each populated cell in both 25yo and 65yo columns reveals a
      tooltip on hover and focus.
- [ ] `source_refs` rendered as text pills, not links.
- [ ] Empty / padded cells do not intercept pointer events.
- [ ] Keyboard users can Tab through all populated cells.
- [ ] All tests pass: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] Site builds: `pnpm --filter @election-2027/site build`

## Hints for Agent

- Cells are rendered by the inner `Column` helper. The cell type is
  `AggregatedOutput["intergenerational"]["impact_on_25yo_in_2027"]["fiscal"]`
  — confirm `reasoning` + `source_refs` are present on the Zod type
  before wiring.
- The Tooltip's `max-w-[260px]` might need widening for long reasoning;
  pass `className="!max-w-[360px]"` if so.

## Editorial check

- [ ] No advocacy language added in cell labels or tooltips.
- [ ] `source_refs` shown verbatim — not rephrased or "cleaned up".
- [ ] Both columns treated identically (same hover behavior).
