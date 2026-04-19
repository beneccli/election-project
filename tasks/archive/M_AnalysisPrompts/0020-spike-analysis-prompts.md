---
id: "0020"
title: "Spike: M_AnalysisPrompts — Canonical analysis prompt, output schema, and adversarial pass"
type: spike
status: done
priority: high
created: 2026-04-19
milestone: M_AnalysisPrompts
spec:
  - docs/specs/analysis/analysis-prompt.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/dimensions.md
  - docs/specs/analysis/political-positioning.md
  - docs/specs/analysis/intergenerational-audit.md
context:
  - docs/specs/analysis/editorial-principles.md
  - docs/specs/analysis/analysis-prompt.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/dimensions.md
  - docs/specs/analysis/political-positioning.md
  - docs/specs/analysis/intergenerational-audit.md
  - docs/specs/analysis/aggregation.md
  - docs/specs/data-pipeline/overview.md
  - prompts/analyze-candidate.md
  - scripts/lib/schema.ts
  - scripts/analyze.ts
depends_on: ["0010"]
---

## Goal

Produce the canonical **per-model, per-candidate analysis prompt** and the **Zod schema** its output must match, replacing the placeholders left by M_DataPipeline.

This spike answers:
- What is the final wording and structure of `prompts/analyze-candidate.md`?
- What is the exact Zod shape of `AnalysisOutputSchema` (today `z.any()`)?
- How is the adversarial pass executed — same call, or separate second call?
- Do we freeze the 5 axes, 6 dimension clusters, and anchor sets in the spec, or leave slack?
- What fixture JSON do we keep in the repo so every downstream change is validated against a concrete example?

Implementation is deferred to the backlog tasks produced by this spike. **The spike itself does not change code or prompts** — it finalizes specs and writes tickets.

## Existing Context

Substantial draft specs already exist and are thorough. They were seeded during foundation and left as `Draft` for this milestone to finalize:

- [`analysis-prompt.md`](../../docs/specs/analysis/analysis-prompt.md) — 9-section prompt design
- [`output-schema.md`](../../docs/specs/analysis/output-schema.md) — per-model JSON structure
- [`dimensions.md`](../../docs/specs/analysis/dimensions.md) — 6 dimension clusters
- [`political-positioning.md`](../../docs/specs/analysis/political-positioning.md) — 5-axis ordinal methodology
- [`intergenerational-audit.md`](../../docs/specs/analysis/intergenerational-audit.md) — measurement-over-indictment framework
- [`editorial-principles.md`](../../docs/specs/analysis/editorial-principles.md) — Stable, non-negotiable

Today `scripts/lib/schema.ts` exports:

```ts
export const AnalysisOutputSchema: z.ZodType<any> = z.any();
```

And `prompts/analyze-candidate.md` is a 30-line placeholder. `scripts/analyze.ts` already wires these in its retry loop — once the real schema and prompt ship, analysis runs begin to validate meaningfully.

## Research Questions + Decisions

### Q1 — Adversarial pass: same prompt or separate call?

**Decision: single prompt, inline adversarial section in v1.**

- The existing prompt design (`analysis-prompt.md §8`) defines an `adversarial_pass` section within the same model call.
- Schema already includes `adversarial_pass` as a top-level field of the analysis JSON.
- A second, independent call would be more adversarial but doubles cost and adds an orchestration dimension we don't yet need.
- Revisit in a future spike if quality suffers.

**ROADMAP impact:** the milestone deliverable "Adversarial pass prompt in `prompts/adversarial-pass.md`" is **not created as a separate file in v1**. The adversarial instructions live inside `prompts/analyze-candidate.md`. ROADMAP updated.

### Q2 — Retries on schema validation

**Decision: 2 retries (total 3 attempts).** Matches the value already wired in `scripts/analyze.ts` (`MAX_RETRIES = 2`). On persistent failure → `<model>.FAILED.json` with error log; aggregation proceeds without that model.

### Q3 — Positioning scores: integers only, or allow halves?

**Decision: integers only in `[-5, +5]`.** Matches the draft positioning spec. Rationale: models hallucinate false precision at sub-integer granularity, and aggregation by consensus interval / modal value is cleaner on integers. Confidence score carries the uncertainty.

### Q4 — Anchor sets per axis

**Decision: 4 anchors per axis, fixed across all candidates.** Anchors listed in `political-positioning.md` (promoted from Draft to Stable). A fixed anchor set is a precondition for cross-candidate comparability — anchors that drift defeat the purpose.

### Q5 — Reference horizon for intergenerational projections

**Decision: 2027–2047 central horizon** (20 years post-election). Shorter-horizon claims (2027–2032) allowed as secondary framing. `intergenerational-audit.md` updated to fix this.

### Q6 — Dimension cluster count

**Decision: keep 6 clusters as drafted** (Economic & Fiscal, Social & Demographic, Security & Sovereignty, Institutional & Democratic, Environmental & Long-term, Intergenerational cross-cutting). Resist splitting "Economic & Fiscal" in v1 — the nesting into sub-dimensions within a cluster already handles granularity and splitting would force website layout changes out of scope for M_AnalysisPrompts.

### Q7 — Temperature

**Decision: `temperature: 0` (or provider equivalent) for the analysis call.** Recorded per run in `metadata.json`. Schema already enforces this field. No separate temperature for the adversarial section (same call, same temperature).

### Q8 — Candidates without legislative records

**Decision: rely on program text + rhetoric with a visible confidence penalty** (confidence ≤ 0.6 on positioning axes unless program explicitly supports placement). Documented in `political-positioning.md`.

### Q9 — Does the model get to request clarification?

**Decision: no.** Single-shot call. Deterministic inputs. If the program is too thin to answer a dimension → "not addressed" is the finding.

### Q10 — Grade semantics

**Decision: grades are "coherence + evidence-support on this dimension", not ideological verdicts.** A candidate can receive an A for a program we personally disagree with if the program is internally coherent, evidence-grounded, and addresses the dimension's problems. Documented in `output-schema.md §dimensions`.

## Deliverables

### 1. Spec finalization (Draft → Stable)

- [ ] `docs/specs/analysis/analysis-prompt.md` — resolve "Open questions", mark **Stable**
- [ ] `docs/specs/analysis/output-schema.md` — freeze fields, fill in any TBD shapes, mark **Stable**
- [ ] `docs/specs/analysis/dimensions.md` — freeze the 6 clusters and sub-dimensions, mark **Stable**
- [ ] `docs/specs/analysis/political-positioning.md` — freeze 5 axes + anchor set, mark **Stable**
- [ ] `docs/specs/analysis/intergenerational-audit.md` — freeze horizon and measurement list, mark **Stable**

### 2. Backlog tasks

Created in [`tasks/backlog/M_AnalysisPrompts/`](../backlog/M_AnalysisPrompts/):

- `0021` — Finalize the 5 analysis specs (promote Draft → Stable, resolve open questions as decided above)
- `0022` — Implement `AnalysisOutputSchema` in `scripts/lib/schema.ts` (replace `z.any()`)
- `0023` — Write the full `prompts/analyze-candidate.md` (replace placeholder)
- `0024` — Schema fixtures + round-trip tests (valid + invalid examples)
- `0025` — Prompt-contract tests (required sections present, no candidate names, stable hash)
- `0026` — End-to-end mock-provider test exercising `analyze.ts` against a fixture model output that matches the real schema

### 3. ROADMAP update

- [ ] Mark M_AnalysisPrompts as **In Progress**
- [ ] Replace deliverable "Adversarial pass prompt in `prompts/adversarial-pass.md`" with "Adversarial pass **section** in `prompts/analyze-candidate.md`" + rationale from Q1
- [ ] Document scope boundary (what this milestone does NOT cover)

## Editorial Principles Check

- ✅ **Analysis, not advocacy.** Prompt wording avoids moral verbs. Schema fields are factual, not judgmental (`magnitude_estimate` not `severity_for_society`).
- ✅ **Symmetric scrutiny.** Fixed 5 axes, 6 dimension clusters, mandatory "not addressed" finding, no candidate-specific branching in prompt.
- ✅ **Measurement over indictment.** Intergenerational section schema forces quantified fields (`quantified: string | null`) separate from narrative fields. Prompt explicitly prohibits "sacrificing", "betraying", etc.
- ✅ **Dissent preserved.** Per-model outputs are independent; aggregation (M_Aggregation) consumes these untouched. Positioning is ordinal; no per-model averaging.
- ✅ **Radical transparency.** Prompt file is SHA256-hashed per run (already wired). Every claim has `source_refs`. No hidden "system" instructions outside the file.

## Red-flag review

Re-read against the red-flag list in `.github/prompts/create-spike.prompt.md`:

- ❌ Publishing without reviewed `sources.md` — no, unchanged from M_DataPipeline's human-review gate.
- ❌ Cardinal averaging of positioning — no, ordinal-only is reinforced in spec Q3 + Q4.
- ❌ Hiding dissent — no, per-model outputs remain intact artifacts.
- ❌ Candidate-specific prompt branches — no, explicitly prohibited in prompt design §5.
- ❌ Reduced transparency — no, prompt hash + per-run metadata unchanged.
- ❌ Advocacy framing in output copy — no, prompt explicitly enforces measurement framing.

No red flags. Proceed to implementation tasks.

## Acceptance Criteria

- [ ] 6 backlog tasks created in `tasks/backlog/M_AnalysisPrompts/`
- [ ] Each task references one of the 5 specs + `editorial-principles.md`
- [ ] No circular dependencies in task graph
- [ ] ROADMAP.md updated with milestone status + Q1 scope change
- [ ] Spike moved to `tasks/archive/M_AnalysisPrompts/` on completion
- [ ] Editorial principles checked against each design decision (above)

## Notes

This spike is unusually light on new design work because the foundation phase seeded all five analysis specs with substantial content. Its real value is:

1. **Closing the open questions** so downstream tasks have no ambiguity.
2. **Promoting specs to Stable** so `scripts/lib/schema.ts` and `prompts/analyze-candidate.md` are implemented against a frozen target.
3. **Breaking implementation into independently reviewable tasks** — schema, prompt, tests — each small enough to land in one PR.

The spec set is the contract. The tasks land it.
