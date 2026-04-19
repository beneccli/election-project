You are an AI coding agent working on the **Élection 2027** project. Your job is to execute the candidate update workflow — re-running the analysis pipeline for a candidate whose program has evolved or needs a scheduled refresh.

## Before anything else: read these

1. [`docs/specs/data-pipeline/update-workflow.md`](../../docs/specs/data-pipeline/update-workflow.md) — the full workflow
2. [`docs/specs/data-pipeline/overview.md`](../../docs/specs/data-pipeline/overview.md) — pipeline stages
3. [`docs/specs/analysis/editorial-principles.md`](../../docs/specs/analysis/editorial-principles.md) — guardrails

## When to use this prompt

Use this prompt when a candidate's analysis needs to be refreshed. Triggers:
- Program revision (updated manifesto or platform)
- Major speech adding new positions not in prior sources
- Scheduled refresh (every N weeks)
- Correction of an error discovered in prior analysis

**Do NOT use this prompt if:**
- Methodology (prompts or schema) changed — that's a different workflow, requires re-running ALL candidates
- This is a brand-new candidate never analyzed before — use ingest + analyze flow from scratch

## Workflow

### Step 1: Clarify scope

Ask the human:
- Which candidate (ID)?
- What triggered this update? (new program / new speech / correction / scheduled)
- What version date should the new version use? (default: today)
- Are there specific new sources to ingest, or is this a re-run with unchanged sources?

### Step 2: Create new version folder

```bash
CANDIDATE=<id>
NEW_DATE=<YYYY-MM-DD>
PREV_DATE=$(readlink candidates/$CANDIDATE/current | sed 's|versions/||')
mkdir -p candidates/$CANDIDATE/versions/$NEW_DATE/sources-raw
```

### Step 3: Source handling

**Case A — sources unchanged** (just re-running with same inputs):

Copy sources-raw forward:
```bash
cp -r candidates/$CANDIDATE/versions/$PREV_DATE/sources-raw/* \
      candidates/$CANDIDATE/versions/$NEW_DATE/sources-raw/
```

Verify SHA256 hashes match.

Skip consolidation — copy `sources.md` forward too:
```bash
cp candidates/$CANDIDATE/versions/$PREV_DATE/sources.md \
   candidates/$CANDIDATE/versions/$NEW_DATE/sources.md
```

Document in INGEST_NOTES.md: "Sources unchanged from $PREV_DATE. This re-run is for <reason>."

**Case B — new sources to add** (delta):

Use [`ingest-sources.prompt.md`](ingest-sources.prompt.md) for the new sources. Then either:
- Edit the previous `sources.md` to integrate the new sources (human-driven), or
- Re-run consolidation fresh if the delta is large enough.

The human decides which approach. Document the choice in `INGEST_NOTES.md`.

**Case C — complete source refresh** (new manifesto supersedes old):

Full ingest from scratch. Use [`ingest-sources.prompt.md`](ingest-sources.prompt.md).

### Step 4: Human review of sources.md

**Gate: do not proceed** until a human has reviewed and committed `sources.md`.

If the update is Case A and `sources.md` was copied forward unchanged, a light confirmation is enough. If the update is Case B or C, full review is required.

### Step 5: Analyze

```bash
npm run analyze -- --candidate $CANDIDATE --version $NEW_DATE
```

Runs all configured models in parallel.

Monitor for:
- Model failures (check `raw-outputs/*.FAILED.json`)
- Schema validation failures
- Unusually long run times (possible quality issue)

If a model failed persistently, note in logs. The aggregator handles missing models gracefully; a single-model analysis can still be published with reduced coverage.

### Step 6: Aggregate

```bash
npm run aggregate -- --candidate $CANDIDATE --version $NEW_DATE
```

Produces `aggregated.draft.json` and `aggregation-notes.md`.

### Step 7: Human review of flagged items

```bash
npm run review -- --candidate $CANDIDATE --version $NEW_DATE
```

**Gate: do not proceed** until a human has resolved all flagged items.

Flagged items come in categories:
- **Source contradiction** — a claim made by a model but not supported by `sources.md`. Human decides: reject claim, or find evidence that legitimizes it.
- **Significant dissent** — models disagree sharply. Human decides: preserve both views, or investigate which has stronger evidence.
- **Novel claim across all models** — potentially correlated hallucination. Human verifies against sources.

### Step 8: Diff audit

```bash
npm run diff -- --candidate $CANDIDATE --from $PREV_DATE --to $NEW_DATE
```

Examine:
- Do the differences reflect the actual program changes?
- Or has methodology drift leaked in? (Should be impossible if prompts unchanged, but verify.)
- Are positioning shifts justified by evidence in new sources?

Document findings in `aggregation-notes.md`.

### Step 9: Publish

```bash
npm run publish -- --candidate $CANDIDATE --version $NEW_DATE
```

Updates `current` symlink, commits, pushes. CI auto-deploys.

### Step 10: Verify deployment

- Check that the candidate page renders correctly
- Check the transparency drawer shows new artifacts
- Check the changelog entry is correct

### Step 11: Update changelog

Ensure the changelog page (`/changelog`) reflects this update. Content is derived from git history + per-version metadata, so this should be automatic, but verify.

## Editorial checks specific to updates

Before publishing, verify:

- [ ] Same analysis prompt as the previous version (SHA256 match)
- [ ] Same schema version
- [ ] Same set of models (if one was dropped or added, this is a methodology change — escalate)
- [ ] Same aggregator model
- [ ] Positioning shifts are evidence-supported, not artifacts of model drift
- [ ] Dissent is preserved (not averaged to look like consensus)

## Red Flags — Stop and Ask

Stop and escalate before publishing if:

- Flagged items reveal systemic issues (many source-contradictions suggest the source material is unreliable)
- All models suddenly agree on a novel claim not in prior versions' sources — possible correlated hallucination
- Diff shows unexplained shifts not corresponding to source changes
- Cost or token usage is 3x the previous run — something is off
- A model's output quality is noticeably degraded (possible provider change)

## What you must NEVER do

- ❌ Edit files in a previous version's folder — old versions are immutable
- ❌ Delete the `current` symlink without replacing it atomically
- ❌ Publish without the human review gates (sources.md and flagged items)
- ❌ Silently change prompt or model versions mid-run
- ❌ Merge raw-outputs from different runs — each version is a complete, coherent set

## Quick Reference

```bash
# Which version is currently published?
readlink candidates/<id>/current

# Diff two versions
npm run diff -- --candidate <id> --from 2026-04-19 --to 2026-06-01

# Re-run just one model
npm run analyze -- --candidate <id> --version <date> --model claude-opus-4-7 --force

# Check metadata of current run
cat candidates/<id>/current/metadata.json | jq .
```

## Related Docs

- [`docs/specs/data-pipeline/update-workflow.md`](../../docs/specs/data-pipeline/update-workflow.md)
- [`docs/specs/data-pipeline/overview.md`](../../docs/specs/data-pipeline/overview.md)
- [`docs/specs/candidates/repository-structure.md`](../../docs/specs/candidates/repository-structure.md)
- [`docs/specs/analysis/aggregation.md`](../../docs/specs/analysis/aggregation.md)
