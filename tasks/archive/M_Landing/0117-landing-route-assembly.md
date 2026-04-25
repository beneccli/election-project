---
id: "0117"
title: "Landing: assemble `/` route + page metadata + i18n wiring"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Landing
spec: docs/specs/website/landing-page.md
context:
  - docs/specs/website/landing-page.md
  - site/app/page.tsx
  - site/app/layout.tsx
  - site/app/comparer/page.tsx
test_command: pnpm --filter site test -- page
depends_on: ["0112", "0114", "0115", "0116"]
---

## Context

Replace the placeholder landing page with the real one per spec §5.1.

## Objectives

1. Rewrite `site/app/page.tsx` to:
   - Call `listLandingCards()` at build time
   - Render `<LandingNavBar>`, `<LandingHero>`, `<CandidateGrid>`,
     `<CompareCta>`, `<MethodologyBlock>`, `<LandingFooter>`
   - Export `metadata` with FR title + description
2. Ensure the page is a pure server component (children islands
   marked `"use client"`).
3. Verify the page builds under static export: `pnpm --filter site build`
   produces `site/out/index.html` with all expected sections.
4. Add a route-level test (`site/app/__tests__/page.test.tsx`) that:
   - Renders the page with a stubbed `listLandingCards`
   - Asserts analyzed-count label matches input
   - Asserts the compare CTA href has two `c=` params when ≥2
     analyzable candidates

## Acceptance Criteria

- [ ] `site/app/page.tsx` is a server component
- [ ] Route-level test passes
- [ ] `pnpm --filter site build` succeeds end-to-end with
      `test-omega` as the sole analyzable candidate
- [ ] `site/out/index.html` contains the hero title, at least one
      candidate card, the methodology block, the footer
- [ ] Lint + typecheck + test clean

## Hints for Agent

- The existing `site/app/comparer/page.tsx` is the closest precedent.
- Keep the build-time data loader call at the top of the component;
  do NOT put it inside effects.

## Editorial check

- [ ] No copy was added beyond what the spec and prior tasks define.
