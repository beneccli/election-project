---
id: "0126"
title: "LanguageToggle as URL navigator + TranslationFallbackBanner"
type: task
status: open
priority: high
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - docs/specs/website/i18n.md
  - site/components/chrome/LanguageToggle.tsx
  - site/components/chrome/NavBar.tsx
  - site/components/chrome/LandingNavBar.tsx
  - site/components/chrome/ComparisonNavBar.tsx
test_command: npm run test --workspace site -- "LanguageToggle|TranslationFallbackBanner"
depends_on: ["0124"]
---

## Context

Per spec §4.4 and §6, the language toggle must navigate to the
equivalent route in the other locale, preserving query strings; and
candidate pages must show a fallback banner when only FR content is
available for the current locale.

## Objectives

1. Rewrite `LanguageToggle.tsx` to:
   - Read the current pathname (and query string) via Next.js
     navigation hooks.
   - Compute the swapped target: prepend or strip `/en` segment.
   - Render as a `<Link>` (preserving accessibility label).
   - Remove the `useLang().setLang` call (state is now URL-derived).
2. Verify all three nav bars (`NavBar`, `LandingNavBar`,
   `ComparisonNavBar`) embed the new toggle correctly.
3. Create `site/components/chrome/TranslationFallbackBanner.tsx`:
   - Dismissible (session-only, no persistence).
   - Renders only when `bundle.translation.status === "missing"` and
     `lang !== "fr"`.
   - String from new `UI_STRINGS.TRANSLATION_FALLBACK_*` entries
     (added in task 0127).
4. Wire the banner into the EN candidate page (just below `<Hero>`).
5. Tests:
   - `LanguageToggle.test.tsx` — pathname swap correct on FR root,
     EN root, candidate route, comparison with query string.
   - `TranslationFallbackBanner.test.tsx` — renders only in EN with
     missing status; dismissible.

## Acceptance Criteria

- [ ] Clicking the toggle on `/comparer?c=a&c=b` navigates to
      `/en/comparer?c=a&c=b`.
- [ ] Clicking it on `/en/candidat/x` navigates to `/candidat/x`.
- [ ] EN candidate page renders fallback banner when no
      `aggregated.en.json` exists; FR page never renders it.
- [ ] All tests pass; lint and typecheck clean.
