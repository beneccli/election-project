---
id: "0053"
title: "Tailwind + OKLCH token port + typography + theme toggle"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - Candidate Page.html
test_command: pnpm --filter site build
depends_on: ["0052"]
---

## Context

Port the `Candidate Page.html` prototype's design tokens (OKLCH CSS variables,
light + dark theme) into the `site/` package under Tailwind CSS. Wire up
`next/font` for `Cormorant Garamond` (display) and `DM Sans` (text). Add a
client-side `ThemeToggle` that toggles `data-theme="dark"` on `<html>` and
persists to localStorage.

## Objectives

1. Add Tailwind v3 to `site/` (`tailwindcss`, `postcss`, `autoprefixer`).
2. Create `site/tailwind.config.ts` with `theme.extend.colors` pulling from
   CSS variables (see spec §5.1). Include `content: ["./app/**/*.{ts,tsx}",
   "./components/**/*.{ts,tsx}"]`.
3. Create `site/postcss.config.mjs`.
4. Create `site/styles/globals.css` with the full OKLCH token set from
   `Candidate Page.html` `:root` and `[data-theme="dark"]` (copy verbatim),
   plus Tailwind's `@tailwind base; @tailwind components; @tailwind
   utilities;`.
5. Import `globals.css` from `site/app/layout.tsx`.
6. Wire `next/font/google` Cormorant Garamond + DM Sans as CSS variables
   `--font-display` and `--font-text` (spec §5.2). Map into
   `tailwind.config.ts` `fontFamily`.
7. Implement `site/components/chrome/ThemeToggle.tsx` as a `"use client"`
   component: a small pill button that toggles the `data-theme` attribute
   on `document.documentElement` and mirrors state to `localStorage["e27-theme"]`.
   On mount, read from localStorage and apply.
8. Expose the toggle in `app/layout.tsx` header area so the placeholder page
   can exercise it.

## Acceptance Criteria

- [ ] Placeholder `/` page renders with the prototype's light-mode colors and
      typography
- [ ] Clicking theme toggle flips to dark mode; all tokens swap via CSS
      variables (no flash of unstyled content)
- [ ] Reload preserves theme selection
- [ ] `pnpm --filter site build` still succeeds
- [ ] No Tailwind class purging surprises — verify by inspecting
      `site/out/_next/static/css/*.css`

## Hints for Agent

- The prototype's variables use `oklch(...)` values directly. Keep them as
  literals inside `:root` / `[data-theme="dark"]`. Tailwind can reference
  them via `theme.extend.colors.bg = "oklch(var(--bg))"` only if the
  variable holds the **inner** of the `oklch()` call. Two options:
  - (a) Store inner values: `--bg: 0.975 0.007 75;` and use
    `oklch(var(--bg))` in Tailwind config.
  - (b) Store full `oklch(...)` strings: `--bg: oklch(0.975 0.007 75);` and
    use `var(--bg)` directly in Tailwind config (no wrapping).
  Pick (b) for simplicity — matches the prototype's storage format.
- Dark mode does NOT use Tailwind's `dark:` variant (spec §5.1 decision).
  The variables swap instead.

## Editorial check

Not applicable — visual tokens only, no candidate-specific copy.
