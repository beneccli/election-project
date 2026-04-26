# Candidate Visibility

> **Version:** 1.0
> **Status:** Draft — pending implementation of M_CandidateVisibility

---

## Overview

Some candidates exist in the repository but should not appear on the
published website. Examples:

- **Synthetic test candidates** used as pipeline fixtures (e.g.
  `test-omega`). They are flagged `is_fictional: true` and useful for
  running scripts end-to-end, but they should not show up on the home
  page or comparison page.
- **Work-in-progress candidates** whose `aggregated.json` exists but
  whose human review is not yet complete, and who should not be exposed
  publicly until the maintainer flips a switch.

This spec defines a single per-candidate flag, `hidden`, that controls
whether a candidate is included in **site listings** (landing grid,
comparison picker, candidate index). The flag is independent of
`is_fictional`.

---

## Design Decisions

### A new field, not a reuse of `is_fictional`

`is_fictional: true` already exists and gates `publish.ts` (it refuses
publication unless `--allow-fictional` is passed). Conflating
"fictional" with "hidden from site" would be wrong:

- A real candidate may need to be hidden temporarily (analysis in
  progress).
- A fictional candidate may need to be visible during demos or local
  development.

The new field is therefore orthogonal:

```jsonc
// candidates/<id>/metadata.json
{
  "id": "test-omega",
  "display_name": "Omega Synthétique",
  // ...
  "is_fictional": true,
  "hidden": true            // ← new, optional, default false
}
```

| flag combination       | example                          | site listing | publish guard |
| ---------------------- | -------------------------------- | ------------ | ------------- |
| `is_fictional` only    | demo run with a synthetic figure | visible      | requires `--allow-fictional` |
| `hidden` only          | real candidate, analysis WIP     | excluded     | normal        |
| both                   | `test-omega` (default)           | excluded     | requires `--allow-fictional` |
| neither                | published real candidate         | visible      | normal        |

### Hard exclusion, no env flag

`EXCLUDE_FICTIONAL=1` is an opt-in env flag because fictional candidates
were *sometimes* visible. `hidden` is *always* an exclusion: there is no
build mode in which a hidden candidate appears in a listing. This keeps
the editorial intent unambiguous and removes one source of surprise.

### Schema (additive)

In `scripts/lib/schema.ts`:

```ts
hidden: z.boolean().optional(),
```

Absence is treated as `false`. No migration needed; existing
`metadata.json` files remain valid.

### Where filtering happens

Two entry points in `site/lib/`:

1. **`listCandidates()`** in [`site/lib/candidates.ts`](../../site/lib/candidates.ts) —
   the global candidate index used by routes and rendering helpers.
   After parsing `metadata.json`, skip if `meta.hidden === true`.

2. **`buildLandingCards()`** (or the equivalent listing in
   [`site/lib/landing-cards.ts`](../../site/lib/landing-cards.ts)) —
   same filter on the landing-page projection.

Comparison page uses `listCandidates()`, so it inherits the filter
without additional work. Verify during implementation.

The filter is applied **before** the existing `EXCLUDE_FICTIONAL` check.
Their order is independent in practice (they short-circuit), but `hidden`
takes precedence semantically.

### Direct URL access

A hidden candidate's data is still on disk and is still committed to the
repository. Hitting `/<lang>/<id>` directly:

- **MAY** still render the candidate page if the static export already
  generated it. We do not actively 404 hidden candidates, because the
  data is public via the GitHub repository — hiding from listings is the
  editorial signal, not a security boundary.
- The implementing task should choose the simplest behavior: if it is
  trivial to skip the static page generation for hidden candidates
  (e.g. by not including them in `generateStaticParams`), do that to
  avoid accidental indexing. If not trivial, leave the page reachable
  and revisit in a later milestone.

This is not a privacy mechanism. The flag is editorial.

---

## Transparency caveat

Because hiding removes a candidate from the user-facing index, we must
not use it to silently suppress unfavorable analyses. Operational rules:

1. The flag's only legitimate uses are:
   - Synthetic test candidates (`test-omega` family).
   - Real candidates whose analysis is incomplete or not yet
     human-reviewed.
2. Hiding a *real, complete, reviewed* candidate must be accompanied by
   a commit message explaining why and (if the situation persists) a
   note on the methodology page.
3. The repository continues to contain all sources, raw outputs, and
   aggregated artifacts for hidden candidates. Transparency is preserved
   at the data-layer level even when the UI omits the candidate.

---

## Test Strategy

In the implementation task:

- **Schema test:** `metadata.json` with `hidden: true` parses; absence
  parses as `undefined`/`false`.
- **Listing tests:** extend existing `candidates.test.ts` and
  `landing-cards.test.ts` with a fixture that sets `hidden: true` and
  asserts the candidate is excluded.
- **Manual smoke (post-merge):** run `npm run build` in `site/` and
  confirm `test-omega` no longer appears in the landing grid or
  comparison picker, while the data folder is untouched on disk.

---

## Out of Scope

- Hiding individual versions of a candidate (we hide the whole
  candidate or none).
- Hiding translations selectively (e.g. visible in FR, hidden in EN).
- A UI affordance for revealing hidden candidates (e.g. an admin/preview
  mode). If needed later, layer it on top of the same flag.
- Automatic detection of "should be hidden" (e.g. missing review). The
  flag is a deliberate, manual signal.

---

## Related Specs

- [`candidates/repository-structure.md`](repository-structure.md) — top-level metadata schema
- [`analysis/editorial-principles.md`](../analysis/editorial-principles.md) — transparency principle
- [`data-pipeline/analysis-modes.md`](../data-pipeline/analysis-modes.md) — `is_fictional` and the publish guard
