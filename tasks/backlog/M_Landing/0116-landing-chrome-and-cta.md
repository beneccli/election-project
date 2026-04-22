---
id: "0116"
title: "Landing: CompareCta, MethodologyBlock, LandingFooter, LandingNavBar"
type: task
status: open
priority: medium
created: 2026-04-22
milestone: M_Landing
spec: docs/specs/website/landing-page.md
context:
  - docs/specs/website/landing-page.md
  - Landing Page.html
  - site/app/page.tsx
  - site/components/chrome/NavBar.tsx
  - site/components/chrome/ComparisonNavBar.tsx
test_command: pnpm --filter site test -- LandingFooter MethodologyBlock CompareCta LandingNavBar
depends_on: []
---

## Context

Bottom-of-page chrome for the landing route. See spec §5.2, §5.7–5.9.

## Objectives

1. `site/components/chrome/LandingNavBar.tsx` — server component;
   mirrors `ComparisonNavBar` but shows the tagline in the middle slot
   and omits the "Transparence" link.
2. `site/lib/compare-cta.ts` — move `buildCompareCtaHref()` from the
   current `app/page.tsx` into a shared helper; keep its ordering rule
   (`updatedAt` desc, two most recent analyzable candidates).
3. `site/components/landing/CompareCta.tsx` — server component; uses
   the helper; NO "Bientôt" badge (the comparison page is live).
4. `site/components/landing/MethodologyBlock.tsx` — server component;
   two paragraphs + 5 method pills; "En savoir plus →" link pointing
   to `/methodologie`.
5. `site/components/landing/LandingFooter.tsx` — server component;
   brand + footer note + 3 links (Méthode anchor, Dépôt via
   `process.env.NEXT_PUBLIC_REPO_URL` with a compile-time fallback,
   Mentions légales `/mentions-legales`).
6. Add the LANDING_ prefixed strings to `site/lib/i18n.ts`.

## Acceptance Criteria

- [ ] `LandingNavBar` has the language + theme toggles; no candidate
      context
- [ ] `CompareCta` preselects two candidates when ≥2 analyzable exist;
      falls back to `/comparer` with no query otherwise
- [ ] `LandingFooter` renders all three links with correct hrefs
- [ ] All new UI strings present in both `fr` and `en` (EN can be
      placeholder prefixed with `[EN]`, consistent with existing
      `UI_STRINGS` convention)
- [ ] Smoke test for `buildCompareCtaHref` covers 0, 1, and 3+
      analyzable candidates
- [ ] Lint + typecheck + test clean

## Editorial check

- [ ] No candidate recommendation in any copy.
- [ ] Footer note reiterates "Aucune recommandation de vote".
