---
id: "0140"
title: "Spike: Methodology page (`/methodologie`)"
type: spike
status: active
priority: high
created: 2026-04-26
milestone: M_Methodology
spec: docs/specs/website/methodology-page.md
context:
  - docs/specs/analysis/editorial-principles.md
  - docs/specs/website/landing-page.md
  - docs/specs/website/transparency.md
  - docs/specs/website/i18n.md
  - docs/specs/data-pipeline/overview.md
  - docs/specs/analysis/dimensions.md
  - docs/specs/analysis/political-positioning.md
  - docs/specs/analysis/aggregation.md
  - site/components/landing/MethodologyBlock.tsx
  - site/components/chrome/TransparencyFooter.tsx
  - site/lib/locale-path.ts
depends_on: []
---

## Goal

Define the long-form **Methodology page** that the landing page's
"En savoir plus" link (and the transparency footer's "Méthodologie
complète →" link) currently point to with a dead `/methodologie`
href. The page must explain — to a sceptical voter who has never seen
the project — exactly how an analysis is produced, why the design
choices were made, what the project is *not*, and where to verify
every claim. It must also state the project's nature: a one-person
side project, no funding, an experiment in objective-driven (rather
than partisan) AI analysis.

## Research questions

1. **What does the page need to contain?** What is the minimum set of
   sections such that a reader who has only seen the landing page
   leaves the methodology page able to (a) explain to a friend how the
   pipeline works, (b) name at least three editorial guardrails, and
   (c) find any underlying artifact (prompt, raw output, source
   document) for any claim on the site?
2. **What already exists in `docs/specs/`** that we are obligated to
   reflect verbatim or in summary? (Editorial principles, dimensions,
   positioning methodology, aggregation rules, pipeline overview.)
   Methodology page content is a *projection* of those specs onto a
   public reader — it must not contradict them, and when they change,
   it must change.
3. **How is this routed in the existing i18n setup?** FR canonical at
   `/methodologie`; EN at `/en/methodologie`. What does the rest of
   the i18n machinery (route segments, `localePath`, parity tests)
   require us to do? Is there any pipeline change (translatable paths,
   schema bump) — and the answer must be "no" since this is content,
   not analysis output.
4. **How do we keep it honest?** This page describes editorial
   guardrails that the rest of the project enforces. If we slip
   advocacy framing into the methodology page, we have undermined the
   whole project from its own front matter. The spec must define the
   editorial contract for this page (no moral verbs, no dunks on
   "competitors", measurement language, candidate-agnostic).
5. **Funding and governance.** The project is unfunded, single
   maintainer, side project, MIT-licensed code, AGENTS-driven
   development. What disclosures are required by the editorial
   principles (radical transparency) without sliding into
   self-promotion?
6. **What is explicitly out of scope?** No election-period legal
   compliance copy (→ `M_Legal`). No analytics/feedback widget. No
   accessibility audit beyond reusing existing tokens (→
   `M_Accessibility`). No Changelog/About/Mentions-légales pages
   (separate routes per `structure.md`).

## Editorial principles at stake

Re-checked against
[`docs/specs/analysis/editorial-principles.md`](../../docs/specs/analysis/editorial-principles.md):

- **Analysis, not advocacy** — the methodology page is the most
  tempting place to slip in a manifesto. Copy must be candidate-
  agnostic, must not editorialize on which programs are "good" or
  "bad", must describe mechanisms rather than verdicts.
- **Symmetric scrutiny** — the page must describe a process applied
  uniformly to every candidate. Wording must avoid "we are tougher on
  X than Y" or any candidate-specific carve-out.
- **Measurement over indictment** — where the page makes empirical
  claims (e.g. "≥4 frontier models per candidate"), it cites the
  measure or links to the artifact, instead of using qualitative
  flourish.
- **Dissent preserved** — the page must explain *how* dissent is
  preserved (per-claim `agreement_map`, no cardinal averaging on
  positioning), not gloss over it as "we capture disagreement".
- **Radical transparency** — the page is a discoverability surface
  for raw outputs, prompts, prompt SHA256 hashes, source PDFs, and
  the GitHub repository.

No red flags: this milestone does not touch prompts, schemas,
aggregation, or candidate data. It is a documentation surface that
mirrors (but never modifies) those artifacts.

## Deliverables

1. **Spec document** — [`docs/specs/website/methodology-page.md`](../../docs/specs/website/methodology-page.md)
   covering page sections, copy contract, routing, data model,
   editorial guardrails, test strategy.
2. **Backlog tasks** — `tasks/backlog/M_Methodology/`:
   - `0141` — i18n strings for methodology page (FR + EN).
   - `0142` — Route shells: `site/app/methodologie/page.tsx` and
     `site/app/[lang]/methodologie/page.tsx` + shared
     `MethodologyPageBody` server component.
   - `0143` — Section components: hero, pipeline diagram, principles,
     positioning, aggregation, dissent, transparency, what-this-is-not,
     limitations, governance.
   - `0144` — Wire `MethodologyBlock` "En savoir plus" link and
     `TransparencyFooter` link through `localePath()` so the EN landing
     and EN candidate page point at `/en/methodologie`.
   - `0145` — Editorial smoke test (forbidden vocabulary regression on
     exported FR + EN HTML) + parity test (both routes render and
     contain the same section-anchor IDs).
3. **ROADMAP update** — promote `M_Methodology` from "📋 Planned" to
   "🚧 In Progress" with link to the spec; add scope boundary.

## Acceptance criteria

- [ ] Spec exists in `docs/specs/website/methodology-page.md`,
      cross-linked from `docs/specs/README.md`.
- [ ] At least 5 backlog tasks in `tasks/backlog/M_Methodology/`,
      each referencing the spec and with clear acceptance criteria.
- [ ] No circular dependencies in the task graph.
- [ ] ROADMAP updated.
- [ ] Editorial principles reviewed and the spec contains an explicit
      "editorial contract for methodology copy" section.
- [ ] Out-of-scope section is explicit (legal, analytics, full
      accessibility audit).

## Notes

- The landing-page link target (`/methodologie`) and the transparency
  drawer link (also `/methodologie`) are pre-existing dead links. Do
  not touch them on the FR side (the path is correct); fix only the
  hard-coded EN copy that bypasses `localePath`.
- This is a one-person side project with no funding. The "Governance"
  section says so plainly — that is itself a transparency disclosure,
  not advocacy.
