---
id: "0096"
title: "Résultats IA tab — aggregation notes + per-model raw JSON + agreement map"
type: task
status: open
priority: medium
created: 2026-04-21
milestone: M_Transparency
spec: docs/specs/website/transparency.md
context:
  - docs/specs/website/transparency.md
  - site/components/chrome/TransparencyDrawer.tsx
  - site/lib/dimension-labels.ts
  - scripts/lib/schema.ts
  - candidates/test-omega/current/aggregated.json
  - candidates/test-omega/current/aggregation-notes.md
  - candidates/test-omega/current/raw-outputs/
test_command: pnpm --filter site test -- ResultsTab
depends_on: ["0092", "0094"]
---

## Context

Tab 4 is the editorial heart of the drawer: it surfaces the
aggregation notes, every per-model raw JSON output verbatim, and the
`agreement_map` (consensus + dissent + positioning intervals).

See spec §7. **Read this section carefully** — the display rules are
non-negotiable (no cardinal aggregation, no score gradients, no
prose synthesis).

## Objectives

1. Create `site/components/transparency/ResultsTab.tsx` with a
   sub-tab switcher driven by the hash parameter `view`:
   - `notes` (default) → `NotesView`
   - `per-model` → `PerModelView`
   - `agreement` → `AgreementMapView`
2. Render the coverage + review ribbons from task 0092 (already in
   the drawer shell) — do **not** duplicate them here.
3. **NotesView**:
   - Fetches `/candidates/<id>/<version>/aggregation-notes.md`.
   - Renders with `react-markdown` + GFM (reuse the component
     configured in task 0094).
4. **PerModelView**:
   - Iterates over `metadata.analysis.models`. For each model:
     - Card header: id, provider, `exact_version`, status badge,
       `execution_mode`, `run_at`.
     - When `attested_by` / `attested_model_version` exist, display
       them.
     - When `provider_metadata_available !== false`, show
       `input_tokens`, `output_tokens`, `cost_usd` if present;
       otherwise omit those fields entirely (do not show "N/A" —
       the absence of the field is the signal).
     - Collapsed by default; expanding issues a `fetch` for
       `/candidates/<id>/<version>/raw-outputs/<model_id>.json`
       and renders `JSON.stringify(data, null, 2)` inside a `<pre>`.
     - Failed runs: render a failure badge; if
       `<model_id>.FAILED.json` exists, link to it without
       attempting to render.
     - Download link for each raw output.
   - Deep-link: `#transparence=results&view=per-model&model=<id>`
     auto-expands that model on mount.
5. **AgreementMapView** — three stacked sections mirroring
   `aggregated.agreement_map`, **read-only**:
   - **Consensus** (`high_confidence_claims[]`): each row shows
     the `claim`, `supported_by` as model badges, the
     `source_ref` as a `<SourceRef>` chip.
   - **Dissent** (`contested_claims[]`): two-column layout
     (`supported_by` vs. `dissenters`); `resolution_note` shown
     verbatim. A toggle "Afficher seulement les désaccords non
     résolus" filters by absence of `resolution_note`.
   - **Positionnement** (`positioning_consensus`): one row per
     axis with FR label (from `dimension-labels.ts`), `modal` as
     integer text (e.g. `-2`), `dissent_count`. **Do not** render
     a numeric bar, gradient, or mean. Integer-as-text only.
6. Unit tests:
   - NotesView renders aggregation-notes markdown.
   - PerModelView omits token fields when
     `provider_metadata_available === false` (manual mode).
   - PerModelView expands the right card from a deep-link hash.
   - AgreementMapView renders consensus + dissent rows from
     fixtures; filter toggle hides resolved-dissent rows.
   - AgreementMapView positioning rows render integer text, NOT a
     visual bar (assert that no element with role="progressbar"
     or class containing "bar" is present in the positioning
     section).

## Acceptance Criteria

- [ ] All three sub-views render correctly for `test-omega`.
- [ ] Token / cost fields hidden when
      `provider_metadata_available === false`.
- [ ] Per-model raw JSON is fetched lazily and shown verbatim.
- [ ] Positioning section contains no visual bar / gradient / mean.
- [ ] Deep-link fragments for each sub-view + `model` / `claim`
      focus work.
- [ ] Tests pass: `pnpm --filter site test -- ResultsTab`.
- [ ] No lint / type errors.

## Editorial check

- [ ] **No cardinal averaging of positioning scores.** The
      positioning section must render integer text only.
- [ ] **Dissent is preserved**, not summarized away —
      `contested_claims[]` rendered row-by-row with both
      `supported_by` and `dissenters` visible.
- [ ] Raw per-model JSON is never edited or filtered —
      `JSON.stringify` verbatim.
- [ ] No advocacy framing in copy; measurement-neutral headings
      ("Consensus", "Désaccords", "Positionnement agrégé").
