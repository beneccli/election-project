---
id: "0050"
title: "Spike: M_WebsiteCore — Next.js static site, candidate page, build-time data loading"
type: spike
status: active
priority: high
created: 2026-04-19
milestone: M_WebsiteCore
spec:
  - docs/specs/website/nextjs-architecture.md
context:
  - docs/specs/website/structure.md
  - docs/specs/website/visual-components.md
  - docs/specs/website/transparency.md
  - docs/specs/analysis/editorial-principles.md
  - scripts/lib/schema.ts
  - candidates/test-omega/current/aggregated.json
  - candidates/test-omega/current/metadata.json
  - Candidate Page.html
depends_on: ["0037"]
---

## Goal

Finalize the design for **M_WebsiteCore**: the Next.js application that reads
`candidates/<id>/current/aggregated.json` at build time and renders a full
candidate page. This spike answers:

- Which Next.js mode (App Router + static export) and which build-time data
  flow?
- How is `candidates/` referenced from `site/` without coupling deployment
  artifacts to the content repo layout?
- Which candidate-page sections ship in M_WebsiteCore vs. deferred to
  M_VisualComponents / M_Transparency?
- How do we preserve the **exact visual design** of the `Candidate Page.html`
  prototype while migrating to a React + Tailwind component model?
- How do we wire the Zod-validated loader so schema drift at build time is a
  hard error (consistent with the pipeline's guardrails)?

Implementation is deferred to the backlog tasks produced by this spike. The
spike itself does **not** add code — it finalizes the spec and writes tickets.

## Scope boundary — what this milestone does NOT cover

- **Landing page (`/`)** — deferred to `M_Landing`.
- **Comparison page (`/comparer`)** — deferred to `M_Comparison`.
- **Methodology page (`/methodologie`)** — deferred to `M_Methodology`.
- **Changelog page (`/changelog`)** — deferred to `M_UpdateWorkflow`.
- **Full transparency drawer** (tabs for sources / prompts / raw outputs /
  agreement map) — deferred to `M_Transparency`. M_WebsiteCore ships a
  **minimal transparency footer** with metadata only, so the page is
  self-consistent.
- **Polished signature visuals** (animated radar bands, trajectory chart,
  dense risk heatmap, intergenerational hover affordances) — deferred to
  `M_VisualComponents`. M_WebsiteCore ships **baseline functional visuals**
  (static SVG radar, dimension tiles, 2-column intergenerational panel,
  color-scaled risk table) matching the prototype's layout so the page is
  visually complete.
- **Accessibility audit** (WCAG 2.1 AA compliance, keyboard nav completeness,
  tabular fallbacks) — deferred to `M_Accessibility`. M_WebsiteCore establishes
  the conventions (semantic HTML, `aria-label`s where trivial, no color-only
  signal) but no audit is run.
- **English translations** — FR is canonical. The prototype's `lang` toggle is
  retained in the UI shell but English strings are placeholders only (ICU
  message scaffolding is out of scope; a simple `{ fr, en }` literal is used).
- **Deployment pipeline** (Vercel / Cloudflare / Netlify config, preview
  envs) — deferred. M_WebsiteCore only guarantees `pnpm --filter site build`
  produces a valid static export locally.

## Research Questions + Decisions

### Q1 — Next.js mode: App Router + `output: "export"` or Pages Router?

**Decision: App Router with `output: "export"` (fully static).**

- The site is read-only, no API routes, no ISR. Static export is the simplest
  fit and aligns with the roadmap's "blazingly fast fully static" goal.
- App Router's `generateStaticParams` is the clean idiom for
  `/candidat/[id]` page generation at build.
- Server Components are used for all data-loading pages (no hydration cost on
  the markup shell). Interactive widgets (section nav scrollspy, language
  toggle, drawer, expandable tiles) are explicit `"use client"` components.

### Q2 — Where does `site/` live and how does it read `candidates/`?

**Decision: `site/` is a second package in the same repo, siblings of
`candidates/`. The data loader uses an explicit relative path resolved from
`process.cwd()` at build time.**

- Repo layout (additions):
  ```
  site/
    package.json
    next.config.mjs
    tsconfig.json
    tailwind.config.ts
    postcss.config.mjs
    app/
      layout.tsx
      page.tsx                       # placeholder, real landing in M_Landing
      candidat/
        [id]/
          page.tsx
    components/
      ...
    lib/
      candidates.ts                  # build-time loader + Zod re-validation
      schema.ts                      # re-exports from scripts/lib/schema
      anchors.ts                     # positioning axis anchor set (from spec)
      i18n.ts                        # FR/EN string resolver
    public/
    styles/
      globals.css
  ```
- No monorepo tooling (turbo, nx) in v1 — root `pnpm` workspaces + per-package
  scripts are sufficient.
- The data loader reads `../candidates/<id>/current/aggregated.json` and
  `../candidates/<id>/current/metadata.json` relative to the `site/` package
  root. The `current` symlink is dereferenced by the filesystem.
- The loader **re-imports `AggregatedOutputSchema` from `scripts/lib/schema`**
  (TypeScript path alias `@pipeline/schema`). This is a hard dependency: the
  site fails to build when the aggregated JSON does not match the schema.
  Rationale: the pipeline's schema is the single source of truth; the site
  never duplicates it.

### Q3 — Tailwind vs. raw CSS (prototype uses OKLCH CSS variables)

**Decision: Tailwind CSS v3 with the prototype's OKLCH palette ported as CSS
variables + Tailwind theme colors.**

- The prototype uses a well-defined design token set (see `Candidate Page.html`
  `:root` and `[data-theme="dark"]`). We port these verbatim into
  `styles/globals.css` as CSS variables and reference them from Tailwind via
  `theme.extend.colors.bg = "oklch(var(--bg))"` etc. — the user asked for
  Tailwind and the token scheme is compatible.
- Two-theme support: `data-theme="dark"` on `<html>` toggles the variable
  overrides. No `prefers-color-scheme` auto-detection in v1 (matches
  prototype's manual toggle).
- Typography: the prototype uses `Cormorant Garamond` (display) + `DM Sans`
  (text). Loaded via `next/font/google` for self-hosting and no external
  request at runtime.

### Q4 — Section parity with the `Candidate Page.html` prototype

The prototype has these sections in this order:

1. Nav bar (sticky, project title + candidate name + FR/EN + transparency CTA)
2. Hero (photo, name, party, position, grade, analysis date, source version,
   models used)
3. Section nav (sticky scrollspy: Synthèse / Positionnement / Domaines /
   Impact intergénérationnel / Risques)
4. **Synthèse** — headline, strengths, weaknesses, gaps
5. **Positionnement** — 5-axis radar + per-axis agreement bars
6. **Domaines** — dimension tiles, each expandable with per-model grades
7. **Impact intergénérationnel** — two-column cohort table
8. **Risques** — heatmap table (dimension × risk type, 1–5 scale)
9. Transparency drawer (slide-in from right, tabs for raw outputs)

The candidate page spec in `docs/specs/website/structure.md` also lists
Problems columns, Downside scenarios, Counterfactual, and deep-dive
collapsibles per dimension. The prototype compresses these:

- "Problems solved / ignored / worsened" → rolled into the expanded dimension
  deep-dives.
- "Downside scenarios" and "Counterfactual" → absent from the prototype.

**Decision:**

- M_WebsiteCore ships the **prototype's 5 sections verbatim** + baseline
  transparency footer (metadata only).
- The **problems_addressed / problems_ignored / problems_worsened** arrays
  from `aggregated.json` are rendered **inside the expanded dimension tile**
  as three labeled sub-blocks (✓ / — / ⚠), preserving the structure spec's
  three-column semantics without duplicating the section.
- **Counterfactual and downside_scenarios** are rendered as **two new
  subsections** within the Synthèse section (below strengths/weaknesses/gaps),
  because the prototype omits them but the aggregated schema carries the data
  and the editorial principle requires it to surface. They use minimal
  layouts — polish in M_VisualComponents.
- **Unsolved problems** is rendered as a list within Synthèse's "gaps" block
  when the aggregated field is non-empty; otherwise the block shows
  "programme couvre toutes les questions majeures" (but see Q7 below —
  absence is itself a finding, we do not softpedal it).

This keeps the prototype design exact and surfaces every aggregated schema
field.

### Q5 — Mapping `aggregated.json` → prototype data shapes

The prototype's hardcoded `C` object uses:

- `C.grade` / `C.gradeSub` — **not present** in aggregated schema. Top-level
  grade is derived from the 5 dimension grades (modal letter + `+`/`-` based
  on consensus confidence). Derivation logic is a pure function in
  `site/lib/grade.ts`, specified in the spec.
- `C.positioning` (array of 5 ints) — not averaged. The prototype's radar
  takes one modal value per axis; we use `aggregated.positioning.<axis>.modal_score`
  (nullable → treated as interval midpoint for the radar shape only, with
  a dissent indicator; the axis row shows the full interval).
- `C.dimGrades` → one letter per dimension — derived from
  `aggregated.dimensions.<dim>.grade.consensus` (`A..F` / `NOT_ADDRESSED`).
  No `+`/`-` modifiers in the Zod schema, so the prototype's `B+`/`B-`
  gradations collapse to the parent letter. This is a **design change**
  from the prototype accepted as correctness over aesthetics.
- `C.risks.<dim>[4 values]` — synthesized from
  `aggregated.dimensions.<dim>.execution_risks[]` by averaging `probability`
  and `severity` confidence floats into four "risk-type" buckets (fiscal,
  implementation, dependency, reversal). **STOP — this would be cardinal
  aggregation.** See Q6.
- `C.intergen` (array of 5 ints) — **not** a direct schema field. Derived
  qualitatively from `aggregated.intergenerational.impact_on_25yo_in_2027`
  and `impact_on_65yo_in_2027` narrative content via a fixed small rubric;
  see spec.
- `C.modelsUsed` — from `metadata.analysis.models` keys.
- `C.rawOutputs` — loaded lazily from
  `candidates/<id>/current/raw-outputs/*.json` at build time, but only
  metadata (model, prompt SHA256, confidence summary) is embedded in the
  page data. Full raw JSON is inlined into a compressed `<script
  type="application/json">` block since the drawer surfaces them. In
  M_Transparency this may move to a separate chunk.

### Q6 — Risk heatmap: prototype shows 1–5 per (dimension × risk type). The schema gives per-risk probability + severity floats. How do we render without cardinal aggregation?

**Decision: Change the visual. Keep the heatmap structure but rows are
individual execution risks (one per aggregated `execution_risks[]` entry),
columns are `probability` and `severity`, each rendered as a confidence-dot
cell (`●●●○○`) following the intergenerational convention. Dimension is a
group header.**

Rationale: the prototype's 1–5 × 4-bucket grid is a design choice, not a
schema requirement. Showing actual per-risk values preserves fidelity and
avoids fabricating a bucket aggregation that the aggregation spec forbids.
The visual density matches (same table footprint) — color gradient is driven
by `max(probability, severity)`. This is a visual change from the prototype
accepted as editorial correctness.

**Open question surfaced in spec:** revisit in M_VisualComponents whether a
"risk score" per dimension (clearly labeled as a heuristic, not an average
of dimensions) is acceptable as an additional overview row.

### Q7 — Editorial guardrails for computed / derived content

The derivation rules that add any **text** the aggregator did not produce
must be explicit and auditable:

| Derived surface | Rule | Editorial status |
|---|---|---|
| Top-level grade letter | Modal of 5 dimension grades; tie → lower | **OK** — purely descriptive summary of explicit grades |
| Top-level grade sub (`+`/`-`/none) | `+` if `summary_agreement >= 0.8`, `-` if `< 0.5`, else none | **OK** — describes consensus strength, not a new judgement |
| Positioning radar shape | Uses `modal_score`; if null, uses interval midpoint and shows a `⚠ dissent` badge | **OK** — documented as a visual summary; canonical view is the per-axis row |
| Intergen 5-int array (prototype) | **Not derived.** Prototype scalar is dropped. Instead render the two-column panel from `impact_on_25yo_in_2027` / `impact_on_65yo_in_2027` directly | **OK** — avoids invented scalar |
| Risk 1–5 buckets (prototype) | **Not derived.** Replaced by per-risk probability + severity dots as in Q6 | **OK** |
| Synthèse strengths/weaknesses/gaps | **Not derived.** The prototype's three bulleted lists map to: strengths = top-3 `problems_addressed` with `strength >= 0.7` across all dimensions; weaknesses = top-3 `problems_worsened` sorted by severity; gaps = `unsolved_problems` (verbatim) | **OK** — selection rule is deterministic and shown in the transparency footer |

**Red-flag check:**

- Does any derived surface introduce advocacy framing? No — the labels
  "strengths", "weaknesses", "gaps" are inherited from the prototype and
  apply symmetrically to every candidate on identical schema fields.
- Does any derived surface introduce candidate-specific branching? No — the
  derivation functions take only `AggregatedOutput` and run identically for
  every candidate.
- Does any derived surface hide dissent? No — `dissent` fields remain
  accessible through the axis rows, dimension tile expansions, and the
  transparency drawer stub.

### Q8 — The language toggle: real i18n or cosmetic?

**Decision: cosmetic in v1.**

- The FR/EN toggle in the prototype switches chart axis labels and section
  headers. It does not translate the aggregated content (which is written in
  French by the analysis prompts).
- We keep the same behavior: `site/lib/i18n.ts` is a small `{ fr, en }`
  literal resolver for UI chrome only. Any aggregated field rendered to the
  user remains in its source language. This matches the roadmap note that
  M_I18n is "under consideration" and defers real translation infrastructure.

### Q9 — Test strategy

**Decision:**

- **Unit:** `site/lib/candidates.ts` loader + all derivation functions
  (`grade.ts`, `positioning-shape.ts`, `synthese-selection.ts`) tested
  against the `test-omega` fixture with Vitest.
- **Build:** a CI-equivalent script `pnpm --filter site build` must succeed
  against `candidates/test-omega`. A task adds a `site:build` check to the
  root `package.json`.
- **No E2E / Playwright in v1** — a manual QA checklist against the
  prototype screenshots is the acceptance bar. E2E deferred to M_Accessibility
  which needs a browser anyway.
- **Schema-drift test:** the loader's happy-path test also asserts that a
  deliberately corrupted `aggregated.json` raises a typed error (fails fast,
  not a silent fallback).

## Red-flag review (editorial principles)

Walked through each principle in
[`docs/specs/analysis/editorial-principles.md`](../../docs/specs/analysis/editorial-principles.md):

| Principle | Status |
|---|---|
| Analysis, not advocacy | ✅ — no labels invented beyond "strengths/weaknesses/gaps" which apply to identical schema fields across candidates |
| Symmetric scrutiny | ✅ — one template, one component tree, one derivation pipeline; no per-candidate branches |
| Measurement over indictment | ✅ — intergenerational panel renders aggregated narrative verbatim; no adjectives injected |
| Dissent preserved | ✅ — axis rows show dissent list; dimension tiles show per-model grade map; risk rows show full prob/sev |
| Pinned model versions + prompt hashes | ✅ — transparency footer renders `metadata.analysis.prompt_sha256`, per-model `exact_version`, and aggregator metadata verbatim |

No red flag surfaced.

## Deliverables

1. **Spec document:** `docs/specs/website/nextjs-architecture.md` (new)
   - Package layout, build flow, data loader contract
   - Derivation rules for Q5 / Q6 / Q7 written as pure-function signatures
   - Section-by-section component inventory for the candidate page with
     explicit "M_WebsiteCore scope" vs. "deferred to M_VisualComponents /
     M_Transparency"
   - Tailwind + OKLCH palette port contract
   - Test strategy

2. **Backlog tasks:** `tasks/backlog/M_WebsiteCore/` — one file per task
   (see "Task breakdown" below).

3. **Updates:**
   - `docs/ROADMAP.md` M_WebsiteCore entry refined with spec link + scope
     boundary
   - `docs/specs/README.md` index gains `website/nextjs-architecture.md`
   - `docs/specs/website/structure.md` status: Draft → **Stable** (promoted
     by task 0051 alongside new spec)

## Task breakdown

| ID | Title | ~size |
|---|---|---|
| 0051 | Promote structure.md to Stable and add nextjs-architecture.md cross-links | S |
| 0052 | Bootstrap `site/` package: Next.js App Router, TS strict, static export, `site:build` root script | M |
| 0053 | Tailwind + OKLCH token port + typography (Cormorant Garamond / DM Sans via `next/font`) + dark-mode toggle | M |
| 0054 | Data loader `site/lib/candidates.ts` — reads aggregated.json + metadata.json via `current/` symlink, re-validates against `AggregatedOutputSchema`, typed getters | M |
| 0055 | Derivation library `site/lib/derived/*.ts` — `top-level-grade.ts`, `synthese-selection.ts`, `positioning-shape.ts` + unit tests against test-omega | M |
| 0056 | Anchors constants `site/lib/anchors.ts` + `i18n.ts` (FR canonical, EN stub) | S |
| 0057 | Candidate page route `/candidat/[id]` with `generateStaticParams` + page shell (nav, hero, sticky section nav with scrollspy) | M |
| 0058 | `<SynthèseSection>` — headline, strengths / weaknesses / gaps + counterfactual + downside_scenarios | M |
| 0059 | `<PositionnementSection>` — radar (consensus interval bands + modal markers) + per-axis agreement bars — baseline quality | M |
| 0060 | `<DomainesSection>` — `<DimensionTile>` grid + expandable deep-dive with problems_addressed/ignored/worsened sub-blocks + per-model grade map | M |
| 0061 | `<IntergenSection>` — two-column split panel rendering impact_on_25yo / impact_on_65yo + narrative summaries | M |
| 0062 | `<RisquesSection>` — per-risk row heatmap (prob × severity confidence dots) grouped by dimension | M |
| 0063 | `<TransparencyFooter>` (stub) — metadata, model versions, prompt hashes, links to raw artifacts — **no drawer, deferred to M_Transparency** | S |
| 0064 | End-to-end build test: `pnpm --filter site build` passes against test-omega; loader unit tests green; README for site/ documents run commands | S |

Size: S ≈ 1–2h; M ≈ 2–4h.

## Acceptance Criteria

- [ ] `docs/specs/website/nextjs-architecture.md` created and linked from
      `docs/specs/README.md`
- [ ] All 14 backlog tasks created in `tasks/backlog/M_WebsiteCore/` with
      clear acceptance criteria each
- [ ] Each task references only the spec, not other tasks
- [ ] Dependencies in task frontmatter form a DAG (no cycles)
- [ ] `docs/ROADMAP.md` M_WebsiteCore entry updated with spec link + scope
      boundary
- [ ] Editorial principles walked through in the spec's "Red-flag review"
      section
- [ ] Spike archived to `tasks/archive/`

## Notes

- The user explicitly asked for `Candidate Page.html` to be the design source
  of truth. Any tension between the prototype and the aggregated schema is
  resolved **in favour of the schema** (Q5/Q6). Layout and visual identity
  remain verbatim.
- `pnpm` is already the repo's package manager (per repo memory note).
- `Landing Page.html` and `Comparison Page.html` are **not consumed** by this
  milestone and will be re-examined in M_Landing / M_Comparison spikes.
