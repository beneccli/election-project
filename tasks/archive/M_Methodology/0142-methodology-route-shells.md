---
id: "0142"
title: "Methodology: route shells (`/methodologie` + `/en/methodologie`)"
type: task
status: open
priority: high
created: 2026-04-26
milestone: M_Methodology
spec: docs/specs/website/methodology-page.md
context:
  - docs/specs/website/methodology-page.md
  - site/app/comparer/page.tsx
  - site/app/[lang]/comparer/page.tsx
  - site/components/pages/ComparerPageBody.tsx
  - site/lib/i18n.ts
test_command: pnpm --filter site build
depends_on: ["0141", "0143"]
---

## Context

The methodology page needs two static route shells matching the
existing `/comparer` pattern: an FR canonical shell at
`site/app/methodologie/page.tsx` and an EN-prefixed shell at
`site/app/[lang]/methodologie/page.tsx`. Both delegate to a shared
server component `MethodologyPageBody`.

## Objectives

1. Create `site/app/methodologie/page.tsx` — exports `metadata` from
   FR `META_METHODOLOGIE_*` strings, renders `<MethodologyPageBody lang="fr" />`.
2. Create `site/app/[lang]/methodologie/page.tsx` — exports `metadata`
   from EN strings, awaits `params`, narrows `lang`, renders the body.
3. The two shells together must produce
   `out/methodologie/index.html` and `out/en/methodologie/index.html`
   in the static export.
4. No client islands, no dynamic params beyond `lang`.

## Acceptance Criteria

- [ ] Both routes export the page successfully via
      `pnpm --filter site build`.
- [ ] `out/methodologie/index.html` and `out/en/methodologie/index.html`
      both exist after build.
- [ ] The shells are thin wrappers (≤ 25 LOC each); all rendering is
      delegated to `MethodologyPageBody`.
- [ ] Page metadata uses the new `META_METHODOLOGIE_TITLE` and
      `META_METHODOLOGIE_DESCRIPTION` strings.
- [ ] `pnpm --filter site typecheck` passes.

## Hints for Agent

- `site/app/comparer/page.tsx` and `site/app/[lang]/comparer/page.tsx`
  are the closest precedent — copy the structure, change the
  i18n keys and component import.
- `MethodologyPageBody` ships in task `0143`; this task depends on
  it and on `0141` (i18n strings).

## Editorial check

- [ ] Shells contain no copy — all copy comes from `UI_STRINGS`.
