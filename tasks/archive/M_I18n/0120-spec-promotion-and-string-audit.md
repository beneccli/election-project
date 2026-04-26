---
id: "0120"
title: "Promote i18n spec to Stable + audit hardcoded FR strings in components"
type: task
status: open
priority: high
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - docs/specs/website/i18n.md
  - docs/specs/README.md
  - site/components/
  - site/app/
  - site/lib/i18n.ts
test_command: npm run test --workspace site -- i18n
depends_on: []
---

## Context

The M_I18n spec lands as Draft. Before any implementation, we (a)
promote it to Stable in `docs/specs/README.md`, and (b) produce the
exhaustive audit of hardcoded French strings still present in
components and route files. Subsequent tasks operate from this audit.

## Objectives

1. Bump the i18n spec status from Draft to Stable in
   `docs/specs/website/i18n.md` and add the entry to
   `docs/specs/README.md` under `website/`.
2. Grep `site/components/**/*.tsx` and `site/app/**/*.tsx` for any
   hardcoded French string (heuristic: unicode characters in the
   French set, common FR words such as `Comparer`, `Synthèse`,
   `Domaines`, `Risques`, `Méthode`, `Programme`, `Voir`, accented
   words, `«`/`»`, etc.).
3. Output the audit as `docs/specs/website/i18n-string-audit.md` with
   one row per offender: file, line, string, proposed `UI_STRINGS` key.
4. Strings in fixtures, comments, doc-strings, and JSDoc are excluded
   from the audit.

## Acceptance Criteria

- [ ] `docs/specs/website/i18n.md` header reads `Status: Stable`.
- [ ] `docs/specs/README.md` lists `website/i18n.md` under `website/`.
- [ ] `docs/specs/website/i18n-string-audit.md` exists with at least
      every visible French string from the candidate, comparison and
      landing pages catalogued.
- [ ] No code changes yet — this task is spec promotion + audit only.
- [ ] All tests pass: `npm run test --workspace site`.

## Hints for Agent

- Existing `UI_STRINGS` keys in `site/lib/i18n.ts` show the naming
  pattern (SCREAMING_SNAKE, prefixed by surface area).
- The audit should NOT include strings already going through `t()`.
