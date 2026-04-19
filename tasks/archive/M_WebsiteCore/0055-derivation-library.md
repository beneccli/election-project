---
id: "0055"
title: "Derivation library: top-level grade, synthèse selection, radar shape"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_WebsiteCore
spec: docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/analysis/editorial-principles.md
  - candidates/test-omega/current/aggregated.json
  - scripts/lib/schema.ts
test_command: pnpm --filter site test
depends_on: ["0054"]
---

## Context

The prototype uses several derived scalars (top-level grade, radar positions,
synthèse bullets) that do not exist verbatim in the aggregated schema. Spec
§3 defines the exact derivation rules. These MUST be pure, deterministic,
and symmetric across candidates — otherwise we introduce an editorial
asymmetry.

## Objectives

1. `site/lib/derived/top-level-grade.ts` — implement `deriveTopLevelGrade`
   per spec §3.1. Modal dimension grade with lower-letter tie-break,
   `+`/`-` modifier from `summary_agreement` thresholds.
2. `site/lib/derived/synthese-selection.ts` — implement `deriveSynthese`
   per spec §3.2. Flattens dimension fields, sorts, takes top-3 each.
   Returns `DerivedBullet[]` carrying `supportedBy` / `dissenters` for
   transparency.
3. `site/lib/derived/positioning-shape.ts` — implement `deriveRadarShape`
   per spec §3.3. `radarValue` falls back to interval midpoint when modal
   is null; flags dissent.
4. Unit tests for each, run against `test-omega` fixture plus crafted
   mini-fixtures for edge cases:
   - grade modal with tie (e.g., [A, B, B, C, C] → `B`, two-way tie → lower)
   - `summary_agreement` boundaries: 0.79 → no modifier, 0.80 → `+`,
     0.49 → `-`, 0.50 → no modifier
   - synthèse top-3 with < 3 items in each list (ensure no crash, returns
     what's available)
   - `positioning.*.modal_score === null` → `radarValue` = midpoint and
     `hasDissent === true`

## Acceptance Criteria

- [ ] All three functions are pure (no I/O, no date-now, no randomness)
- [ ] Unit tests cover happy path + at least 2 edge cases each
- [ ] All tests pass against `candidates/test-omega`
- [ ] Functions typed strictly against `AggregatedOutput` types from
      `@pipeline/schema`
- [ ] `npm run typecheck` and `npm run lint` pass

## Hints for Agent

- The empty-list fallback in `synthese-selection` must NOT produce
  advocacy-coded copy. Use the neutral phrase from spec §3.2: "Aucun
  élément marquant identifié dans cette analyse".
- Ordering ties: when two items have identical scores, fall back to the
  dimension key alphabetical order so output is stable across builds
  (determinism for caching, git diffs).

## Editorial check

- [ ] Top-level grade derivation: no new information invented; describes
      only what the aggregator already wrote (modal of existing grades +
      consensus strength label)
- [ ] Synthèse selection: identical filter/sort rules for every candidate;
      empty lists produce neutral language, never "programme parfait" etc.
- [ ] Radar midpoint is used for shape only, never labeled as a score
      (enforced by returning both `modal` and `radarValue` separately)
