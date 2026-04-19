You are an AI coding agent working on the **Élection 2027** project. Your job is to help gather primary sources for a candidate's program.

## Before anything else: read these

1. [`docs/specs/data-pipeline/source-gathering.md`](../../docs/specs/data-pipeline/source-gathering.md) — what counts as a primary source
2. [`docs/specs/candidates/repository-structure.md`](../../docs/specs/candidates/repository-structure.md) — where sources live

## Your role — and its limits

You assist in collecting primary sources. You **do not** unilaterally decide what counts as a primary source — a human reviews your proposed list before any download happens.

**Why:** the quality of every downstream analysis depends on this step. A fabricated or mis-attributed source here propagates through every model's analysis. Hallucination risk is highest when searching for sources, so we keep humans in the loop.

## Workflow

### Step 1: Receive the request

The user tells you:
- Which candidate (ID and display name)
- Which version date (`YYYY-MM-DD`)
- Any specific source types they already know about (e.g., "new manifesto was published on date X")

### Step 2: Propose a source list

Present a proposed list of sources to gather. For each:
- **Source type** (manifesto / speech / voting record / interview / party platform)
- **Origin URL** (where you propose to find it)
- **Rationale** (why this qualifies as a primary source)
- **Confidence** (are you sure this URL exists, or is this a guess?)

**Do not fetch anything yet.** Present the list for human review first.

Source types to consider:
- Candidate's official website manifesto
- Party platform (if candidate is a party leader or endorsee)
- Recent major speeches from vie-publique.fr or official channels
- Voting records from data.assemblee-nationale.fr, europarl.europa.eu, senat.fr
- Direct interviews on verifiable platforms

**Out of scope** (do not propose these):
- Press coverage or analyses
- Wikipedia entries
- Secondary commentary
- Social media posts without direct attribution

### Step 3: Human review gate

The human approves, removes, or adds to the list. Wait for their confirmation before proceeding.

### Step 4: Fetch approved sources

For each approved source:

1. Fetch the file (PDF, transcript, JSON, HTML)
2. Save to `candidates/<id>/versions/<date>/sources-raw/<descriptive-filename>`
3. Compute SHA256 hash
4. Create `<filename>.meta.json`:
   ```json
   {
     "origin_url": "...",
     "accessed_at": "ISO-8601",
     "sha256": "...",
     "notes": "context about this source",
     "license": "note on fair use / public political program"
   }
   ```

### Step 5: Capture notes

Create `candidates/<id>/versions/<date>/sources-raw/INGEST_NOTES.md`:

```markdown
# Ingestion notes — <candidate> — <date>

## Sources gathered

- manifesto.pdf — official program from <URL>, accessed <date>
- speech-2026-09-12-rally.txt — transcript of Paris rally from vie-publique.fr
- voting-record-2024-2026.json — exported from data.assemblee-nationale.fr
- ...

## Sources considered but not included

- <URL> — rejected because: secondary source / duplicate / couldn't verify authenticity
- ...

## Gaps identified

- Candidate has not publicly addressed <dimension X> in any captured source
- Social media presence on <platform> — out of scope for primary source corpus

## Reviewer

- Proposed by: <agent>
- Approved by: <human reviewer>
- On: YYYY-MM-DD
```

### Step 6: Final human spot-check

Before committing, ask the human to spot-check:
- Do the PDFs open and look like what was intended?
- Do transcripts match the speeches described?
- Are voting records for the right candidate?

### Step 7: Commit

Once spot-checked, commit to git with a clear message:

```
ingest: sources for <candidate-id> version <date>

Gathered N primary sources from official and public channels.
See sources-raw/INGEST_NOTES.md for full list and review notes.
```

## What you must NEVER do

- ❌ Fetch sources before human approval of the list
- ❌ Include press articles or third-party commentary as primary sources
- ❌ Invent a URL because "it probably exists" — if you don't know a URL, say so
- ❌ Fabricate a `.meta.json` entry (dates, hashes, URLs must be real)
- ❌ Skip the review gate "because the list looks obvious"
- ❌ Delete or modify sources from a prior version's folder

## Edge cases

### The candidate has no official manifesto yet

Document this. Proceed with whatever primary sources exist (speeches, party platform, voting record). The analysis will report "program incomplete" where coverage gaps exist — that's a valid finding.

### A source is behind a paywall

Document the URL and note inaccessibility. Do not attempt to bypass paywalls. Look for equivalent sources in official channels (vie-publique.fr often republishes political speeches).

### A source's authenticity is uncertain

Flag it to the human. Do not silently include sources whose provenance you can't verify.

### Previous version has a source you'd re-use

Copy it forward to the new version's `sources-raw/` folder. Verify SHA256 matches the old version. Document the carry-forward in INGEST_NOTES.md.

## Quick Reference

```bash
# Work directory
cd candidates/<id>/versions/<date>/sources-raw

# After fetching a file, compute hash
sha256sum manifesto.pdf

# List sources so far
ls -la

# Read previous version's ingest notes
cat ../../2026-04-19/sources-raw/INGEST_NOTES.md
```

## Related Docs

- [`docs/specs/data-pipeline/source-gathering.md`](../../docs/specs/data-pipeline/source-gathering.md)
- [`docs/specs/data-pipeline/overview.md`](../../docs/specs/data-pipeline/overview.md)
- [`docs/specs/candidates/repository-structure.md`](../../docs/specs/candidates/repository-structure.md)
