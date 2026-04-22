---
id: "0090"
title: "Spike: Comparison page — side-by-side candidate analysis"
type: spike
status: active
priority: high
created: 2026-04-22
milestone: M_Comparison
spec: docs/specs/website/comparison-page.md
context:
  - Comparison Page.html
  - Candidate Page.html
  - site/app/candidat/[id]/page.tsx
  - site/components/sections/PositionnementSection.tsx
  - site/components/sections/DomainesSection.tsx
  - site/components/sections/IntergenSection.tsx
  - site/components/sections/RisquesSection.tsx
  - site/components/widgets/PositioningRadar.tsx
  - site/components/widgets/IntergenHorizonTable.tsx
  - site/components/widgets/RiskSummaryMatrix.tsx
  - site/components/widgets/GradeBadge.tsx
  - site/lib/candidates.ts
  - site/lib/schema.ts
  - scripts/lib/schema.ts
  - docs/specs/website/structure.md
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/website/visual-components.md
  - docs/specs/website/candidate-page-polish.md
  - docs/specs/analysis/editorial-principles.md
  - docs/ROADMAP.md
depends_on: []
---

## Goal

Implement the `/comparer` page described in
[`docs/specs/website/structure.md`](../../docs/specs/website/structure.md#comparison-page-comparer)
using the design prototype `Comparison Page.html` as the canonical visual
reference — in the same way `M_WebsiteCore` + `M_CandidatePagePolish`
implemented the candidate page from `Candidate Page.html`.

The comparison page lets the reader select 2–4 candidates and sees them
rendered side-by-side on the **same four analytical sections** already
produced for the candidate page:

1. **Positionnement politique** — overlaid multi-candidate radar + per-axis
   dot rows.
2. **Analyse par domaine** — grades comparison table, one row per
   dimension, with spread indicator.
3. **Impact intergénérationnel** — per-domain ordinal impact score,
   one column per candidate.
4. **Risques** — stacked per-candidate 6×4 risk heatmaps.

No new analytical content is produced; the page is a **projection** of
already-aggregated per-candidate data.

## Research Questions

1. **Does the comparison page require schema changes?**
   After reading the v1.1 aggregated schema: **no**. Positioning modal
   positions, per-dimension grades, `risk_profile` 4-category levels, and
   the `horizon_matrix` cells already exist. Rendering a comparison view
   is pure projection. → Spec records this explicitly so the tasks do not
   drift into schema work.

2. **URL state vs. localStorage.**
   The structure spec calls out `/comparer?c=<id>&c=<id>…`. The prototype
   uses `localStorage` only. Decision: URL is the source of truth
   (shareable/bookmarkable), localStorage is a fallback on first visit.
   Query-string order determines candidate color slot.

3. **Intergenerational comparison — one cell per domain, but the polish
   milestone made intergen a 6 rows × 3 horizons matrix.** How do we
   collapse to a single ordinal value per domain per candidate without
   cardinal averaging?
   Decision: use the **modal score of the `h_2038_2047` horizon** (longest,
   the "net impact to 2047" framing the prototype header already uses).
   No cross-horizon averaging. The comparison cell links to the candidate
   page's full horizon matrix so no detail is hidden.

4. **Dimension "best" marker ↑ in the prototype.**
   Prototype highlights the uniquely-highest grade per row. Is this an
   advocacy move? Decision: it is a **per-dimension peer comparison**,
   not a composite ranking. It is consistent with the existing candidate
   page showing per-dimension grades. We keep it, but with guardrails:
   (a) only shown when the maximum is strictly unique (no tied "winners"),
   (b) the page shows no aggregate / overall ordering, (c) the row also
   displays the numeric spread so dissent is visible, (d) the prototype's
   structure.md already sanctions "Visual diff highlighter — when a
   dimension has meaningfully different grades across selected candidates,
   the row is subtly emphasized."

5. **Radar overlay of candidate polygons — cardinal-averaging risk?**
   Each candidate polygon is that candidate's per-axis **modal** integer
   in [-5, +5]. Overlay is visual only; no arithmetic is performed between
   candidates. This matches the radar rendering already used on the
   candidate page for the consensus shape. Safe.

6. **What happens when a selected candidate is missing a v1.1 field**
   (schema-drift risk)? Decision: the comparison page reuses
   `loadCandidate()` which already re-validates against the current
   schema. A candidate that fails validation is **unselectable** (greyed
   out in the picker) with a small "analyse indisponible" marker. Same
   error-handling as the candidate page.

7. **Are there any hidden schema fields the prototype implies but we do
   not carry?** Audit:
   - `positioning` per-axis modal ✓
   - `dimensions[k].overall.grade` ✓
   - `intergenerational.horizon_matrix[row].cells.h_2038_2047.modal_score` ✓
   - `dimensions[k].risk_profile.{budgetary,implementation,dependency,reversibility}.modal_level` ✓
   No new fields required.

## Existing Context

- **Prior art — candidate page:** `site/app/candidat/[id]/page.tsx` and
  its four sections already render each of the four analytical blocks
  from `aggregated.json`. The comparison page creates side-by-side
  variants of these widgets, never reinvents the data model.
- **Visual tokens:** OKLCH CSS variables in `site/styles/` (ported from
  the prototypes in M_WebsiteCore). Candidate color slots defined below.
- **Editorial guardrails:** `editorial-principles.md` §1 (analysis, not
  advocacy), §2 (symmetric scrutiny), §4 (dissent preserved). The
  `structure.md` "Comparison page" section already enumerates
  non-features that bind this milestone.
- **Dependencies satisfied:** `M_WebsiteCore`, `M_VisualComponents`,
  `M_CandidatePagePolish` (already shipped) — all widgets, loaders,
  tokens, and the v1.1 schema are in place.

## Editorial principles at stake

1. **No overall "winner" per candidate.** No composite score, no overall
   grade comparison across the selected set, no ideological alignment
   score. Each dimension compared independently.
2. **No cardinal averaging.** Radar overlays modal integers; per-axis
   rows show individual dots; grade deltas are reported as spread
   (max − min), never mean.
3. **Symmetric rendering.** Every selected candidate uses identical
   components, fonts, sizes, and column widths. Color slots are assigned
   by URL-order only; there is no "primary" candidate.
4. **Dissent preserved per-candidate.** The comparison cell is a
   projection — clicking it routes to the candidate page where the full
   dissent/per-model breakdown is visible. The comparison view links out;
   it never hides.
5. **Fictional candidates excluded unless explicitly enabled.** The picker
   defers to the same `EXCLUDE_FICTIONAL` env used by the loader.

## Deliverables

1. **Spec:** `docs/specs/website/comparison-page.md` (**Stable** on
   creation; no schema or prompt changes)
2. **Backlog tasks** in `tasks/backlog/M_Comparison/`:
   - `0091` — Route `/comparer` + picker state machine (URL + localStorage,
     2..4 guard, fictional exclusion, color slots)
   - `0092` — Build-time multi-candidate loader + index data
   - `0093` — `<ComparisonRadar>` widget + `<PositioningComparison>`
     section
   - `0094` — `<DomainesComparison>` table (grades + spread + unique-max
     marker)
   - `0095` — `<IntergenComparison>` table (h_2038_2047 modal projection)
   - `0096` — `<RisquesComparison>` stacked per-candidate risk matrices
   - `0097` — Comparison page shell (NavBar, Hero, sticky selected-header,
     empty state)
   - `0098` — Landing/candidate CTAs, tests, build smoke
3. **ROADMAP.md** — mark `M_Comparison` status 🚧 In Progress; link spec.
4. **specs/README.md** — list the new spec under `website/`.

## Scope boundary (what this milestone does NOT cover)

- New analytical output (schema, prompts, aggregation) — none required.
- Landing page visuals or stakes charts (→ `M_Landing`).
- "Which candidate best matches my preferences" quiz — excluded by
  editorial principles, full stop.
- Per-model dissent drawer in the comparison view — clicking routes to
  the candidate page instead.
- Sharable image / OpenGraph card generation — deferred.
- Animated transitions when the selected set changes — deferred.

## Acceptance Criteria

- [x] Spec document `docs/specs/website/comparison-page.md` created and linked from `specs/README.md`
- [x] 8 tasks created in `tasks/backlog/M_Comparison/`
- [x] Each task references the spec, has acceptance criteria, and editorial-check bullet where relevant
- [x] ROADMAP.md updated (status `🚧 In Progress`, spec link)
- [x] No circular dependencies in task graph
- [x] Editorial principles checked — findings recorded in spec §3 and §4

## Notes

- Prototype provides inline dummy data (`ALL_CANDIDATES`); we ignore it
  and source all values from `candidates/<id>/current/aggregated.json`.
- The prototype's font sizing is slightly smaller than the candidate page;
  the user has said they will fine-tune after implementation — we copy
  the prototype's sizes faithfully.
- Design decision: `/comparer` is a **client-island page** (picker state
  is interactive) built on a server-rendered shell that pre-bundles
  every analyzed candidate's comparison-relevant projection at build
  time. See spec §5.
