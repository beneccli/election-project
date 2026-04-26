---
id: "0145"
title: "Methodology: editorial smoke + parity tests"
type: task
status: open
priority: high
created: 2026-04-26
milestone: M_Methodology
spec: docs/specs/website/methodology-page.md
context:
  - docs/specs/website/methodology-page.md
  - site/app/comparer/comparison-editorial.test.tsx
  - site/app/__tests__/landing-editorial.test.tsx
test_command: pnpm --filter site test -- methodology-editorial
depends_on: ["0142", "0143", "0144"]
---

## Context

The methodology page is the surface most exposed to advocacy drift.
Spec §2 defines a binding editorial contract; spec §7.2 prescribes a
last-line-of-defense regression test that builds the exported HTML
and rejects any forbidden vocabulary, candidate name, or missing
section anchor. This task lands that test plus the FR/EN parity check.

## Objectives

1. Create
   `site/app/methodologie/methodology-editorial.test.tsx` modeled on
   `site/app/comparer/comparison-editorial.test.tsx`. Build (or use
   the build output of) `out/methodologie/index.html` and
   `out/en/methodologie/index.html`, then assert:
   - No forbidden vocabulary from the shared list (extract or import
     the list from the comparison/landing tests rather than
     duplicating).
   - No 2027 candidate `display_name` from
     `candidates/*/metadata.json` appears in rendered text.
   - Every required anchor ID from spec §7.1 is present.
   - Both locales render the same set of anchor IDs.
2. Add a build-output assertion: after the site build, both files
   `out/methodologie/index.html` and `out/en/methodologie/index.html`
   exist.
3. Wire the test into the existing `pnpm --filter site test` run; no
   extra manual step.

## Acceptance Criteria

- [ ] `pnpm --filter site test -- methodology-editorial` passes.
- [ ] Test fails fast and informatively if a banned word is added to
      any `METHODOLOGY_*` string.
- [ ] Test fails fast if a candidate name is added to methodology
      copy.
- [ ] Test fails if either route is missing from the static export.
- [ ] Anchor-ID parity test fails if FR and EN diverge.
- [ ] No flakiness across three consecutive runs.

## Hints for Agent

- Look at how `comparison-editorial.test.tsx` reads the build output
  — that pattern is the precedent.
- Candidate display names: load each `candidates/<id>/metadata.json`,
  extract `display_name`, and assert none appears in the methodology
  HTML. (Anchor figures like "Hollande 2012" are NOT in
  `candidates/*/metadata.json` and are therefore safe.)
- Forbidden-vocabulary list: import or factor out the shared list
  rather than duplicating it. If factoring is too invasive for this
  task, duplicate with a comment pointing at the source-of-truth
  test.

## Editorial check

- [ ] Test does NOT permit any forbidden word "for the methodology
      page only". The list is the same list applied site-wide.
- [ ] Test reads from the *exported* HTML, not from React tree
      snapshots — catches anything that slips into final output.
