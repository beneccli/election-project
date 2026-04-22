---
id: "0112"
title: "Landing: view-model `LandingCard` + `listLandingCards()` build-time loader"
type: task
status: open
priority: high
created: 2026-04-22
milestone: M_Landing
spec: docs/specs/website/landing-page.md
context:
  - docs/specs/website/landing-page.md
  - site/lib/candidates.ts
  - site/lib/comparison-projections.ts
  - site/lib/derived/comparison-projection.ts
  - site/lib/derived/keys.ts
  - site/lib/derived/spectrum-label.ts
  - scripts/lib/schema.ts
test_command: pnpm --filter site test -- landing-cards
depends_on: []
---

## Context

The landing page renders a uniform grid of candidate cards with two
statuses: `analyzed` (aggregated.json present) and `pending` (only
`metadata.json` present). The existing `listCandidates()` skips
pending candidates — the landing page needs both. See spec §3.1, §4.2,
§4.3.

## Objectives

1. Add an optional field `family_override: z.enum(["ecologie"]).optional()`
   to `CandidateMetadataSchema` in `scripts/lib/schema.ts` (additive, no
   existing candidate affected).
2. Create `site/lib/landing-cards.ts` exporting
   - `LandingCard`, `LandingCardAnalyzed`, `LandingCardPending`,
     `LandingFamily` types per spec §3.1
   - `listLandingCards(): LandingCard[]` — build-time loader that
     emits both analyzed and pending rows, ordered by `updatedAt`
     desc then `displayName` asc
   - `deriveFamilyBucket(spectrumStatus, overallSpectrumModal, familyOverride)`
     pure helper with the mapping in spec §4.3
3. Reuse `deriveComparisonProjection(bundle)` for analyzed-branch
   derivation; extract `ecoAxis` from `positioning[AXIS_KEY.economic]`.
4. Safe-fallback: when `loadCandidate(id)` throws for a candidate that
   has `aggregated.json`, emit a `pending` row (never fail the build).

## Acceptance Criteria

- [ ] Zod schema accepts existing candidate metadata files unchanged
- [ ] `listLandingCards()` returns both analyzed and pending rows
- [ ] Ordering rule verified by unit test (fixture: 3 candidates with
      mixed dates and names)
- [ ] Every spectrum status maps to exactly one bucket; test covers
      the 7 statuses + `split` + `inclassable` + `ecologie` override
- [ ] Broken aggregated bundle → `pending` row, not a throw
- [ ] `pending` rows never carry `overallGrade`, `ecoAxis`, or any
      aggregated-dependent field (type-level guarantee)
- [ ] Lint + typecheck + test clean

## Hints for Agent

- `buildComparisonEntries` in `site/lib/comparison-projections.ts` is
  the closest pattern; mirror its shape.
- `AXIS_KEYS` in `site/lib/derived/keys.ts` gives the economic axis
  index.
- Do NOT add a new version of the loader — extend existing ones or
  wrap them.

## Editorial check

- [ ] No cardinal averaging: `ecoAxis` comes from a single modal,
      never composed.
- [ ] Symmetric: analyzed and pending both traverse the same
      party/family derivation path.
