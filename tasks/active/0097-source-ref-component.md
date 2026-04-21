---
id: "0097"
title: "SourceRef component + migrate section usages"
type: task
status: open
priority: medium
created: 2026-04-21
milestone: M_Transparency
spec: docs/specs/website/transparency.md
context:
  - docs/specs/website/transparency.md
  - site/components/sections/IntergenSection.tsx
  - site/components/sections/DomainesSection.tsx
  - site/lib/transparency-hash.ts
test_command: pnpm --filter site test -- SourceRef IntergenSection DomainesSection
depends_on: ["0092", "0094"]
---

## Context

The drawer is only useful if claims actually link to it. Today
`IntergenSection` and `DomainesSection` render `source_refs` as
inline plain text. This task wraps them in a `<SourceRef>` chip
that, when clicked, opens the drawer on the Document tab and
scrolls to the matching heading.

See spec §9.

## Objectives

1. Create `site/components/widgets/SourceRef.tsx` (`"use client"`):
   - Accepts `children: string` (the raw locator).
   - Renders as an inline button-like chip, styled as a small
     underlined pill (matching existing "Sources (n)" affordances
     visually).
   - Full locator in `title`; visual width capped with ellipsis.
   - On click: writes
     - `#transparence=document&anchor=<slug>` when the locator
       matches `^sources\.md#([a-z0-9-]+)$`
     - `#transparence=document` otherwise.
   - Hook-based implementation reusing `useTransparencyHash()` from
     task 0092.
2. Migrate existing inline usages:
   - `IntergenSection` — replace the inline `source_refs.map(...)`
     rendering with a list of `<SourceRef>` chips.
   - `DomainesSection` — replace evidence/source chips inside
     `DimensionDeepDive` with `<SourceRef>`.
   - Do **not** remove the `<details>` wrapper or collapsed
     rendering — keep existing UX, only change the leaf element.
3. Unit tests:
   - Clicking a `<SourceRef>` with `sources.md#retraites` writes
     the correct hash fragment.
   - Clicking one without a matching pattern opens the drawer at
     the document root.
   - IntergenSection / DomainesSection regression tests confirm
     the chips render with expected labels and clicking triggers
     hash navigation.

## Acceptance Criteria

- [ ] `<SourceRef>` exported from `site/components/widgets/SourceRef.tsx`.
- [ ] `IntergenSection` + `DomainesSection` migrated.
- [ ] No visual regression on the candidate page (all existing
      `source_refs` still render; only the leaf node changes).
- [ ] Tests pass: `pnpm --filter site test -- SourceRef
      IntergenSection DomainesSection`.
- [ ] No lint / type errors.

## Hints for Agent

- The `<SourceRef>` is purely a link-like trigger; it does not
  render a dropdown or tooltip in v1.
- The drawer listens on `hashchange`, so no imperative open call
  is required.

## Editorial check

- [ ] No change to the `source_refs` data — chip is a pass-through.
- [ ] No new prose content generated.
- [ ] Every candidate's source chips behave identically (symmetric
      scrutiny preserved).
