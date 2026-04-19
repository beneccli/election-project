---
id: "XXXX"
title: "Spike: Short descriptive title"
type: spike          # spike = research/planning task
status: open         # open | active | blocked | done
priority: high       # spikes are usually high priority
created: YYYY-MM-DD
milestone: M_<n>     # The milestone this spike defines (e.g., M_DataPipeline)
spec: null           # Will be created by this spike
context:             # Existing files to read for context
  - path/to/relevant/file.ts
depends_on: []       # List of task IDs this depends on
---

## Goal

What question does this spike answer? What capability does the milestone enable?

## Research Questions

1. What are the requirements?
2. What are the design options?
3. What are the dependencies?
4. What's the scope boundary (what we will NOT do)?
5. What editorial principles constrain the design? (see `AGENTS.md`)

## Deliverables

This spike produces:

1. **Spec Document**: `docs/specs/<category>/<feature>.md`
   - Design decisions and rationale
   - API / data structure / prompt definitions
   - Integration points with existing code
   - Success metrics

2. **Backlog Tasks**: `tasks/backlog/M_<n>/`
   - Individual implementation tasks
   - Each task references the spec
   - Tasks are independent where possible
   - Clear acceptance criteria per task

3. **Update ROADMAP.md**
   - Add milestone to appropriate section
   - Update dependencies

## Existing Context

- Related features: ...
- Prior art: ...
- Constraints: ...
- Editorial principles at stake: ...

## Acceptance Criteria

- [ ] Spec document created in `docs/specs/`
- [ ] At least N tasks created in `tasks/backlog/M_<n>/`
- [ ] Tasks cover all major features from spec
- [ ] Each task has clear acceptance criteria
- [ ] No circular dependencies in task graph
- [ ] ROADMAP.md updated with milestone
- [ ] Editorial principles reviewed and design decisions checked against them

## Notes

Any additional context, open questions, or decisions to resolve.
