# Candidates — Data Directory

This directory contains all candidate data. Each candidate has a dedicated folder; each folder contains versioned analysis runs.

**This is the core data of the project.** Every artifact here is referenced by the website at build time and exposed publicly via the transparency drawer.

For the canonical layout spec, see [`../docs/specs/candidates/repository-structure.md`](../docs/specs/candidates/repository-structure.md).

---

## Folder structure

```
candidates/
├── README.md                    # This file
├── <candidate-id>/
│   ├── metadata.json            # candidate identity
│   ├── current -> versions/<date>   # symlink to currently-published version
│   └── versions/
│       ├── YYYY-MM-DD/          # one folder per analysis run
│       └── YYYY-MM-DD/
└── <another-candidate>/
    └── ...
```

---

## Candidate ID conventions

- kebab-case, lowercase, ASCII-only
- Format: `<first-name>-<last-name>`
- Permanent — if the candidate's display name changes, the ID stays

Examples:
- `jane-dupont`
- `pierre-moreau`
- `marie-claire-lefebvre`

Interim IDs during planning (e.g., `macron-successor` before a successor declares) **must be renamed** before public publication.

---

## Top-level `metadata.json`

Example:

```json
{
  "id": "jane-dupont",
  "display_name": "Jane Dupont",
  "party": "Parti Exemple",
  "party_id": "PE",
  "photo_url": "https://example.com/photo.jpg",
  "photo_credit": "Photo credit string with license",
  "declared_candidate_date": "2026-02-15",
  "official_website": "https://jane-dupont.fr",
  "created": "2026-02-20",
  "updated": "2026-04-19"
}
```

---

## Per-version folder

Every dated version folder is a **complete, self-contained analysis run**:

```
versions/2026-04-19/
├── sources-raw/              # primary source files + INGEST_NOTES.md
│   ├── manifesto.pdf
│   ├── manifesto.meta.json
│   ├── speech-2026-09-12.txt
│   ├── speech-2026-09-12.meta.json
│   ├── voting-record.json
│   ├── voting-record.meta.json
│   └── INGEST_NOTES.md
├── sources.md                # human-reviewed consolidated program
├── metadata.json             # run metadata (models, prompt hashes, timestamps)
├── raw-outputs/              # one JSON per model (immutable)
│   ├── claude-opus-4-7.json
│   ├── gpt-5-xxx.json
│   ├── gemini-ultra-xxx.json
│   ├── mistral-large-xxx.json
│   └── grok-xxx.json
├── aggregated.json           # final synthesized analysis
└── aggregation-notes.md      # human-readable aggregation commentary
```

Files in `raw-outputs/` are **immutable** once written. They are the transparency artifact. If a model's output was broken, add `<model>.FAILED.json` alongside; do not hand-edit the successful outputs.

---

## The `current` symlink

Each candidate has a `current` symlink to the version that powers the website:

```bash
candidates/jane-dupont/current -> versions/2026-04-19
```

The website reads `candidates/<id>/current/aggregated.json` at build time. Updating the current version is an atomic symlink swap.

Updating:

```bash
npm run publish -- --candidate jane-dupont --version 2026-06-01
```

---

## Example: creating a new candidate end-to-end

```bash
# 1. Create identity
mkdir -p candidates/jane-dupont/versions/2026-04-19/sources-raw
cat > candidates/jane-dupont/metadata.json <<EOF
{
  "id": "jane-dupont",
  "display_name": "Jane Dupont",
  "party": "Parti Exemple",
  ...
}
EOF

# 2. Ingest sources (see .github/prompts/ingest-sources.prompt.md)
npm run ingest -- --candidate jane-dupont --version 2026-04-19

# 3. Consolidate
npm run consolidate -- --candidate jane-dupont --version 2026-04-19
# ... human reviews sources.md.draft → renames to sources.md → commits ...

# 4. Analyze (parallel across models)
npm run analyze -- --candidate jane-dupont --version 2026-04-19

# 5. Aggregate
npm run aggregate -- --candidate jane-dupont --version 2026-04-19

# 6. Review flagged items
npm run review -- --candidate jane-dupont --version 2026-04-19
# ... human reviews flagged_for_review → finalizes aggregated.json ...

# 7. Publish
npm run publish -- --candidate jane-dupont --version 2026-04-19
```

---

## Example: updating a candidate

See [`.github/prompts/update-candidate.prompt.md`](../.github/prompts/update-candidate.prompt.md) for the full workflow.

```bash
NEW_DATE=2026-06-01
mkdir -p candidates/jane-dupont/versions/$NEW_DATE/sources-raw

# Case A: sources unchanged, just re-run analysis
cp -r candidates/jane-dupont/versions/2026-04-19/sources-raw/* \
      candidates/jane-dupont/versions/$NEW_DATE/sources-raw/
cp candidates/jane-dupont/versions/2026-04-19/sources.md \
   candidates/jane-dupont/versions/$NEW_DATE/sources.md

npm run analyze -- --candidate jane-dupont --version $NEW_DATE
npm run aggregate -- --candidate jane-dupont --version $NEW_DATE
npm run review -- --candidate jane-dupont --version $NEW_DATE
npm run publish -- --candidate jane-dupont --version $NEW_DATE
```

---

## Historical versions

Old version folders are **never deleted**. They are historical artifacts proving what analysis was public at a given time.

If the previous analysis contained an error, the correct procedure is:

1. Create a new version with the correction
2. Publish the new version
3. Note the correction in the new version's `aggregation-notes.md`
4. Update the changelog page

Do not retroactively edit past versions.

---

## Git handling

- `sources-raw/` is committed. PDFs are binary but small enough that plain git works for v1. Migrate to git-lfs if files get large.
- `raw-outputs/` is committed. JSON is large but compressible; essential for transparency.
- `.gitignore` excludes `.draft.json` files and pipeline logs.
- Never commit `node_modules/` or build outputs.

---

## Related Docs

- [`../docs/specs/candidates/repository-structure.md`](../docs/specs/candidates/repository-structure.md) — canonical layout spec
- [`../docs/specs/data-pipeline/overview.md`](../docs/specs/data-pipeline/overview.md) — pipeline stages
- [`../docs/specs/data-pipeline/source-gathering.md`](../docs/specs/data-pipeline/source-gathering.md) — what counts as a primary source
- [`../docs/specs/data-pipeline/update-workflow.md`](../docs/specs/data-pipeline/update-workflow.md) — updating a candidate
- [`../.github/prompts/ingest-sources.prompt.md`](../.github/prompts/ingest-sources.prompt.md)
- [`../.github/prompts/update-candidate.prompt.md`](../.github/prompts/update-candidate.prompt.md)
