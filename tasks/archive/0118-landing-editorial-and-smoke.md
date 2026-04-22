---
id: "0118"
title: "Landing: editorial regression + build smoke tests"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Landing
spec: docs/specs/website/landing-page.md
context:
  - docs/specs/website/landing-page.md
  - site/components/comparison/ComparisonBody.test.tsx
test_command: pnpm --filter site test -- landing-editorial
depends_on: ["0117"]
---

## Context

Editorial safeguards from spec §2 and §8 need automated enforcement so
future changes cannot drift into advocacy. Mirror the approach used by
`comparison-editorial.test.tsx`.

## Objectives

1. `site/app/__tests__/landing-editorial.test.tsx`:
   - Render the landing page with a fixture covering 1 analyzed
     (`test-omega`) + 2 pending candidates
   - Assert the rendered DOM contains NONE of:
     `["classement", "gagnant", "meilleur candidat", "winner",
       "catastrophique", "crise", "désastre", "disaster",
       "score global"]`
   - Assert headline stat numbers have no class in
     `{"bad","warn","text-risk-red","text-amber-500"}` and no inline
     `color:` style containing `red` / `oklch(... 25 )` (risk-red token)
   - Assert the compare CTA does NOT render a "Bientôt" / "Soon" pill
2. Build smoke in CI: `pnpm --filter site build` stays green on the
   `test-omega`-only scenario (no new config needed; add a note to
   the site README if a custom env var is introduced).
3. Add a short `Editorial safeguards` section to `site/README.md`
   referencing this test and the spec.

## Acceptance Criteria

- [ ] Editorial regression test passes on the current implementation
      and fails if a banned word is injected into a landing component
- [ ] Build smoke passes locally
- [ ] `site/README.md` has a pointer to the editorial safeguard test
- [ ] Lint + typecheck + test clean

## Editorial check

- [ ] Banned-word list matches `docs/specs/analysis/editorial-principles.md`
      guidance (measurement over indictment, analysis not advocacy).
