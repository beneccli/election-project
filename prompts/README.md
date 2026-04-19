# Prompts — Versioned LLM Prompt Artifacts

This directory contains the **actual LLM prompts** used by the pipeline. They are first-class versioned artifacts.

**Not** to be confused with `.github/prompts/` — that folder contains prompts for AI coding agents working on this repository. This folder (`prompts/`) contains prompts sent to LLMs during the pipeline's analysis runs.

---

## Why prompts are artifacts

The prompts in this directory are the operational definition of the project's analytical method. Changing a prompt's wording changes every output it produces. Therefore:

- **Every prompt file has a version** recorded in its header.
- **Every run records the SHA256** of the prompt file used.
- **Edits are changelog events**, not silent refactors.
- **A prompt change is a new analysis version**, not an update to an existing one.

---

## Files (when created)

| File | Used by | Purpose |
|------|---------|---------|
| `consolidate-sources.md` | `scripts/consolidate.ts` | Produces `sources.md.draft` from `sources-raw/` |
| `analyze-candidate.md` | `scripts/analyze.ts` | Produces per-model analysis JSON |
| `aggregate-analyses.md` | `scripts/aggregate.ts` | Produces `aggregated.draft.json` from per-model outputs |
| `adversarial-pass.md` | `scripts/analyze.ts` (optional second call) | Self-critique of a completed analysis |
| `CHANGELOG.md` | Humans | Records what changed in each prompt version |

These files do not exist yet — they are produced by the `M_AnalysisPrompts` and `M_Aggregation` spikes. This README is the scaffolding so the location is clearly defined.

---

## Prompt file format

Each prompt file has a YAML frontmatter header:

```markdown
---
name: analyze-candidate
version: 1.0
created: 2026-04-19
updated: 2026-04-19
used_by: scripts/analyze.ts
related_specs:
  - docs/specs/analysis/analysis-prompt.md
  - docs/specs/analysis/output-schema.md
  - docs/specs/analysis/editorial-principles.md
---

# [Prompt title]

[Full prompt text follows, in markdown. This is what actually gets sent to the LLM.]
```

The frontmatter is stripped before sending to the LLM (the pipeline handles this).

---

## CHANGELOG.md

Example entry:

```markdown
## 2026-05-12 — analyze-candidate.md 1.1

**Change:** Clarified the instruction on `intergenerational.magnitude_estimate.units` to require explicit units.

**Why:** Some models were producing values without units, making cross-model aggregation ambiguous.

**Impact:** All candidates on v1.0 of this prompt need re-running to maintain comparability.

**Backward compat:** Outputs from v1.0 remain valid (units field is optional in schema v1.0 — v1.1 prompt produces outputs that still validate against schema v1.0).
```

---

## Prompt versioning rules

- **Patch** (1.0 → 1.0.1): clarifications, typo fixes, no semantic change. Outputs should be identical or near-identical.
- **Minor** (1.0 → 1.1): new instructions that shape output; existing candidates should be re-run for comparability.
- **Major** (1.0 → 2.0): breaking change to output structure or analytical approach; schema bump likely; all candidates re-run.

---

## Pinning in runs

When the pipeline runs a prompt, the per-version `metadata.json` records:

```json
{
  "analysis": {
    "prompt_file": "prompts/analyze-candidate.md",
    "prompt_version": "1.0",
    "prompt_sha256": "3fa1b2c3..."
  }
}
```

This allows any reader to verify, long after the fact, which exact prompt text produced a given analysis. Combined with git history, the prompt used is always recoverable.

---

## Never do this

- ❌ Silently edit a prompt — always bump the version and update CHANGELOG.md
- ❌ Commit a new prompt version without updating the related spec in `docs/specs/analysis/`
- ❌ Run the pipeline on production data with an unreleased draft prompt
- ❌ Delete old prompt versions — keep them in git history for auditability

---

## Related Docs

- [`../docs/specs/analysis/analysis-prompt.md`](../docs/specs/analysis/analysis-prompt.md)
- [`../docs/specs/analysis/aggregation.md`](../docs/specs/analysis/aggregation.md)
- [`../docs/specs/data-pipeline/overview.md`](../docs/specs/data-pipeline/overview.md)
- [`../AGENTS.md`](../AGENTS.md) — editorial principles constraining what prompts can say
