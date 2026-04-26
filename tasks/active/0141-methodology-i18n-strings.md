---
id: "0141"
title: "Methodology: i18n strings (FR + EN)"
type: task
status: open
priority: high
created: 2026-04-26
milestone: M_Methodology
spec: docs/specs/website/methodology-page.md
context:
  - docs/specs/website/methodology-page.md
  - docs/specs/analysis/editorial-principles.md
  - site/lib/i18n.ts
test_command: pnpm --filter site test -- i18n
depends_on: []
---

## Context

The methodology page (spec §5) introduces a new family of `METHODOLOGY_*`
UI strings used by every section component, plus `META_METHODOLOGIE_*`
for the route metadata. They all need both FR (canonical) and EN
translations and must pass the existing parity validator.

## Objectives

1. Add the full `METHODOLOGY_*` key family to `site/lib/i18n.ts`
   (or a co-located shard that `i18n.ts` re-exports) following the
   alphabetical ordering used elsewhere in `UI_STRINGS`.
2. Cover every key listed in spec §5: hero, pipeline stages (×6),
   five editorial principles (title + statement + example each),
   positioning, aggregation, dimensions intro, transparency,
   "not this" bullets (×6), limits (×3), governance (×5), TOC label,
   meta title/description.
3. Both locales for every key. EN is a faithful translation of FR;
   no editorial drift.
4. No new schema, no new file beyond `i18n.ts` (or one shard).

## Acceptance Criteria

- [ ] Every key required by spec §5 exists in `UI_STRINGS`.
- [ ] Every entry has both `fr` and `en`.
- [ ] FR copy contains no banned vocabulary (run the existing
      forbidden-words list mentally; smoke test in `0145` enforces it).
- [ ] FR copy is candidate-agnostic — no candidate name from
      `candidates/*/metadata.json` appears.
- [ ] `pnpm --filter site test -- i18n` passes.
- [ ] `pnpm --filter site typecheck` passes.

## Hints for Agent

- Look at the `LANDING_*` and `TRANSPARENCY_*` clusters in
  `site/lib/i18n.ts` for the established voice and density.
- For pipeline-stage copy, prefer mechanism verbs ("consolide",
  "interroge", "agrège") over evaluative ones.
- Keep each principle's `STATEMENT` ≤ 140 chars and each `EXAMPLE`
  ≤ 200 chars to fit the card layout.

## Editorial check

- [ ] No moral verbs in FR or EN.
- [ ] No "we are better / more honest than X" framing.
- [ ] No naming of any 2027 candidate or party being analyzed.
- [ ] Funding/governance copy is plain disclosure, not pitch.
