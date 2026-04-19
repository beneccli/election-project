# Quick-Start: Zero-API End-to-End Run

> **Audience:** Contributors who want to exercise the full pipeline
> without paying for any LLM API calls.
> **Status:** Testing / low-cost operation — **not** the recommended
> production path. Production runs use the `api` mode with pinned
> paid providers (see [`specs/data-pipeline/overview.md`](specs/data-pipeline/overview.md)).
> **Spec:** [`specs/data-pipeline/analysis-modes.md`](specs/data-pipeline/analysis-modes.md)

This walkthrough builds a **fictional candidate** end-to-end using:

- `manual-webchat` for 2 of 3 analyses (operator pastes the prompt into
  any web chat UI and pastes the reply back)
- `copilot-agent` for the 3rd analysis and the aggregation (the Copilot
  agent plays the role of a model)

At the end you will have a published (local) `candidates/<id>/current`
symlink pointing at an aggregated, human-reviewed analysis of a
made-up program — with zero API dollars spent.

> ⚠️ **Fictional candidates are sandbox-only.** The scaffolder and the
> `publish` command both enforce a symmetric guard: a candidate whose
> `id` starts with `test-` **must** carry `is_fictional: true` in its
> metadata, and such a candidate can only be published with
> `--allow-fictional`. This is intentional — it prevents a fictional
> program from ever being pushed to production.

---

## 0. Prerequisites

```bash
npm install
```

No API keys required for this flow.

---

## 1. Scaffold a fictional candidate

Pick a throwaway ID prefixed with `test-`:

```bash
npm run scaffold-candidate -- \
  --id test-omega \
  --name "Omega Synthétique" \
  --party "Parti Placeholder-Ω" \
  --party-id test-omega \
  --date 2027-11-01 \
  --is-fictional
```

This creates `candidates/test-omega/` with `is_fictional: true` in
`metadata.json` and seeds `versions/2027-11-01/sources.md.draft` with
the mandatory `⚠️ PROGRAMME FICTIF` banner.

---

## 2. Generate fake sources via a web chat

Open [`prompts/fixtures/generate-test-sources.md`](../prompts/fixtures/generate-test-sources.md)
and paste its content into any chat UI (ChatGPT, Claude.ai, Gemini,
Mistral Le Chat, …). The template asks the model for a fictional but
internally coherent program covering all six dimension clusters.

Save the reply as:

```
candidates/test-omega/versions/2027-11-01/sources.md.draft
```

Keep the `⚠️ PROGRAMME FICTIF` banner at the top.

**Human review gate**: skim the draft, fix anything that looks
incoherent, then rename:

```bash
mv candidates/test-omega/versions/2027-11-01/sources.md.draft \
   candidates/test-omega/versions/2027-11-01/sources.md
```

---

## 3. Analyze — two models via manual webchat

Generate the copy-pasteable bundle once — it is model-agnostic and
reusable across every chat UI you drive:

```bash
npm run prepare-manual-analysis -- \
  --candidate test-omega \
  --version 2027-11-01
```

This writes `candidates/test-omega/versions/2027-11-01/_manual/`
containing:

- `prompt-bundle.txt` — the full prompt + `sources.md` + a valid
  reference example showing the exact schema shape.
- `sources.md` — a copy, in case your UI prefers file attachments.
- `README.md` — per-UI paste instructions (ChatGPT, Claude.ai, Gemini).
- `expected-filenames.txt` — suggested raw-output slugs.

For each of your two web-chat models: paste `prompt-bundle.txt` into
the chat UI, ask for the reply as a single JSON object, save the reply
to e.g. `_manual/claude-omega.json` (the ingest script strips a single
layer of ` ```json ` fences automatically).

Ingest it:

```bash
npm run ingest-raw-output -- \
  --candidate test-omega \
  --version 2027-11-01 \
  --model claude-manual \
  --mode manual-webchat \
  --attested-version claude-opus-4-1-20250514 \
  --attested-by "$(whoami)" \
  --file candidates/test-omega/versions/2027-11-01/_manual/claude-omega.json
```

Repeat for your second web-chat model (e.g. `gpt-manual`).

> **If ingest fails with schema validation errors**, the chat model did
> not match the reference example structure. Re-run the prompt in the
> chat, point the model at the `REFERENCE EXAMPLE` section of the bundle,
> and ask for strict JSON matching its keys exactly. Do **not** hand-edit
> the output file.

`_manual/` is gitignored — nothing leaks.

---

## 4. Analyze — third model via the Copilot agent

Open `.github/prompts/analyze-candidate-via-copilot.prompt.md` as a
Copilot prompt file and run it with the candidate + version pinned.
The agent will write directly to
`candidates/test-omega/versions/2027-11-01/raw-outputs/<model>.json`.
After it finishes, stamp the metadata:

```bash
npm run ingest-raw-output -- \
  --candidate test-omega \
  --version 2027-11-01 \
  --model gemini-copilot \
  --mode copilot-agent \
  --attested-version gemini-2.5-pro \
  --attested-by copilot-session \
  --already-written \
  --file candidates/test-omega/versions/2027-11-01/raw-outputs/gemini-copilot.json
```

You should now have **≥3 raw outputs** and a `metadata.json` whose
`analysis.models` map records a distinct `execution_mode` per model.

---

## 5. Aggregate — via the Copilot agent

Bundle the aggregation prompt + the three raw outputs:

```bash
npm run prepare-manual-aggregation -- \
  --candidate test-omega \
  --version 2027-11-01
```

This writes
`candidates/test-omega/versions/2027-11-01/_manual-aggregation/bundle.txt`.

Run the prompt file `.github/prompts/aggregate-analyses-via-copilot.prompt.md`
in Copilot. It will produce `aggregated.draft.json`. Then ingest:

```bash
npm run ingest-aggregated -- \
  --candidate test-omega \
  --version 2027-11-01 \
  --mode copilot-agent \
  --attested-version claude-opus-4-1 \
  --attested-by copilot-aggregator \
  --already-written \
  --file candidates/test-omega/versions/2027-11-01/aggregated.draft.json
```

---

## 6. Human review

```bash
npm run review -- \
  --candidate test-omega \
  --version 2027-11-01 \
  --reviewer "$(whoami)"
```

Walk through flagged items. When done, the CLI renames
`aggregated.draft.json` → `aggregated.json` and stamps
`human_review_completed: true`.

---

## 7. Publish — guard in action

First attempt **without** the override:

```bash
npm run publish -- --candidate test-omega --version 2027-11-01
```

Expected: the publish command refuses because
`is_fictional: true`. This is the guard working as specified.

Now with the override:

```bash
npm run publish -- \
  --candidate test-omega \
  --version 2027-11-01 \
  --allow-fictional
```

The `current` symlink is created. A warning is logged loudly. **Do
not** commit the resulting symlink to a production branch.

---

## 8. Clean up

Delete the fictional candidate folder when you are done:

```bash
rm -rf candidates/test-omega
```

---

## Recap

You just ran a full multi-model analysis end-to-end without paying
for a single API call. The integration test
`scripts/pipeline.integration.test.ts` exercises the same mixed-mode
flow programmatically as a regression guard
(`mixed_mode_fictional_candidate_flows_through_publish_guard`).
