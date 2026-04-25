---
id: "0125"
title: "Comparison + landing pages: locale-aware data wiring + FR-only tag"
type: task
status: open
priority: medium
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - docs/specs/website/i18n.md
  - site/components/comparison/CandidateSelector.tsx
  - site/components/comparison/ComparisonBody.tsx
  - site/components/landing/
  - site/lib/landing-cards.ts
  - site/lib/derived/comparison-projection.ts
test_command: npm run test --workspace site -- "comparison|landing"
depends_on: ["0124"]
---

## Context

The comparison and landing pages aggregate data from many candidates.
Once the loader is locale-aware (task 0123) and the routing is in
place (task 0124), these pages need to:

1. Use the locale-resolved bundle for each candidate.
2. Display a small "FR" tag on candidates whose `aggregated.<lang>.json`
   is missing (i.e. fell back to FR), without removing them.

## Objectives

1. Update `comparison-projection.ts` and `landing-cards.ts` to accept
   a `lang: Lang` parameter and call `loadCandidate(id, lang)` per
   candidate.
2. Threading `lang` from the EN route shells into the projection
   functions.
3. In `CandidateSelector`, render a small uppercase `FR` chip next to
   any candidate whose `availableLocales` (from `listCandidates`)
   does not include the current `lang`.
4. In landing-page candidate cards, same chip placement (top-right
   corner).
5. Tests:
   - `comparison-projection.test.ts` — locale propagation; FR-only
     candidate flagged.
   - `landing-cards.test.ts` — same.
   - `CandidateSelector.test.tsx` — chip renders for FR-only
     candidate when `lang === "en"`.

## Acceptance Criteria

- [ ] Selecting candidates on `/en/comparer` resolves their EN
      content where available and falls back to FR with an `FR` chip
      otherwise.
- [ ] Landing `/en` shows all candidates; FR-only ones marked with
      the chip.
- [ ] No candidate is dropped from the EN locale.
- [ ] All tests pass; lint and typecheck clean.

## Editorial check

- [ ] Symmetric scrutiny preserved: FR-only candidates remain visible
      in EN with explicit provenance marker.
- [ ] No candidate-specific UI branching beyond the chip flag.
