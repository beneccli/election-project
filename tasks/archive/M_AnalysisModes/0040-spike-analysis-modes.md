---
id: "0040"
title: "Spike: Analysis execution modes (API / web-chat / Copilot) + test-candidate scaffolding"
type: spike
status: active
priority: high
created: 2026-04-19
milestone: M_AnalysisModes
spec: docs/specs/data-pipeline/analysis-modes.md
context:
  - docs/specs/data-pipeline/overview.md
  - docs/specs/analysis/editorial-principles.md
  - docs/specs/analysis/analysis-prompt.md
  - docs/specs/analysis/aggregation.md
  - docs/specs/candidates/repository-structure.md
  - scripts/analyze.ts
  - scripts/aggregate.ts
  - scripts/scaffold-candidate.ts
  - scripts/lib/providers.ts
  - scripts/lib/schema.ts
  - prompts/analyze-candidate.md
  - prompts/aggregate-analyses.md
  - .github/prompts/ingest-sources.prompt.md
  - .github/prompts/update-candidate.prompt.md
depends_on: []
---

## Goal

Enable the pipeline to produce analyses and aggregations **without paid LLM
API calls**, by introducing two additional execution modes alongside the
existing API path:

1. **Manual web-chat mode** — the operator copy-pastes the canonical prompt
   + `sources.md` into a frontier chat UI they already subscribe to
   (ChatGPT, Claude.ai, Gemini), then drops the returned JSON back into the
   repo via a small ingest helper.
2. **Copilot-agent mode** — a `.github/prompts/*.prompt.md` file drives
   GitHub Copilot itself to run the analysis, using its selected model and
   direct repo access. Copilot writes the `raw-outputs/<model>.json` file
   directly.
3. **API mode** — the existing `scripts/analyze.ts` / `scripts/aggregate.ts`
   path, unchanged.

A secondary goal is to make **end-to-end testing cheap**: provide tooling to
scaffold a **fictional test candidate** and generate a plausible fake
`sources.md` via a web-chat prompt, so the whole pipeline can be exercised
before M_FirstCandidate.

This milestone explicitly unblocks M_FirstCandidate by removing the "must
spend money on APIs to test" constraint.

## Research Questions

### Q1. Does adding execution modes compromise editorial principles?

**Editorial concerns:**

- **Symmetric scrutiny** — every candidate analyzed with identical rigor on
  identical dimensions, using the **same prompt**. Any mode where the
  operator might *reword* the prompt is a principle violation.
- **Dissent preserved** — we still need ≥3 models producing independent
  outputs. Manual and Copilot modes must document which model produced each
  file and not collapse models.
- **Pinned model versions** — API mode records this from provider metadata.
  Manual mode requires the operator to **attest** the exact version string
  they used. Copilot mode requires Copilot itself to record the model it
  was configured with.
- **Prompt hashing** — every output's metadata must still record the
  SHA256 of `prompts/analyze-candidate.md` at the moment of the run. For
  manual/copilot modes, this is the hash of the file on disk at ingest
  time.
- **Radical transparency** — raw outputs remain public; a new
  `execution_mode` field makes the provenance visible rather than hidden.

**Decision:** All three modes send **the same canonical prompt file
verbatim**. The "manual" mode's bundle is generated from
`prompts/analyze-candidate.md`, never hand-edited. The Copilot prompt file
loads `prompts/analyze-candidate.md` verbatim as the instructions it hands
to the model. No mode allows prompt editing; editing the prompt is still
the `M_AnalysisPrompts` new-version workflow.

### Q2. What metadata do we need for mode provenance?

Every `ModelRunEntry` in `metadata.json.analysis.models` gains:

- `execution_mode`: `"api" | "manual-webchat" | "copilot-agent"`
- `attested_by`: string (operator handle / GitHub login), required for
  non-`api` modes, null for `api`.
- `attested_model_version`: string, required for non-`api` modes (e.g.
  `"gpt-5-thinking-2026-04-10 (web chat)"`, `"claude-opus-4.1 via
  copilot chat"`). For `api` mode this is the provider-returned version
  (existing `exact_version` field).
- `provider_metadata_available`: boolean. `true` for `api`; `false`
  otherwise. Signals that token counts and cost are absent for
  manual/copilot rows.

Aggregation metadata gets analogous `execution_mode`, `attested_by`,
`attested_model_version` fields on `aggregator_model`.

Token counts and cost fields become optional (they're already optional in
the current schema for duration, but we'll make cost / tokens explicitly
optional for non-api rows).

### Q3. How does manual ingest work without letting operators edit outputs?

**Flow:**

1. Operator runs `npm run prepare-manual-analysis -- --candidate X
   --version Y`. Script produces:
   - `candidates/X/versions/Y/_manual/prompt-bundle.txt` — a single file
     combining the verbatim prompt + the `sources.md` content + explicit
     "return JSON only" instructions + expected output filename.
   - `candidates/X/versions/Y/_manual/README.md` — step-by-step
     instructions for each supported chat UI (ChatGPT, Claude.ai,
     Gemini).
   - `candidates/X/versions/Y/_manual/` is `.gitignored`'d except the
     README (so operators can't accidentally commit chat transcripts).
2. Operator pastes into a chat UI, attaches `sources.md` as a file if
   supported, runs the prompt, copies the JSON result.
3. Operator runs `npm run ingest-raw-output -- --candidate X --version Y
   --model <model-id> --attested-version "<exact model string>" --mode
   manual-webchat --file <path-to-json>`. Script:
   - Validates JSON against `AnalysisOutputSchema`.
   - Writes to `raw-outputs/<model-id>.json`.
   - Appends a `ModelRunEntry` to `metadata.json`.
   - Computes and records current `prompt_sha256` of
     `prompts/analyze-candidate.md`.
   - Refuses to overwrite an existing entry unless `--force`.

**Guardrail:** the ingest script hard-fails if the JSON doesn't validate.
There is no manual edit path — broken JSON means re-run the chat. This
matches the existing "never hand-edit raw-outputs" rule.

### Q4. How does Copilot-agent mode work?

A new `.github/prompts/analyze-candidate-via-copilot.prompt.md` instructs
the coding agent to:

1. Read `prompts/analyze-candidate.md` verbatim (treat it as its
   operational instructions).
2. Read `candidates/<id>/versions/<date>/sources.md` as the source
   material.
3. Produce the JSON analysis, self-validate it against
   `scripts/lib/schema.ts` (via `npx vitest` against the schema or a
   dedicated `npm run validate-raw -- <file>` helper).
4. Call the existing `ingest-raw-output` script with
   `--mode copilot-agent` and the model identifier the user indicates
   (Copilot Chat displays the selected model; the operator passes it
   through).

The Copilot prompt itself must include an **editorial principles
reminder** and a **red-flag list** (identical to the ones in
`prompts/analyze-candidate.md`), so the agent's framing is not
degraded by the intermediate layer.

**Honesty clause:** the Copilot prompt explicitly tells the agent: "you
are the analyst model for this run. Do not delegate, do not re-summarize,
produce the structured JSON directly."

### Q5. How do we exercise the full pipeline without a real candidate?

Two supporting tools:

1. **Test-candidate scaffold prompt** (`.github/prompts/generate-test-candidate.prompt.md`)
   — wraps `scripts/scaffold-candidate.ts` and enforces:
   - ID prefix `test-` (e.g. `test-dupont`).
   - `is_fictional: true` in `candidates/<id>/metadata.json`.
   - A visible banner in `sources.md` header: `> ⚠️ FICTIONAL TEST
     CANDIDATE — not a real political program.`
2. **Fictional sources generator** (`prompts/fixtures/generate-test-sources.md`)
   — a copy-pasteable prompt the operator drops into Gemini/ChatGPT. It
   asks the chat model to produce a **self-consistent, plausibly
   coherent** fake French presidential program spanning all six
   dimension clusters (so every dimension has something to analyze).
   Output: a fully-formed `sources.md` following the consolidation
   template.

**Publish guard:** `scripts/publish.ts` refuses to update `current` or
commit when `candidates/<id>/metadata.json.is_fictional === true`, unless
`--allow-fictional` is explicitly passed. Fictional candidates can still
have `aggregated.json` — they just can't be published as real candidates
on the website. Website build (future M_WebsiteCore) will filter them
out by default.

### Q6. What's the scope boundary?

**In scope for M_AnalysisModes:**

- Metadata schema extensions for `execution_mode` + attestation fields.
- `prepare-manual-analysis.ts` and `prepare-manual-aggregation.ts` bundle
  generators.
- `ingest-raw-output.ts` and `ingest-aggregated.ts` drop-in helpers.
- `.github/prompts/analyze-candidate-via-copilot.prompt.md` and
  `.github/prompts/aggregate-analyses-via-copilot.prompt.md`.
- `.github/prompts/generate-test-candidate.prompt.md`.
- `prompts/fixtures/generate-test-sources.md` copy-pasteable
  program-generator prompt.
- `is_fictional` flag on candidate metadata and publish guard.
- Quick-start docs describing the three modes.

**Out of scope:**

- New analytical prompts — `prompts/analyze-candidate.md` and
  `prompts/aggregate-analyses.md` are reused verbatim.
- Website rendering differences per mode (→ M_WebsiteCore /
  M_Transparency will handle exposing `execution_mode` to readers).
- Automated detection of prompt-editing abuse — we trust the SHA256
  recorded at ingest time; if someone edited the prompt, the hash
  differs and that difference is visible in metadata.
- Running a real candidate end-to-end — that's M_FirstCandidate.

## Deliverables

1. **Spec document**: `docs/specs/data-pipeline/analysis-modes.md`
   - Three execution modes with sequence diagrams
   - Metadata schema extensions
   - Manual bundle format
   - Copilot agent prompt design
   - Test-candidate workflow
   - Publish guard behavior

2. **Backlog tasks**: `tasks/backlog/M_AnalysisModes/`
   - `0041` — Finalize analysis-modes spec (Draft → Stable)
   - `0042` — Extend metadata schema with execution_mode + attestation
   - `0043` — `prepare-manual-analysis` and `prepare-manual-aggregation`
     bundle scripts
   - `0044` — `ingest-raw-output` and `ingest-aggregated` drop-in scripts
   - `0045` — Copilot agent prompts for analyze + aggregate
   - `0046` — Test-candidate scaffold agent prompt + `is_fictional` flag
     + publish guard
   - `0047` — Web-chat fictional-sources generator prompt
   - `0048` — Quick-start docs + cross-links

3. **ROADMAP.md**: insert `M_AnalysisModes` in Phase 1, before
   `M_FirstCandidate`.

## Editorial principles check

- **Analysis, not advocacy** — mode changes do not touch the analytical
  prompt. ✅
- **Symmetric scrutiny** — all modes use the same prompt file verbatim;
  no per-candidate branching. ✅
- **Measurement over indictment** — unaffected (no analytical copy
  changes). ✅
- **Dissent preserved** — still requires N independent model runs;
  `execution_mode` is recorded per-run so readers can see if, say, 3 of
  4 were manual. ✅
- **Radical transparency** — `execution_mode`, `attested_by`, and
  `attested_model_version` are exposed in metadata and (eventually) in
  the website's transparency drawer. ✅

## Red flags surfaced (none blocking)

- **Lower verifiability of manual/copilot model attestation.** We cannot
  cryptographically prove which model produced a manually-pasted output.
  Mitigation: `execution_mode` makes this visible; the transparency
  drawer will label non-api outputs accordingly. Accept and document.
- **Fictional candidates leaking to production.** Mitigation: publish
  guard + `is_fictional` flag; later website filter. Accept and
  document.
- **Copilot agent could drift from verbatim prompt.** Mitigation: the
  Copilot prompt hashes `prompts/analyze-candidate.md` into the
  ingested metadata; if the agent silently edited the spirit of the
  prompt, the hash still matches, but the agent explicitly includes the
  prompt file path in its tool calls and is reminded to follow it
  verbatim. Residual risk documented in the spec.

## Acceptance Criteria

- [x] Spec `docs/specs/data-pipeline/analysis-modes.md` created with
      Draft status, linked from `docs/specs/README.md`
- [x] At least 8 tasks created in `tasks/backlog/M_AnalysisModes/`
- [x] Tasks have clear acceptance criteria and reference the spec
- [x] No circular dependencies
- [x] ROADMAP.md updated — `M_AnalysisModes` appears in Phase 1 before
      `M_FirstCandidate`, with dependencies stated
- [x] Editorial principles review performed and documented
- [x] Red flags listed with mitigations

## Notes

This milestone is the operator-ergonomics sibling of M_DataPipeline. It
does not change *what* the pipeline computes, only *how* an operator can
drive it. Preserving that separation is the single most important
invariant during implementation.
