---
id: "0123"
title: "Locale-aware loadCandidate + listCandidates.availableLocales"
type: task
status: open
priority: high
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - docs/specs/website/i18n.md
  - site/lib/candidates.ts
  - site/lib/candidates.test.ts
  - site/lib/i18n.ts
test_command: npm run test --workspace site -- candidates
depends_on: ["0121"]
---

## Context

The build-time loader currently reads only `aggregated.json`. Per
spec §4.1, it must support an optional `lang` parameter that resolves
`aggregated.<lang>.json` with FR fallback, and surface the resolution
status to the page.

## Objectives

1. Extend `loadCandidate(id, lang: Lang = "fr")` to:
   - For `lang === "fr"`: unchanged behavior.
   - For `lang !== "fr"`: try `aggregated.<lang>.json`; on miss, fall
     back to FR `aggregated.json`; populate
     `bundle.translation = { lang, status: "available" | "missing" }`.
   - For `lang === "fr"`: `bundle.translation = { lang: "fr", status:
     "native_fr" }` (always present, simplifies caller logic).
2. When a translation file is found, run the parity validator
   (imported from `@pipeline/validate-translation` or replicated
   helper) as a **warning** (`console.warn`), never fail the build.
3. Extend `listCandidates()` to include `availableLocales: Lang[]`
   per entry, computed by scanning `current/aggregated.<lang>.json`
   files.
4. Update `CandidateBundle` and `CandidateIndexEntry` types
   accordingly.
5. Tests in `candidates.test.ts`:
   - `loadCandidate(id, "en")` returns translation when present.
   - `loadCandidate(id, "en")` falls back with `status: "missing"`
     when absent.
   - `loadCandidate(id, "fr")` unchanged (regression).
   - `listCandidates()` returns `availableLocales` correctly for a
     mix of FR-only and FR+EN candidates.

## Acceptance Criteria

- [ ] All new and existing tests pass: `npm run test --workspace site`.
- [ ] No type errors: `npm run typecheck`.
- [ ] FR-only callers still work without code change (default `lang`).
- [ ] Page-level callers can branch on `bundle.translation.status` to
      render the missing-translation banner.
