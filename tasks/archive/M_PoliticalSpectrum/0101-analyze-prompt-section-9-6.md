---
id: "0101"
title: "Update analyze-candidate.md §9: add spectrum derivation rules; regenerate sha256"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_PoliticalSpectrum
spec: docs/specs/analysis/political-spectrum-label.md
context:
  - prompts/analyze-candidate.md
  - prompts/analyze-candidate.sha256.txt
  - prompts/CHANGELOG.md
  - scripts/lib/prompt-contract.test.ts
  - docs/specs/analysis/political-positioning.md
depends_on:
  - "0100"
---

## Context

The canonical analyst prompt must instruct the model to derive and
emit `positioning.overall_spectrum`. See spec §6.1.

## Objectives

1. In `prompts/analyze-candidate.md`:
   - Add a new sub-section **§9.6 Overall spectrum label** after
     the five axis instructions. Cover:
     - The 8 enum values verbatim (spec §3).
     - "Derived from axis evidence; no new sources admitted."
     - The `derived_from_axes` requirement (non-empty).
     - Weighting rule (economic + social/cultural primary;
       ecological + sovereignty tiebreak; institutional
       orthogonal except at the extremes).
     - The `inclassable` escape hatch + trigger conditions.
     - Two worked examples: one clean placement, one
       `inclassable`.
     - Confidence ceiling rule: `≤ min(confidences of
       derived_from_axes)`.
     - Measurement-framing reminder (no "reasonable centrism",
       no "dangerous extremism").
   - Extend §5 "Required output structure" to list
     `overall_spectrum` under `positioning`.
   - Update the prompt frontmatter `version` to `"1.2"` and
     `updated` to today.
2. Regenerate `prompts/analyze-candidate.sha256.txt` using the
   existing hashing script / `npm run` target (see repo memory /
   M_AnalysisPrompts precedent). Verify the hash matches the new
   file bytes.
3. Update `prompts/CHANGELOG.md` with a v1.2 entry describing the
   additive §9.6 block and the `overall_spectrum` output field.
4. Update `scripts/lib/prompt-contract.test.ts` to assert the
   prompt text mentions:
   - All 8 enum values (`extreme_gauche`, `gauche`,
     `centre_gauche`, `centre`, `centre_droit`, `droite`,
     `extreme_droite`, `inclassable`).
   - The phrase `derived_from_axes` or equivalent requirement.
   - The `inclassable` escape hatch.

## Acceptance Criteria

- [ ] §9.6 added to `prompts/analyze-candidate.md` matching
      spec §6.1
- [ ] `schema_version "1.2"` referenced in §5 output shape
- [ ] `prompts/analyze-candidate.sha256.txt` regenerated and
      matches file bytes
- [ ] `prompts/CHANGELOG.md` has a v1.2 entry
- [ ] `prompt-contract.test.ts` asserts enum presence + escape
      hatch + `derived_from_axes`
- [ ] `npm run test -- prompt-contract` passes
- [ ] The prompt does **not** rewrite any existing §9 axis
      instruction (additive only)

## Hints

- `prompts/` frontmatter format: see the existing
  `analyze-candidate.md` header.
- Hash regen: existing tasks under `M_AnalysisPrompts` wrote these
  sidecars — reuse the same npm script / node one-liner used there.

## Editorial check

- [ ] No rewording of existing §9 axis instructions — additive
      only
- [ ] Worked examples use measurement framing (no advocacy
      vocabulary)
- [ ] Prompt explicitly forbids anchoring the label on party name
      or media reputation
