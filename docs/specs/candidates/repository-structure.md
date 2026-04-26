# Candidate Repository Structure

> **Version:** 1.1
> **Status:** Stable — finalized by M_DataPipeline spike (2026-04-19)

---

## Overview

Every candidate's data lives under `candidates/<candidate-id>/`. All data is **versioned by date** — a program's analysis at a given point in time is a complete, immutable artifact. Subsequent analyses produce new dated versions; old versions are retained.

---

## Per-candidate layout

```
candidates/
└── <candidate-id>/
    ├── metadata.json           # identity: name, party, photo URL, dates
    ├── current -> versions/YYYY-MM-DD   # symlink to current published version
    └── versions/
        ├── YYYY-MM-DD/         # each dated folder is a complete analysis run
        │   ├── sources-raw/    # original primary sources (PDFs, transcripts)
        │   │   ├── manifesto.pdf
        │   │   ├── speech-2026-09-12.txt
        │   │   └── ...
        │   ├── sources.md      # consolidated, human-reviewed program summary
        │   ├── metadata.json   # run metadata: models used, prompt hashes
        │   ├── raw-outputs/    # per-model JSON outputs (never edited)
        │   │   ├── claude-opus-4-7.json
        │   │   ├── gpt-5-xxx.json
        │   │   ├── gemini-ultra-xxx.json
        │   │   ├── mistral-large-xxx.json
        │   │   └── grok-xxx.json
        │   ├── aggregated.json       # final synthesized analysis
        │   └── aggregation-notes.md  # notes on disagreements and review decisions
        └── YYYY-MM-DD/ ...
```

---

## Candidate IDs

Format: `<first-name>-<last-name>` in kebab-case, lowercased, ASCII-stripped.

Examples:
- `jane-dupont`
- `pierre-moreau`

IDs are permanent. If the candidate's name needs correction, the ID stays; display name in `metadata.json` changes.

When a candidate's identity is unknown (e.g., "likely Macron successor" in early planning), an interim ID like `macron-successor` may be used, but this **must be renamed** before any public publication.

---

## Top-level `metadata.json`

```json
{
  "id": "jane-dupont",
  "display_name": "Jane Dupont",
  "party": "Parti Exemple",
  "party_id": "PE",
  "photo_url": "https://example.com/photo.jpg",
  "photo_credit": "Source + license",
  "declared_candidate_date": "2026-02-15",
  "official_website": "https://example.com",
  "created": "2026-04-19",
  "updated": "2026-04-19",
  "is_fictional": false,
  "hidden": false
}
```

Optional fields:

- `is_fictional` (boolean, default `false`) — synthetic test candidate. Gates `publish.ts` (requires `--allow-fictional`). See [`../data-pipeline/analysis-modes.md`](../data-pipeline/analysis-modes.md).
- `hidden` (boolean, default `false`) — exclude from public site listings (landing grid, comparison picker, candidate index) without removing the data. Orthogonal to `is_fictional`. See [`visibility.md`](visibility.md).
- `family_override` (`"ecologie"`) — landing-page family bucket override. See [`../website/landing-page.md`](../website/landing-page.md) §4.3.

The photo URL is external. We do not store photos in the repo (to avoid image licensing issues in git). The site references them via URL at build time.

---

## Versioned folder: `versions/YYYY-MM-DD/`

One folder per analysis run. The date is the **version date** — meaningful as "program state as of this date, analyzed with tooling as of this date."

### `sources-raw/`

Original primary sources. Acceptable file types:
- `.pdf` — official manifestos, program documents
- `.txt` / `.md` — speech transcripts, article text
- `.html` — saved web pages
- `.json` — voting record exports
- `.url` files — links to live sources (with access date noted)

**Rule:** every file in `sources-raw/` has a clear primary-source origin. Aggregator articles and press commentary **do not** belong here.

### `sources.md`

The **human-reviewed, consolidated program summary**. This is the single ground-truth document used as input to every per-model analysis.

Structure (suggested — finalized in M_DataPipeline spike):

```markdown
# <Candidate Name> — Program (as of YYYY-MM-DD)

> Consolidated from: [list of sources-raw/ files]
> Review date: YYYY-MM-DD
> Reviewer: <human reviewer identifier>

## Economic & Fiscal

### Pensions

<candidate's stated position, with direct quotes where exact wording matters>
[Source: manifesto.pdf p.12]

### Taxation

...

## Social & Demographic

...
```

- Direct quotes used where candidate's exact wording carries weight.
- Every substantive claim cites the specific primary source it came from.
- Neutral tone. No interpretation added — interpretation is the LLMs' job on top of this.
- **Human review required** before any downstream analysis runs against this file.

### `metadata.json` (per-version)

```json
{
  "candidate_id": "jane-dupont",
  "version_date": "2026-04-19",
  "schema_version": "1.0",
  "sources": {
    "consolidation_method": "human_review_of_llm_draft",
    "consolidation_prompt_sha256": "...",
    "consolidation_prompt_version": "1.0",
    "sources_md_sha256": "...",
    "reviewed_by": "human reviewer identifier",
    "reviewed_at": "ISO-8601"
  },
  "analysis": {
    "prompt_file": "prompts/analyze-candidate.md",
    "prompt_sha256": "...",
    "prompt_version": "1.0",
    "models": {
      "claude-opus-4-7": {
        "provider": "anthropic",
        "exact_version": "claude-opus-4-7",
        "temperature": 0,
        "run_at": "ISO-8601",
        "tokens_in": 42000,
        "tokens_out": 8500,
        "cost_estimate_usd": 1.23,
        "status": "success | failed"
      },
      ...
    }
  },
  "aggregation": {
    "prompt_file": "prompts/aggregate-analyses.md",
    "prompt_sha256": "...",
    "prompt_version": "1.0",
    "aggregator_model": {
      "provider": "anthropic",
      "exact_version": "claude-opus-4-7",
      "run_at": "ISO-8601"
    },
    "human_review_completed": true,
    "reviewer": "human reviewer identifier",
    "reviewed_at": "ISO-8601"
  }
}
```

Everything about how this analysis was produced is captured here. A reader should be able to reconstruct exactly which model versions, which prompts, and which sources were used.

### `raw-outputs/`

One JSON file per model. Filename format: `<exact-model-version>.json`.

**Immutable.** These files are written by the pipeline once and never edited. They are the core transparency artifact — readers can download them, compare them, feed them to their own aggregator.

If a model fails, a `<model>.FAILED.json` file records the error details.

### `aggregated.json`

The final synthesized analysis powering the website. See [`../analysis/aggregation.md`](../analysis/aggregation.md) for schema.

**Not** auto-generated without human review — the human review gate on `flagged_for_review` items runs before this file is produced in its final form.

### `aggregation-notes.md`

Human-readable commentary on the aggregation run:
- Which models ran, which failed
- Notable disagreements
- Flagged items and how they were resolved
- Any overrides applied by the reviewer

---

## The `current` symlink

Each candidate has a `current` symlink pointing to the version folder that powers the website build.

```bash
candidates/jane-dupont/current -> versions/2026-04-19
```

Updating the current version:

```bash
cd candidates/jane-dupont
rm current
ln -s versions/2026-06-01 current
```

Or via `scripts/publish.ts`:

```bash
npm run publish -- --candidate jane-dupont --version 2026-06-01
```

Git tracks the symlink change. Rebuild + deploy is triggered by this commit.

**Alternative considered:** a `current.txt` file pointing to the version. Symlink preferred because filesystem tools (including `ls`, `cat`) resolve it naturally and the site build reads via path rather than parsing a manifest.

---

## Adding a new candidate

1. Create `candidates/<candidate-id>/metadata.json` (top-level)
2. Create `candidates/<candidate-id>/versions/YYYY-MM-DD/`
3. Populate `sources-raw/` with primary source files
4. Run `scripts/consolidate.ts` to draft `sources.md`
5. **Human reviews** `sources.md`, commits
6. Run `scripts/analyze.ts` (fans out to models in parallel)
7. Run `scripts/aggregate.ts`
8. **Human reviews** flagged items, finalizes `aggregated.json`
9. Create `current` symlink
10. Commit, push, deploy

See [`../data-pipeline/update-workflow.md`](../data-pipeline/update-workflow.md) for the full workflow.

---

## Updating a candidate's analysis

Create a new dated folder under `versions/`. Re-run the pipeline. Update the `current` symlink.

Old versions remain as historical artifacts. The website's candidate page can (optionally, in a future milestone) show a version history / diff between versions.

---

## Storage and git considerations

- `raw-outputs/` files are large JSON. They are still committed — this is a feature, not a bug, because they are the core transparency artifact.
- `sources-raw/` may contain large PDFs. Consider git-lfs if files get very large. For v1, plain git is acceptable.
- `.gitignore` excludes any local `.draft.json` files and pipeline logs.

---

## File naming rules

- Folders / files: kebab-case, lowercase
- Version folders: `YYYY-MM-DD`
- Model output files: use exact model version string (e.g. `claude-opus-4-7.json`)
- Dates in filenames: ISO format only

---

## Related Specs

- [`../analysis/output-schema.md`](../analysis/output-schema.md)
- [`../analysis/aggregation.md`](../analysis/aggregation.md)
- [`../data-pipeline/overview.md`](../data-pipeline/overview.md)
- [`../data-pipeline/source-gathering.md`](../data-pipeline/source-gathering.md)
- [`../data-pipeline/update-workflow.md`](../data-pipeline/update-workflow.md)
