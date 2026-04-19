---
id: "XXXX"
title: "Short descriptive title"
type: task           # task | bug | spike | epic
status: open         # open | active | blocked | done
priority: medium     # low | medium | high | critical
created: YYYY-MM-DD
milestone: M_<n>     # Semantic milestone ID (e.g., M_DataPipeline, M_WebsiteCore)
spec: null           # Link to spec doc: docs/specs/analysis/output-schema.md
context:             # Files the agent MUST read before working
  - path/to/relevant/file.ts
  - path/to/another/file.ts
test_command: npm run test -- <filter>
depends_on: []       # List of task IDs this depends on: ["0001", "0002"]
---

## Context

Brief description of the problem or feature. What exists today? What's the gap?

## Objectives

1. First concrete objective
2. Second concrete objective
3. Third concrete objective

## Acceptance Criteria

- [ ] Criterion 1 (testable)
- [ ] Criterion 2 (testable)
- [ ] Criterion 3 (testable)
- [ ] All tests pass: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- Look at `some-file.ts` for patterns
- The existing `SomeType` can be extended
- Refer to spec section "X" for design details

## Editorial check (if applicable)

If this task touches any of the following, re-read editorial principles in `AGENTS.md` first:
- [ ] Prompts in `prompts/` — does this change analysis behavior?
- [ ] Schemas — does this preserve evidence/source_refs?
- [ ] Aggregation — does this preserve dissent?
- [ ] Website copy — is the language measurement, not indictment?
- [ ] Any asymmetry introduced between candidates?

## Notes

Any additional context, links to discussions, or historical decisions.
