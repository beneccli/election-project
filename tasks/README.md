# Élection 2027 — Task Management

> **Purpose:** AI-agent-friendly task tracking using "Tickets as Code" (TaC)

---

## Directory Structure

```
tasks/
├── active/              # Tasks currently being worked (3–5 max)
├── backlog/             # Future work organized by milestone
│   ├── M_Foundation/
│   ├── M_DataPipeline/
│   ├── M_AnalysisPrompts/
│   ├── M_WebsiteCore/
│   └── ...
├── archive/             # Completed tasks (moved here when done)
├── templates/           # Task and spike templates
│   ├── task.md          # Standard implementation task
│   └── spike.md         # Research/planning spike
└── README.md            # This file
```

---

## Task Types

| Type | Purpose | Deliverable |
|------|---------|-------------|
| **task** | Implement a feature | Code + tests |
| **bug** | Fix an issue | Code fix + regression test |
| **spike** | Research/planning | Spec + backlog tasks |
| **epic** | Group of related tasks | All subtasks completed |

---

## Workflow

### Starting a New Milestone (Spike Flow)

1. **Create a spike** in `tasks/active/` using `templates/spike.md`
2. **Agent researches** and creates:
   - Spec document in `docs/specs/<category>/`
   - Tasks in `tasks/backlog/M_<n>/`
   - ROADMAP update
3. **Human reviews** and approves
4. **Move spike to `archive/`**
5. **Move tasks from `backlog/` to `active/`** one at a time

See [`.github/prompts/create-spike.prompt.md`](../.github/prompts/create-spike.prompt.md).

### Working on a Task

1. **Read the task file** in `tasks/active/`
2. **Parse YAML frontmatter** to find:
   - `spec:` — Design document to read first
   - `context:` — Source files to understand
   - `test_command:` — How to verify completion
3. **Read the spec** (permanent design doc in `docs/specs/`)
4. **Read context files**
5. **Execute objectives** from the task
6. **Run `test_command`** to verify
7. **Move to `tasks/archive/`** when complete

See [`.github/prompts/start-task.prompt.md`](../.github/prompts/start-task.prompt.md).

---

## Task File Format

```yaml
---
id: "0001"
title: "Implement Zod schema for candidate analysis output"
type: task                                       # task | bug | spike | epic
status: open                                     # open | active | blocked | done
priority: high                                   # low | medium | high | critical
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

---

## The Golden Rules

### 1. Code references specs, NOT tasks

```ts
// ❌ Bad: Reference to transient task
// See task 0001

// ✅ Good: Reference to permanent spec
// See docs/specs/analysis/output-schema.md
```

### 2. Specs are permanent, tasks are transient

| Document | Describes | Lifetime |
|----------|-----------|----------|
| Spec | *What* and *why* (design) | Permanent |
| Task | *When* and *who* (execution) | Until archived |

### 3. Milestones use semantic IDs

```
❌ Old: M1, M2, M3 (linear, causes inflation)
✅ New: M_DataPipeline, M_WebsiteCore (semantic, extensible)
```

### 4. Done = Move

```bash
mv tasks/active/0001-*.md tasks/archive/
```

Git history tracks when things were done.

### 5. Editorial principles are guardrails

If a task's objectives or acceptance criteria could compromise any editorial principle (analysis over advocacy, symmetric scrutiny, measurement over indictment, dissent preservation, transparency), **pause and escalate** before implementing. See `AGENTS.md`.

---

## Quick Commands

```bash
# List active tasks
ls tasks/active/

# Find all open tasks
grep -l "status: open" tasks/active/*.md

# List tasks for a milestone
ls tasks/backlog/M_DataPipeline/

# Archive a completed task
mv tasks/active/0001-*.md tasks/archive/

# Find tasks by priority
grep -rl "priority: high" tasks/active/
```

---

## Naming Conventions

### Task Files

```
<id>-<short-slug>.md
```

Examples:
- `0001-zod-analysis-schema.md`
- `0002-consolidate-sources-script.md`
- `0000-spike-data-pipeline.md` (spikes often use `0000` prefix)

### Milestone Folders

```
M_<FeatureCluster>/
```

Examples:
- `M_Foundation/`
- `M_DataPipeline/`
- `M_AnalysisPrompts/`
- `M_WebsiteCore/`
- `M_Transparency/`
- `M_Comparison/`

---

## Integration with ROADMAP

The ROADMAP (`docs/ROADMAP.md`) tracks milestones at a high level:
- Status (Done, In Progress, Planned, Spike)
- Dependencies between milestones

Tasks provide the detailed breakdown:
- Individual implementation steps
- Acceptance criteria
- Test commands

**Flow:**
```
ROADMAP (strategy) → Spike (planning) → Spec (design) → Tasks (execution)
```
