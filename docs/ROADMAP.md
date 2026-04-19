# Élection 2027 — Roadmap

> **Last Updated:** April 19, 2026
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
| M_Foundation | 🚧 Active | Repo scaffolding, docs, tickets-as-code system |
| M_DataPipeline | 📋 Planned (spike needed) | Candidate folder structure, versioning, script skeletons |
| M_AnalysisPrompts | 📋 Planned (spike needed) | The analysis prompt, schema, adversarial pass |
| M_Aggregation | 📋 Planned (spike needed) | Aggregator prompt, agreement_map, dissent preservation |
| M_FirstCandidate | 📋 Planned | End-to-end run on one candidate as proof |

### 📅 Phase 2: Website (planned)

| Milestone | Status | Description |
|-----------|--------|-------------|
| M_WebsiteCore | 📋 Planned (spike needed) | Next.js app, candidate page, data loading |
| M_VisualComponents | 📋 Planned (spike needed) | Radar chart, intergenerational split, risk heatmap, trajectory chart |
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

**Spike produces:**
- `docs/specs/data-pipeline/overview.md` (complete)
- `docs/specs/candidates/repository-structure.md` (complete)
- Refinement of script signatures and error handling
- Backlog tasks in `tasks/backlog/M_DataPipeline/`

**Key design decisions to validate:**
- Symlink vs. manifest file for `current` version
- Should `consolidate.ts` call an LLM or purely concatenate? (likely: LLM with mandatory human review)
- Prompt hash calculation method
- Where structured metadata (model versions, timestamps) lives

---

### M_AnalysisPrompts

**Goal:** Produce the canonical analysis prompt that runs per model per candidate, plus the Zod schema its output must match.

**Depends on:** M_DataPipeline

**Spike produces:**
- `docs/specs/analysis/analysis-prompt.md` (prompt design)
- `docs/specs/analysis/output-schema.md` (Zod schema and JSON structure)
- `docs/specs/analysis/political-positioning.md`
- `docs/specs/analysis/intergenerational-audit.md`
- `docs/specs/analysis/dimensions.md`
- Actual prompt file in `prompts/analyze-candidate.md`
- Actual schema in `scripts/lib/schema.ts`
- Adversarial pass prompt in `prompts/adversarial-pass.md`

**Non-negotiables:**
- Single prompt per candidate (not multi-turn)
- Structured JSON output
- Every claim has evidence citations back to `sources.md`
- Self-confidence scores per section
- Adversarial pass included

---

### M_Aggregation

**Goal:** Produce the aggregator prompt and logic that merges 4–5 per-model JSON outputs into a single `aggregated.json` while preserving dissent.

**Depends on:** M_AnalysisPrompts

**Spike produces:**
- `docs/specs/analysis/aggregation.md`
- Aggregator prompt in `prompts/aggregate-analyses.md`
- Aggregation script `scripts/aggregate.ts`
- `agreement_map` schema extension

**Non-negotiables:**
- Positioning is never cardinally averaged
- Dissent is shown, not averaged away
- Contradictions against `sources.md` flagged for human review, not auto-published

---

### M_FirstCandidate

**Goal:** Execute the full pipeline on one declared candidate end-to-end. This is the proof that the system works before scaling.

**Depends on:** M_DataPipeline + M_AnalysisPrompts + M_Aggregation

**Deliverables:**
- `candidates/<first-candidate-id>/versions/<date>/` fully populated
- `aggregated.json` validated against schema
- Manual inspection of output quality
- Iteration on prompts based on what we learn

---

### M_WebsiteCore

**Goal:** Next.js app reading from `candidates/` at build time, rendering a basic candidate page.

**Depends on:** M_FirstCandidate (need real data to build against)

**Spike produces:**
- `docs/specs/website/structure.md` (complete)
- Component architecture
- Data loading strategy (filesystem at build time)
- Backlog tasks

---

### M_VisualComponents

**Goal:** The signature visual components that make the site screenshot-worthy: 5-axis positioning radar, intergenerational split panel, risk heatmap, trajectory chart.

**Depends on:** M_WebsiteCore

**Spike produces:**
- `docs/specs/website/visual-components.md`
- Component specs (props, states, accessibility)
- Backlog tasks per component

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
