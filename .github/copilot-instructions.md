# Élection 2027: Global Architecture Context

You are working on **Élection 2027** — a transparent multi-AI analysis of French presidential candidate programs, published as a static Next.js website.

## Core Architecture
- **Pipeline** (`scripts/`, TypeScript): consolidate → analyze (parallel across LLMs) → aggregate → publish
- **Data** (`candidates/`): per-candidate, versioned by date. Human-reviewed source documents + raw model outputs + aggregated JSON
- **Prompts** (`prompts/`): versioned LLM prompts, treated as first-class artifacts
- **Site** (`site/`): Next.js app, static export, reads from `candidates/` at build time

## ⚠️ Editorial Principles (READ BEFORE TOUCHING PROMPTS OR AGGREGATION)
- **Analysis, not advocacy.** Readers form verdicts. The site reports tradeoffs.
- **Symmetric scrutiny.** Every candidate, identical dimensions, identical rigor.
- **Measurement over indictment.** Intergenerational = quantified transfers, not moral language.
- **Dissent preserved.** Disagreement across models is shown, not averaged away.
- **Pinned model versions + prompt hashes** in every run's metadata.

If a change would compromise any of these → **stop, open a spike, ask**.

## 📋 Task System ("Tickets as Code")
Work assigned via files in `tasks/`:
- **Active tasks**: `tasks/active/` — read these first
- **Backlog**: `tasks/backlog/M_<n>/` — organized by semantic milestone
- **Spikes**: Research tasks that produce a spec + backlog tasks
- **Milestones**: Semantic IDs (`M_DataPipeline`, `M_WebsiteCore`), never numeric

Workflow: Read task → Read linked spec → Read context → Implement → Test → Archive

## 🚨 Never Do This
- Edit files in `candidates/<id>/versions/<date>/raw-outputs/` — they are the transparency artifact
- Change prompt wording without starting a new analysis version
- Average political positioning scores cardinally — positioning is ordinal
- Publish a new `sources.md` without human review
- Introduce an asymmetry between candidates (one dimension for A, different for B)

## Reference Material
- **Project overview**: [`AGENTS.md`](../AGENTS.md)
- **Roadmap**: [`docs/ROADMAP.md`](../docs/ROADMAP.md)
- **Specs**: [`docs/specs/`](../docs/specs/) (permanent design documents)
- **Pipeline spec**: [`docs/specs/data-pipeline/`](../docs/specs/data-pipeline/)
- **Editorial / analysis spec**: [`docs/specs/analysis/`](../docs/specs/analysis/)
- **Website spec**: [`docs/specs/website/`](../docs/specs/website/)
- **Task system**: [`tasks/README.md`](../tasks/README.md)

## Tech Stack
- Node 20+, TypeScript strict, ES modules
- Next.js (static export), Tailwind, Recharts
- Zod for schema validation
- Vitest for testing
- npm

## Testing & Lint
```bash
npm run test          # Vitest
npm run test:schema   # JSON schema tests
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
```

**For AI Agents:** Start with `docs/ROADMAP.md` for context, check `tasks/active/` for work, read linked specs before implementing. For anything touching editorial behavior (prompts, aggregation, schemas), re-read the editorial principles in `AGENTS.md`.
