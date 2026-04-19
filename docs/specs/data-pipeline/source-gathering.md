# Source Gathering

> **Version:** 1.1
> **Status:** Stable — finalized by M_DataPipeline spike (2026-04-19)

---

## Overview

This spec defines how primary sources about a candidate's program are gathered and what qualifies as a primary source.

The quality of every downstream analysis depends entirely on this step. A fabricated or mis-attributed source here propagates through every model's analysis and every aggregated claim.

---

## What counts as a primary source

**Primary sources** are first-hand expressions of the candidate's program:

✅ **In scope:**
- The candidate's official program document / manifesto (PDF from their website)
- The candidate's official party platform (where the candidate is a party leader or endorsee)
- Transcripts of major speeches by the candidate (from official channels)
- Official press releases from the candidate's campaign
- The candidate's voting record in public bodies (Assemblée nationale, Parlement européen, Sénat, Conseil régional, etc.)
- Public statements attributed directly to the candidate on verifiable platforms (official social media, official interviews)
- Book-length works authored by the candidate that lay out policy positions

❌ **Out of scope:**
- Press coverage or opinion pieces about the candidate (secondary)
- Analyses by third-party think tanks
- Wikipedia or encyclopedia entries
- Past programs from prior elections (unless explicitly carried over — in which case, the current program citing them is the primary source)
- Statements attributed by intermediaries without direct citation

**Why this distinction:** we are analyzing what the candidate proposes, not what observers think the candidate proposes. Mixing the two is how analyses become indistinguishable from commentary.

### Voting records — special handling

A candidate's legislative voting record is a primary source about their revealed preferences, even when their program statement is silent or different.

- Include voting records from `data.assemblee-nationale.fr`, `europarl.europa.eu`, `senat.fr`, etc.
- Capture votes on issues relevant to the analytical dimensions.
- Where a voting record differs from stated program position, this is an analytical finding — note both, do not resolve.

---

## Where to find primary sources

Common sources (not exhaustive):

| Source | URL pattern | Notes |
|--------|-------------|-------|
| Candidate's official site | Varies | Usually `<candidate-name>.fr` or party URL |
| Vie Publique | `vie-publique.fr` | Government-published speeches and program archives |
| Assemblée nationale | `data.assemblee-nationale.fr` | Voting records |
| European Parliament | `europarl.europa.eu` | Voting records for MEPs |
| Sénat | `senat.fr` | Voting records |
| Conseil constitutionnel | `conseil-constitutionnel.fr` | Where relevant for institutional positions |
| Party platforms | Party websites | Official party programs |

---

## Capture format

For each source, we capture:

- **The file itself** — PDF, HTML page (saved), transcript text, JSON export, etc.
- **A URL of origin** — where we got it
- **An access date** — when it was retrieved (ISO-8601)
- **A SHA256 hash** of the captured file

File naming in `sources-raw/`:

```
sources-raw/
├── manifesto.pdf                        # main program document
├── manifesto.meta.json                  # origin URL, access date, hash
├── speech-2026-09-12-rally-paris.txt    # speech transcript with date + location
├── speech-2026-09-12-rally-paris.meta.json
├── voting-record-2024-2026.json         # exported voting record
├── voting-record-2024-2026.meta.json
├── interview-le-monde-2026-10-03.txt
└── interview-le-monde-2026-10-03.meta.json
```

Every file has a matching `.meta.json`:

```json
{
  "origin_url": "https://example.com/manifesto.pdf",
  "accessed_at": "2026-04-19T10:00:00Z",
  "sha256": "...",
  "notes": "Retrieved from candidate's official site, Programme section",
  "license": "presumed fair use — official public political program"
}
```

---

## The ingestion prompt

An AI agent can assist with source discovery and retrieval. The prompt for this is [`.github/prompts/ingest-sources.prompt.md`](../../../.github/prompts/ingest-sources.prompt.md).

**Critical:** the agent does not unilaterally decide what counts as a primary source. The human in the loop reviews the list of sources before consolidation runs. Without this gate, hallucinated or misattributed sources slip in and poison every downstream stage.

The collaboration pattern:

1. Agent proposes a list of sources it intends to capture (with URLs).
2. Human reviews the list, removes/adds as needed.
3. Agent fetches the approved sources, writes to `sources-raw/`.
4. Human spot-checks the captures (especially that PDFs are the real program, not unrelated documents).
5. Human commits to git.

---

## Reuse across versions

A source captured in an earlier version (e.g., the candidate's main manifesto) may be reused in a later version if unchanged. To reuse:

- Copy the file and its `.meta.json` to the new version folder's `sources-raw/`
- Verify SHA256 is unchanged
- New version's ingestion can skip re-download

If the manifesto was updated between versions, capture the new one — don't conflate versions.

---

## Copyright and fair use

Candidate programs and their associated speeches are public political communication. Reproducing them for the purpose of analysis and commentary is permissible under fair-use principles in most jurisdictions; in France, `droit de citation` covers this use.

- Do not reproduce the full text on the website.
- Do reproduce short passages (direct quotes) necessary for the analysis to be grounded in the candidate's own words.
- `sources.md` may include longer direct excerpts organized for analytical use — this is internal working material, made public as part of the transparency drawer.
- Always credit the source file and its origin.
- Legal review prior to public launch (see `M_Legal` milestone in ROADMAP).

---

## Completeness check

Before consolidation runs, the source set should cover:

- [ ] Current official program / manifesto
- [ ] Party platform (if applicable)
- [ ] Recent major speeches (last 6 months)
- [ ] Voting record (if candidate holds legislative office)
- [ ] Any publicly stated positions on the fixed dimension list that are absent from the above

If a dimension is not addressed by any captured source, the analysis will report "not addressed" for that dimension. This is acceptable — it's itself a finding. But we should not fail to capture a source that *does* address the dimension.

---

## Open Questions (Resolved — M_DataPipeline spike 2026-04-19)

- **Debate transcripts:** Yes, include transcripts of official debates the candidate participated in. These are primary sources of the candidate’s stated positions.
- **Party-platform candidates:** Include the party platform as a primary source. Note the relationship in the candidate’s `metadata.json` (e.g., `"program_source": "party_platform"`). The consolidated `sources.md` should note which positions come from the party platform vs. the candidate’s own statements.
- **Interview positions:** Include as primary sources. If contradictory to the manifesto, include both — the contradiction is itself an analytical finding. Mark interview-only positions with lower prominence in `sources.md` consolidation.
- **Git vs. git-lfs:** Plain git for v1. Migrate to git-lfs if any candidate’s `sources-raw/` exceeds 100MB total. The pipeline does not depend on git-lfs tooling.

---

## Related Specs

- [`overview.md`](overview.md)
- [`update-workflow.md`](update-workflow.md)
- [`../candidates/repository-structure.md`](../candidates/repository-structure.md)
- [`../analysis/dimensions.md`](../analysis/dimensions.md)
