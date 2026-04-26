# Élection 2027 — Roadmap

> **Last Updated:** April 26, 2026
> **Status:** Foundation phase
> **Target:** Full public launch by Q3 2026, with candidates added and updated through election day

---

## 🎯 Project Vision

A **transparent, multi-AI analysis** of candidate programs for the 2027 French presidential election, published as a static, fast, freely accessible website.

Every candidate analyzed by 4–5 frontier AI models on identical dimensions. Disagreement between models preserved. Sources, prompts, and raw outputs all public. Editorial stance: **analysis, not advocacy** — readers form verdicts.

### The value proposition

1. **For voters:** a clear, visual summary of what each candidate is proposing, what problems they solve, what they ignore, and what remains unsolved under their program — with explicit treatment of intergenerational impact.
2. **For candidates:** visibility of rigorous analysis creates pressure to produce serious programs rather than slogans.
3. **For public discourse:** a reusable, transparent methodology that anyone can audit, replicate, or critique.

### Success criteria for launch

- At least 5 major declared candidates analyzed
- Each analysis uses ≥4 frontier models from ≥3 providers
- All source programs, prompts, and raw outputs publicly accessible
- Static site loads in <1s, works on mobile, accessible
- Methodology page explains every design decision
- Legal review cleared for French election-period rules

---

## 🗂️ Milestone Naming Convention

Milestones use **semantic IDs** (`M_DataPipeline`), never linear numbers (`M3`). This allows inserting new milestones without renumbering.

Format: `M_<FeatureCluster>`

---

## 📊 Current Status

### 🚧 Phase 1: Foundation (completed)

| Milestone | Status | Description |
|-----------|--------|-------------|
| M_Foundation | ✅ Done | Repo scaffolding, docs, tickets-as-code system |
| M_DataPipeline | ✅ Done | Candidate folder structure, versioning, script skeletons |
| M_AnalysisPrompts | ✅ Done | The analysis prompt, schema, inline adversarial pass |
| M_Aggregation | ✅ Done | Aggregator prompt, agreement_map, dissent preservation, human review CLI |
| M_AnalysisModes | ✅ Done | Manual web-chat + Copilot-agent execution modes, test-candidate scaffolding, publish guard |
| M_FirstCandidate | ✅ Done | End-to-end run on one candidate as proof |

### 📅 Phase 2: Website (planned)

| Milestone | Status | Description |
|-----------|--------|-------------|
| M_WebsiteCore | ✅ Done | Next.js (App Router + static export), candidate page, build-time data loading |
| M_VisualComponents | ✅ Done | Radar chart, intergenerational split, risk heatmap, counterfactual signal |
| M_CandidatePagePolish | ✅ Done | Screenshot-worthy sections: per-model radar overlays, dimension headline list, intergen horizon matrix, risk summary matrix + Drawer primitive. Adds schema v1.1 (additive). |
| M_Transparency | ✅ Done | Transparency drawer — raw outputs, prompts, sources exposed (2026-04-21) |
| M_Comparison | ✅ Done | Side-by-side candidate comparison mode — shipped 2026-04-22 ([`specs/website/comparison-page.md`](specs/website/comparison-page.md)) |
| M_PoliticalSpectrum | ✅ Done | Global spectrum label on each candidate (additive v1.2 field; Hero chip) ([`specs/analysis/political-spectrum-label.md`](specs/analysis/political-spectrum-label.md)) |
| M_Landing | ✅ Done | Landing page with "2027 stakes" visuals + candidate grid + comparison/methodology entry points ([`specs/website/landing-page.md`](specs/website/landing-page.md)) |

### 📅 Phase 3: Operations (planned)

| Milestone | Status | Description |
|-----------|--------|-------------|
| M_UpdateWorkflow | 📋 Planned | Scripts and docs for "one week later" candidate updates |
| M_CandidateVisibility | ✅ Done | Per-candidate `hidden` flag to exclude staged/synthetic candidates from site listings ([`specs/candidates/visibility.md`](specs/candidates/visibility.md)) |
| M_Methodology | � In Progress | Public-facing methodology page (`/methodologie`); pipeline explainer, editorial guardrails, governance / no-funding disclosure ([`specs/website/methodology-page.md`](specs/website/methodology-page.md)) |
| M_Legal | 📋 Planned | Legal review, election-period compliance, disclosures |
| M_Accessibility | 📋 Planned | WCAG 2.1 AA, mobile, slow-connection optimization |

### 📅 Phase 4: Launch + Evolution (planned)

| Milestone | Status | Description |
|-----------|--------|-------------|
| M_PublicLaunch | 📋 Planned | First public version |
| M_CandidateOnboarding | 📋 Planned | Process to add a newly declared candidate |
| M_DebateIntegration | 📋 Planned | React to debate moments with supplementary analysis |
| M_I18n | ✅ Done | English locale: locale-prefixed routes, translatable `aggregated.<lang>.json`, parity validator, translator prompt + manual workflow ([`specs/website/i18n.md`](specs/website/i18n.md)) |

---

## 🧭 Milestone Detail

### M_Foundation (Active)

**Goal:** Scaffolding the repository so any AI coding agent can continue the work without needing the original chat conversation.

**Deliverables:**
- Top-level `README.md`, `AGENTS.md`, `.github/copilot-instructions.md`
- `tasks/` with templates
- `docs/specs/` with the editorial and architectural principles baked in
- Initial `.github/prompts/` for common agent workflows

**Status:** In progress (this is the current work).

---

### M_DataPipeline

**Goal:** Define the canonical per-candidate folder structure, versioning scheme, and script skeletons so the pipeline is executable end-to-end, even if with mock LLM responses initially.

**Depends on:** M_Foundation

**Status:** ✅ Done (2026-04-19). All 9 tasks (0011–0019) implemented and archived.

**Specs produced:**
- `docs/specs/data-pipeline/overview.md` (**Stable**)
- `docs/specs/data-pipeline/source-gathering.md` (**Stable**)
- `docs/specs/candidates/repository-structure.md` (**Stable**)

**Backlog tasks** (`tasks/backlog/M_DataPipeline/`):
- `0011` — Bootstrap project (package.json, tsconfig, tooling)
- `0012` — Zod schemas for pipeline JSON artifacts
- `0013` — Utility library (hash, logger, validation, file helpers)
- `0014` — LLM provider abstraction layer
- `0015` — Script skeleton: consolidate.ts
- `0016` — Script skeleton: analyze.ts
- `0017` — Script skeleton: aggregate.ts
- `0018` — Script skeleton: publish.ts + candidate scaffolding
- `0019` — End-to-end pipeline integration test with mock LLMs

**Key design decisions (validated by spike):**
- **Symlink** for `current` version (not manifest file) — filesystem tools resolve naturally
- **`consolidate.ts` calls an LLM** with mandatory human review of the draft
- **Prompt hash:** SHA256 of prompt file content at call time (`crypto.createHash('sha256')`)
- **Metadata** lives in per-version `metadata.json` with full model/prompt/cost tracking
- **Plain git** for source files (v1); migrate to git-lfs if >100MB per candidate
- **Idempotent scripts** — re-running is safe, `--force` to override

**Scope boundary (what this milestone does NOT cover):**
- Real prompt content (→ M_AnalysisPrompts)
- Aggregation logic and schema (→ M_Aggregation)
- Analysis output schema beyond placeholder (→ M_AnalysisPrompts)
- Website integration (→ M_WebsiteCore)

---

### M_AnalysisPrompts

**Goal:** Produce the canonical analysis prompt that runs per model per candidate, plus the Zod schema its output must match.

**Depends on:** M_DataPipeline

**Status:** ✅ Done (2026-04-19). Spike `0020` and all six tasks (`0021`–`0026`) implemented and archived.

**Spike produces:**
- `docs/specs/analysis/analysis-prompt.md` (prompt design) — promoted Draft → **Stable** via task `0021`
- `docs/specs/analysis/output-schema.md` (Zod schema and JSON structure) — promoted Draft → **Stable** via task `0021`
- `docs/specs/analysis/political-positioning.md` — promoted Draft → **Stable** via task `0021`
- `docs/specs/analysis/intergenerational-audit.md` — promoted Draft → **Stable** via task `0021`
- `docs/specs/analysis/dimensions.md` — promoted Draft → **Stable** via task `0021`
- Actual prompt file in `prompts/analyze-candidate.md` — task `0023`
- Actual schema in `scripts/lib/schema.ts` — task `0022`
- Adversarial pass **inlined as §8 of `prompts/analyze-candidate.md`** (see spike decision Q1; no separate `adversarial-pass.md` in v1)

**Non-negotiables:**
- Single prompt per candidate (not multi-turn)
- Structured JSON output
- Every claim has evidence citations back to `sources.md`
- Self-confidence scores per section
- Adversarial pass included (inline)

**Key design decisions (spike `0020`):**
- Adversarial pass is inline in the main call (Q1) — revisit if quality suffers
- Schema-retry count: 2 (3 total attempts), persistent failure → `<model>.FAILED.json`
- Positioning scores: integers only in `[-5, +5]`, never cardinally averaged
- Fixed anchor set of 4 figures/parties per axis, shared across all candidates
- Intergenerational horizon: 2027–2047 central
- Temperature 0, single-shot (no clarification requests)
- Grades reflect coherence + evidence-support, not ideology

**Scope boundary (what this milestone does NOT cover):**
- Aggregation across models (→ M_Aggregation)
- Separate second-call adversarial pass (deferred; may revisit after first real run)
- Live candidate data / actual runs (→ M_FirstCandidate)
- Website rendering of analysis output (→ M_WebsiteCore)

---

### M_Aggregation

**Goal:** Produce the aggregator prompt and logic that merges 4–5 per-model JSON outputs into a single `aggregated.json` while preserving dissent.

**Depends on:** M_AnalysisPrompts

**Status:** 🚧 In Progress. Spike `0030` archived (2026-04-19); implementation tasks `0031`–`0037` in `tasks/backlog/M_Aggregation/`.

**Spike produces:**
- `docs/specs/analysis/aggregation.md` (finalized by spike `0030`; promoted Draft → Stable by task `0031`)
- Aggregator prompt in `prompts/aggregate-analyses.md` (task `0033`)
- Aggregation script `scripts/aggregate.ts` (already scaffolded by M_DataPipeline; consumes the real schema via task `0032`)
- `agreement_map` schema extension — inline per-claim `supported_by`/`dissenters` plus top-level summary (task `0032`)
- Human review CLI `scripts/review.ts` + hard publish-gate (task `0036`)

**Non-negotiables:**
- Positioning is never cardinally averaged — **aggregated output has no `score` field** (regression fixture enforces this)
- Dissent is shown, not averaged away — structural fields (`dissent[]`, `supported_by`, `dissenters`), not prose hedging
- Contradictions against `sources.md` flagged for human review, not auto-published — including correlated hallucination
- Publish blocks on `metadata.aggregation.human_review_completed === true`

**Key design decisions (spike `0030`):**
- Meta-LLM aggregation (Option A). Single designated aggregator model; overlap with analyst set permitted in v1 but audited.
- 2 retries on aggregator schema failure → `aggregated.FAILED.json`; no deterministic averaging fallback.
- Hard minimum 1 successful analysis; soft minimum 3 → `coverage_warning: true` below that.
- Review CLI is minimal (readline + `$EDITOR`); skipped items block final publish.
- Aggregated output schema carries its own `schema_version: "1.0"` independent of per-model schema.

**Scope boundary (what this milestone does NOT cover):**
- Live LLM aggregation on a real candidate (→ M_FirstCandidate)
- Self-aggregation bias measurement / aggregator-disjoint rule (→ post-M_FirstCandidate follow-up)
- Web UI for human review (CLI only in v1)
- Cross-candidate symmetry audit tooling
- Deterministic aggregation fallback (Option B)
- Website rendering of `agreement_map` / positioning intervals (→ M_VisualComponents + M_Transparency)

---

### M_AnalysisModes

**Goal:** Allow the pipeline to run without paid LLM API calls by introducing two additional execution modes alongside the existing API path: **manual web-chat** (copy-paste into ChatGPT/Claude/Gemini subscriptions) and **Copilot-agent** (Copilot itself acts as the analyst model, writing files via its tools). Also deliver test-candidate scaffolding so the pipeline can be exercised end-to-end on fictional input before touching real candidates.

**Depends on:** M_DataPipeline + M_AnalysisPrompts + M_Aggregation

**Status:** 🚧 In Progress. Spike `0040` active (2026-04-19); implementation tasks `0041`–`0048` in `tasks/backlog/M_AnalysisModes/`.

**Spike produces:**
- `docs/specs/data-pipeline/analysis-modes.md` (finalized Stable by task `0041`)
- Metadata schema extensions: `execution_mode` + `attested_by` + `attested_model_version` + `provider_metadata_available` per run; `is_fictional` on candidate metadata (task `0042`)
- `prepare-manual-analysis` / `prepare-manual-aggregation` bundle scripts (task `0043`)
- `ingest-raw-output` / `ingest-aggregated` drop-in scripts (task `0044`)
- `.github/prompts/analyze-candidate-via-copilot.prompt.md` + `.github/prompts/aggregate-analyses-via-copilot.prompt.md` (task `0045`)
- Test-candidate scaffold prompt + `is_fictional` flag + publish guard (task `0046`)
- `prompts/fixtures/generate-test-sources.md` web-chat program generator (task `0047`)
- Quick-start zero-API docs + mixed-mode integration test (task `0048`)

**Non-negotiables:**
- All three modes send `prompts/analyze-candidate.md` bytes **verbatim** — no per-mode prompt editing
- Every run records `execution_mode` + prompt SHA256 + attested model version
- Fictional candidates cannot reach `current` without `--allow-fictional`
- Aggregation human-review gate is mode-agnostic (still required)

**Key design decisions (spike `0040`):**
- Single canonical prompt file, loaded by all three modes — no duplication
- Manual/Copilot modes mark `provider_metadata_available: false`; token counts and cost become optional for those rows
- Symmetric ID-prefix guard: `test-*` IDs require `is_fictional: true` and vice versa
- `_manual/` working directory is `.gitignore`'d (except README) to prevent chat-transcript leakage
- Residual risk on Copilot model identification accepted and documented

**Scope boundary (what this milestone does NOT cover):**
- New analytical prompts (reuse existing `prompts/analyze-candidate.md` and `prompts/aggregate-analyses.md`)
- Website rendering of `execution_mode` (→ M_Transparency)
- Automated detection of prompt editing (SHA256 mismatch is visible in metadata; detection is downstream)
- Running a real candidate end-to-end (→ M_FirstCandidate)

---

### M_FirstCandidate

**Goal:** Execute the full pipeline on one declared candidate end-to-end. This is the proof that the system works before scaling.

**Depends on:** M_DataPipeline + M_AnalysisPrompts + M_Aggregation + M_AnalysisModes

**Deliverables:**
- `candidates/<first-candidate-id>/versions/<date>/` fully populated
- `aggregated.json` validated against schema
- Manual inspection of output quality
- Iteration on prompts based on what we learn

---

### M_WebsiteCore

**Goal:** Next.js app reading from `candidates/` at build time, rendering a complete candidate page matching the `Candidate Page.html` prototype.

**Depends on:** M_FirstCandidate (real data); in the meantime, iterates against `candidates/test-omega`.

**Status:** 🚧 In Progress. Spike `0050` active (2026-04-19); implementation tasks `0051`–`0064` in `tasks/backlog/M_WebsiteCore/`.

**Spike produces:**
- `docs/specs/website/nextjs-architecture.md` (finalized Stable via task `0051`)
- `docs/specs/website/structure.md` promoted Draft → **Stable** (task `0051`)
- `site/` package scaffold with App Router + `output: "export"` + Tailwind + OKLCH token port (tasks `0052`–`0053`)
- Build-time data loader with Zod re-validation (task `0054`)
- Derivation library — top-level grade, synthèse selection, radar shape (task `0055`)
- Candidate page route `/candidat/[id]` with all five sections matching the prototype (tasks `0057`–`0062`)
- Minimal transparency footer with metadata + prompt hashes (task `0063` — full drawer deferred to M_Transparency)
- End-to-end build smoke test against test-omega (task `0064`)

**Key design decisions (spike `0050`):**
- App Router + `output: "export"` (no API routes, no ISR)
- `site/` is a pnpm workspace sibling of `candidates/` and `scripts/`
- Schema re-exported from pipeline via `@pipeline/*` TS path alias (single source of truth)
- OKLCH CSS variables ported verbatim from prototype; Tailwind references them via `theme.extend.colors`
- All derived view-model fields are pure functions tested against test-omega
- Risk heatmap rebuilt per-risk (probability + severity dots) to avoid cardinal aggregation — deliberate divergence from prototype
- Top-level grade modifier (`+`/`-`) describes consensus strength, never substantive judgement
- FR is canonical; EN toggle is cosmetic (aggregated content stays in source language)

**Scope boundary (what this milestone does NOT cover):**
- Landing page (→ M_Landing)
- Comparison page (→ M_Comparison)
- Methodology, Changelog, About pages
- Full transparency drawer with raw-output viewer, agreement map UI, sources.md rendering (→ M_Transparency)
- Polished signature visuals — animated radar bands, trajectory chart, interactive risk heatmap, intergen hover affordances (→ M_VisualComponents)
- Accessibility audit / lighthouse budget (→ M_Accessibility)
- Real i18n infrastructure (→ M_I18n, under consideration)
- Deployment pipeline (Vercel / Cloudflare config, preview envs)

---

### M_VisualComponents

**Goal:** The signature visual components that make the site screenshot-worthy: 5-axis positioning radar, intergenerational split panel, per-risk table, counterfactual direction signal.

**Depends on:** M_WebsiteCore

**Status:** 🚧 In Progress. Spike `0070` active (2026-04-20); implementation tasks `0071`–`0074` in `tasks/backlog/M_VisualComponents/`. Most of the milestone already shipped during M_WebsiteCore and its polish pass; remaining work is hover-interaction depth and mobile fallback.

**Spike produces:**
- `docs/specs/website/visual-components.md` promoted Draft → **Stable** (v1.1) — reconciled with implementation
- Backlog tasks `0071`–`0074`

**Already shipped under M_WebsiteCore (documented in v1.1 spec):**
- `<PositioningRadar>`, `<AxisAgreementBars>`, `<PositioningLegend>`
- `<IntergenSplitPanel>`, `<RiskHeatmap>` (per-risk expandable table — deliberate divergence from the 2D-scatter draft)
- `<DimensionTile>`, `<ProblemsColumns>`, `<CounterfactualBlock>`
- `<Tooltip>`, `<ConfidenceDots>`, `<GradeBadge>`

**Key design decisions (spike `0070`):**
- **No charting library in v1.** Pure SVG + DOM is sufficient for every visual currently in scope.
- **`<RiskHeatmap>` is a per-risk expandable table, not a 2D scatter.** Rationale: a scatter invites composing probability × severity into a single cardinal score — exactly what we refuse for positioning. Both axes are reported independently as `ConfidenceDots`.
- **`<CounterfactualBlock>`** is the qualitative stand-in for a trajectory chart: direction + confidence + changed dimensions, using only data that exists.
- **`<TrajectoryChart>` is explicitly deferred.** The current aggregated schema has no year-by-year trajectory values, and fabricating them (or interpolating) would violate transparency. Future work likely lives in a new milestone provisionally called `M_TrajectoryData` — a schema + prompt extension, not a visual change.
- **`<SourceRef>` and `<TransparencyDrawer>`** are owned by M_Transparency. Components that have `source_refs` (IntergenSplitPanel, ProblemsColumns) display them as plain text in v1 and become drawer anchors under M_Transparency.

**Scope boundary (what this milestone does NOT cover):**
- `TrajectoryChart` and any time-series visual (→ future `M_TrajectoryData`)
- `SourceRef` / `TransparencyDrawer` / raw-output viewer (→ M_Transparency)
- Landing-page and comparison-page visuals (→ M_Landing, M_Comparison)
- Print stylesheet, full WCAG audit (→ M_Accessibility)
- Animation choreography beyond simple CSS transitions

---

### M_CandidatePagePolish

**Goal:** Make each section of the candidate page screenshot-worthy by aligning with the `Candidate Page.html` prototype while real aggregated data has grown richer than the prototype assumed. Four sections redesigned — Positionnement (per-model radar selector), Domaines (headline list with inline deep dive), Intergénérationnel (domain × horizon matrix), Risques (summary matrix + right-side Drawer for full list). Ships additive schema v1.1.

**Depends on:** M_VisualComponents

**Status:** 🚧 Planned. Spike `0080` archived (2026-04-20); implementation tasks `0081`–`0088` in `tasks/backlog/M_CandidatePagePolish/`.

**Spike produces:**
- `docs/specs/website/candidate-page-polish.md` (finalized Stable by spike `0080`)
- Schema v1.1 (additive): `dimensions[k].headline`, `dimensions[k].risk_profile` (4 fixed categories), `intergenerational.horizon_matrix` (6 rows × 3 horizons), `positioning[axis].per_model` (aggregated, complete list). `schema_version` bumps from `"1.0"` to `"1.1"`.
- Prompt v1.1 for `analyze-candidate.md` + `aggregate-analyses.md` with new output-structure sections and ordinal-synthesis rules.
- `<Drawer>` primitive reusable by M_Transparency.

**Non-negotiables:**
- All new aggregated numeric fields stay ordinal (modal + interval + per-model verbatim). No cardinal averaging.
- Fixed cell sets: 4 risk categories × 5 dimensions; 6 horizon rows × 3 horizons; must be filled for every candidate.
- Measurement prose only in horizon-matrix and risk-profile notes (editorial principle 3).
- Existing `DimensionDeepDive`, `IntergenSplitPanel`, `RiskHeatmap` preserved — relocated, never removed.

**Key design decisions (spike `0080`):**
- Positioning-style ordinal aggregation reused verbatim for `risk_profile` levels and `horizon_matrix` scores.
- `test-omega` is the only candidate; migrated atomically in task `0083` between schema/prompt tasks and UI tasks.
- Cohort labels ("Actifs 35–55 ans" etc.) are **render-time annotations**, not schema fields — schema encodes calendar horizons (`h_2027_2030`, `h_2031_2037`, `h_2038_2047`).
- `<Drawer>` built on `@radix-ui/react-dialog`, designed as generic chrome primitive so M_Transparency can reuse it for raw-outputs / prompts / agreement map.
- `<RiskHeatmap>` (per-risk table) preserved unchanged, relocated into the Drawer.

**Scope boundary (what this milestone does NOT cover):**
- Transparency drawer content — raw outputs / prompts / agreement map viewer (→ M_Transparency; reuses `<Drawer>` primitive shipped here)
- Landing and comparison pages
- New dimensions or positioning axes
- New per-candidate run (regenerating `test-omega` is part of task `0083`)
- Lighthouse / WCAG audit (→ M_Accessibility)
- Animation or motion design beyond the Drawer slide

---

### M_Transparency

**Goal:** The transparency drawer — sources, prompts, raw per-model outputs, aggregation notes, and agreement map — all accessible from the candidate page in at most two clicks from any claim.

**Depends on:** M_WebsiteCore + M_CandidatePagePolish (reuses the `<Drawer>` primitive shipped there)

**Status:** ✅ Done (2026-04-21). Spike `0090` + implementation tasks `0091`–`0098` archived under `tasks/archive/M_Transparency/`.

**Spike produces:**
- `docs/specs/website/transparency.md` promoted Draft → **Stable (v1.1)** via task `0098`
- Content-addressed prompt snapshot build script `site/scripts/copy-prompts.ts` + `sources-raw/manifest.json` emission (task `0091`)
- `<TransparencyDrawer>` shell with 4 tabs + hash-fragment deep-link utility (`#transparence=...`) (task `0092`)
- Sources tab with file index + inline PDF/markdown/text/JSON viewers (task `0093`)
- Document consolidé tab with `react-markdown` + slug-anchor scroll (task `0094`)
- Prompts tab with SHA256-verified display and "not available in current repository" state for drifted prompts (task `0095`)
- Résultats IA tab with aggregation notes + per-model raw JSON + agreement-map read-only views (task `0096`)
- `<SourceRef>` component + migration of IntergenSection and DomainesSection evidence chips (task `0097`)
- Integration: NavBar entry, TransparencyFooter button, e2e smoke test on `test-omega` (task `0098`)

**Non-negotiables:**
- Prompt-byte integrity — the drawer refuses to render current disk content under a historic SHA256 when the file has drifted.
- Agreement map is a read-only display of `agreement_map` fields. No cardinal averaging, no score bars, no synthetic means.
- Every claim carrying `source_refs` becomes click-to-open via `<SourceRef>`.
- Drawer chrome is candidate-agnostic — identical four tabs for every candidate.

**Key design decisions (spike `0090`):**
- Hash-fragment URL scheme (`#transparence=...`) — compatible with `output: "export"`, free of full re-renders, cleanly removed on close via `history.replaceState`.
- Content-addressed prompt snapshots (`/prompts/<sha256>.md`) guarantee byte-accurate historical prompt display; drift produces a warning, never a silent substitution.
- Zero schema changes — M_Transparency is pure UI over artifacts that already exist.
- `<Drawer>` primitive reused from M_CandidatePagePolish at `size="xl"`.

**Scope boundary (what this milestone does NOT cover):**
- Syntax highlighting for JSON / markdown (deferred polish)
- Custom PDF viewer (native browser iframe in v1)
- Version-history navigation / diff between versions
- Cross-candidate model comparison
- Bulk zip download
- Full WCAG 2.1 AA audit (→ M_Accessibility)
- English translations of drawer copy (FR canonical)
- Comment / share / chatbot features (explicit non-goals)

---

### M_Comparison

**Goal:** Pick 2–4 candidates, see them side by side on identical dimensions with visual diff.

**Depends on:** M_WebsiteCore + M_VisualComponents + M_CandidatePagePolish

**Status:** ✅ Done (2026-04-22). Spike `0090` archived; implementation tasks `0091`–`0098` shipped in commits `c7c7376`, `a6ae818`, `0013794`, `91ff46d`, `35c51db`, `d8adb0a`, `f1586a5`, `2b960cc`.

**Spike produces:**
- `docs/specs/website/comparison-page.md` (finalized **Stable** on creation; no schema changes)
- Route `/comparer` with URL-query-driven selection (`?c=<id>&c=<id>…`) + localStorage fallback (task `0091`)
- Build-time `deriveComparisonProjection()` view-model and multi-candidate loader (task `0092`)
- Four comparison-variant widgets — `<PositionnementComparison>` (overlaid radar + dot rows), `<DomainesComparison>` (grade table + spread + unique-max marker), `<IntergenComparison>` (h_2038_2047 ordinal table), `<RisquesComparison>` (stacked per-candidate 6×4 matrices) — tasks `0093`–`0096`
- Page shell with candidate selector, sticky selected-header, empty state (task `0097`)
- Landing + candidate-page CTAs, editorial regression test, build smoke (task `0098`)

**Non-negotiables:**
- **No composite / overall scoring across candidates.** No ranking, no winner, no voter-match quiz — enforced by the editorial regression test in task `0098`.
- **No cardinal averaging.** Radar overlays modal integers; per-axis rows plot individual dots; grade deltas report spread (max − min), never mean; the single intergenerational cell uses `h_2038_2047` modal score verbatim.
- **Symmetric rendering.** Every selected candidate renders with identical components, sizes, fonts and column widths. Color slot is URL order only.
- **Dissent preserved by link-out.** Every comparison cell is a projection of an already-aggregated ordinal field; deeper detail remains on `/candidat/<id>`.
- **Zero schema or prompt changes.** All cells derive from existing aggregated v1.1 fields.

**Key design decisions (spike `0090`):**
- Prototype `Comparison Page.html` is the visual contract; the prototype's inline dummy data (`ALL_CANDIDATES`) is discarded — values come from real `aggregated.json`.
- URL query is the source of truth for selection (shareable); localStorage is hydration fallback only.
- Intergenerational cell collapses the 6×3 matrix to the `h_2038_2047` **modal** per row (longest-horizon = "net impact to 2047"). No cross-horizon averaging; row label links to the candidate page's full matrix.
- Unique-best `↑` marker on the domain-grade table is a per-dimension peer comparison, not a composite. Only shown when `argmax` is strictly unique.

**Scope boundary (what this milestone does NOT cover):**
- New analytical output — schema, prompts, aggregation unchanged.
- Landing page and stakes charts (→ M_Landing).
- Per-model dissent drawer in the comparison view (link-out to candidate page instead).
- OG / share-image generation (→ future `M_Sharing`).
- Mobile comparison redesign (→ M_Accessibility).
- Split-pane deep-link from comparison cell to candidate-page section (v1 uses `#` anchors only).

---

### M_PoliticalSpectrum

**Goal:** Add a global political-spectrum label (extrême-gauche / gauche / centre-gauche / centre / centre-droit / droite / extrême-droite + `inclassable` escape hatch) to each candidate analysis, as an **additive** field sibling to the existing 5-axis positioning. The label powers the candidate-page Hero chip (prototype `Candidate Page.html` line 701) and is derived from the axis evidence — never from media convention.

**Depends on:** M_AnalysisPrompts + M_Aggregation + M_CandidatePagePolish (schema v1.1 additive-bump precedent)

**Status:** 📋 Planned. Spike `0099` in `tasks/active/`; implementation tasks `0100`–`0106` in `tasks/backlog/M_PoliticalSpectrum/`.

**Spike produces:**
- `docs/specs/analysis/political-spectrum-label.md` (**Stable** on creation; companion to `political-positioning.md`, not a replacement)
- Zod schema extension on per-model and aggregated positioning; `schema_version` bump `1.1` → `1.2` (task `0100`)
- `prompts/analyze-candidate.md` §9.6 "Overall spectrum label" (task `0101`)
- `prompts/aggregate-analyses.md` §4.3.bis modal + distribution + dissent rule (task `0102`)
- Cross-references in `political-positioning.md`, `output-schema.md`, `aggregation.md` (task `0103`)
- `candidates/test-omega/` fixture regeneration with the new field (task `0104`)
- `site/lib/derived/spectrum-label.ts` helper + `Hero.tsx` chip next to party badge (task `0105`)
- Optional surfacing in `/comparer` selector + sticky header (task `0106`)

**Non-negotiables:**
- **Derived, not convention-assigned.** The label must be computed from the 5-axis evidence present in the same analysis; the prompt forbids anchoring on media reputation or party name. `derived_from_axes` is a required non-empty array.
- **Never averaged.** Aggregation uses modal plurality + `label_distribution` counts + `dissent[]` — identical discipline to the per-axis ordinal rule. `.strict()` Zod rejects any `score`, `mean`, `index`, or `numeric_value` key on the spectrum object.
- **Escape hatch is first-class.** `inclassable` is part of the enum, not a fallback. Programs orthogonal to L-R are expected to land there with reasoning.
- **Radar remains authoritative.** The chip is a communication aid that scrolls to `#positionnement`. The site never shows the chip without the 5-axis detail on the same page.
- **Absent-field fails soft.** Pre-v1.2 aggregated outputs render no chip — no placeholder, no guessed label.

**Key design decisions (spike `0099`):**
- 8-value enum (7 canonical French + `inclassable`). Display labels in `site/lib/i18n.ts`; JSON enum is ASCII snake_case.
- Field lives under `positioning.overall_spectrum` (sibling of the 5 axes), signalling that it is a projection of the positioning block.
- Both analyst and aggregator emit the field; the aggregator never promotes a label no raw output carried.
- `modal_label = null` on tied / all-distinct modes → site renders "Positionnement partagé" with tooltip.
- Manual-bundle scripts (`prepare-manual-*.ts`) need no code change; they embed `prompts/*.md` verbatim, so prompt updates propagate.

**Scope boundary (what this milestone does NOT cover):**
- Replacement of the 5-axis positioning — the label is additive only.
- Retroactive relabeling of historical raw outputs — pre-v1.2 outputs remain valid and chip-less.
- A "filter candidates by spectrum" view or a landing-page spectrum bar.
- Re-analysis of production candidates via paid APIs — folded into the next candidate update cycle.
- English enum values beyond i18n display labels — no new translation infrastructure.

---

### M_Landing

**Goal:** Landing page with France-level context (debt curve, demographic curve, "stakes" framing), candidate cards grid, entry to comparison mode. Visual contract is the `Landing Page.html` prototype; implementation is a pure projection of existing aggregated data plus a static France-level context module.

**Depends on:** M_Comparison

**Status:** 🚧 In Progress. Spike `0110` archived (2026-04-22); implementation tasks `0111`–`0118` in `tasks/backlog/M_Landing/`.

**Spike produces:**
- `docs/specs/website/landing-page.md` (**Stable** on creation; no schema changes)
- `site/lib/landing-context.ts` — France-level stats + two area-chart series with source URLs (task `0111`)
- `site/lib/landing-cards.ts` — `LandingCard` view-model + `listLandingCards()` including `pending` candidates + family-bucket mapping (task `0112`)
- `<StakesAreaChart>` reusable pure-SVG area chart with reference line + projection support (task `0113`)
- `<LandingHero>` with neutral-color headline stats (editorial adjustment vs. prototype) (task `0114`)
- `<CandidateGrid>` + `<CandidateCard>` (analyzed/pending variants) + family filter + extracted `<SpectrumPill>` widget (task `0115`)
- `<LandingNavBar>`, `<CompareCta>`, `<MethodologyBlock>`, `<LandingFooter>` + shared `buildCompareCtaHref` helper (task `0116`)
- `/` route assembly, page metadata, i18n wiring, end-to-end build smoke (task `0117`)
- Editorial regression test covering banned vocabulary + neutral-color assertion on headline stats (task `0118`)

**Non-negotiables:**
- **No ranking of candidates.** Order is `updatedAt` desc with `displayName` asc as tie-breaker; analyzed and pending cards interleave.
- **No cardinal averaging.** Per-card mini axis bar plots the economic-axis modal only; grade badge is the already-aggregated top-level grade.
- **Symmetric cards.** Every analyzed candidate renders with the same tile; every pending candidate renders with the same tile; no party-specific treatment.
- **Neutral presentation of context numbers.** Headline debt/deficit/carbon stats render in the default text color — no `bad`/`warn` coloring. Advocacy framing ("crise", "catastrophe") banned by editorial regression test.
- **Pending ≠ clickable.** Candidates without a published `aggregated.json` render as `aria-disabled` with no link target; clicking a pending tile would imply withheld analysis.
- **Sources cited.** Every France-level series pill links to its source URL (Eurostat, INSEE, legal target).

**Key design decisions (spike `0110`):**
- Landing-card view-model reuses `deriveComparisonProjection()` for analyzed rows; pending rows skip `aggregated.json` entirely — single derivation pipeline, two safe outputs.
- Family filter maps the 7-label spectrum taxonomy to four buckets (gauche / centre / droite / écologie) via a deterministic public mapping; `metadata.family_override` is an additive optional field for ecology-platform candidates whose spectrum lands elsewhere.
- France-level context is a static typed constant in `site/lib/landing-context.ts` — never auto-fetched; updating it is a documented manual step.
- Filter state is ephemeral (no URL, no localStorage); the canonical candidate URL stays `/candidat/<id>`.
- `<SpectrumPill>` is extracted from the existing candidate-page `Hero.tsx` so both surfaces share identical visuals.

**Scope boundary (what this milestone does NOT cover):**
- Content for the `/methodologie`, `/changelog`, `/mentions-legales` pages — linked with placeholder anchors in v1.
- Real EN translation of aggregated content (→ future `M_I18n`); EN chrome strings use the existing placeholder pattern.
- Per-candidate photos on cards — slot reserved but not wired; filled when photo assets are onboarded under `M_CandidateOnboarding`.
- Server-side analytics; no telemetry on the hot path.
- Schema changes beyond the additive optional `family_override` on `CandidateMetadataSchema`.
- Any average or composite ranking across candidates — explicit non-feature carried over from `structure.md`.

---

### M_UpdateWorkflow

**Goal:** The "one week later" flow — scripts and documentation that make updating a candidate's analysis a ~1-hour task (15m LLM time, 30m human review, 15m commit/deploy).

**Depends on:** M_FirstCandidate

**Deliverables:**
- `.github/prompts/update-candidate.prompt.md` (already drafted in foundation)
- `scripts/` orchestration wrapper
- Documented process in `docs/specs/data-pipeline/update-workflow.md`
- Diff visualization between versions

---

### M_Methodology

**Goal:** A public-facing `/methodologie` page that explains, for a sceptical first-time reader, how the project produces an analysis, the editorial guardrails it enforces, what it deliberately does **not** do, its known limitations, and its governance / no-funding posture. Closes the dead `/methodologie` link in the landing page's `MethodologyBlock` and the candidate-page transparency footer.

**Depends on:** M_WebsiteCore + M_I18n (needs FR canonical / EN parity routing)

**Status:** 🚧 In Progress. Spike `0140` active (2026-04-26); implementation tasks `0141`–`0145` in `tasks/backlog/M_Methodology/`.

**Spike produces:**
- `docs/specs/website/methodology-page.md` (finalized **Stable** by spike `0140`)
- New `METHODOLOGY_*` UI string family in `site/lib/i18n.ts` (task `0141`)
- Static route shells `site/app/methodologie/page.tsx` + `site/app/[lang]/methodologie/page.tsx` (task `0142`)
- Eleven section components + `MethodologyPageBody` server component + `methodology-content.ts` static module (task `0143`)
- Patch hard-coded `/methodologie` hrefs in `MethodologyBlock` + `TransparencyFooter` to flow through `localePath()` (task `0144`)
- Editorial smoke test on exported HTML (forbidden vocabulary, no candidate names, anchor parity FR/EN) + build smoke (task `0145`)

**Non-negotiables:**
- Page is candidate-agnostic — no 2027 candidate name appears in any rendered string (enforced by the smoke test in task `0145`).
- Same forbidden vocabulary list as `/comparer` and `/` editorial regressions — no carve-out for the methodology page.
- No advocacy framing on motivation: the project is described as an experiment in objective-driven AI analysis, not as a corrective to "biased media".
- Zero changes to prompts, schemas, aggregation, or candidate data.
- Governance section discloses plainly: single maintainer, no funding, no political affiliation declared, bus-factor risk acknowledged.

**Key design decisions (spike `0140`):**
- Server-only rendering. No client islands. The pipeline diagram is a static SVG with mobile-stack fallback.
- Methodology content is the projection of `docs/specs/` onto a public reader; specs remain the binding source. Spec drift = page drift, not vice versa.
- Static `EDITORIAL_PRINCIPLES` and `PIPELINE_STAGES` arrays in `methodology-content.ts` give the page a single source-of-truth for ordering and i18n keys.
- FR canonical at `/methodologie`; EN at `/en/methodologie` — same shell pattern as `/comparer`.

**Scope boundary (what this milestone does NOT cover):**
- Election-period legal compliance copy (→ M_Legal).
- Mentions légales / about page / contact form / analytics widget.
- Full WCAG 2.1 AA audit (→ M_Accessibility); the page reuses existing tokens and is pure HTML/CSS.
- Changelog page (separate route per `structure.md`).
- "How to reproduce on another election" tutorial (potential follow-up).
- Any change to prompts, schemas, aggregation, or candidate-pipeline behaviour.

---

### M_Legal

**Goal:** Legal review cleared, disclosures published, compliance with French election-period rules confirmed.

**Depends on:** Nothing technical — can proceed in parallel. Blocks M_PublicLaunch.

**Out of scope for AI agents:** This milestone's deliverable is a legal consultation; tasks under it are documentation updates and footer/disclosure components.

---

### M_Accessibility

**Goal:** WCAG 2.1 AA, mobile-first checks, performance budget (LCP <1.5s on mobile), works on slow connections.

**Depends on:** M_WebsiteCore + M_VisualComponents

---

### M_I18n

**Goal:** Ship the public site in English alongside French. The data pipeline stays monolingual French; translation is a separate, human-gated post-processing step on the already-aggregated JSON.

**Depends on:** M_WebsiteCore + M_Comparison + M_Landing (all three page types must be locale-aware)

**Status:** 📋 Planned. Spike `0119` archived (2026-04-25); implementation tasks `0120`–`0129` in `tasks/backlog/M_I18n/`.

**Spike produces:**
- `docs/specs/website/i18n.md` (Stable on promotion via task `0120`)
- Filename convention: `aggregated.json` is canonical FR; `aggregated.<lang>.json` are sibling translation files (additive, no rename).
- Translatable-paths allowlist + parity validator `scripts/validate-translation.ts` (task `0121`).
- Additive `translations.<lang>` block on `VersionMetadataSchema` (prompt SHA, attested model, execution mode, human-review flag).
- Translator prompt `prompts/translate-aggregated.md` + `prepare-manual-translation` / `ingest-translation` scripts (task `0122`).
- Locale-aware `loadCandidate(id, lang)` with FR fallback and `availableLocales` per candidate (task `0123`).
- `[lang]` route segment under `app/[lang]/` mirroring FR for landing, candidate, comparison; FR canonical at bare path; EN at `/en/...` (task `0124`).
- Locale-aware comparison + landing wiring with explicit "FR" tag for FR-only candidates in EN locale (task `0125`).
- `LanguageToggle` rewritten as URL navigator (URL is the source of truth, `localStorage` removed); `TranslationFallbackBanner` (task `0126`).
- Real EN translations for every `UI_STRINGS` entry, no `[EN] …` placeholders (task `0127`).
- `test-omega` translated EN fixture + dual-locale build smoke + `test-delta` as the missing-translation case (task `0128`).
- Quick-start docs addendum + Transparency drawer locale provenance subsection (task `0129`).

**Non-negotiables:**
- **Pipeline stays FR.** Analyst and aggregator prompts unchanged. Translation operates only on `aggregated.json`. No new analysis version is created by translation.
- **Structural parity.** Translation files re-validate against the same `AggregatedOutputSchema`; numbers, scores, IDs, array lengths, agreement maps, and `source_refs` are byte-identical to FR. Only allowlisted prose strings differ.
- **Symmetric scrutiny across locales.** Every FR candidate appears in EN. Missing translations fall back to FR with an explicit banner — never dropped from the locale.
- **Party + candidate names not translated.** Enforced by exclusion of `metadata.json` from the translatable surface.
- **Sources never translated.** `sources.md`, `sources-raw/`, and `raw-outputs/*.json` stay FR (transparency contract).
- **Translation prompt versioned + hashed.** SHA256 + attested model recorded in metadata for each translation, just like analyst and aggregator prompts.
- **Human-review gate.** `aggregated.<lang>.draft.json` → `aggregated.<lang>.json` is a manual `mv`; ingest sets `human_review_completed: false` until the human flips it.

**Key design decisions (spike `0119`):**
- Bare `aggregated.json` = canonical FR; locale suffix marks derivatives. Backward compatible; no rename of existing fixtures.
- Routing: `[lang]` segment, FR canonical at bare path, EN at `/en/...`. Built-in Next.js i18n routing rejected (incompatible with `output: "export"`).
- Loader runs parity check at build time as a warning; hard enforcement happens at ingest. Editorial gate stays human.
- `LangProvider` becomes URL-derived, `localStorage` removed — sharable URLs are the canonical "current locale".

**Scope boundary (what this milestone does NOT cover):**
- Translating `sources.md` or `raw-outputs/*.json` — primary-source fidelity is the transparency contract.
- Translating `aggregation-notes.md` (Transparency drawer surfaces a "FR only" tag in EN; deferred follow-up).
- Translating `metadata.json` (party + display names verbatim across locales).
- Automated MT in CI — every translation is human-reviewed.
- More than two locales (schema and routing extensible; v1 ships only `en`).
- RTL support, locale-aware number formatting, separate EN methodology page (M_Methodology owns).
- Re-running analyses to "improve" EN-readable phrasing in FR — strictly out of scope.

---

### M_PublicLaunch

**Goal:** First publicly announced version.

**Depends on:** M_Comparison + M_Landing + M_Methodology + M_Legal + M_Accessibility + ≥5 candidates analyzed

---

## 🗓️ Indicative Timeline

> These are targets, not commitments. Solo/small-team projects slip; we update dates honestly.

| Phase | Target Window |
|-------|---------------|
| Phase 1 (Foundation + pipeline + first candidate) | Q2 2026 |
| Phase 2 (Website) | Q3 2026 |
| Phase 3 (Operations + Legal) | Q3 2026 |
| Phase 4 (Public launch) | Q3–Q4 2026 |
| Continuous updates | Through April 2027 |

---

## 🚫 Explicit Non-Goals

- **No endorsements.** Ever. The site does not recommend a candidate.
- **No real-time debate scoring.** We analyze programs, not performances.
- **No voter turnout tooling or "voting guide" features** that nudge behavior.
- **No user accounts / comments / social features.** Static site, read-only.
- **No AI chatbot on the site.** (Users bring their own models to dig deeper if they want.)
- **No advertising revenue.** Funding, if any, is grants/donations/personal, publicly disclosed.

These non-goals protect the project's editorial credibility and simplify the attack surface.

---

## 📝 How to Propose a New Milestone

1. Open a spike in `tasks/active/` using `templates/spike.md`
2. Milestone ID must be semantic (`M_<FeatureCluster>`)
3. Spike produces spec + backlog tasks + ROADMAP update
4. See [`.github/prompts/create-spike.prompt.md`](../.github/prompts/create-spike.prompt.md)
