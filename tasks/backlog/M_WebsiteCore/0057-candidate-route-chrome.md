---
id: "0057"
title: "Candidate route /candidat/[id] + nav + hero + section scrollspy"
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
depends_on: ["0054", "0055", "0056"]
---

## Context

Stand up the candidate page route with `generateStaticParams`, the top
NavBar, the Hero band, and the sticky section navigation (scrollspy). Section
bodies are empty placeholders for now — subsequent tasks fill them in.

## Objectives

1. `site/app/candidat/[id]/page.tsx`:
   - `generateStaticParams` returns `listCandidates().map(...)`
   - `generateMetadata` sets `<title>` to `"<name> — Analyse · Élection 2027"`
   - Page is a server component; loads via `loadCandidate(params.id)`
   - Renders `<NavBar>`, `<Hero>`, `<SectionNav>`, five section placeholders
     (each with an `id` and a visible heading so the scrollspy can be tested
     end-to-end), then `<TransparencyFooter>` stub (a `<footer>` with a
     simple placeholder — real stub lands in 0063).
2. `site/components/chrome/NavBar.tsx`:
   - Sticky top, `--nav-h` height
   - Project wordmark "Élection 2027" linking to `/`
   - Candidate display name and party
   - Placeholder CTA button "Transparence" that opens nothing in v1 (wired
     in M_Transparency); include an `aria-disabled` hint
   - `ThemeToggle` and `LanguageToggle` on the right
3. `site/components/chrome/Hero.tsx`:
   - Photo slot (prototype's coloured rectangle using `partyColor` from
     metadata if present, else neutral fallback)
   - Name + party pill + position (`metadata.display_name`, `.party`,
     aggregated summary inferred position — use first axis's anchor
     narrative if no explicit position label available)
   - Top-level grade via `deriveTopLevelGrade`
   - Headline: `aggregated.summary`
   - Version line: "Analyse basée sur le programme au `version_date`"
   - Models used: pill list from `metadata.analysis.models`
4. `site/components/chrome/SectionNav.tsx` (client):
   - Sticky below NavBar
   - Items: Synthèse, Positionnement, Domaines, Impact intergénérationnel,
     Risques
   - Scrollspy via `IntersectionObserver` setting an `active` item
   - Clicking an item scrolls to the section via native hash link
     (`scroll-behavior: smooth` already in globals)
5. Match the prototype's visual styling for all three chrome components as
   closely as practical with Tailwind.

## Acceptance Criteria

- [ ] `pnpm --filter site build` generates `site/out/candidat/test-omega/
      index.html`
- [ ] The generated page renders NavBar + Hero + SectionNav + 5 empty
      section stubs
- [ ] Scrollspy highlights the section currently in view
- [ ] Theme and language toggles work from the NavBar
- [ ] Visual side-by-side comparison with `Candidate Page.html` at the
      same scroll position shows parity in chrome layout (acceptable minor
      pixel drift)
- [ ] No client JS on `NavBar` or `Hero` (server components)

## Hints for Agent

- Keep `SectionNav` client-only; scrollspy needs `window`.
- Use CSS `scroll-margin-top` on section headings to offset for the nav
  height — the prototype's `html { scroll-behavior: smooth }` is already in
  `globals.css`.
- Models-used pill list uses the **map keys** of
  `metadata.analysis.models` (those are the canonical model IDs in this
  project).

## Editorial check

- [ ] Hero shows the same metadata structure for every candidate — no
      per-candidate layout branching
- [ ] Version line shows `version_date` verbatim; no "last week" fuzzing
