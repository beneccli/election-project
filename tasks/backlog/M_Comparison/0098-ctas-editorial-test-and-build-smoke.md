---
id: "0098"
title: "Comparison CTAs + editorial regression test + build smoke"
type: task
status: open
priority: medium
created: 2026-04-22
milestone: M_Comparison
spec: docs/specs/website/comparison-page.md
context:
  - site/app/page.tsx
  - site/app/candidat/[id]/page.tsx
  - docs/specs/website/comparison-page.md
test_command: pnpm --filter site test -- comparison-editorial
depends_on: ["0097"]
---

## Context

Closing task for M_Comparison: wire entry points, enforce editorial
guardrails via a regression test, and verify the static export.

## Objectives

1. **Landing page CTA:** add a "Comparer plusieurs candidats" / "Compare
   candidates" button on `/` that routes to `/comparer?c=<id1>&c=<id2>`
   with the two most-recently-updated analyzable candidates.
2. **Candidate page CTA:** small inline link "Comparer à un autre
   candidat →" on the candidate page hero that routes to
   `/comparer?c=<this>`.
3. **Editorial regression test** (`site/app/comparer/comparer.editorial.test.tsx`):
   - Render `/comparer` (via test harness) with 4 fixture candidates.
   - Assert that the rendered DOM does NOT contain any of:
     `["gagnant", "winner", "vainqueur", "classement général",
      "score global", "meilleur candidat", "best candidate"]`.
   - Assert no element has an `aria-label` or title suggesting overall
     ranking.
4. **Build smoke:**
   - `pnpm --filter site build` succeeds.
   - `/comparer.html` is present in `site/out/`.
   - `/comparer.html` at build time contains every analyzable
     candidate id (the full projection list is embedded).
5. **Docs:** append a short §"Comparison" subsection to
   `site/README.md` documenting the URL query, localStorage key, and
   the editorial constraints.

## Acceptance Criteria

- [ ] Landing CTA pre-selects two candidates in URL order by recency.
- [ ] Candidate-page CTA pre-fills one slot with the current candidate.
- [ ] Editorial regression test passes and fails loudly when any
      forbidden word is inserted into a comparison component (negative
      test in the PR description).
- [ ] `pnpm --filter site build` passes.
- [ ] `site/out/comparer.html` exists and includes the projection
      payload.
- [ ] `pnpm --filter site test`, `typecheck`, and `lint` all clean.

## Hints for Agent

- The "most recently updated" ordering is already available via
  `listCandidates()` — sort by `updatedAt` descending.
- The editorial regression test is the last line of defense; please
  document its rationale in a short comment pointing to
  `docs/specs/analysis/editorial-principles.md`.
