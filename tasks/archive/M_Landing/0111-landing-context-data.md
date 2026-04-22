---
id: "0111"
title: "Landing: France-level context data module (stats + chart series)"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Landing
spec: docs/specs/website/landing-page.md
context:
  - docs/specs/website/landing-page.md
  - Landing Page.html
  - site/lib/i18n.ts
test_command: pnpm --filter site test -- landing-context
depends_on: []
---

## Context

The landing page's hero shows three headline stats and two France-level
area charts (public debt 2000–2025, population 65+ 2000–2050 with
projection from 2025). These values are factual, are NOT derived from
any candidate, and must carry source attributions. See spec §3.2.

## Objectives

1. Create `site/lib/landing-context.ts` exporting typed `CONTEXT_STATS`
   and `CONTEXT_SERIES` constants with `I18nString` labels and source
   URLs (values copied verbatim from `Landing Page.html`).
2. Add a short README comment at the top of the file naming the
   updater role and documenting that these values are manually
   maintained (never auto-fetched).
3. Export `ContextStat` and `ContextSeries` TypeScript types matching
   the spec.

## Acceptance Criteria

- [ ] `site/lib/landing-context.ts` exists with typed exports
- [ ] Each series entry includes a `source.url` and `source.label`
- [ ] Demographics series has `projectionFrom: 2025`
- [ ] Debt series has `refLine: { y: 60, label: "Critère 60% (Maastricht)" }`
- [ ] Unit test asserts both series are non-empty, monotonically
      increasing on year, and that `projectionFrom` (when set) is
      present in the `points` year set
- [ ] No candidate data is imported in this module
- [ ] Lint + typecheck clean

## Hints for Agent

- Shape mirrors `Landing Page.html` `debtData` / `demoData` arrays.
- Use existing `I18nString` type from `site/lib/i18n.ts`.
- Do NOT add moral adjectives to `label` strings; factual only.

## Editorial check

- [ ] No advocacy language in copy ("crise", "catastrophe" banned).
- [ ] Sources cited for every numeric series.
