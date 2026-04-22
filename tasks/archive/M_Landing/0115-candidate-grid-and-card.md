---
id: "0115"
title: "Landing: `<CandidateGrid>` + `<CandidateCard>` with family filter"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Landing
spec: docs/specs/website/landing-page.md
context:
  - docs/specs/website/landing-page.md
  - Landing Page.html
  - site/components/widgets/GradeBadge.tsx
  - site/components/chrome/Hero.tsx
test_command: pnpm --filter site test -- CandidateCard CandidateGrid
depends_on: ["0112"]
---

## Context

Render the filter pills + candidate grid per spec §5.5 and §5.6. The
card has two variants (analyzed / pending) rendered by the same
discriminated-union component. Extract the spectrum-pill markup from
the candidate-page `Hero.tsx` to a shared widget so both surfaces use
the same visual.

## Objectives

1. Extract `site/components/widgets/SpectrumPill.tsx` from the inline
   spectrum chip markup in `Hero.tsx`; candidate-page Hero imports the
   new component (identical visual output guaranteed by snapshot test).
2. `site/components/landing/CandidateCard.tsx` (client):
   - Analyzed variant: party stripe, party pill, grade badge, axis
     mini-bar (dot at `((ecoAxis + 5) / 10) * 100%`, or "—" when null),
     spectrum pill, footer with date + "Voir l'analyse →".
   - Pending variant: party stripe, party pill, "Analyse à venir"
     pill, no grade/axis, `aria-disabled`, no link.
3. `site/components/landing/CandidateGrid.tsx` (client):
   - Owns filter-pill state (local only; no URL, no localStorage).
   - Filter pills: Tous / Gauche / Centre / Droite / Écologie.
   - IntersectionObserver fade-in with `prefers-reduced-motion`
     short-circuit.
4. Grid uses `grid-cols-4` at `≥1024px`, `grid-cols-3` down to
   `720 px`, `grid-cols-2` below, `grid-cols-1` below `440 px`.

## Acceptance Criteria

- [ ] Pending card has no href, no grade, no axis dot
- [ ] Analyzed card with `ecoAxis === null` renders "—" instead of a
      dot (test fixture required)
- [ ] Filter pill selection hides non-matching cards + updates a
      visible count
- [ ] Extraction regression: candidate-page `Hero` test still passes
      with the new `SpectrumPill` import
- [ ] Grid shows cards in `updatedAt` desc, `displayName` asc order
      (analyzed + pending interleaved)
- [ ] a11y: filter pills are `<button role="radio">` inside a
      `role="radiogroup"` with labeled count
- [ ] Lint + typecheck + test clean

## Hints for Agent

- `GradeBadge` already exists in `site/components/widgets/`.
- Existing `Hero.tsx` spectrum chip starts at the `<a href="#positionnement">`
  block — copy into `SpectrumPill` verbatim then swap the anchor target
  via a prop.

## Editorial check

- [ ] No ranking copy on cards ("top", "meilleur", "classement").
- [ ] Same card shape for every analyzed candidate and every pending
      candidate (symmetric scrutiny).
- [ ] `ecoAxis` is a single ordinal modal — no compositing.
