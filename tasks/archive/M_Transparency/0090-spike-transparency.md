---
id: "0090"
title: "Spike: M_Transparency — transparency drawer (sources, prompts, raw outputs, agreement map)"
type: spike
status: active
priority: high
created: 2026-04-21
milestone: M_Transparency
spec:
  - docs/specs/website/transparency.md
context:
  - docs/specs/website/transparency.md
  - docs/specs/website/candidate-page-polish.md
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/website/structure.md
  - docs/specs/analysis/editorial-principles.md
  - docs/specs/analysis/aggregation.md
  - docs/specs/candidates/repository-structure.md
  - site/components/chrome/Drawer.tsx
  - site/components/chrome/TransparencyFooter.tsx
  - site/components/sections/IntergenSection.tsx
  - site/components/sections/DomainesSection.tsx
  - site/scripts/copy-candidate-artifacts.ts
  - scripts/lib/schema.ts
  - candidates/test-omega/current/aggregated.json
  - candidates/test-omega/current/metadata.json
  - candidates/test-omega/current/aggregation-notes.md
depends_on: ["0088"]
---

## Goal

Finalize the design for **M_Transparency**: the right-side drawer that
exposes every artifact used to produce a candidate's analysis — primary
sources, the consolidated `sources.md`, the exact prompt bytes, each
model's raw JSON output, the aggregation notes, and the agreement map.

This is the UI that turns "trust us" into "check us". It is the single
most important editorial affordance on the site — if it is hidden,
shallow, or unlinkable from claims, the project loses its differentiator.

This spike answers:

- Which component anatomy (tabs, deep links, empty states)?
- Where do the per-version artifacts live at build time, and how do we
  guarantee **prompt-byte integrity** across site versions (the SHA256
  recorded in `metadata.json` must match what the drawer shows)?
- How does a `<SourceRef>` in a section deep-link into the drawer?
- What stays in v1 vs. deferred to `M_Accessibility`,
  `M_VisualComponents` polish, or a later milestone?

Implementation is deferred to the backlog tasks produced by this spike.

## Red-flag check (editorial principles)

Reviewed against `docs/specs/analysis/editorial-principles.md`:

| Principle | Transparency design position |
|---|---|
| Analysis over advocacy | Drawer is pure artifact exposure. No new prose is generated. ✅ |
| Symmetric scrutiny | Drawer structure is candidate-agnostic — same four tabs, same fields, for every candidate. ✅ |
| Measurement over indictment | No ordinal/cardinal numbers introduced. ✅ |
| Dissent preserved | Raw per-model JSON shown verbatim; agreement map tab surfaces `contested_claims` and dissenter lists. ✅ |
| Pinned model versions + prompt hashes | Drawer displays exact `exact_version` per model and verifies `prompt_sha256` matches the byte stream shown. ✅ |
| Human review gate | Drawer displays `human_review_completed` + reviewer id + timestamp; no new write path. ✅ |

No red flags. The drawer **strengthens** the transparency pillar rather
than compromising any principle.

## Scope boundary — what this milestone does NOT cover

- **Syntax highlighting for JSON / markdown.** v1 uses plain `<pre>` +
  browser-native markdown rendering via `react-markdown` with no
  highlighter. Deferred to a later polish pass.
- **PDF viewer customization.** v1 embeds PDFs via `<iframe>` and
  defers to the browser's native PDF viewer. No `pdf.js`, no page
  thumbnails, no search.
- **Version-history UI** (navigate between dated versions of the same
  candidate). Deferred — `current` is the only displayed version in
  v1, matching the rest of the site.
- **Diff view** between two versions of the same candidate. Deferred.
- **Cross-candidate inspection** (e.g. "how did models differ across
  candidates on the housing axis"). Deferred.
- **Bulk zip download** of `versions/<date>/`. Deferred — individual
  file downloads are sufficient for v1, and a zip requires either a
  build-time archiver or a client-side one (heavy). Revisit after
  user feedback.
- **Saved views / bookmarks** beyond the deep-link URL scheme.
- **WCAG 2.1 AA audit.** The Drawer primitive already meets baseline
  dialog a11y (Radix); full audit is `M_Accessibility`.
- **Comment / discussion / social share** — explicit non-features.
- **AI "ask questions about this candidate" chatbot** — explicit
  non-feature.
- **Schema changes.** Zero. M_Transparency is pure UI over artifacts
  that already exist.

## Research Questions + Decisions

### Q1 — Drawer anatomy: single top-level drawer or one-drawer-per-tab?

**Decision: one `<TransparencyDrawer>` with four internal tabs.**

- Matches the draft spec and the mental model ("open Transparence, pick
  what you want").
- Deep links (`#transparence=<tab>`) switch tabs without reloading the
  drawer.
- Reuses the `<Drawer>` primitive built in `M_CandidatePagePolish`
  (`site/components/chrome/Drawer.tsx`). Uses `size="xl"` (960px max).

Tabs:

1. `sources` — files from `sources-raw/`
2. `document` — `sources.md`
3. `prompts` — `analyze-candidate.md`, `aggregate-analyses.md`,
   `consolidate-sources.md`
4. `results` — three sub-views: `notes` (`aggregation-notes.md`),
   `per-model` (raw outputs), `agreement` (the `agreement_map` render).

### Q2 — How does the drawer get the artifact bytes, and how do we guarantee prompt-byte integrity?

**Decision: all artifacts ship as static files under
`site/public/candidates/<id>/<version>/` and
`site/public/prompts/<sha256>.md`. The drawer `fetch()`es them at open
time and verifies hashes where applicable.**

- **Per-candidate artifacts** (`aggregated.json`, `metadata.json`,
  `sources.md`, `aggregation-notes.md`, `raw-outputs/*.json`,
  `sources-raw/*`) are already copied by
  `site/scripts/copy-candidate-artifacts.ts`. No change to that script
  except: emit a `sources-raw/manifest.json` listing files with their
  byte size and SHA256 so the Sources tab can render an index without
  doing a directory listing on the client.

- **Prompt files** are the subtle case. `metadata.json` records
  `analysis.prompt_sha256` and `aggregation.prompt_sha256`. If
  `prompts/analyze-candidate.md` has drifted since the version was
  run, showing the **current disk content** under that SHA would be a
  lie. Fix: a new build step `site/scripts/copy-prompts.ts` copies
  every `prompts/*.md` it finds on disk to
  `site/public/prompts/<actual-sha256>.md` (content-addressed). The
  drawer then loads by **the SHA recorded in metadata**, not by
  logical name. If the file is not present (because the disk content
  has drifted and no-one committed the old SHA), the drawer shows a
  **"prompt not available in current repository"** badge with a link
  to the git history — it does NOT render the current (wrong) content
  labeled as historic. Zero silent lies.
  - For v1 the only prompts copied are those whose disk SHA matches
    the SHA recorded in at least one shipped candidate's metadata.
    That keeps the `public/prompts/` directory minimal.
  - A `site/public/prompts/manifest.json` lists
    `{ logical_name, sha256, byte_length }` for every available file.

- **Client fetch path.** The drawer fetches from static URLs. No API
  routes (incompatible with `output: "export"`). Errors are rendered
  as inline "artifact unavailable" states.

### Q3 — How do `<SourceRef>`s in page sections integrate?

**Decision: a new `<SourceRef>` component wraps a source locator and,
when clicked, opens the drawer on the `document` tab and scrolls to
the matching heading anchor.**

- The schema's `SourceRef` is already a plain string locator (e.g.
  `"sources.md#retraites"` or free-form). v1 interprets the string
  conservatively:
  - Full string rendered as chip text.
  - If it matches the pattern `sources.md#<slug>`, clicking sets the
    drawer URL hash to `#transparence=document&anchor=<slug>` and the
    `document` tab scrolls to that `<h2>` / `<h3>` by slug.
  - If it does not match, the chip opens the `document` tab at the
    top (no deep link). This is a graceful fallback — nothing breaks.
- Sections that already render `source_refs` inline (IntergenSection,
  DomainesSection evidence lists) migrate to `<SourceRef>`.
- Every aggregated claim with `source_refs.length > 0` becomes
  click-to-open.

### Q4 — URL scheme for deep linking

**Decision: hash fragments, parsed client-side.**

- `#transparence=sources` → opens drawer on Sources tab.
- `#transparence=sources&file=<filename>` → Sources tab, viewer open
  on that file.
- `#transparence=document[&anchor=<slug>]` → Document tab, optional
  scroll target.
- `#transparence=prompts[&sha=<sha256>]` → Prompts tab, optional
  highlight.
- `#transparence=results&view=<notes|per-model|agreement>[&model=<id>|claim=<id>]`
  → Results tab, optional sub-view + focus.

Rationale: `output: "export"` has no server-side rewrites, and
switching the drawer state via pathname would force a full re-render
of the candidate page. Hash fragments are free. Closing the drawer
removes the `#transparence` fragment via `history.replaceState` so
the back button does not reopen.

### Q5 — Agreement map rendering — how to preserve "dissent shown, not averaged"

**Decision: three read-only sections mirroring the schema, zero
composed numbers.**

Inside `results > agreement`:

1. **Consensus** — `high_confidence_claims[]`. For each: the `claim`
   string, `supported_by` as a list of model IDs (badges), evidence
   `source_ref` as a `<SourceRef>`.

2. **Dissent** — `contested_claims[]`. For each: the claim text, two
   columns `supported_by` / `dissenters`, any `resolution_note` from
   the aggregator shown verbatim (not summarized).

3. **Positioning intervals** — `positioning_consensus` per axis. Shows
   `modal` score, `dissent_count`. Does NOT show a mean. Anchored to
   the aggregated schema: the score integer (`[-5, +5]`) is displayed
   as text ("–2"), never on a gradient bar that implies cardinality.

This is verbatim display of already-existing structural fields. No
aggregation is recomputed.

### Q6 — Coverage and failure cases

**Decision: the drawer surfaces failure first-class, never hides it.**

- `metadata.json > analysis.models[<id>].status === "failed"` → the
  per-model entry shows a red "Échec" badge and, if the
  `<id>.FAILED.json` artifact exists, links to it.
- `coverage_warning: true` on the aggregated output → a prominent
  warning ribbon at the top of the `results` tab.
- `human_review_completed: false` → warning ribbon at the top of the
  drawer (though the publish gate normally blocks this from shipping).
- Missing `sources-raw/` files → Sources tab shows an empty state
  with copy explaining that primary sources have not yet been
  archived for this version (common for `test-omega`).

### Q7 — Entry points from the candidate page

**Decision: three entry points, all leading to the same drawer.**

1. **Section-level `<SourceRef>` chips** (primary) — any cited claim.
2. **Prominent "Transparence" button** at the top of the existing
   `<TransparencyFooter>` that opens the drawer on the `document`
   tab. Existing footer content remains unchanged for readers who
   skim without opening the drawer.
3. **NavBar entry** — a `Transparence` item (FR) in the top-of-page
   section nav that scrolls to the footer and opens the drawer.

### Q8 — What about `consolidate.ts` prompt?

**Decision: include it in the Prompts tab but only if a shipped
version's `metadata.json > consolidation.prompt_sha256` exists.**

Current `metadata.json` only records `analysis` and `aggregation`
prompt metadata. Consolidation metadata was not required in earlier
milestones. The drawer probes optionally; if no field is present the
consolidation entry is omitted (v1 behavior). A later cleanup may
add `consolidation.*` to metadata — not in scope here.

### Q9 — Can the drawer render without JavaScript?

**Decision: no. The drawer is an interactive affordance, so it is a
`"use client"` component. BUT every artifact it exposes also has a
**direct-URL fallback** under `/candidates/<id>/<version>/...` and
`/prompts/<sha>.md`, and the `<TransparencyFooter>` already lists the
download links for the most important ones. A reader with JS disabled
can still reach every artifact through plain HTML.**

This maintains the "accessible without JavaScript" intent from the
draft spec without requiring server-side rendering of a dialog, which
would be complex and costly.

## Deliverables

1. **Spec promotion**: `docs/specs/website/transparency.md` goes Draft
   → **Stable (v1.1)**, reconciled with the decisions above.

2. **Backlog tasks** in `tasks/backlog/M_Transparency/`:
   - `0091` — Promote spec + `copy-prompts.ts` build step + per-version
     `sources-raw/manifest.json` emission.
   - `0092` — `<TransparencyDrawer>` shell with 4 tabs + hash-fragment
     deep-linking utility.
   - `0093` — Sources tab (file list + inline viewers for
     PDF/markdown/text/JSON).
   - `0094` — Document consolidé tab (react-markdown + anchor scroll).
   - `0095` — Prompts tab (SHA-verified display, mismatch warning).
   - `0096` — Résultats IA tab (notes + per-model raw JSON +
     agreement map read-only views).
   - `0097` — `<SourceRef>` component + migrate existing usages.
   - `0098` — Integration: NavBar entry, TransparencyFooter button,
     e2e smoke test on `test-omega`, close-milestone update
     (spec → Stable, ROADMAP → Done).

3. **ROADMAP update**: `M_Transparency` row goes 📋 Planned
   (spike needed) → 🚧 In Progress with a "Spike produces" block
   consistent with the pattern used by other milestones.

## Acceptance Criteria

- [x] Spec draft reviewed; decisions recorded inline (Q1–Q9).
- [ ] Spec document updated and promoted to Stable on task `0098`.
- [ ] 8 backlog tasks created in `tasks/backlog/M_Transparency/`.
- [ ] Tasks reference the spec, not each other (except minimal
      `depends_on` chain on infra tasks).
- [ ] Each task has clear acceptance criteria and a `test_command`.
- [ ] No circular dependencies in the task graph.
- [ ] ROADMAP.md updated with the milestone status block.
- [ ] Editorial principles reviewed and no red flag triggered.

## Notes

Open questions left for implementation-time refinement:

- Whether to use `react-markdown` or a lighter custom parser — task
  `0094` decides based on bundle-size measurement.
- Whether the per-model raw JSON view needs lazy-loading on very
  large files — task `0096` decides after measuring
  `test-omega`'s raw outputs (~40KB each; likely fine as-is).
- Whether the PDF iframe's `sandbox` attribute needs `allow-forms` for
  interactive manifesto PDFs — decide when a real PDF ships.
