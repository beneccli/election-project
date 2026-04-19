---
id: "0056"
title: "Anchors + i18n literal resolver"
type: task
status: open
priority: medium
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/analysis/political-positioning.md
test_command: pnpm --filter site test
depends_on: ["0053"]
---

## Context

Two small shared utilities needed by the UI: the anchor figures displayed on
each positioning axis (shared across all candidates — editorial requirement)
and a minimal FR/EN literal resolver for UI chrome strings.

## Objectives

1. `site/lib/anchors.ts` — export a constant object keyed by axis
   (`economic`, `social_cultural`, `sovereignty`, `institutional`,
   `ecological`) with an array of anchor entries:
   ```ts
   { label: { fr: string; en: string }, position: number }
   ```
   Pull anchors from `docs/specs/analysis/political-positioning.md`. If
   anchors are not yet fully enumerated there, use the prototype's axis
   metadata as a placeholder and add a TODO comment citing the spec section
   to verify.
2. `site/lib/i18n.ts` — export:
   ```ts
   export type Lang = "fr" | "en";
   export type I18nString = { fr: string; en: string };
   export function t(s: I18nString, lang: Lang): string;
   ```
   Plus a `UI_STRINGS` object containing every hardcoded chrome string used
   in section headers, section nav labels, buttons, and the transparency
   footer stub. FR is canonical — EN strings may be English placeholders
   ("[EN] Synthèse") for now.
3. `site/components/chrome/LanguageToggle.tsx` (client) — toggles a `lang`
   prop propagated via React context. Stores to
   `localStorage["e27-lang"]`, defaults to `"fr"`.
4. Unit tests for `t()` and a snapshot of `UI_STRINGS` so accidental
   deletions fail loudly.

## Acceptance Criteria

- [ ] `anchors.ts` exports anchors for all 5 axes; positions are integers
      in `[-5, +5]`
- [ ] `i18n.ts` exports the helper and the string registry
- [ ] `LanguageToggle` is a `"use client"` component that updates a
      `LangContext` provider defined in the same file
- [ ] Tests pass
- [ ] If political-positioning.md lacks enumerated anchors, a TODO comment
      exists linking to the spec section and listing the placeholder set

## Hints for Agent

- Keep `UI_STRINGS` alphabetized by key so future PRs produce clean diffs.
- The `Lang` context default should be `"fr"` — do not attempt to detect
  from `Accept-Language` (that would require middleware, which breaks
  static export).

## Editorial check

- [ ] Anchors are identical across all candidates (no candidate-specific
      anchor overrides allowed)
- [ ] The i18n layer never applies to aggregated content — only UI chrome
