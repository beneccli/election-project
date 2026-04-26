---
id: "0130"
title: "Spike: per-candidate visibility flag"
type: spike
status: open
priority: medium
created: 2026-04-26
milestone: M_CandidateVisibility
spec: docs/specs/candidates/visibility.md
context:
  - candidates/test-omega/metadata.json
  - scripts/lib/schema.ts
  - site/lib/candidates.ts
  - site/lib/landing-cards.ts
  - docs/specs/candidates/repository-structure.md
  - docs/specs/analysis/editorial-principles.md
depends_on: []
---

## Goal

Allow a candidate's data to remain in the repo (and continue to be usable
by tests, scripts, and pipeline integration tests) while being **excluded
from the published website**: the landing page, the comparison page, and
the candidate index returned by `listCandidates`.

Concretely: hide `test-omega` from the public site without deleting it,
and make the same mechanism available for any future candidate that
should be staged but not yet shown (e.g. analysis in progress, embargoed
update).

## Research Questions

1. **Reuse `is_fictional` or add a new flag?**
   - `is_fictional` already exists and the publish CLI uses it as a guard
     (`--allow-fictional`). Reusing it would conflate "synthetic test
     fixture" with "should not appear on the public site". We may want to
     hide a real candidate (in-progress analysis), and we may want
     fictional candidates visible in non-production builds.
   - Decision: **add a new, orthogonal `hidden` field**. Absence = visible
     (backward compatible). `is_fictional` stays as-is and continues to
     gate `publish.ts`.

2. **Env override or hard exclusion?**
   - The existing `EXCLUDE_FICTIONAL=1` env flag is opt-in for
     development. For visibility, the editorial intent is "this candidate
     is not published": a hardcoded exclusion at every site listing is
     simpler and removes one mode where a hidden candidate accidentally
     appears.
   - Decision: **hard exclusion in all site listing functions**. No env
     flag. The candidate page route may still resolve if the URL is hit
     directly (transparency: data is in the repo); whether to 404 it is
     an open question (see below).

3. **Scope of "hidden":**
   - In: landing page grid, comparison page picker, `listCandidates()`
     return value, locale-aware variants of those listings.
   - Out (for this milestone): hiding individual versions, hiding
     translations selectively, hiding candidates only from the homepage
     but not the comparer.

## Editorial check

- **Symmetric scrutiny:** hiding does not change *how* a candidate is
  analyzed. The dimensions, prompts, and aggregation are identical. The
  flag controls publication only.
- **Transparency:** the files (sources, raw outputs, aggregated.json)
  remain in the repo and on the public domain via the GitHub repo. The
  flag does not delete or hide source artifacts; it only removes the
  candidate from listing UIs. This must be stated in the spec.
- **No advocacy implications:** the flag is editorial-neutral; it does
  not let us hide candidates we disagree with for substantive reasons.
  The spec must call this out as a misuse risk.

If the project ever needs to hide a real, declared candidate at launch
time, that decision must be documented (commit message + a note in the
methodology page). Out of scope for this spike to enforce automatically.

## Deliverables

1. **Spec:** `docs/specs/candidates/visibility.md` describing the
   `hidden` field, its semantics, where it is filtered, and the
   transparency caveat.

2. **Backlog tasks** in `tasks/backlog/M_CandidateVisibility/`:
   - `0131` — Add `hidden` to schema, filter in site listings, mark
     `test-omega` as hidden, tests.

   The change is small enough to fit one task. No artificial split.

3. **ROADMAP update** under Phase 3 (Operations).

## Open Questions

- **Direct URL access (`/<id>`)**: should hitting `/test-omega` directly
  404 when `hidden: true`, or render normally? Proposal in spec: render
  normally (transparency-friendly: link still works for those who have
  it). Static export will produce the page anyway because the data is
  parsed during build. Confirm during implementation.

## Acceptance Criteria

- [x] Spec document created at `docs/specs/candidates/visibility.md`
- [x] One backlog task created under `tasks/backlog/M_CandidateVisibility/`
- [x] Task has clear acceptance criteria and references the spec
- [x] ROADMAP.md updated with `M_CandidateVisibility` milestone
- [x] Spec linked from `docs/specs/README.md`
- [x] Editorial principles reviewed (no transparency reduction, no
      asymmetric scrutiny)
