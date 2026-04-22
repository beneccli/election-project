---
id: "0097"
title: "Comparison page shell: hero, selector, sticky header, empty state"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Comparison
spec: docs/specs/website/comparison-page.md
context:
  - Comparison Page.html
  - site/components/chrome/NavBar.tsx
  - site/components/chrome/TransparencyFooter.tsx
  - docs/specs/website/comparison-page.md
test_command: pnpm --filter site test -- ComparisonBody
depends_on: ["0091", "0093", "0094", "0095", "0096"]
---

## Context

All widgets exist. This task wires the page shell to match the
prototype: page hero, candidate selector, sticky selected-header,
empty state, and the four sections laid out under the main container.

## Objectives

1. `site/components/comparison/CandidateSelector.tsx`:
   - Horizontal scroll row of tiles (one per candidate from
     `listComparisonProjections()`).
   - Tile layout matches prototype `CandidateSelector`.
   - Disabled when `!analyzable` or when `maxReached && !selected`.
2. `site/components/comparison/SelectedHeader.tsx` (sticky under NavBar
   at `top: var(--nav-h)`):
   - Chip per selected candidate: color dot + small `<GradeBadge>` +
     name + position.
3. Page hero in `site/app/comparer/page.tsx`: kicker "Comparaison" /
   "Comparison", h1 "Confronter les programmes" / "Side-by-side
   programme analysis", subtitle copy from prototype (FR + EN).
4. Empty-state panel below selector when fewer than 2 candidates
   selected.
5. Assemble under the main `<main class="mx-auto max-w-[1100px] px-10
   pb-24">` container: Selector → SelectedHeader → PositionnementComparison →
   DomainesComparison → IntergenComparison → RisquesComparison.
6. Add a scoped transparency footer variant listing each selected
   candidate's `Version metadata.json` link (no raw-outputs drawer on
   this page).

## Acceptance Criteria

- [ ] Prototype `Comparison Page.html` and implemented `/comparer` are
      visually aligned at 1280×900, 4 candidates, both themes.
- [ ] Empty state renders below 2 selected; disappears at ≥ 2.
- [ ] Sticky header appears only once 2+ candidates are selected.
- [ ] Keyboard accessibility: every selector tile is a focusable
      button with an accessible label including name + party + grade.
- [ ] Dark theme token round-trip works (no hard-coded hex).
- [ ] No `<Drawer>` mounted on this page.

## Hints for Agent

- The prototype uses inline styles; prefer Tailwind + CSS vars to match
  site conventions established in M_WebsiteCore.
- Reuse the `useLang()` pattern from the candidate page.
