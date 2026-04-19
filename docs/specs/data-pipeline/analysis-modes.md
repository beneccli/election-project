# Analysis Execution Modes

> **Version:** 1.0 (Draft — to be promoted to Stable by task `0041`)
> **Status:** Draft
> **Produced by:** spike `0040-spike-analysis-modes`

---

## Overview

The analysis and aggregation stages of the pipeline (stages 3 and 4 in
[`overview.md`](overview.md)) can be executed in three modes. All three
produce **the same artifacts** (`raw-outputs/<model>.json`,
`aggregated.json`) validated against the same Zod schemas and driven by
the **same prompt files** (`prompts/analyze-candidate.md`,
`prompts/aggregate-analyses.md`).

The only thing that varies is **how the LLM is called**:

| Mode | How the LLM is reached | Who attests the output |
|------|-----------------------|------------------------|
| `api` | Direct provider SDK call from `scripts/analyze.ts` / `scripts/aggregate.ts` | Provider metadata |
| `manual-webchat` | Operator copy-pastes prompt + sources into ChatGPT / Claude.ai / Gemini chat UI, pastes JSON back | Operator attestation |
| `copilot-agent` | GitHub Copilot itself is instructed to act as the analyst model, producing the JSON file via its tools | Copilot session + operator attestation |

All three modes record an `execution_mode` field per run, making the
provenance visible in `metadata.json` and (eventually) in the
transparency drawer on the website.

> **Non-negotiable invariant:** the analytical prompt is never edited
> per mode. All three modes send the bytes of
> `prompts/analyze-candidate.md` verbatim. Editing the prompt remains the
> M_AnalysisPrompts new-version workflow.

---

## Why three modes

**Cost.** Running five frontier models through paid APIs for every
candidate adds up. Operators who already pay for ChatGPT Plus, Claude
Pro, and Gemini Advanced can run the pipeline on their existing
subscriptions.

**Developer access.** GitHub Copilot exposes several frontier models with
deep thinking modes and full repo access. Driving Copilot as the analyst
keeps the operator in one tool and writes files directly.

**Testing.** Before M_FirstCandidate, operators need a zero-cost way to
exercise the whole pipeline. Manual and Copilot modes make this
feasible.

**Credibility.** API mode stays the default for any public run, because
provider metadata gives the strongest pinned-version signal. Manual and
Copilot modes carry attestation flags so readers can distinguish.

---

## Mode 1 — `api` (existing, unchanged)

Already implemented in M_DataPipeline and M_Aggregation. No changes in
this milestone beyond a schema extension that adds an
`execution_mode: "api"` field to run entries.

---

## Mode 2 — `manual-webchat`

### Operator experience

```
npm run prepare-manual-analysis -- --candidate <id> --version <date>
```

Produces, under `candidates/<id>/versions/<date>/_manual/`:

```
_manual/
├── README.md               # per-UI step-by-step (ChatGPT, Claude, Gemini)
├── prompt-bundle.txt       # verbatim prompt + sources.md + return-JSON instructions
├── sources.md              # copy of sources.md for attachment upload
└── expected-filename.txt   # e.g. "claude-opus-4-1.json"
```

The `_manual/` folder is `.gitignore`'d (except the `README.md`) so that
chat transcripts, scratch files, and pasted responses are never
committed.

The operator:

1. Opens their chat UI.
2. Attaches `sources.md` if the UI supports file uploads.
3. Pastes the contents of `prompt-bundle.txt`.
4. Copies the JSON response to a file.
5. Runs:

```
npm run ingest-raw-output -- \
  --candidate <id> \
  --version <date> \
  --model <model-slug> \
  --attested-version "<exact model string the UI reports>" \
  --attested-by "<operator handle>" \
  --mode manual-webchat \
  --file <path-to-json>
```

### `prompt-bundle.txt` format

```
============================================================
ÉLECTION 2027 — ANALYSIS PROMPT BUNDLE
Generated: <ISO timestamp>
Candidate: <id>
Version: <date>
Prompt file: prompts/analyze-candidate.md
Prompt SHA256: <hash>
Mode: manual-webchat
============================================================

INSTRUCTIONS FOR THE CHAT MODEL
-------------------------------
You are being used as an analyst model for a transparency-oriented
public website. Follow the prompt below VERBATIM. Return ONLY the
JSON structure described — no commentary, no markdown fences, no
prefatory text.

============================================================
PROMPT (verbatim from prompts/analyze-candidate.md)
============================================================

<entire body of prompts/analyze-candidate.md, frontmatter stripped>

============================================================
SOURCES.md
============================================================

<entire body of candidates/<id>/versions/<date>/sources.md>

============================================================
END OF BUNDLE — return JSON only
============================================================
```

### Ingest behavior

`scripts/ingest-raw-output.ts`:

1. Reads the JSON file provided.
2. Attempts `JSON.parse`; if the operator pasted a markdown-fenced
   response, strip one layer of fences automatically as a convenience.
3. Validates against `AnalysisOutputSchema`. On failure: dump the Zod
   issues, refuse to write anything. No fallback, no partial accept.
4. Computes SHA256 of the current `prompts/analyze-candidate.md` file.
5. Writes the JSON verbatim to `raw-outputs/<model-slug>.json`.
6. Appends a `ModelRunEntry` to `metadata.json.analysis.models` with:
   - `execution_mode: "manual-webchat"`
   - `attested_by: "<operator>"`
   - `attested_model_version: "<exact model string>"`
   - `provider_metadata_available: false`
   - `exact_version: <attested_model_version>` (best available)
   - `provider: "manual"` (sentinel value; the actual provider is
     captured in `attested_model_version`)
   - `run_at: <now>`
   - `tokens_in`, `tokens_out`, `cost_estimate_usd`, `duration_ms`
     omitted (the schema makes these optional for non-api rows).
7. Refuses to overwrite an existing entry unless `--force`.

### `prepare-manual-aggregation` and `ingest-aggregated`

Mirror scripts for stage 4. The bundle includes all `raw-outputs/*.json`
(pretty-printed) plus the `prompts/aggregate-analyses.md` prompt. The
ingest script writes `aggregated.draft.json` (not `aggregated.json` —
the human-review gate from M_Aggregation is still required) and updates
`metadata.json.aggregation`.

---

## Mode 3 — `copilot-agent`

### Operator experience

Two new agent prompts in `.github/prompts/`:

- `analyze-candidate-via-copilot.prompt.md`
- `aggregate-analyses-via-copilot.prompt.md`

Invocation: the operator opens Copilot Chat, selects their desired model
(Claude Opus, GPT-5 thinking, Gemini 2.5 Pro, etc.), and runs the
prompt with arguments `<candidate-id> <version-date>`.

### Copilot agent prompt structure

Each agent prompt:

1. **Preface** — a short section that tells Copilot: "you are acting as
   the analyst model for this run. You are not coordinating other
   tools; you are doing the analytical work yourself."
2. **Editorial principles reminder** — a compact restatement of the
   five principles, identical in wording to the ones in the analytical
   prompt.
3. **Instruction** — "Read the file `prompts/analyze-candidate.md` in
   its entirety and treat it as your complete operational instructions.
   Read `candidates/<id>/versions/<date>/sources.md` as the source
   material. Produce the JSON output the prompt describes."
4. **Validation requirement** — "Before writing the output file, run
   `npm run validate-raw -- <tentative-file>` and iterate until it
   passes."
5. **Output writing** — "Write the validated JSON to
   `candidates/<id>/versions/<date>/raw-outputs/<model-slug>.json` and
   then run `npm run ingest-raw-output -- --mode copilot-agent ...` to
   record the `ModelRunEntry`." (The ingest step, even when Copilot
   already placed the file, is how we capture the
   `execution_mode` + `attested_by` + `attested_model_version` fields
   in metadata. The ingest script accepts an "already in place" flag:
   `--already-written`.)
6. **Red flags** — "If you cannot determine the model you are
   currently running as, stop and ask. Do not guess."

### Why the agent prompt instructs Copilot to read the analytical prompt rather than embedding it

Keeping `prompts/analyze-candidate.md` as the single source of truth
preserves the "one canonical prompt" invariant. If we duplicated the
instructions inside the Copilot prompt, divergence would be a
principle-level bug the moment the analytical prompt is revised.

### Attested model version for Copilot

Copilot exposes the selected model name in-session but not always
programmatically. Operator passes it on the CLI (`--attested-version
"claude-opus-4-1 via copilot chat"`) when calling ingest. The prompt
tells Copilot to halt if the model name is ambiguous.

---

## Metadata schema extensions

`ModelRunEntry` gains:

```ts
execution_mode: z.enum(["api", "manual-webchat", "copilot-agent"]),
attested_by: z.string().min(1).optional(),          // required when mode != "api"
attested_model_version: z.string().min(1).optional(), // required when mode != "api"
provider_metadata_available: z.boolean(),
```

Refinement: `execution_mode === "api"` iff `provider_metadata_available
=== true`. Token counts and cost are only required when
`provider_metadata_available === true`.

`aggregation.aggregator_model` gains the same four fields.

`CandidateMetadataSchema` gains:

```ts
is_fictional: z.boolean().optional(),  // true for test candidates
```

Default (absent) treated as `false`. Publish refuses fictional candidates
unless `--allow-fictional` is passed.

---

## Test-candidate scaffolding

### `.github/prompts/generate-test-candidate.prompt.md`

Drives Copilot to:

1. Ask the operator for a fictional candidate name + party.
2. Generate an ID of the form `test-<kebab-name>` (enforced by a
   validation check).
3. Run `scripts/scaffold-candidate.ts` with `--is-fictional` (new flag
   added in task `0046`).
4. Create a visible banner at the top of the (empty) `sources.md.draft`
   placeholder:

   ```
   > ⚠️ FICTIONAL TEST CANDIDATE — this program is synthetic, generated
   > for pipeline testing purposes. Do not treat as reflecting a real
   > person's political views.
   ```

5. Print a pointer to `prompts/fixtures/generate-test-sources.md` so the
   operator can generate the fictional program content.

### `prompts/fixtures/generate-test-sources.md`

A copy-pasteable prompt the operator drops into a web-chat LLM. Produces
a plausible, self-consistent, fictional French presidential program
(not a real person's views, labelled fictional throughout) covering all
six dimension clusters so every analytical dimension has material to
work with.

The generated text uses the **same section headings** as the
consolidation output, so the result can be pasted directly as
`sources.md`.

The prompt explicitly instructs the chat model to:

- Invent a coherent political positioning (e.g. "centre-droit
  souverainiste" or "socialiste écologiste" — one consistent profile).
- Cover each of the six dimension clusters with at least three concrete
  measures.
- Include at least one quantified claim per section (for the
  `intergenerational` and `measurement` facets to exercise).
- Label every section header "(fictif)" so the fictional nature is
  preserved visually.
- Be clearly distinguishable from any real candidate — no real party
  names, no real person names beyond public-figure anchors used for
  positioning.

---

## Publish guard

`scripts/publish.ts` gains a pre-flight check:

```ts
if (candidateMetadata.is_fictional === true && !opts.allowFictional) {
  throw new Error(
    `Refusing to publish fictional test candidate "${id}". ` +
    `Re-run with --allow-fictional if this is intentional (e.g. for ` +
    `a CI smoke test).`
  );
}
```

The check runs **before** any symlink update or git commit. A fictional
candidate can still reach `aggregated.json` — it just cannot become
`current`.

---

## Integration with existing specs

- [`overview.md`](overview.md) — section "Where LLMs are called vs.
  not" gains a per-mode breakdown.
- [`update-workflow.md`](update-workflow.md) — references the new
  ingest helpers as optional paths inside steps 5 and 6.
- [`../candidates/repository-structure.md`](../candidates/repository-structure.md)
  — note `_manual/` as a .gitignored working folder and
  `is_fictional` on candidate metadata.
- [`../analysis/aggregation.md`](../analysis/aggregation.md) — the
  human-review gate still fires regardless of mode.

---

## Test strategy

- **Unit tests** on the schema extension (metadata validates with each
  of the three `execution_mode` values; mandatory fields enforced).
- **Unit tests** on `prepare-manual-analysis`: bundle contains the
  current prompt hash, sources verbatim, expected filename.
- **Unit tests** on `ingest-raw-output`: rejects invalid JSON, rejects
  non-validating JSON, refuses overwrite without `--force`, writes
  correct `ModelRunEntry` shape.
- **Unit tests** on the fictional flag + publish guard.
- **Integration test** (extends `pipeline.integration.test.ts`): a
  scenario where one raw output arrives via `manual-webchat` ingest and
  one via a simulated `copilot-agent` ingest, then aggregation runs
  (mock provider) and publish is blocked because of fictional flag but
  succeeds with `--allow-fictional`.

---

## Success metrics

- Operator can run a full pipeline end-to-end on a fictional candidate
  using only free web-chat subscriptions + Copilot, producing a valid
  `aggregated.draft.json`, **in under 2 hours of wall-clock time** with
  no API costs.
- `metadata.json` for such a run distinguishes, per-model,
  `execution_mode`, who attested, and what version string they claimed.
- Running the same operation via API mode continues to work with no
  regressions (existing `pipeline.integration.test.ts` stays green).

---

## Open questions

1. **Should `provider: "manual"` be a fully separate enum value, or
   should we preserve the original provider name (`anthropic`,
   `openai`, …) with `execution_mode` carrying the mode signal?**
   Current proposal: preserve the original provider name where
   unambiguous (e.g. `provider: "anthropic"` when the operator uses
   Claude.ai). Only when the operator refuses to disclose the provider
   (uncommon) do we fall back to `provider: "manual"`. Decision to be
   finalized by task `0042`.
2. **Copilot model identification ambiguity** — if Copilot silently
   switches models mid-session, our attestation is wrong. Mitigation:
   prompt tells Copilot to halt if uncertain. Longer-term: rely on
   Copilot's session metadata when available. Accept residual risk.
3. **Fictional candidates in the website build** — M_WebsiteCore will
   need a filter. Flagged as a dependency note there.

---

## Related Specs

- [`overview.md`](overview.md) — pipeline stages
- [`source-gathering.md`](source-gathering.md) — stage 1 (unchanged)
- [`update-workflow.md`](update-workflow.md) — references new helpers
- [`../analysis/editorial-principles.md`](../analysis/editorial-principles.md)
  — the invariants this spec respects
- [`../analysis/analysis-prompt.md`](../analysis/analysis-prompt.md) —
  the canonical prompt all modes share
- [`../analysis/aggregation.md`](../analysis/aggregation.md) — the
  review gate all modes share
- [`../candidates/repository-structure.md`](../candidates/repository-structure.md)
  — `is_fictional` flag lives here
