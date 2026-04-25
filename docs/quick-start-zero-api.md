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
  --id bruno-retailleau \
  --name "Bruno Retailleau" \
  --party "Les Républicains" \
  --party-id les-republicains \
  --date 2026-04-24 \
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
  --candidate bruno-retailleau \
  --version 2026-04-25
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
  --candidate jeanluc-melanchon \
  --version 2026-04-24
```

This writes
`candidates/test-omega/versions/2027-11-01/_manual-aggregation/bundle.txt`.

Run the prompt file `.github/prompts/aggregate-analyses-via-copilot.prompt.md`
in Copilot. It will produce `aggregated.draft.json`. Then ingest:

```bash
npm run ingest-aggregated -- \
  --candidate bruno-retailleau \
  --version 2026-04-25 \
  --mode copilot-agent \
  --attested-version claude-opus-4-7 \
  --attested-by copilot-aggregator \
  --already-written \
  --file candidates/bruno-retailleau/versions/2026-04-25/aggregated.draft.json
```

---

## 6. Human review

```bash
npm run review -- \
  --candidate bruno-retailleau \
  --version 2026-04-25 \
  --reviewer "$(whoami)"
```

Walk through flagged items. When done, the CLI renames
`aggregated.draft.json` → `aggregated.json` and stamps
`human_review_completed: true`.

---

## 7. Publish — guard in action

First attempt **without** the override:

```bash
npm run publish -- --candidate bruno-retailleau --version 2026-04-25
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

## 9. (Optional) Translate the aggregated analysis to English

> **Spec:** [`specs/website/i18n.md`](specs/website/i18n.md)
> **Prompt:** [`prompts/translate-aggregated.md`](../prompts/translate-aggregated.md)

The site is locale-aware: when a candidate has a published
`aggregated.<lang>.json`, the locale toggle surfaces the translated
prose; otherwise the page falls back to the FR canonical artifact
with a "Translation pending" banner. Translations are produced
manually (no API mode in v1) and gated by human review, exactly
like consolidation and aggregation.

### 9.1 Prepare a copy-pasteable bundle

```bash
npm run prepare-manual-translation -- \
  --candidate test-omega \
  --version 2027-11-01 \
  --lang en
```

This writes `candidates/test-omega/versions/2027-11-01/_translation/en/`
containing:

- `prompt-bundle.txt` — the verbatim translate-aggregated prompt with
  the FR `aggregated.json` payload pre-pasted and the target language
  substituted in.
- `README.md` — exact next-step commands (re-displayed below for
  convenience).

### 9.2 Paste into a chat UI, save the reply

Open any chat UI (Claude.ai, ChatGPT, Le Chat, …) and paste the
contents of `prompt-bundle.txt`. The model returns a single JSON
object: same schema as the FR aggregated, but with translatable prose
fields rewritten in English. Save the reply as e.g.
`~/Downloads/aggregated.en.json`.

> ⚠️ The translator must keep all numeric values, IDs, and array
> lengths byte-for-byte identical to the FR canonical file. The
> ingest step below validates this with the same parity checker that
> guards the published artifacts.

### 9.3 Ingest the translation

```bash
npm run ingest-translation -- \
  --candidate test-omega \
  --version 2027-11-01 \
  --lang en \
  --attested-version "<exact model string from the chat UI>" \
  --input ~/Downloads/aggregated.en.json
```

This writes `aggregated.en.draft.json` next to the FR canonical file
and stamps a `translations.en` provenance block in
`metadata.json` (prompt SHA256, prompt version, attested model,
ingest timestamp, `human_review_completed: false`).

### 9.4 Human review gate

Open the draft, skim the prose, and check that:

- No advocacy verbs (`sacrifice`, `betray`, `steal`, `crush`,
  `rescue`) leaked in — translations report tradeoffs, never moral
  verdicts.
- French proper nouns (party names, institutions) are kept
  untranslated where appropriate (e.g. *Assemblée nationale*).
- The schema parses (`schema_version` and structure are unchanged).

When satisfied, promote the draft and flip the review flag:

```bash
mv candidates/test-omega/versions/2027-11-01/aggregated.en.draft.json \
   candidates/test-omega/versions/2027-11-01/aggregated.en.json
```

Then edit `metadata.json` to set
`translations.en.human_review_completed: true` and add `reviewer`
+ `reviewed_at` (ISO 8601).

### 9.5 Verify in the site build

```bash
npm run validate-translation -- --candidate test-omega --version 2027-11-01 --lang en
npm run site:build
```

The `/en/candidat/test-omega` page now serves the EN prose, and the
Transparency drawer's "Translation" subsection surfaces the prompt
SHA256, attested model, ingest timestamp, and the human-review
flag — exactly the same provenance shape as the analysis and
aggregation blocks.

---

## Recap

You just ran a full multi-model analysis end-to-end without paying
for a single API call. The integration test
`scripts/pipeline.integration.test.ts` exercises the same mixed-mode
flow programmatically as a regression guard
(`mixed_mode_fictional_candidate_flows_through_publish_guard`).
