---
id: "0131"
title: "Add `hidden` flag to candidate metadata and filter from site listings"
type: task
status: open
priority: medium
created: 2026-04-26
milestone: M_CandidateVisibility
spec: docs/specs/candidates/visibility.md
context:
  - scripts/lib/schema.ts
  - scripts/lib/schema.test.ts
  - site/lib/candidates.ts
  - site/lib/candidates.test.ts
  - site/lib/landing-cards.ts
  - site/lib/landing-cards.test.ts
  - candidates/test-omega/metadata.json
test_command: npm run test
depends_on: []
---

## Context

The repository contains four candidates with completed analyses:
`bruno-retailleau`, `david-lisnard`, `jeanluc-melanchon`, and
`test-omega`. The last is a synthetic test fixture and should not appear
on the public website (landing grid, comparison picker, candidate
index), even though its data must remain on disk for pipeline tests.

Today there is `is_fictional` (gates `publish.ts`) and an env-based
`EXCLUDE_FICTIONAL=1` filter, but no per-candidate visibility flag with
a clear editorial meaning. See [`docs/specs/candidates/visibility.md`](../../../docs/specs/candidates/visibility.md).

## Objectives

1. Add an optional `hidden: boolean` field to `CandidateMetadataSchema`
   in `scripts/lib/schema.ts`. Absence is treated as `false`.
2. Filter `meta.hidden === true` candidates out of:
   - `listCandidates()` in `site/lib/candidates.ts`
   - the landing projection in `site/lib/landing-cards.ts`
   The filter must apply unconditionally (no env flag).
3. Set `hidden: true` on `candidates/test-omega/metadata.json`.
4. Update tests:
   - Schema: `hidden: true` parses; absence is allowed.
   - Site listings: a fixture with `hidden: true` is excluded from both
     `listCandidates()` and the landing-cards projection.
5. Verify the comparison page picker also excludes the hidden candidate
   (it consumes `listCandidates()` — likely automatic, but confirm with
   a smoke test or unit test).
6. Update `docs/specs/candidates/repository-structure.md` to document
   the new field in the top-level `metadata.json` example.

## Acceptance Criteria

- [ ] `CandidateMetadataSchema` accepts and validates `hidden: true|false|undefined`
- [ ] `candidates/test-omega/metadata.json` has `"hidden": true`
- [ ] `listCandidates()` does not return `test-omega` in its result
- [ ] Landing-cards projection does not include `test-omega`
- [ ] Comparison-page picker no longer offers `test-omega`
- [ ] New schema test covers the `hidden` field (true / false / absent)
- [ ] New listing test covers the filter using a synthetic fixture
- [ ] `docs/specs/candidates/repository-structure.md` documents the field
- [ ] All tests pass: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- Read [`docs/specs/candidates/visibility.md`](../../../docs/specs/candidates/visibility.md) before
  starting — it defines the semantics, where the filter lives, and the
  transparency caveat.
- The schema field goes next to the existing `is_fictional` declaration
  in `scripts/lib/schema.ts` (around line 50). Use the same pattern.
- Filter implementation pattern already exists for `excludeFictional`;
  add a sibling check `if (meta.hidden === true) continue;` placed
  *before* the fictional check.
- Tests for `listCandidates` live in `site/lib/candidates.test.ts`;
  there is already a helper that copies `test-omega` into a temp dir.
  Extend the existing pattern with a third fixture that sets `hidden`.
- Direct URL access (`/<lang>/<id>`) for a hidden candidate is **not**
  required to 404 (see spec §"Direct URL access"). Keep the change
  scoped to listings.

## Editorial check

- [ ] No prompt changes (none expected).
- [ ] No schema changes affect analysis output (only top-level metadata).
- [ ] No asymmetric scrutiny introduced — `hidden` is editorial-neutral
      and applies uniformly to any candidate.
- [ ] Transparency preserved — files remain on disk and in git; only
      site listings exclude them.

## Notes

This task is intentionally scoped to one PR. Out of scope: hiding
individual versions, per-locale hiding, admin/preview reveal modes (see
spec §"Out of Scope").
