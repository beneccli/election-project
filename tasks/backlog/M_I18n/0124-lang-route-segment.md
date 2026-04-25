---
id: "0124"
title: "[lang] route segment for landing, candidate, and comparison pages"
type: task
status: open
priority: high
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - docs/specs/website/i18n.md
  - site/app/layout.tsx
  - site/app/page.tsx
  - site/app/candidat/[id]/page.tsx
  - site/app/comparer/page.tsx
  - site/lib/lang-context.tsx
  - site/next.config.mjs
test_command: npm run build --workspace site
depends_on: ["0123"]
---

## Context

Per spec §4.2, EN pages live under `/en/...` while FR stays canonical
at the bare path. We add a `[lang]` route subtree under `app/[lang]/`
mirroring the FR routes.

## Objectives

1. Create `site/app/[lang]/layout.tsx`:
   - Sets `<html lang>` from the `[lang]` segment.
   - Wraps children in `<LangProvider initial={lang}>`.
   - `generateStaticParams`: returns `[{ lang: "en" }]` (extensible).
2. Create `site/app/[lang]/page.tsx` (EN landing) — imports the same
   page body as FR `app/page.tsx`, passes `lang="en"`.
3. Create `site/app/[lang]/candidat/[id]/page.tsx` — same body as FR
   candidate page, passes `lang="en"`. `generateStaticParams`
   enumerates `lang × candidate` (one EN page per candidate).
   Calls `loadCandidate(id, "en")` and renders the
   `TranslationFallbackBanner` (introduced in task 0126) when
   `bundle.translation.status === "missing"`.
4. Create `site/app/[lang]/comparer/page.tsx` — same body as FR
   comparison page, passes `lang="en"`.
5. Refactor: extract the page bodies of the three FR pages into
   shared components under `site/components/pages/` so the FR and EN
   route files become thin shells. No prop-drilling beyond `lang`,
   `id`, `selectedCandidates`.
6. Update `LangProvider` to accept an `initial: Lang` prop (URL-
   derived) and remove the `localStorage` read/write — the URL is the
   source of truth.
7. `app/layout.tsx` keeps `<LangProvider initial="fr">` for the FR
   tree.

## Acceptance Criteria

- [ ] `npm run build --workspace site` produces static HTML for `/`,
      `/candidat/<id>`, `/comparer`, `/en`, `/en/candidat/<id>`,
      `/en/comparer`.
- [ ] Inspecting the generated `<html lang>` attribute shows `fr` on
      FR pages and `en` on EN pages.
- [ ] No client-side `localStorage` read for language remains in
      `LangProvider`.
- [ ] No regression in existing FR routes: `npm run test --workspace
      site` still passes.

## Editorial check

- [ ] Every candidate present in `/candidat/[id]` appears at
      `/en/candidat/[id]` (symmetric scrutiny — fall back to FR
      content rather than removing the candidate from the EN tree).
