You are an AI coding agent working on the **Élection 2027** project — a transparent multi-AI analysis of French presidential candidate programs. Your job is to complete a task from the task management system.

## Before anything else: read these

1. [`AGENTS.md`](../../AGENTS.md) — project architecture and editorial principles
2. [`docs/specs/analysis/editorial-principles.md`](../../docs/specs/analysis/editorial-principles.md) — **non-negotiable guardrails**

If the task touches any of: prompts, analysis schemas, aggregation logic, or website copy — the editorial principles constrain what you can do. Re-read them before implementing.

## Your Workflow

1. **Find active tasks:**
   ```bash
   ls tasks/active/
   ```

2. **Pick a task** (or use the one specified by the user)

3. **Read the task file** and parse the YAML frontmatter:
   - `spec:` — Design document to read FIRST
   - `context:` — Source files to understand
   - `test_command:` — How to verify your work
   - `depends_on:` — Ensure these are done

4. **Read the spec document** (e.g., `docs/specs/analysis/output-schema.md`)
   - Understand the design decisions
   - Know the API / schema / component contract
   - Check success criteria

5. **Read context files** to understand current implementation

6. **Check the task's "Editorial check" section** — if any item applies, re-read the relevant editorial principle before coding.

7. **Execute the objectives** from the task file

8. **Run the test command** to verify:
   ```bash
   npm run test -- <filter>
   ```
   Plus always:
   ```bash
   npm run lint
   npm run typecheck
   ```

9. **Archive when complete:**
   ```bash
   mv tasks/active/XXXX-*.md tasks/archive/
   ```

## Golden Rules

- **Code references specs, NOT tasks** — Use `// See docs/specs/...`
- **Milestones use semantic IDs** — `M_DataPipeline`, NOT `M2`
- **Read spec before implementing** — Design decisions are there for a reason
- **Test incrementally** — Don't write 500 lines before testing
- **Small diffs** — Prefer many small commits over one large one
- **Strict TypeScript** — No `any` without a `// eslint-disable-next-line` + explanation
- **No `console.log` in committed code** — use the project logger

## Red Flags — Stop and Ask

Stop and escalate to the human before continuing if:

- Implementing the task would require changing prompt wording (this creates a new analysis version — not an update)
- Implementing the task would average political positioning scores cardinally
- Implementing the task would hide dissent between models in the UI or aggregation
- Implementing the task would allow publication without a reviewed `sources.md`
- Implementing the task would introduce asymmetric treatment between candidates
- The task's acceptance criteria seem to conflict with an editorial principle
- The spec is ambiguous on a critical editorial question

These are not matters of style — they are project integrity. Never work around them silently.

## If the Task is a Spike

Spikes produce deliverables rather than code:
1. **Spec document** in `docs/specs/<category>/`
2. **Backlog tasks** in `tasks/backlog/M_<n>/`
3. **ROADMAP update**

Use [`.github/prompts/create-spike.prompt.md`](create-spike.prompt.md) as your guide.

## If the Task Touches LLM Prompts

When editing files in `prompts/`:
1. This is a versioned artifact. Editing the wording creates a new analysis version.
2. Bump the version in `prompts/CHANGELOG.md`
3. Document what changed and why
4. Plan for re-running affected candidates (may be its own follow-up task)
5. Re-compute SHA256 hashes in any test fixtures that reference the prompt

## If the Task Touches Schemas

When editing `scripts/lib/schema.ts` or related Zod schemas:
1. Add schema version bump if breaking change
2. Update `docs/specs/analysis/output-schema.md` to match
3. Add migration notes if breaking
4. Update existing fixtures that use the schema
5. Verify existing aggregated.json files still validate (or document migration path)

## Quick Reference

```bash
# List active tasks
ls tasks/active/

# Find open tasks
grep -l "status: open" tasks/active/*.md

# Run all tests
npm run test

# Type-check and lint
npm run typecheck && npm run lint

# Run the pipeline for one candidate
npm run consolidate -- --candidate <id> --version <date>
npm run analyze -- --candidate <id> --version <date>
npm run aggregate -- --candidate <id> --version <date>
npm run publish -- --candidate <id> --version <date>

# Archive completed task
mv tasks/active/0001-*.md tasks/archive/
```

## Final Check Before Archiving

- [ ] All acceptance criteria met
- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] Editorial check items (from task) reviewed
- [ ] Code references spec, not task
- [ ] Small, reviewable diff
- [ ] Commit message explains *why*, not just *what*

If any fail, don't archive. Ask for review first.
