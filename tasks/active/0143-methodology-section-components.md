---
id: "0143"
title: "Methodology: section components + page body"
type: task
status: open
priority: high
created: 2026-04-26
milestone: M_Methodology
spec: docs/specs/website/methodology-page.md
context:
  - docs/specs/website/methodology-page.md
  - docs/specs/analysis/editorial-principles.md
  - docs/specs/data-pipeline/overview.md
  - site/components/pages/ComparerPageBody.tsx
  - site/components/landing/MethodologyBlock.tsx
  - site/lib/locale-path.ts
test_command: pnpm --filter site test -- methodology
depends_on: ["0141"]
---

## Context

Implement the eleven section components and the top-level
`MethodologyPageBody` per spec §3 and §6. All components are server
components — no client JS. The `<PipelineDiagram>` is a static SVG.

## Objectives

1. Create the static content module `site/lib/methodology-content.ts`
   exporting `PIPELINE_STAGES`, `EDITORIAL_PRINCIPLES`, and
   `NOT_THIS_BULLETS` per spec §5. Each entry references existing
   `UI_STRINGS` keys and resolves spec/artifact hrefs through
   `process.env.NEXT_PUBLIC_REPO_URL` for repo-relative paths.
2. Build the section components in `site/components/methodology/`:
   - `MethodologyHero.tsx`
   - `PipelineDiagram.tsx` (server-rendered SVG; mobile fallback =
     vertical card stack)
   - `EditorialPrinciplesSection.tsx` (renders 5 cards from
     `EDITORIAL_PRINCIPLES`)
   - `PositioningSection.tsx`
   - `AggregationSection.tsx`
   - `DimensionsSection.tsx` (uses `UI_STRINGS.DIMENSION_LABEL_*`)
   - `TransparencyLinksSection.tsx`
   - `NotThisSection.tsx`
   - `LimitationsSection.tsx`
   - `GovernanceSection.tsx`
   - `MethodologyTOC.tsx` (sticky on lg+, anchors to section IDs)
3. Build `site/components/pages/MethodologyPageBody.tsx` — assembles
   TOC + sections in the order listed in spec §3. Receives `{ lang }`.
4. Add a unit test
   `site/lib/__tests__/methodology-content.test.ts` validating the
   shape of the static arrays (5 principles, 6 pipeline stages, 6
   "not this" bullets, no missing i18n keys).
5. Add a render smoke test
   `site/components/pages/__tests__/MethodologyPageBody.test.tsx`
   that renders the body for both `fr` and `en` and asserts every
   section anchor ID is present.

## Acceptance Criteria

- [ ] All eleven section components exist and are server components.
- [ ] No `"use client"` directives in any new file.
- [ ] `MethodologyPageBody` renders all sections in spec §3 order.
- [ ] Section heading anchor IDs match spec §7.1
      (`#hero`, `#pipeline`, `#principes`, `#positionnement`,
      `#agregation`, `#dimensions`, `#transparence`, `#ce-que-non`,
      `#limites`, `#gouvernance`).
- [ ] `methodology-content.ts` arrays have the correct lengths.
- [ ] `MethodologyTOC` is hidden on viewports < `lg` (Tailwind
      `hidden lg:block`).
- [ ] `pnpm --filter site test -- methodology` passes.
- [ ] `pnpm --filter site typecheck` passes.

## Hints for Agent

- Reuse the OKLCH tokens already in `globals.css` — no new CSS.
- The pipeline diagram does not need to be aesthetically perfect;
  prefer correctness (all 6 stages, all artifact links resolved) and
  legibility over visual flourish. A boxes-and-arrows static SVG is
  enough.
- Use `t(UI_STRINGS.X, lang)` consistently — never inline strings.
- For repo URL: `const REPO = process.env.NEXT_PUBLIC_REPO_URL ??
  "https://github.com/election-2027/election-2027";` (matches
  `TransparencyFooter`).

## Editorial check

- [ ] Re-read [`docs/specs/analysis/editorial-principles.md`](../../docs/specs/analysis/editorial-principles.md)
      before writing any prose.
- [ ] No moral verbs anywhere in component code or JSX.
- [ ] No naming of any 2027 candidate.
- [ ] Limits section frames AI bias as a real limitation, not a
      reassurance.
- [ ] Governance section discloses funding (none), affiliation (none
      declared), and bus-factor risk — plainly, without pitch.
- [ ] No new dimension introduced for any candidate (this task does
      not touch the analysis pipeline at all).
