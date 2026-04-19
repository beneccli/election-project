You are an AI coding agent working on the **Élection 2027** project — a transparent multi-AI analysis of French presidential candidate programs. Your job is to create a planning spike for a new milestone.

## Before anything else: read these

1. [`AGENTS.md`](../../AGENTS.md) — project architecture and editorial principles
2. [`docs/ROADMAP.md`](../../docs/ROADMAP.md) — where this milestone fits
3. [`docs/specs/README.md`](../../docs/specs/README.md) — existing specs
4. [`docs/specs/analysis/editorial-principles.md`](../../docs/specs/analysis/editorial-principles.md) — **non-negotiable guardrails**

If the spike touches prompts, schemas, aggregation, or website copy, the editorial principles constrain the design. Re-read them before proposing solutions.

## What is a Spike?

A spike is a research/planning task that produces deliverables BEFORE implementation begins. Spikes answer the question: "What exactly should we build and how should we build it?"

## Your Deliverables

1. **Spec Document** — `docs/specs/<category>/<feature>.md`
   - Design decisions and rationale
   - Data structures / API / prompt definitions
   - Integration points with existing code
   - Success metrics
   - Open questions noted explicitly

2. **Backlog Tasks** — `tasks/backlog/M_<n>/`
   - Individual implementation tasks
   - Each task references the spec (not other tasks)
   - Clear acceptance criteria per task
   - No circular dependencies

3. **ROADMAP Update** — Add or update milestone in `docs/ROADMAP.md`
   - Assign to appropriate phase
   - Note dependencies
   - Note what this milestone explicitly does NOT cover (scope boundary)

## Spike Workflow

1. **Create spike file** in `tasks/active/` using `tasks/templates/spike.md`

2. **Research the feature area:**
   - Read existing specs in `docs/specs/` to understand prior decisions
   - Read related code (`site/`, `scripts/`, `prompts/`)
   - Check `docs/ROADMAP.md` for dependencies

3. **Check against editorial principles:**
   - Does the proposed design preserve symmetric scrutiny?
   - Does it preserve dissent where relevant?
   - Does it keep measurement over indictment in place?
   - Does it maintain transparency?
   - If the answer to any is "uncertain" — surface this in the spec under "Open questions" and ask for human review before continuing.

4. **Create the spec document** with:
   - Problem statement
   - Design options considered
   - Chosen approach with rationale
   - Data structures / prompt designs / component specs
   - Integration plan
   - Test strategy
   - Open questions

5. **Break down into tasks:**
   - Create `tasks/backlog/M_<n>/` folder
   - Create task files using `tasks/templates/task.md`
   - Each task ~1-3 hours of implementation work
   - Tasks reference the spec, not each other
   - Include editorial-check items in task files where relevant

6. **Update ROADMAP.md** with the new milestone

7. **Archive the spike:**
   ```bash
   mv tasks/active/0000-spike-*.md tasks/archive/
   ```

## Example Spike Structure

```
tasks/
├── active/
│   └── 0000-spike-visual-components.md  # The spike itself (then archived)
└── backlog/
    └── M_VisualComponents/
        ├── 0150-positioning-radar.md
        ├── 0151-positioning-axis-row.md
        ├── 0152-intergenerational-split.md
        ├── 0153-dimension-tile.md
        └── ...

docs/specs/
└── website/
    └── visual-components.md  # The spec document (updated or created)
```

## Golden Rules

- **Specs are permanent** — Design documents live in `docs/specs/`
- **Tasks are transient** — They get archived when done
- **Semantic milestone IDs** — `M_VisualComponents`, NOT `M7.1`
- **Code references specs** — `// See docs/specs/website/visual-components.md`
- **Editorial principles override convenience** — If the most elegant design would violate a principle, it is not the chosen design. Flag the tension in the spec and propose an alternative.

## Red Flags — Stop and Escalate

Stop, document in the spike file, and ask the human before proceeding if:

- The proposed design would allow publishing without a reviewed `sources.md`
- The proposed design would average political positioning scores cardinally
- The proposed design would hide dissent between models
- The proposed design would introduce candidate-specific prompt branches
- The proposed design would reduce transparency (hiding raw outputs, prompts, or sources)
- The proposed design uses advocacy framing in output copy

These are not matters of convenience or elegance — they are project integrity.

## Template Locations

- Spike template: `tasks/templates/spike.md`
- Task template: `tasks/templates/task.md`

## Final Check Before Submitting

Re-read the spec you produced. Ask:

1. Would another AI agent be able to implement the tasks without needing this conversation?
2. Are the editorial principles preserved?
3. Are the "no" cases (scope boundaries) explicit?
4. Is the spec linked from `docs/specs/README.md`?

If any answer is "no", iterate before archiving the spike.
