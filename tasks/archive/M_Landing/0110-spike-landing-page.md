---
id: "0110"
title: "Spike: Landing page (/) — integrate the design prototype into the Next.js site"
type: spike
status: done
priority: high
created: 2026-04-22
milestone: M_Landing
spec: docs/specs/website/landing-page.md
context:
  - Landing Page.html
  - docs/specs/website/structure.md
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/website/comparison-page.md
  - docs/specs/analysis/editorial-principles.md
  - site/app/page.tsx
  - site/app/comparer/page.tsx
  - site/lib/candidates.ts
  - site/lib/comparison-projections.ts
  - site/lib/derived/comparison-projection.ts
  - site/lib/derived/top-level-grade.ts
  - site/lib/derived/spectrum-label.ts
  - site/lib/i18n.ts
  - site/components/chrome/NavBar.tsx
  - site/components/chrome/ComparisonNavBar.tsx
  - site/components/chrome/Hero.tsx
depends_on: []
---

## Goal

Replace the placeholder `site/app/page.tsx` with a production landing
page that **visually matches the `Landing Page.html` prototype** and is
**wired to real candidate data** the same way the candidate page
(`/candidat/<id>`) and the comparison page (`/comparer`) are.

No new analytical output is produced. The landing page is a pure
projection of fields that already exist in candidate metadata and
aggregated schema v1.1/v1.2, plus a small set of **France-level context
figures** (public debt, demographics) that live in a dedicated static
data module with source citations.

## Research Questions

1. **What reusable data already exists?**
   - `listCandidates()` returns analyzable entries (those with `aggregated.json`).
   - `listComparisonProjections()` returns full `ComparisonProjection`
     rows including `overallGrade`, axis modals, party, spectrum status.
   - `deriveTopLevelGrade`, `deriveSpectrumLabel` are pure and tested.
2. **What does the prototype require that does NOT exist?**
   - Per-card *mini* axis marker (economic axis only) — derivable from
     `positioning[0]` of the comparison projection.
   - Political-family **filter** (Gauche / Centre / Droite / Écologie).
     The spectrum label covers left↔right cleanly, but "Écologie" is a
     party-family concept, not a spectrum bucket. Decision needed.
   - "Coming-soon" candidate cards (candidates whose folder exists but
     has no published `aggregated.json` yet) — current loader skips them.
   - Two France-level area charts (public debt 2000–2025, population 65+
     2000–2050 with projection). Static data with source references.
3. **How is the candidate grid ordered without implying ranking?**
   Already solved on the landing-page CTA: sort by `updatedAt` desc.
   Reused verbatim here.
4. **What editorial risks does the prototype carry?**
   - Red/warn coloring on France-level stats (`.bad`, `.warn`): the
     numbers themselves are factual (Eurostat / INSEE), but coloring
     them red/amber adds an editorial gloss. Decided in §3 of spec.
   - Per-card single-axis mini-bar collapses a 5-axis analysis to one
     ordinal; same risk as the comparison page's axis rows, mitigated
     identically (ordinal, sourced from modal, linked through to the
     full radar).
   - "Political family" filter labels (`gauche`, `droite`, …) must map
     to our 7-label spectrum taxonomy and NOT introduce a new ordering.
5. **Scope boundary** — see the spec. Explicitly out of scope for this
   milestone: the `Méthodologie`, `Changelog`, `Mentions légales` pages
   (linked with placeholders); server-side analytics; real EN
   translations of aggregated content.

## Deliverables

1. **Spec document** — [`docs/specs/website/landing-page.md`](../../docs/specs/website/landing-page.md)
2. **Backlog tasks** — `tasks/backlog/M_Landing/0111`–`0118`
3. **ROADMAP update** — `M_Landing` promoted to 🚧 In Progress with
   spec link + scope boundary
4. **Spec index** — `docs/specs/README.md` updated with the new entry

## Editorial principles check

| Principle | Outcome | Mitigation |
|---|---|---|
| Analysis, not advocacy | At risk: prototype uses `.bad`/`.warn` color on context numbers. | Context numbers render in neutral text color; source citation visible next to each stat; color reserved for chart reference lines, not numeric headlines. |
| Symmetric scrutiny | Preserved. | Every card is the same component. "Coming soon" cards hide grade + axis mini-bar (not just grey them) — we never show a grade derived from partial data. |
| Measurement over indictment | Preserved. | Hero context charts are factual series with source pills; no adjectival framing in copy. |
| Dissent preserved | Not applicable (landing shows aggregated modal only). Link-out to `/candidat/<id>` preserves full dissent view. |
| Radical transparency | Preserved. | Footer links to repository + methodology; per-card "last updated" date visible. |

**No cardinal averaging** anywhere on the landing page. The mini axis
bar uses the single modal integer (`positioning.economic.modal`), same
rule as the comparison-page axis dot row.

**Red flags checked (all clear):**
- No aggregation-score compositing on cards.
- No ranking of candidates (alphabetical fallback for equal `updated`).
- No per-candidate prompt variation.
- No hiding of raw outputs — the "Transparence" NavBar link still
  resolves to the candidate page drawer once a candidate is selected.

## Acceptance Criteria

- [x] Spec document created at `docs/specs/website/landing-page.md`
- [x] 8 backlog tasks created in `tasks/backlog/M_Landing/` covering:
      context data, landing view-model, area chart, hero band, filter +
      grid, CTA + methodology + footer + nav, route assembly + i18n,
      editorial regression tests + build smoke
- [x] Each task references the spec, not other tasks
- [x] No circular dependencies
- [x] ROADMAP.md updated — milestone promoted, scope boundary documented
- [x] Editorial principles reviewed (table above); open question on the
      `ecologie` filter surfaced in the spec and answered

## Notes

The archived `M_Comparison` spike `0090` is the closest precedent; this
spike mirrors its shape deliberately (same granularity, same "one
view-model + N presentational components" split) so an implementing
agent can reuse the same patterns.
