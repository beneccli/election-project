# Data Pipeline Overview

> **Version:** 1.1
> **Status:** Stable — finalized by M_DataPipeline spike (2026-04-19)

---

## Overview

The data pipeline is the loop that takes primary source material about a candidate's program and produces the JSON that powers the website.

Five stages, each with a dedicated script in `scripts/`:

```
 1. INGEST      2. CONSOLIDATE     3. ANALYZE         4. AGGREGATE       5. PUBLISH
 ─────────      ──────────────     ───────────        ─────────────      ──────────
 sources-raw/ → sources.md.draft → raw-outputs/*.json → aggregated.json → current symlink
                     ↓                                       ↓                ↓
              [human review]                          [human review]     git commit
                     ↓                                       ↓                ↓
                sources.md                         aggregated.json       deploy
```

---

## Stage 1: Ingest

**Script:** `scripts/ingest.ts`
**Input:** candidate identity + source URLs / files
**Output:** `candidates/<id>/versions/<date>/sources-raw/`
**Spec:** [`source-gathering.md`](source-gathering.md)

Responsibilities:
- Download / capture primary source files (PDFs, speech transcripts, voting records)
- Record access date + origin URL for each
- Organize into `sources-raw/` subfolder
- Compute SHA256 for each file
- **No LLM calls at this stage.** This is mechanical collection.

This stage often involves human judgment on what sources to include. An AI agent can assist but should not unilaterally decide what counts as a primary source — the agent prompt [`ingest-sources.prompt.md`](../../../.github/prompts/ingest-sources.prompt.md) defines the collaboration pattern.

---

## Stage 2: Consolidate

**Script:** `scripts/consolidate.ts`
**Input:** `sources-raw/` folder
**Output:** `sources.md.draft` → (after human review) → `sources.md`

Responsibilities:
- Run an LLM pass to produce a neutral, structured summary of the candidate's program drawn from `sources-raw/`
- Preserve direct quotes where exact wording matters
- Cite source file for every claim
- Organize by policy area (same taxonomy as [`../analysis/dimensions.md`](../analysis/dimensions.md))
- **Do not interpret** — summarize

The consolidation prompt is [`prompts/consolidate-sources.md`](../../../prompts/consolidate-sources.md).

### Human review gate

The LLM produces `sources.md.draft`. A human reviews and either:
- Renames to `sources.md` (approved)
- Edits and renames (approved with edits)
- Rejects and re-runs consolidation with notes

The pipeline **does not proceed** to analysis until `sources.md` exists and has been committed to git by a human.

### Why human review here specifically

- Hallucination risk is highest when summarizing (a fabricated claim here propagates through every downstream stage).
- Catches misattributions early.
- Anchors the entire analysis in human-reviewed ground truth.
- Cheap — 20 minutes of review prevents hours of downstream debugging.

---

## Execution modes

Stages 3 (Analyze) and 4 (Aggregate) can be driven in any of three
**execution modes**, depending on what accounts and budget an
operator has available:

| Mode | Driver | When to use |
|---|---|---|
| `api` | `scripts/analyze.ts` / `aggregate.ts` calling provider SDKs | Production. Default. Requires paid API keys. |
| `manual-webchat` | `prepare-manual-analysis.ts` bundles the prompt; operator pastes into a web chat and ingests the reply via `ingest-raw-output.ts` | Zero-API testing, or when a model is only available via a subscription chat interface. |
| `copilot-agent` | The Copilot agent itself fills the role of a model, using `.github/prompts/analyze-candidate-via-copilot.prompt.md` | Agent self-runs, dogfooding the pipeline on a fictional candidate. |

Every raw output records its `execution_mode`, attested model
version, and attester ID in `metadata.json`. Mixing modes across
models within a single version is supported and common in tests.

Full specification: [`analysis-modes.md`](analysis-modes.md).
Operator walkthrough: [`../../quick-start-zero-api.md`](../../quick-start-zero-api.md).

---

## Stage 3: Analyze

**Script:** `scripts/analyze.ts <candidate-id> <version-date>`
**Input:** `sources.md` + analysis prompt
**Output:** `raw-outputs/<model>.json` (one per model, parallel)
**Spec:** [`../analysis/analysis-prompt.md`](../analysis/analysis-prompt.md)

Responsibilities:
- For each configured model:
  - Call model with prompt + sources.md
  - Parse and validate JSON output against Zod schema
  - Retry up to 2 times on invalid output
  - Write to `raw-outputs/<exact-model-version>.json`
  - Or write `<model>.FAILED.json` on persistent failure
- Record run metadata (exact version, tokens, cost) in version `metadata.json`
- Record prompt SHA256 in version `metadata.json`
- Run all models **in parallel** (they are independent)

Model set is configurable (`scripts/config/models.ts`), but the default is 4–5 frontier models across ≥3 providers.

### No human gate here

Raw outputs are not human-reviewed. They are raw data. The aggregation stage and its human gate handle quality control.

---

## Stage 4: Aggregate

**Script:** `scripts/aggregate.ts <candidate-id> <version-date>`
**Input:** all `raw-outputs/*.json` for the version + `sources.md`
**Output:** `aggregated.draft.json` → (after human review) → `aggregated.json` + `aggregation-notes.md`
**Spec:** [`../analysis/aggregation.md`](../analysis/aggregation.md)

Responsibilities:
- Run aggregator LLM with all raw outputs + sources.md + aggregator prompt
- Validate aggregated output against Zod schema (extended schema with agreement_map)
- Separate claims into:
  - Consensus claims (to be published)
  - Contested claims (published with dissent shown)
  - Flagged claims (require human review before publication)
- Write `aggregated.draft.json` and `aggregation-notes.md`

### Human review gate (second one)

`scripts/review.ts` surfaces `flagged_for_review` items in a CLI. The reviewer:
- Approves claims that check out against sources.md
- Rejects claims that don't
- Edits claims that need rewording

Result: `aggregated.json` (final) + updated `aggregation-notes.md` documenting decisions.

---

## Stage 5: Publish

**Script:** `scripts/publish.ts --candidate <id> --version <date>`
**Input:** finalized `aggregated.json`
**Output:** updated `current` symlink, commit, push, deploy

Responsibilities:
- Verify `aggregated.json` exists and is valid
- Verify human review was completed (flag in metadata.json)
- Update `candidates/<id>/current` symlink to point at the new version
- Commit all changes (new version folder + symlink update)
- Trigger deployment (push to main — CI auto-deploys)

---

## Error handling and idempotency

- All scripts are **idempotent** where possible. Re-running ingest on an existing version folder is safe.
- Re-running analyze on a model that already succeeded is a no-op unless `--force` is passed.
- Scripts log to `scripts/logs/<timestamp>-<action>.log` for debugging.
- Cost tracking: every LLM call logs estimated cost; run totals appear in `metadata.json` and `aggregation-notes.md`.

---

## Running the full pipeline

For a new candidate (first analysis):

```bash
npm run ingest -- --candidate jane-dupont --version 2026-04-19
# ... populate sources-raw/ manually or with agent help ...
npm run consolidate -- --candidate jane-dupont --version 2026-04-19
# [human reviews sources.md.draft → commits as sources.md]
npm run analyze -- --candidate jane-dupont --version 2026-04-19
npm run aggregate -- --candidate jane-dupont --version 2026-04-19
npm run review -- --candidate jane-dupont --version 2026-04-19
# [human reviews flagged items → finalizes aggregated.json]
npm run publish -- --candidate jane-dupont --version 2026-04-19
```

For updating a candidate, see [`update-workflow.md`](update-workflow.md).

---

## Parallelism and cost

- Stage 3 (analyze) runs all models concurrently. Wall-clock time ≈ slowest model.
- A full pipeline run for one candidate takes roughly:
  - Ingest: 15–60 minutes (human time to gather sources)
  - Consolidate: 5 minutes LLM + 20 minutes human review
  - Analyze: 5–10 minutes parallel LLM
  - Aggregate: 3–5 minutes LLM + 20–40 minutes human review
  - Publish: 2 minutes
- Total: ~60–90 minutes of wall-clock for a new candidate after sources are gathered.
- Cost per candidate per analysis run: ~$5–$20 in LLM costs (rough estimate; depends on model choice).

---

## Where LLMs are called vs. not

| Stage | LLM call? | Why |
|-------|-----------|-----|
| Ingest | No | Mechanical collection. LLM hallucination risk too high for source discovery. |
| Consolidate | Yes (1 call) | Summarization of collected sources into a structured document. Human review gate after. |
| Analyze | Yes (N calls, parallel) | The core analytical work. |
| Aggregate | Yes (1 call, plus optional adversarial pass) | Synthesis across per-model outputs. |
| Publish | No | Mechanical: update symlink, commit, push. |

Total LLM calls for a full pipeline run: ~6–8 (1 consolidate + 4-5 analyze + 1-2 aggregate).

---

## Schema validation

Every script that produces JSON validates its output against a Zod schema in `scripts/lib/schema.ts`:

- `sources.md` → free-form markdown (no schema, but structural linter checks for required sections)
- `raw-outputs/<model>.json` → `AnalysisOutputSchema`
- `aggregated.json` → `AggregatedOutputSchema`
- `metadata.json` (per-version) → `VersionMetadataSchema`

Schema violations halt the pipeline. No silent acceptance of malformed data.

---

## Implementation Notes (added by M_DataPipeline spike)

### Project bootstrap

The pipeline is a TypeScript project:
- Node 20+ LTS, ES modules (`"type": "module"`)
- TypeScript strict mode, compiled via `tsx` for scripts
- Zod for runtime schema validation
- Commander.js (or similar) for CLI argument parsing
- pino for structured logging
- Vitest for testing

### CLI convention

All pipeline scripts accept `--candidate <id>` and `--version <YYYY-MM-DD>` as required arguments. Optional flags:
- `--force` — re-run even if output already exists
- `--dry-run` — validate inputs without executing
- `--verbose` — debug-level logging

### Prompt hashing

SHA256 of the prompt file's raw content (UTF-8 bytes), computed at call time using Node.js `crypto.createHash('sha256')`. The hash is recorded in `metadata.json` for the version.

### Cost tracking

Every LLM call logs:
- `tokens_in`, `tokens_out` (from provider response)
- `cost_estimate_usd` (computed from per-model pricing config)
- `duration_ms`

Per-run totals are written to `metadata.json`.

### Idempotency rules

| Script | Re-run behavior |
|--------|----------------|
| ingest | Safe — skips existing files unless `--force` |
| consolidate | Safe — produces `.draft`, does not overwrite `sources.md` |
| analyze | Skips models with existing output unless `--force` |
| aggregate | Overwrites `.draft.json` (safe, pre-review) |
| publish | Updates symlink (idempotent) |

### Error handling

- Schema validation failures halt the script with a non-zero exit code and a structured error log.
- LLM call failures trigger up to 2 retries with exponential backoff.
- After max retries, the model is marked as `failed` in metadata and a `<model>.FAILED.json` is written.
- The pipeline continues with remaining models (analyze stage) or fails (consolidate/aggregate stages).

---

## Related Specs

- [`source-gathering.md`](source-gathering.md)
- [`update-workflow.md`](update-workflow.md)
- [`../candidates/repository-structure.md`](../candidates/repository-structure.md)
- [`../analysis/analysis-prompt.md`](../analysis/analysis-prompt.md)
- [`../analysis/aggregation.md`](../analysis/aggregation.md)
- [`../analysis/output-schema.md`](../analysis/output-schema.md)
