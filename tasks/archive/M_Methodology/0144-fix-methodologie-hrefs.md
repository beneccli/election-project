---
id: "0144"
title: "Methodology: fix EN-broken hrefs to `/methodologie`"
type: task
status: open
priority: medium
created: 2026-04-26
milestone: M_Methodology
spec: docs/specs/website/methodology-page.md
context:
  - docs/specs/website/methodology-page.md
  - site/components/landing/MethodologyBlock.tsx
  - site/components/chrome/TransparencyFooter.tsx
  - site/lib/locale-path.ts
test_command: pnpm --filter site test -- "MethodologyBlock|TransparencyFooter|LanguageToggle"
depends_on: ["0142"]
---

## Context

Two existing components hard-code `href="/methodologie"`:

- `site/components/landing/MethodologyBlock.tsx:42`
- `site/components/chrome/TransparencyFooter.tsx:183`

The candidate page transparency drawer has the same pattern (per
`docs/specs/website/i18n.md`). On EN pages this sends users to the
non-existent FR-canonical path instead of `/en/methodologie`. With
the methodology routes now landing in task `0142`, this href bug
becomes user-visible.

## Objectives

1. Replace each occurrence of `href="/methodologie"` with
   `href={localePath("/methodologie", lang)}` in the components above.
2. If any other site code references `/methodologie` directly (grep
   the repo before assuming), apply the same fix.
3. Add a regression assertion: an integration test that renders
   each affected component with `lang="en"` and asserts the rendered
   anchor `href` is `/en/methodologie`.

## Acceptance Criteria

- [ ] No remaining literal `"/methodologie"` strings in `site/components/`
      or `site/app/` (verified by grep, excluding `out/` and `.next/`).
- [ ] `MethodologyBlock` rendered with `lang="en"` produces an anchor
      with `href="/en/methodologie"`.
- [ ] `TransparencyFooter` rendered with `lang="en"` produces an
      anchor with `href="/en/methodologie"`.
- [ ] FR rendering is unchanged (`href="/methodologie"`).
- [ ] `pnpm --filter site test -- "MethodologyBlock|TransparencyFooter|LanguageToggle"` passes.
- [ ] `pnpm --filter site typecheck` passes.

## Hints for Agent

- `site/lib/locale-path.ts` exports `localePath(path, lang)`;
  `site/lib/compare-cta.ts` is the canonical usage example.
- The candidate-page transparency drawer's "Méthodologie complète →"
  link lives inside `TransparencyFooter` (per the existing imports in
  `site/.next/server/chunks/657.js`); confirm by reading the source
  rather than the build output.

## Editorial check

- N/A — this is a routing fix, no copy changes.
