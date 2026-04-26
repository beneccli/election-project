---
id: "0127"
title: "Complete real EN translations for all UI_STRINGS"
type: task
status: open
priority: medium
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - docs/specs/website/i18n.md
  - docs/specs/website/i18n-string-audit.md
  - site/lib/i18n.ts
  - site/lib/i18n.test.ts
test_command: npm run test --workspace site -- i18n
depends_on: ["0120"]
---

## Context

The `UI_STRINGS` table currently contains many `[EN] …` placeholders
and is missing entries for strings discovered in the audit (task
0120). This task makes the EN UI shippable.

## Objectives

1. For every entry in `UI_STRINGS` whose `en` value starts with
   `[EN] ` or matches the FR string verbatim where translation is
   meaningful, write a real EN translation following the guidelines
   in spec §5.
2. Add new `UI_STRINGS` entries for every offender from the audit
   (task 0120's `i18n-string-audit.md`).
3. Add `TRANSLATION_FALLBACK_TITLE`, `TRANSLATION_FALLBACK_BODY`,
   `TRANSLATION_FALLBACK_DISMISS` entries used by the banner (task
   0126).
4. Extend `i18n.test.ts` with a test asserting that **no** `UI_STRINGS`
   value (FR or EN) starts with `[EN] ` or is empty.
5. Replace any hardcoded FR string identified by the audit with a
   `t(UI_STRINGS.KEY, lang)` call.

## Acceptance Criteria

- [ ] No `[EN] …` placeholders remain anywhere in `UI_STRINGS`.
- [ ] The "no placeholder, no empty" test passes.
- [ ] No grep hit for visible French text in `site/components/**`
      and `site/app/**` outside of `i18n.ts`, fixtures, comments, or
      JSON imports.
- [ ] All tests pass; lint and typecheck clean.

## Editorial check

- [ ] Spectrum labels translated as political vocabulary (Centre →
      Centre, Droite → Right) — never as party names.
- [ ] Section labels translated literally (Synthèse → Summary, etc.) —
      no rewriting that adds editorial framing.
