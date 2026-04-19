# Élection 2027 — Multi-AI Program Analysis

> **Analyze. Not advocate.**

A transparent, AI-aggregated analysis of candidate programs for the 2027 French presidential election. Multiple frontier AI models independently analyze each candidate's program across economic, social, security, sovereignty, environmental, institutional, and intergenerational dimensions. Results are aggregated with dissent preserved, published as a static website, with every source, prompt, and raw model output exposed for verification.

![Status](https://img.shields.io/badge/status-Foundation-blue)
![Stack](https://img.shields.io/badge/stack-Next.js-black)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

---

## 🎯 What this project does

For each declared candidate:

1. **Gather** the official program from primary sources (manifestos, speeches, voting records) into a versioned, human-reviewed source document.
2. **Analyze** the program by running a single structured prompt against 4–5 frontier models from different providers (Anthropic, OpenAI, Google, Mistral, xAI…).
3. **Aggregate** the independent analyses into a single result that preserves model disagreement rather than averaging it into consensus.
4. **Publish** as a static Next.js site with clear visual dimensions, a transparency drawer showing raw model outputs, and comparison mode across candidates.

Every claim on the site traces back to the source program. Every model output is public. The methodology is fixed before any candidate is analyzed.

---

## 🧭 Editorial stance

The site is **analysis, not advocacy**. If a program is fiscally sound but transfers wealth from young to old, that's a measurement, not a verdict — readers decide. Specifically:

- **Symmetric scrutiny** — every candidate analyzed with identical rigor on identical dimensions.
- **Measurement over indictment** — the intergenerational section quantifies net transfers, it does not editorialize.
- **Dissent preserved** — when models disagree, the disagreement is shown, not averaged away.
- **Full transparency** — sources, prompts, raw model outputs, and aggregation notes all published.

See [`docs/specs/analysis/`](docs/specs/analysis/) for the editorial principles baked into the pipeline.

---

## 🏗️ How it works

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Primary    │ --> │  sources.md  │ --> │  5× LLMs     │ --> │ Aggregator  │
│  Sources    │     │ (reviewed)   │     │ (parallel)   │     │   LLM       │
└─────────────┘     └──────────────┘     └──────────────┘     └──────┬──────┘
                                                                     │
                                                                     ▼
                                                            ┌─────────────────┐
                                                            │ aggregated.json │
                                                            └────────┬────────┘
                                                                     │
                                                                     ▼
                                                            ┌─────────────────┐
                                                            │  Next.js build  │
                                                            │  (static)       │
                                                            └─────────────────┘
```

See [`docs/specs/data-pipeline/`](docs/specs/data-pipeline/) for the full pipeline spec.

---

## 📁 Repository layout

```
election-2027/
├── candidates/              # Per-candidate versioned data (THE DATA)
│   └── <candidate-id>/
│       └── versions/<date>/
│           ├── sources.md         # Human-reviewed program summary
│           ├── sources-raw/       # Original PDFs, screenshots
│           ├── raw-outputs/       # Per-model JSON outputs
│           ├── aggregated.json    # Final synthesized analysis
│           └── metadata.json      # Version info, model versions used
├── prompts/                 # Versioned LLM prompts (consolidation, analysis, aggregation)
├── scripts/                 # Pipeline orchestration (TypeScript)
├── site/                    # Next.js app (reads from candidates/ at build time)
├── docs/                    # Specs, roadmap, methodology
│   ├── ROADMAP.md
│   └── specs/
├── tasks/                   # Tickets-as-code (active / backlog / archive / templates)
├── AGENTS.md                # AI coding agent guide
└── .github/
    ├── copilot-instructions.md
    └── prompts/             # Reusable agent prompts (create-spike, start-task, …)
```

---

## 🚀 Getting started

Foundation phase. No executable code yet. The next step is the `M_DataPipeline` spike.

```bash
# When pipeline is implemented:
npm install
npm run ingest -- <candidate-id>     # gather sources, produce sources.md
npm run analyze -- <candidate-id>    # fan out to all models in parallel
npm run aggregate -- <candidate-id>  # produce aggregated.json
npm run build                        # static site build
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [`docs/README.md`](docs/README.md) | Documentation index |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Milestones and project plan |
| [`docs/specs/`](docs/specs/) | Permanent design documents |
| [`AGENTS.md`](AGENTS.md) | AI coding agent instructions |
| [`tasks/README.md`](tasks/README.md) | How the tickets-as-code system works |

---

## 🤖 For AI coding agents

Start with [`AGENTS.md`](AGENTS.md) → check [`tasks/active/`](tasks/) → read the linked spec in `docs/specs/` → implement → test → archive the task.

The editorial principles in [`docs/specs/analysis/`](docs/specs/analysis/) are **not negotiable** and must not drift during implementation. If a change seems to compromise them, open a spike to discuss — do not silently change behavior.

---

## 📄 License

TBD. This project will be open-source with a license chosen before launch.

---

## ⚠️ Legal and ethical notes

- French election-period communication rules apply to this site. A legal review is required before the official campaign period.
- This site does not endorse any candidate. It does not accept advertising. Funding sources, if any, will be publicly disclosed.
- All source materials used are public primary sources. Copyright of program documents belongs to their respective authors; this project reproduces them under fair-use for analysis and commentary.
