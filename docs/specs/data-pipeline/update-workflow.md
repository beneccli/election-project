# Update Workflow

> **Version:** 1.0
> **Status:** Draft — to be finalized by M_UpdateWorkflow milestone

---

## Overview

This spec defines the **"one week later" workflow** — updating an existing candidate's analysis when their program evolves, a major speech changes their positioning, or a scheduled re-analysis is due.

The goal is that this process is **routine, repeatable, and takes ~60–90 minutes** of wall-clock time for a candidate whose analysis is already established.

---

## When to update

Common triggers:

1. **Program revision** — candidate publishes updated manifesto or platform.
2. **Major speech** — significant policy announcement not in prior sources.
3. **Scheduled refresh** — every N weeks leading up to election.
4. **Correction** — error discovered in prior analysis; re-run with fixed inputs.
5. **Methodology improvement** — prompt or schema updated; re-run all candidates to maintain comparability.

---

## Workflow

### 1. Determine change type

Three categories:

**A. Source change only** (new/updated sources, same methodology)
- Prompt files unchanged
- Schema unchanged
- Just new dated version with updated `sources-raw/`

**B. Methodology change** (prompts or schema updated)
- Touches every candidate
- Requires re-running all candidates for comparability
- Use `M_Methodology` or specific spike-driven rollout

**C. Both** — rarely ideal; prefer separating into two runs.

### 2. Create new version folder

```bash
CANDIDATE=jane-dupont
NEW_DATE=2026-06-01
mkdir -p candidates/$CANDIDATE/versions/$NEW_DATE
```

### 3. Update sources

If source change: capture new primary sources into `sources-raw/`.

For unchanged sources that carry over, copy from previous version:

```bash
cp -r candidates/$CANDIDATE/versions/2026-04-19/sources-raw/manifesto.* \
      candidates/$CANDIDATE/versions/$NEW_DATE/sources-raw/
```

Verify SHA256 of carried-over files is unchanged.

### 4. Consolidate → human review

```bash
npm run consolidate -- --candidate $CANDIDATE --version $NEW_DATE
```

Produces `sources.md.draft`. Human reviews.

**Shortcut for small source deltas:** if only a new speech was added, the human can edit the previous version's `sources.md`, apply the delta from the new source, and save directly — no need to re-run consolidation from scratch. Document this in the per-version `metadata.json`.

### 5. Analyze → parallel across models

```bash
npm run analyze -- --candidate $CANDIDATE --version $NEW_DATE
```

Runs all configured models in parallel. ~5–10 minutes wall-clock.

### 6. Aggregate → human review of flags

```bash
npm run aggregate -- --candidate $CANDIDATE --version $NEW_DATE
npm run review -- --candidate $CANDIDATE --version $NEW_DATE
```

Human reviews flagged items. Usually 20–40 minutes, often less on update runs.

### 7. Publish

```bash
npm run publish -- --candidate $CANDIDATE --version $NEW_DATE
```

Updates `current` symlink, commits, pushes. Deployment is automatic via CI.

### 8. Diff audit (recommended)

Compare new aggregated output to previous:

```bash
npm run diff -- --candidate $CANDIDATE \
  --from 2026-04-19 --to $NEW_DATE
```

Sanity check: do the differences reflect the actual program changes, or has methodology drift leaked in?

---

## The methodology-change case (Category B)

When we update the prompt or schema, all candidates need re-running to maintain comparability. This is expensive (cost + human review time), so we:

1. Bump prompt version explicitly (e.g., `1.0` → `1.1`).
2. Document in `prompts/CHANGELOG.md`.
3. Update the spec that references the prompt.
4. Run one candidate first as a pilot; manually inspect output.
5. If output quality is acceptable, run remaining candidates.
6. During transition, the site displays a banner noting that some candidates are on older methodology versions.
7. Once all are on the new version, remove the banner.

---

## Agent-assisted updates

The workflow is formalized in [`.github/prompts/update-candidate.prompt.md`](../../../.github/prompts/update-candidate.prompt.md).

An agent can drive steps 2–7 with human review gates at steps 4 (sources review) and 6 (aggregation review).

---

## Concurrent updates

If multiple candidates are being updated simultaneously (common in methodology-change scenarios):

- Each update is an independent version folder
- No shared state between runs
- Commits can be separate PRs per candidate for easier review
- Deployment is cumulative — all committed versions are served

---

## When NOT to publish an update

- Flagged items in aggregation reveal systematic issues (e.g., many source-contradictions) → investigate before publishing
- Models show suspicious correlated agreement on a novel claim not in sources → flag for deeper review
- Site-side build fails → fix before deploying
- Diff from previous version shows unexplained shifts (methodology drift?) → investigate

---

## Keeping old versions

Old dated version folders are **never deleted**. They are historical artifacts proving what analysis was public at a given time.

The website serves the `current` symlink version for each candidate. A future milestone may add a version history UI — but the data is already structured for it.

---

## Open questions (for spike)

- Should we publish updated versions automatically on a schedule, or only manually? (Default: manual.)
- Should we auto-notify when a candidate's official site publishes a new document? (Nice-to-have; not v1.)
- How long do we retain `raw-outputs/` on disk? (Default: forever — they are the transparency artifact.)
- CI/CD for methodology-change cascades? (Future consideration.)

---

## Related Specs

- [`overview.md`](overview.md)
- [`source-gathering.md`](source-gathering.md)
- [`../candidates/repository-structure.md`](../candidates/repository-structure.md)
- [`../analysis/analysis-prompt.md`](../analysis/analysis-prompt.md)
- [`../analysis/aggregation.md`](../analysis/aggregation.md)
