# AGENTS.md — AI Coding Agent Instructions

> **Purpose:** Guide AI coding agents (Claude, GitHub Copilot, Cursor, etc.) in contributing to the Élection 2027 multi-AI program analysis project.

---

## 🎯 Project Overview

This project produces a **transparent, multi-AI analysis of 2027 French presidential candidate programs**, published as a static Next.js website. The output is not a single AI's opinion: it's an aggregation of 4–5 frontier models analyzing each program independently, with disagreement preserved rather than averaged away.

### The four pillars of this project

1. **Primary-source grounding** — every claim traces back to the candidate's actual words.
2. **Model diversity** — analyses come from different providers (Anthropic, OpenAI, Google, Mistral, xAI…) to reduce correlated bias.
3. **Editorial neutrality** — analysis, not advocacy. Symmetric scrutiny of every candidate on identical dimensions.
4. **Radical transparency** — sources, prompts, raw model outputs, and aggregation notes all public.

### Editorial principles (non-negotiable)

These principles are baked into the prompts and the aggregation logic. They must not drift during implementation:

- **Analysis over advocacy.** The site reports tradeoffs; readers make verdicts.
- **Symmetric scrutiny.** Every candidate analyzed with identical rigor on identical dimensions. A point of criticism applied to one candidate must be applied to all where relevant.
- **Measurement over indictment.** The intergenerational section quantifies net transfers; it does not editorialize about fairness.
- **Dissent preserved.** When models disagree, show it. Don't average into false consensus.
- **Pinned model versions.** Every run records exact model version strings.
- **Prompt versioning.** A changed prompt is a new analysis version, not an update to an existing one.

If a change seems to compromise these, **open a spike** to discuss — do not silently alter behavior.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Website** | Next.js (static export) |
| **Language** | TypeScript |
| **Package manager** | npm |
| **Schema validation** | Zod |
| **LLM SDKs** | `@anthropic-ai/sdk`, `openai`, `@google/generative-ai`, `@mistralai/mistralai`, etc. |
| **Styling** | Tailwind CSS |
| **Charts/viz** | Recharts or D3 (per-component decision) |
| **Hosting** | Vercel / Cloudflare Pages / Netlify (static) |

### Node / package conventions

- Node 20+ LTS
- ES modules (`"type": "module"`)
- Scripts under `scripts/` are TypeScript, run via `tsx` or `node --loader`
- Strict TypeScript (`"strict": true`), no `any` without explicit justification comment

---

## 📁 Project Structure

```
election-2027/
├── candidates/                 # 📊 THE DATA (per-candidate, versioned)
│   └── <candidate-id>/
│       ├── metadata.json       # candidate name, party, photo, etc.
│       ├── current -> versions/<date>/   # symlink to current version
│       └── versions/
│           └── YYYY-MM-DD/
│               ├── sources.md          # consolidated, human-reviewed program
│               ├── sources-raw/        # original PDFs, screenshots, URLs
│               ├── metadata.json       # version date, models used, prompt hashes
│               ├── raw-outputs/        # one JSON per model, never edited
│               │   ├── claude-opus.json
│               │   ├── gpt-5.json
│               │   ├── gemini-ultra.json
│               │   ├── mistral-large.json
│               │   └── grok.json
│               ├── aggregated.json     # final synthesized analysis
│               └── aggregation-notes.md # where models disagreed, how resolved
│
├── prompts/                    # 📝 VERSIONED LLM PROMPTS
│   ├── consolidate-sources.md
│   ├── analyze-candidate.md
│   ├── aggregate-analyses.md
│   └── adversarial-pass.md
│
├── scripts/                    # 🤖 PIPELINE ORCHESTRATION (TypeScript)
│   ├── consolidate.ts          # sources-raw/* → sources.md
│   ├── analyze.ts              # sources.md → raw-outputs/*.json (parallel)
│   ├── aggregate.ts            # raw-outputs/* → aggregated.json
│   ├── publish.ts              # update current symlink, trigger build
│   └── lib/
│       ├── schema.ts           # Zod schemas for all JSON artifacts
│       ├── providers.ts        # LLM provider abstraction
│       └── validate.ts         # schema validation helpers
│
├── site/                       # 🌐 NEXT.JS APP
│   ├── app/                    # Next.js app router
│   ├── components/             # React components
│   ├── lib/                    # data loading from ../candidates
│   └── public/
│
├── docs/                       # 📚 DOCUMENTATION
│   ├── README.md               # doc index
│   ├── ROADMAP.md              # milestones
│   └── specs/                  # 📐 PERMANENT DESIGN DOCUMENTS
│       ├── analysis/           # editorial principles, prompt design, schema
│       ├── candidates/         # candidate data layout and conventions
│       ├── data-pipeline/      # ingestion, consolidation, aggregation
│       └── website/            # site structure, components, transparency
│
├── tasks/                      # 📋 TICKETS-AS-CODE
│   ├── active/                 # current work (3–5 tasks max)
│   ├── backlog/                # future work by milestone (M_<n>/)
│   ├── archive/                # completed tasks
│   └── templates/              # task.md, spike.md
│
├── AGENTS.md                   # this file
└── .github/
    ├── copilot-instructions.md # global Copilot config
    └── prompts/                # reusable agent prompts
        ├── create-spike.prompt.md
        ├── start-task.prompt.md
        ├── ingest-sources.prompt.md
        ├── update-candidate.prompt.md
        └── review-aggregation.prompt.md
```

---

## 📋 Task Management System ("Tickets as Code")

> **For AI Agents:** This is how you receive work assignments.
> **Canonical Source:** [`tasks/README.md`](tasks/README.md)

### Directory Structure

```
tasks/
├── active/           # Current work (read these!)
├── backlog/          # Future work organized by milestone
│   ├── M_Foundation/
│   ├── M_DataPipeline/
│   └── ...
├── archive/          # Completed tasks
└── templates/        # task.md, spike.md
```

### Task Types

| Type | Purpose | Deliverable |
|------|---------|-------------|
| **task** | Implement a feature | Code + tests |
| **bug** | Fix an issue | Code fix + regression test |
| **spike** | Research/planning | Spec + backlog tasks |
| **epic** | Group of related tasks | All subtasks completed |

### Spike Workflow (new milestone)

1. Create spike in `tasks/active/` using `templates/spike.md`
2. Agent researches and produces:
   - Spec document in `docs/specs/<category>/`
   - Tasks in `tasks/backlog/M_<n>/`
   - ROADMAP update
3. Human reviews and approves
4. Move spike to `archive/`
5. Move tasks from `backlog/` to `active/` one at a time

### Task Workflow (implementation)

1. Read task file in `tasks/active/`
2. Parse YAML frontmatter: `spec`, `context`, `test_command`
3. Read the spec (permanent design doc in `docs/specs/`)
4. Read context files
5. Execute objectives
6. Run `test_command`
7. Move task to `tasks/archive/`

### Task File Format

```yaml
---
id: "0001"
title: "Implement Zod schema for candidate analysis output"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_DataPipeline
spec: docs/specs/analysis/output-schema.md
context:
  - scripts/lib/schema.ts
  - prompts/analyze-candidate.md
test_command: npm run test -- schema
depends_on: []
---
```

### The Golden Rules

1. **Code references specs, NOT tasks**
   - ❌ `// See task 0042`
   - ✅ `// See docs/specs/analysis/output-schema.md`

2. **Milestones use semantic IDs** — `M_DataPipeline`, not `M3`

3. **Specs are permanent, tasks are transient**
   - Specs describe *what* and *why*
   - Tasks describe *when* and *how much*

4. **Done = Move**
   - `mv tasks/active/0001-*.md tasks/archive/`

---

## 🚨 Critical rules specific to this project

### Editorial rules

1. **Never change prompt wording casually.** The prompts in `prompts/` are versioned artifacts. A reworded analysis prompt changes the meaning of every output produced with it. If you need to edit one, you are starting a new analysis version — document why.

2. **Never edit files in `raw-outputs/`.** They are the transparency artifact. If a model produced a broken JSON, fix the prompt or add a validation retry; never hand-edit the output.

3. **Never aggregate positioning by averaging.** Political positioning scores across models are ordinal, not cardinal. Aggregation uses relative ordering or consensus intervals, never arithmetic mean. See [`docs/specs/analysis/political-positioning.md`](docs/specs/analysis/political-positioning.md).

4. **Never introduce asymmetric scrutiny.** If a dimension is analyzed for one candidate, it must be analyzed for every candidate. No "we'll skip this for X because they don't talk about it" — if they don't talk about it, that's itself an analytical finding.

5. **The intergenerational section is measurement.** It describes transfers in concrete units (€/person/year, probability of homeownership by age N, pension replacement rate for a 25-year-old today). It does not use advocacy language like "sacrificing" or "stealing from".

### Technical rules

6. **Pin model versions.** Every analysis run records exact model version strings in `metadata.json` (e.g. `claude-opus-4-7`, not `claude-opus`).

7. **Validate every JSON artifact** against its Zod schema before writing to disk. Silent schema drift is the worst kind of bug for this project.

8. **Hash prompts.** Record SHA256 of each prompt file used in a run's `metadata.json`. This allows detecting if a prompt changed between runs claiming to be the same version.

9. **Every claim carries evidence.** In analysis output JSON, every judgment field has a sibling `source_refs` field pointing into `sources.md`. A claim with no evidence is a bug.

10. **Human review gate on `sources.md`.** The pipeline never auto-publishes a new source document. A human must review and commit. Scripts may produce a `sources.md.draft`; committing the final name is a manual step.

---

## 🧪 Testing Conventions

### Running tests

```bash
npm run test              # full test suite (Vitest)
npm run test:schema       # JSON schema validation tests
npm run test:pipeline     # pipeline scripts (with mocked LLM providers)
npm run test:site         # Next.js component tests
npm run lint              # ESLint + TypeScript
npm run typecheck         # tsc --noEmit
```

### Test naming

```ts
// Pattern: <subject>_<scenario>_<expected>
test("schema_validates_valid_candidate_output_returns_success", () => { ... });
test("aggregator_preserves_dissent_when_models_disagree", () => { ... });
```

### Test categories

- **Unit** — Vitest, colocated with source (`foo.ts` + `foo.test.ts`)
- **Schema** — validate that example outputs parse
- **Pipeline** — integration tests with mocked LLM providers using fixture responses
- **Site** — component tests with React Testing Library

### Required fixture coverage

Pipeline tests must cover:
- All models returning valid JSON (happy path)
- One model returning malformed JSON (retry behavior)
- Models disagreeing on a key claim (dissent preserved)
- Models agreeing on a claim (consensus marked)
- A model making a claim unsupported by `sources.md` (flagged in review queue)

---

## 📝 Code Style

- TypeScript strict mode, no `any` without justification
- Prettier defaults, 2-space indent
- ESLint with `@typescript-eslint` recommended + React
- No `console.log` in committed code — use a structured logger (`pino` or similar)
- JSDoc on exported functions

### Naming

| Item | Convention | Example |
|------|------------|---------|
| Types/Interfaces | PascalCase | `CandidateAnalysis` |
| Functions/vars | camelCase | `aggregateAnalyses` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |
| Files | kebab-case | `candidate-analysis.ts` |
| React components | PascalCase file | `CandidateCard.tsx` |

---

## 🔄 Development Workflow

### For a new feature (milestone)

1. Read `docs/ROADMAP.md` to understand where this fits
2. Create a spike using [`.github/prompts/create-spike.prompt.md`](.github/prompts/create-spike.prompt.md)
3. Spike produces spec + backlog tasks
4. Implement tasks one at a time

### For updating a candidate's analysis

1. Use [`.github/prompts/update-candidate.prompt.md`](.github/prompts/update-candidate.prompt.md)
2. Workflow:
   - Fetch latest sources into new dated folder
   - Run consolidation → human review of `sources.md`
   - Run analysis (parallel across models)
   - Run aggregation
   - Update `current` symlink
   - Commit, push, deploy

### For a bug fix

1. Reproduce with a test
2. Fix with minimal changes
3. Ensure the regression test stays in the suite

---

## 🤖 AI Agent Tips

### When implementing a task

1. **Read the spec first.** Design decisions live in `docs/specs/`, not in your head.
2. **Check editorial principles** (top of this file) if the task touches prompts, schemas, or aggregation.
3. **Start with the schema.** If the task produces or consumes JSON, write/update the Zod schema first, then the code.
4. **Test with fixtures, not live APIs.** LLM calls in tests are flaky and expensive.
5. **Small diffs.** Prefer many small commits over one large one.

### When unsure

1. Ask clarifying questions — don't guess at requirements.
2. Propose alternatives — "I could do X or Y, which fits better?"
3. If it might violate an editorial principle — **stop and ask**.

### Red flags (escalate before acting)

- The task would change prompt wording
- The task would introduce an asymmetry between candidates
- The task would remove or downgrade transparency (hiding raw outputs, prompts, or sources)
- The task would average positioning scores cardinally
- The task would allow the site to publish without a reviewed `sources.md`

If you see any of these, **pause and ask the human** before implementing.

---

## 📚 Further Reading

- [`docs/ROADMAP.md`](docs/ROADMAP.md) — project milestones
- [`docs/specs/analysis/`](docs/specs/analysis/) — editorial and analytical design
- [`docs/specs/data-pipeline/`](docs/specs/data-pipeline/) — pipeline architecture
- [`docs/specs/website/`](docs/specs/website/) — site structure and components
- [`tasks/README.md`](tasks/README.md) — task system details
- [`prompts/`](prompts/) — the actual LLM prompts (versioned artifacts)
