---
id: "0106"
title: "Comparison page: surface spectrum label in selector + sticky selected-header"
type: task
status: open
priority: medium
created: 2026-04-22
milestone: M_PoliticalSpectrum
spec: docs/specs/analysis/political-spectrum-label.md
context:
  - site/app/comparer/page.tsx
  - site/components/comparison/CandidateSelector.tsx
  - site/components/comparison/SelectedHeader.tsx
  - site/lib/derived/comparison-projection.ts
  - site/lib/derived/spectrum-label.ts
depends_on:
  - "0105"
---

## Context

Reuse the derivation helper from task 0105 to show the spectrum
label as a small subtitle under each candidate name in the
`/comparer` selector cards and sticky selected-header. See spec
§8.2.

## Objectives

1. Extend the `ComparisonProjection` type (in
   `site/lib/derived/comparison-projection.ts`) with an optional
   `spectrum_label_display: string | null` and
   `spectrum_status: "present" | "split" | "inclassable" | "absent"`
   field populated at build time via the same helper as Hero.
2. Update `CandidateSelector.tsx` to render the display text
   below the candidate name in its option row, using
   text-text-tertiary styling. Omit entirely when
   `spectrum_status === "absent"`.
3. Update `SelectedHeader.tsx` to show the display text next to
   the first-name + partyShort line in each chip.
4. Keep existing accessibility labels intact; extend them to
   include the spectrum text when present.
5. Unit tests:
   - `comparison-projection.test.ts` — projection populates
     both new fields from aggregated input.
   - `CandidateSelector.test.tsx` — renders the subtitle when
     present, omits it when absent.
   - `SelectedHeader.test.tsx` — renders spectrum text inside
     the chip.

## Acceptance Criteria

- [ ] `ComparisonProjection` carries the two new fields
- [ ] Selector card subtitles render per spec (4 status
      branches)
- [ ] Sticky selected-header chips render per spec
- [ ] Existing comparison tests still pass
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds

## Hints

- Do not duplicate the helper logic — compute projection fields
  by calling `deriveSpectrumLabel(aggregated, "fr")` in the
  projection builder and passing the result's `displayText` and
  `status` into the projection record.
- Keep selector card width stable across all four branches
  (reserve min-height so cards don't jump).

## Editorial check

- [ ] The comparison page still has **no aggregate "overall
      ranking"** — the spectrum label is per-candidate, displayed
      independently, not compared or sorted
- [ ] No color coding of the label by left/right (would be
      editorial)
