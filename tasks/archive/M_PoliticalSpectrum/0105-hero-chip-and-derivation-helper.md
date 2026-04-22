---
id: "0105"
title: "Hero chip: spectrum-label derivation helper + render next to party badge"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_PoliticalSpectrum
spec: docs/specs/analysis/political-spectrum-label.md
context:
  - Candidate Page.html
  - site/components/chrome/Hero.tsx
  - site/lib/derived/top-level-grade.ts
  - site/lib/derived/radar-geometry.ts
  - site/lib/i18n.ts
  - site/lib/schema.ts
depends_on:
  - "0100"
  - "0104"
---

## Context

Render the spectrum label as a small text span next to the party
badge in the candidate-page Hero, matching prototype
`Candidate Page.html` line 701 (`<span>{C.position}</span>` after
the party pill). See spec §8.1.

The field is additive; when absent (pre-v1.2 aggregated), Hero
renders nothing — no chip, no placeholder.

## Objectives

1. Add `site/lib/derived/spectrum-label.ts` exporting a pure
   function:
   ```ts
   deriveSpectrumLabel(
     aggregated: AggregatedOutput,
     lang: "fr" | "en"
   ): {
     label: SpectrumLabel | null,   // null when modal_label is null OR field absent
     displayText: string | null,    // localized label; null when nothing to show
     tooltipLines: string[],        // per-model breakdown for tooltip
     status: "present" | "split" | "inclassable" | "absent"
   }
   ```
   - `status === "absent"` → `displayText: null`; Hero renders
     nothing.
   - `status === "split"` (modal_label === null) →
     localized "Positionnement partagé" / "Split positioning".
   - `status === "inclassable"` → localized "Hors spectre" /
     "Unplaceable".
   - `status === "present"` → the French/English display label
     from the table below.
2. Extend `site/lib/i18n.ts` with the 8 French display labels
   (spec §3) plus the fallback strings "Positionnement partagé" /
   "Split positioning" and "Hors spectre" / "Unplaceable".
3. Update `site/components/chrome/Hero.tsx`:
   - Call `deriveSpectrumLabel(aggregated, lang)`.
   - If `displayText` is non-null, render a small text span in
     the existing `.flex` row containing the party badge,
     matching prototype styling
     (`fontSize: 11, color: "var(--text-tertiary)"`).
   - The span is wrapped in a `<button>` (or `<a href="#positionnement">`)
     that scrolls to the `#positionnement` section and exposes
     the tooltip lines via `aria-label` / `title`.
   - Accessibility: announce "Positionnement : {displayText}" for
     screen readers.
4. Write unit tests:
   - `site/lib/derived/spectrum-label.test.ts` covering all four
     `status` branches including the absent-field case.
   - `site/components/chrome/Hero.test.tsx` (or extend existing)
     with branches for present / inclassable / split / absent
     rendering.

## Acceptance Criteria

- [ ] Pure helper with unit tests exercising all 4 status
      branches
- [ ] Hero renders the chip only when appropriate; falls back to
      empty render for pre-v1.2 aggregated
- [ ] Keyboard-accessible link/button; scrolls to
      `#positionnement`
- [ ] Tooltip / `aria-label` exposes the per-model distribution
- [ ] `npm run test` passes
- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm run build` (site) succeeds; `out/candidat/<id>/index.html`
      contains the chip text for `test-omega`

## Hints

- Prototype reference bytes in `Candidate Page.html` line 701:
  `<span style={{ fontSize:11, color:"var(--text-tertiary)" }}>{C.position}</span>`
- `deriveTopLevelGrade` is the closest architectural precedent
  (pure, input-only, returns a render-ready struct). Mirror its
  shape.
- Do **not** use `GradeBadge` for the chip — the spectrum label
  is not a grade. Use plain text.

## Editorial check

- [ ] The chip text is descriptive, never advocacy ("Droite", not
      "Right-wing tilt")
- [ ] When `modal_label === null`, the site does NOT pick the
      first label alphabetically — it renders "Positionnement
      partagé"
- [ ] When the field is absent, the site does NOT guess a label
      from the per-axis modal scores
