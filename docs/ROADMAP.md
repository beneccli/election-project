# Élection 2027 — Roadmap

> **Last Updated:** April 20, 2026
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

### 🚧 Phase 1: Foundation (in progress)

| Milestone | Status | Description |
|-----------|--------|-------------|
| M_Foundation | ✅ Done | Repo scaffolding, docs, tickets-as-code system |
| M_DataPipeline | ✅ Done | Candidate folder structure, versioning, script skeletons |
| M_AnalysisPrompts | ✅ Done | The analysis prompt, schema, inline adversarial pass |
| M_Aggregation | ✅ Done | Aggregator prompt, agreement_map, dissent preservation, human review CLI |
| M_AnalysisModes | ✅ Done | Manual web-chat + Copilot-agent execution modes, test-candidate scaffolding, publish guard |
| M_FirstCandidate | 📋 Planned | End-to-end run on one candidate as proof |

### 📅 Phase 2: Website (planned)

| Milestone | Status | Description |
|-----------|--------|-------------|
| M_WebsiteCore | ✅ Done | Next.js (App Router + static export), candidate page, build-time data loading |
| M_VisualComponents | ✅ Done | Radar chart, intergenerational split, risk heatmap, counterfactual signal |
| M_CandidatePagePolish | ✅ Done | Screenshot-worthy sections: per-model radar overlays, dimension headline list, intergen horizon matrix, risk summary matrix + Drawer primitive. Adds schema v1.1 (additive). |
| M_Transparency | 📋 Planned (spike needed) | Transparency drawer — raw outputs, prompts, sources exposed |
| M_Comparison | 📋 Planned | Side-by-side candidate comparison mode |
| M_Landing | 📋 Planned | Landing page with "2027 stakes" visuals |

### 📅 Phase 3: Operations (planned)

| Milestone | Status | Description |
|-----------|--------|-------------|
| M_UpdateWorkflow | 📋 Planned | Scripts and docs for "one week later" candidate updates |
| M_Methodology | 📋 Planned | Methodology page; how everything works, funding, governance |
| M_Legal | 📋 Planned | Legal review, election-period compliance, disclosures |
| M_Accessibility | 📋 Planned | WCAG 2.1 AA, mobile, slow-connection optimization |

### 📅 Phase 4: Launch + Evolution (planned)

| Milestone | Status | Description |
|-----------|--------|-------------|
| M_PublicLaunch | 📋 Planned | First public version |
| M_CandidateOnboarding | 📋 Planned | Process to add a newly declared candidate |
| M_DebateIntegration | 📋 Planned | React to debate moments with supplementary analysis |
| M_I18n | 🤔 Under consideration | English version? |

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

**Goal:** The transparency drawer — sources, prompts, raw per-model outputs, agreement map — all accessible from the candidate page.

**Depends on:** M_WebsiteCore

**Spike produces:**
- `docs/specs/website/transparency.md`
- UX design for drawer
- Handling of large raw JSON outputs (syntax highlight, collapse)

---

### M_Comparison

**Goal:** Pick 2–4 candidates, see them side by side on identical dimensions with visual diff.

**Depends on:** M_WebsiteCore + M_VisualComponents

---

### M_Landing

**Goal:** Landing page with France-level context (debt curve, demographic curve, "stakes" framing), candidate cards grid, entry to comparison mode.

**Depends on:** M_Comparison

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

**Goal:** A dedicated methodology page users can read to understand how every claim on the site was produced.

**Depends on:** M_Aggregation (needs the methodology to be stable)

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
