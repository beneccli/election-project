---
id: "0102"
title: "Update aggregate-analyses.md §4.3: add overall_spectrum modal + distribution + dissent rule"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_PoliticalSpectrum
spec: docs/specs/analysis/political-spectrum-label.md
context:
  - prompts/aggregate-analyses.md
  - prompts/aggregate-analyses.sha256.txt
  - prompts/CHANGELOG.md
  - scripts/lib/prompt-contract.aggregate.test.ts
  - docs/specs/analysis/aggregation.md
depends_on:
  - "0100"
---

## Context

The aggregator must compute modal + distribution + dissent for the
new categorical `overall_spectrum` field, using the same ordinal
discipline as per-axis positioning. See spec §5, §6.2.

## Objectives

1. In `prompts/aggregate-analyses.md`:
   - Add **§4.3.bis Overall spectrum label — modal + distribution
     + dissent** directly after §4.3.
   - Cover:
     - Modal plurality; `modal_label = null` on tie or all-distinct.
     - `label_distribution` as counts across models.
     - `dissent[]`: every model whose label differs from
       `modal_label` (or every model when `modal_label = null`).
     - `per_model[]`: exhaustive across contributing models.
     - **Never promote a label no model emitted.**
     - `anchor_narrative` distils per-model reasoning; no new
       evidence.
   - Extend §4.3's closing note to include `overall_spectrum` in
     the "never average" guardrail.
   - Extend the `agreement_map.positioning_consensus` block to
     list `overall_spectrum: { modal_label, distribution,
     dissent_count }`.
   - Update the prompt frontmatter `version` to `"1.2"` and
     `updated` to today.
2. Regenerate `prompts/aggregate-analyses.sha256.txt`.
3. Update `prompts/CHANGELOG.md` with a v1.2 entry.
4. Update `scripts/lib/prompt-contract.aggregate.test.ts` to
   assert the prompt text mentions:
   - `overall_spectrum`
   - `modal_label` and `label_distribution`
   - "never promote a label no model emitted" (or equivalent)
   - `agreement_map.positioning_consensus.overall_spectrum`

## Acceptance Criteria

- [ ] §4.3.bis added matching spec §6.2
- [ ] §4.3 "never average" closing note mentions
      `overall_spectrum`
- [ ] `agreement_map.positioning_consensus.overall_spectrum`
      documented in the prompt
- [ ] `prompts/aggregate-analyses.sha256.txt` regenerated
- [ ] `prompts/CHANGELOG.md` has a v1.2 entry
- [ ] `prompt-contract.aggregate.test.ts` assertions pass
- [ ] `npm run test -- prompt-contract.aggregate` passes

## Hints

- Existing §4.3 structure is the template — reuse its bullet style.
- The "never promote unsupported label" rule is an extension of
  the existing "supported_by non-empty" principle.

## Editorial check

- [ ] Aggregator never invents a label (e.g. emitting
      `centre_gauche` when no model said it)
- [ ] `inclassable` is handled as a regular enum value, not a
      fallback for tied modes
- [ ] `modal_label = null` is an explicit valid outcome, not an
      error
