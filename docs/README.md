# Documentation Index

Welcome to the documentation for **Élection 2027** — multi-AI analysis of French presidential candidate programs.

---

## Quick Links

- 🗺️ **[Roadmap](ROADMAP.md)** — Milestones and project plan
- 📐 **[Specs](specs/)** — Permanent design documents
- 🤖 **[AGENTS.md](../AGENTS.md)** — AI coding agent instructions
- 📋 **[Tasks](../tasks/README.md)** — How the tickets-as-code system works

---

## Document Structure

```
docs/
├── README.md               # This file
├── ROADMAP.md              # Project milestones and plan
└── specs/                  # Permanent design documents
    ├── README.md
    ├── analysis/           # Editorial principles, prompts, schemas
    │   ├── editorial-principles.md
    │   ├── dimensions.md
    │   ├── analysis-prompt.md
    │   ├── output-schema.md
    │   ├── aggregation.md
    │   ├── political-positioning.md
    │   └── intergenerational-audit.md
    ├── candidates/         # Candidate data layout and conventions
    │   └── repository-structure.md
    ├── data-pipeline/      # Ingestion and orchestration
    │   ├── overview.md
    │   ├── source-gathering.md
    │   └── update-workflow.md
    └── website/            # Site structure and components
        ├── structure.md
        ├── visual-components.md
        └── transparency.md
```

---

## For New Contributors

1. **Start with [`../README.md`](../README.md)** for project overview
2. **Read [`../AGENTS.md`](../AGENTS.md)** for architecture and editorial principles
3. **Check [`ROADMAP.md`](ROADMAP.md)** for current milestone
4. **Browse [`specs/`](specs/)** to understand the design
5. **Look at [`../tasks/active/`](../tasks/)** for current work

---

## For AI Coding Agents

See [`../AGENTS.md`](../AGENTS.md) for:
- Project overview and architecture
- Editorial principles (non-negotiable)
- Task management system
- Testing conventions
- Code style guidelines

**Critical:** Before touching prompts, schemas, or aggregation, re-read the editorial principles in `AGENTS.md`. They are guardrails, not suggestions.

---

## Current Phase

**Phase 1: Foundation** (M_Foundation, M_DataPipeline, M_AnalysisPrompts)

Focus areas:
- Pipeline architecture (consolidate → analyze → aggregate → publish)
- Versioned prompt artifacts
- Zod schema for analysis output
- First candidate end-to-end as proof of concept

See [`ROADMAP.md`](ROADMAP.md) for details.

---

**Last Updated**: April 2026
**Status**: Foundation in progress
