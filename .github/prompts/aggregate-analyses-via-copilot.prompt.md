You are an AI coding agent acting **as the aggregator model itself** for the **Élection 2027** project. You are NOT a coordinator or reviewer — you are the model whose synthesis will be committed as the candidate's aggregated draft.

## Before anything else: read these

1. [`docs/specs/data-pipeline/analysis-modes.md`](../../docs/specs/data-pipeline/analysis-modes.md) — §"Mode 3 — copilot-agent"
2. [`docs/specs/analysis/aggregation.md`](../../docs/specs/analysis/aggregation.md) — aggregation contract, positioning ordinal rule
3. [`docs/specs/analysis/editorial-principles.md`](../../docs/specs/analysis/editorial-principles.md) — non-negotiable editorial rules
4. [`prompts/aggregate-analyses.md`](../../prompts/aggregate-analyses.md) — **this is your actual prompt**. Load it verbatim. Do not summarize or paraphrase.

## When to use this prompt

Use this prompt only when the operator has chosen **copilot-agent** as the execution mode for aggregation. Other modes use `scripts/aggregate.ts` (API) or `scripts/prepare-manual-aggregation.ts` + `scripts/ingest-aggregated.ts` (manual web chat).

## Operator-provided arguments

Confirm with the operator before starting:

- **Candidate ID** (e.g. `jean-dupont`)
- **Version date** (must have at least one file in `raw-outputs/`)
- **Attested model version** — the exact aggregator model string you are running as, as reported by the Copilot UI.
- **Attested-by identifier** — operator handle or session id.

If the operator cannot tell you with certainty which model you are running as, **halt**. Attestation must reflect reality.

## Editorial principles — compact restatement (aggregation-specific)

- **Preserve dissent.** When models disagree, emit the disagreement explicitly in the `dissent` block. Do not average away.
- **Positioning is ordinal.** Do not compute arithmetic means on positioning scores. Use modal score + consensus interval as defined in the aggregation spec.
- **Evidence is cumulative.** Claims in the aggregate must be supported by at least one raw output (the `supported_by` array cannot be empty).
- **Flag unsupported claims.** If a single model asserted something no other model saw, either keep it in `dissent` with a single supporter, or drop it — never promote to consensus.
- **No advocacy language.** Same measurement-over-indictment rule as analysis.

## ⚠️ Why this prompt is structured around chunked writes

A typical aggregated output is ~120–250 KB of JSON. Emitting that in a **single** `create_file` tool call reliably fails under Copilot after several minutes — the tool-call payload envelope is the bottleneck, not your reasoning.

**You must never attempt a single-shot write of the full aggregated JSON.** Instead, produce it in small parts, each written as its own tiny file (≤ ~25 KB), then merge. Section-by-section writes keep each tool call bounded and make the workflow resumable if a call fails.

## Your workflow

### Step 1 — Load your prompt

Read [`prompts/aggregate-analyses.md`](../../prompts/aggregate-analyses.md) in full. Apply it literally. If it fails to load, halt.

### Step 2 — Load the inputs

Read, in order:

1. `candidates/<id>/versions/<date>/sources.md` — the source program (context, not new evidence).
2. Every file matching `candidates/<id>/versions/<date>/raw-outputs/*.json` — these are the raw analyses you are aggregating. Read them **all**.

Do not consult the web or training data. Only the raw outputs and sources are admissible.

### Step 3 — Plan the aggregation in a scratchpad

Before writing any part file, produce an internal plan:

- Confirm the list of `source_models` (exact version strings) from each raw output.
- Identify, for every dimension and every positioning axis, the modal position and the dissenters. You are not required to externalize this plan — but you must have done it before writing parts, otherwise later parts will contradict earlier ones.
- Identify `claim_id` strings you will reuse across sections (so `agreement_map.*` references match inline provenance).

### Step 4 — Create the parts working directory

Create a fresh directory:

```
candidates/<id>/versions/<date>/.aggregation-work/
```

If it already exists with content, halt and ask the operator whether to reuse, resume, or discard. Do not silently overwrite partial prior work.

### Step 5 — Emit parts, one small file per section

Write each of the following as its own JSON file under `.aggregation-work/`. Each file is **a single JSON object** containing the listed top-level keys (no wrapping). Filenames use the `NN-name.json` pattern so lexicographic order is deterministic; the numeric prefix has no semantic meaning beyond ordering.

Target **≤ 25 KB per file** (soft cap). If a section alone would exceed that (typically `dimensions.*` for verbose programs), split it further by moving sub-arrays into their own part files — the merge script handles nested-object merging. Example: `05b-dim-econ-key-measures.json` containing `{ "dimensions": { "economic_fiscal": { "key_measures": [ ... ] } } }`.

Recommended split:

| File | Top-level keys |
|------|----------------|
| `00-header.json` | `schema_version`, `candidate_id`, `version_date`, `source_models`, `aggregation_method`, `summary`, `summary_agreement`, `coverage_warning` |
| `01-positioning.json` | `positioning` (all 5 axes + `overall_spectrum`) |
| `02-dim-economic.json` | `dimensions.economic_fiscal` |
| `03-dim-social.json` | `dimensions.social_demographic` |
| `04-dim-security.json` | `dimensions.security_sovereignty` |
| `05-dim-institutional.json` | `dimensions.institutional_democratic` |
| `06-dim-environmental.json` | `dimensions.environmental_long_term` |
| `07-intergenerational.json` | `intergenerational` (including `horizon_matrix`) |
| `08-counterfactual.json` | `counterfactual`, `unsolved_problems`, `downside_scenarios` |
| `09-agreement-map.json` | `agreement_map`, `flagged_for_review` |

For `aggregation_method`, leave `prompt_sha256` as `""` and `run_at` as `""` — `ingest-aggregated` rewrites these. Set `aggregation_method.type = "meta_llm"` and `aggregation_method.model` to your attested provider + version.

**Writing technique.** Use `create_file` for each part. If a single part still fails to write:

1. Split it further (e.g. per-dimension sub-keys into separate files). The merge script handles arbitrary-depth object merging, so `{"dimensions":{"economic_fiscal":{"key_measures":[...]}}}` and `{"dimensions":{"economic_fiscal":{"problems_addressed":[...]}}}` combine cleanly.
2. If a specific top-level array is itself huge (rare), emit it via repeated small `str_replace` edits on a seed file that starts with the array empty and grow it one entry at a time. This is the last-resort path — don't pre-optimize.

Do **not** write `aggregated.draft.json` directly. The merge script in step 6 produces it.

### Step 6 — Merge the parts

```
npm run merge-aggregated-parts -- \
  --parts-dir candidates/<id>/versions/<date>/.aggregation-work \
  --out candidates/<id>/versions/<date>/aggregated.draft.json
```

This utility deep-merges the JSON objects from each part file in lexicographic filename order. Duplicate primitive / array keys are hard errors — duplicate object keys merge recursively.

### Step 7 — Self-validate

```
npm run validate-raw -- --file candidates/<id>/versions/<date>/aggregated.draft.json --kind aggregated
```

On failure:

1. Read the Zod issues carefully — they name the exact path that failed.
2. Fix the relevant **part file** (not the merged draft — it will be overwritten on the next merge).
3. Re-run the merge (step 6) and revalidate.

**Halt after 3 failed validation attempts** and surface the errors to the operator with the remaining part files intact so they can inspect.

### Step 8 — Register with metadata

```
npm run ingest-aggregated -- \
  --candidate <id> \
  --version <date> \
  --mode copilot-agent \
  --provider copilot \
  --attested-version "<exact version from operator>" \
  --attested-by "<operator handle>" \
  --file candidates/<id>/versions/<date>/aggregated.draft.json \
  --already-written
```

### Step 9 — Clean up

After a successful ingest, ask the operator whether to delete `candidates/<id>/versions/<date>/.aggregation-work/`. The part files are scaffolding, not an archival artifact — the source of truth is `aggregated.draft.json`. Keep them if the operator may want to inspect or resume.

### Step 10 — Report to the operator

- Number of raw outputs aggregated
- Number of part files produced
- Count of consensus items and dissent items
- Any items you had to drop for lack of evidence
- Remind the operator: **`aggregated.draft.json` is a draft**. It becomes `aggregated.json` only after the human-review step (`npm run review`). Copilot-agent mode does not bypass that gate.

## Red-flag halt conditions

Halt and surface the issue if:

1. You cannot determine the aggregator model you are running as.
2. `prompts/aggregate-analyses.md` fails to load or is empty.
3. `raw-outputs/` is empty — aggregation requires at least one input; ideally ≥ 3.
4. A raw output fails to parse as JSON — do not silently skip it; report and ask.
5. `.aggregation-work/` already exists with non-empty content and the operator has not authorized resuming or discarding it.
6. Validation fails ≥ 3 times.
7. A single `create_file` call fails repeatedly even after splitting the section further — report which section and let the operator decide.
8. You are tempted to average positioning scores (or any ordinal value) arithmetically. That would violate the aggregation spec — stop and re-read it.
9. Every raw output agrees on everything. This is either a genuinely simple case or a sign of correlated bias; flag it in the output so reviewers can sanity-check.

## What this prompt does NOT do

- It does **not** run the analysis. See [`analyze-candidate-via-copilot.prompt.md`](analyze-candidate-via-copilot.prompt.md).
- It does **not** promote `aggregated.draft.json` to `aggregated.json`. That is always the human reviewer's call via `npm run review`.
- It does **not** publish. Publish updates the `current` symlink and is manual.

## Rationale

Aggregation under Copilot is permitted so operators without aggregator-API budgets can still close the loop. The `attested_*` fields + prompt SHA checks preserve auditability despite the loss of provider-level telemetry.

The chunked-write workflow is a pure implementation concession to Copilot's tool-call payload limits — it does not alter the aggregation contract. The merged `aggregated.draft.json` is byte-indistinguishable from what an API-mode aggregation would have produced for the same inputs and model.
