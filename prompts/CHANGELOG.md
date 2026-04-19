# Prompts Changelog

All changes to files in `prompts/` are recorded here. See
[`prompts/README.md`](README.md) for the versioning rules.

## 2026-04-19 — analyze-candidate.md 1.0

**Change:** Initial production version of the per-candidate analysis
prompt. Replaces the placeholder shipped with M_DataPipeline.

**Why:** M_AnalysisPrompts milestone (spike `0020`) finalized the 9-section
prompt design, the Zod output schema, the 5-axis positioning methodology
with fixed anchor sets, the 6 dimension clusters, and the
intergenerational audit measurement framework. Task 0023 implements the
prompt matching those specs.

**Impact:** First real analysis prompt — no prior production version to
compare with. All future runs use this prompt; the SHA256 is recorded per
run in `versions/<date>/metadata.json`.

**Backward compat:** Not applicable (no prior stable version).

**Related specs:**
- `docs/specs/analysis/analysis-prompt.md` (Stable)
- `docs/specs/analysis/output-schema.md` (Stable)
- `docs/specs/analysis/dimensions.md` (Stable)
- `docs/specs/analysis/political-positioning.md` (Stable)
- `docs/specs/analysis/intergenerational-audit.md` (Stable)
- `docs/specs/analysis/editorial-principles.md` (Stable)
