---
id: "0091"
title: "Comparison route: picker state machine (URL + localStorage)"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Comparison
spec: docs/specs/website/comparison-page.md
context:
  - Comparison Page.html
  - site/app/candidat/[id]/page.tsx
  - site/lib/candidates.ts
  - docs/specs/website/comparison-page.md
test_command: pnpm --filter site test -- comparer
depends_on: []
---

## Context

M_Comparison introduces the `/comparer` page. This task lays the
foundation: the route, the URL query ↔ localStorage selection state
machine, and the 2–4 / fictional / unknown-id guards. No visual widgets
yet — this task must land before any comparison widget can be mounted.

## Objectives

1. Create `site/app/comparer/page.tsx` (server component) that:
   - statically renders the page shell (NavBar, page hero, transparency
     footer — all existing chrome),
   - loads the full `ComparisonProjection[]` at build time from
     `listCandidates()` + `loadCandidate()`,
   - embeds the projection list into a single client island
     `<ComparisonBody>`.
2. Create `<ComparisonBody>` (client component) owning selection state:
   - Reads `?c=<id>` (possibly repeated) from `useSearchParams`.
   - If URL empty on mount, hydrates from `localStorage["e27-compare"]`.
   - On change, writes back to BOTH URL (`router.replace`, shallow) and
     localStorage.
   - Caps at 4; ignores the 5th click with a "max atteint" marker on
     the picker.
   - Drops unknown / non-analyzable / fictional (unless
     `EXCLUDE_FICTIONAL !== "1"` env at build time) ids silently on
     hydration.
   - Exposes selected `ComparisonProjection[]` via context to child
     sections.
3. Add a minimal placeholder for the four comparison sections (empty
   named components that render a TODO panel) so the route builds.

## Acceptance Criteria

- [ ] Route `/comparer` resolves at build time (`pnpm --filter site build`
      succeeds with `test-omega` as sole candidate).
- [ ] Selection order = URL query order = color slot index (tested).
- [ ] URL/localStorage round-trip: set 2 ids → reload → 2 ids still
      selected.
- [ ] Fifth selection click is ignored, existing 4 untouched.
- [ ] Unknown / fictional (when excluded) ids removed on hydration.
- [ ] Below 2 selected, an empty state is rendered; no section widgets
      mount.
- [ ] No editorial copy mentions "winner", "classement général", etc.
      (lint-style regex test).
- [ ] `pnpm --filter site typecheck` and `pnpm --filter site lint` clean.

## Hints for Agent

- `loadCandidate()` already throws on schema invalidation — catch and
  mark `analyzable: false`.
- The candidate page already shows how to compose NavBar + page chrome.
- See spec §5 for state-machine guard rules.
- Editorial check: grep the new files for forbidden vocabulary; the
  regression test in task `0098` enforces this too.
