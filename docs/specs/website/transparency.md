# Transparency Drawer

> **Version:** 1.0
> **Status:** Draft — to be finalized by M_Transparency spike

---

## Overview

The transparency drawer is the UI affordance that exposes every artifact used to produce the analysis on a candidate page: primary sources, the consolidated source document, the exact prompts used, each model's raw output, and the aggregation notes.

**This is the core mechanism that distinguishes this project from any other political analysis site.** Every other outlet says "trust us"; this site says "check us".

---

## Design principles

1. **Always one click away.** From any claim, the reader can reach the evidence that produced it.
2. **No content hidden behind logins or paywalls.** Everything is public.
3. **Download affordances throughout.** Users who want to audit or run their own aggregation can download the raw outputs.
4. **Readable, not just accessible.** Syntax highlighting for JSON, structure-aware rendering for markdown, proper PDF embeds.
5. **Linkable sections.** Every artifact has a stable URL so specific items can be shared.

---

## Drawer structure

The drawer slides in from the right side of the viewport, covering roughly 60% of the width on desktop and 100% on mobile.

### Top-level tabs

```
┌──────────────────────────────────────────────────────────────┐
│  Sources  │  Document consolidé  │  Prompts  │  Résultats IA │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    [Content area]                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Tabs:

1. **Sources** — primary source files from `sources-raw/`
2. **Document consolidé** — the human-reviewed `sources.md`
3. **Prompts** — the exact prompt files used (consolidation, analysis, aggregation) with SHA256 hashes
4. **Résultats IA** — per-model raw JSON outputs + aggregation notes

---

## Tab 1: Sources

### Content

A list of all files in `candidates/<id>/current/sources-raw/`:

```
📄 manifesto.pdf                   Téléchargé le 2026-04-15 depuis example.com
                                   SHA256: a7b3...
                                   [Voir] [Télécharger]

📝 speech-2026-09-12-rally.txt     Retranscrit depuis vie-publique.fr
                                   SHA256: c9d1...
                                   [Voir] [Télécharger]

📊 voting-record-2024-2026.json    Depuis data.assemblee-nationale.fr
                                   [Voir] [Télécharger]
```

Each entry:
- File icon by type
- Filename
- Origin URL + access date (from `.meta.json`)
- SHA256 hash
- View + download affordances

### Viewing

- PDFs: inline embed (browser PDF viewer)
- Text / markdown: inline rendered
- JSON (voting records): syntax-highlighted tree view
- HTML captures: sandboxed iframe or rendered preview

---

## Tab 2: Document consolidé (`sources.md`)

### Content

The full `sources.md` for the current version, rendered with markdown formatting. Section anchors match the structure of the analysis dimensions so claims in the main page can deep-link to specific sections.

### Header metadata

```
Document consolidé — <candidate name>
Version du <date>
Revu par <reviewer> le <date>
SHA256: a7b3...
Sources utilisées: 5 fichiers (voir onglet Sources)
```

### Deep-linking

When a user clicks a `<SourceRef>` in the main page, the drawer opens on this tab and scrolls to the cited section.

URL format: `/candidat/<id>#source=<section-anchor>`

---

## Tab 3: Prompts

### Content

The three (or four, with adversarial pass) prompt files used:

```
📝 consolidate-sources.md          Version 1.0
                                   Hash: 3fa1... (vérifié contre run)
                                   [Voir le texte complet]

📝 analyze-candidate.md            Version 1.0
                                   Hash: 8cb2...
                                   [Voir le texte complet]

📝 aggregate-analyses.md           Version 1.0
                                   Hash: 1de4...
                                   [Voir le texte complet]
```

### Why this matters

Reading the prompts is the most direct way a skeptical reader can assess bias. If the prompt framing is loaded, the analysis is compromised — and we make it easy to check.

### Prompt display

- Full text rendered in a monospace-friendly view
- Copy button for each
- Link to the git commit of the prompt file

---

## Tab 4: Résultats IA

### Content

This is where the editorial transparency lives.

#### Sub-tab 4a: Aggregation notes

Renders `aggregation-notes.md`:
- Which models ran, succeeded, failed
- Notable disagreements and how aggregation preserved them
- Flagged items and their human-review resolutions
- Reviewer name and review date

#### Sub-tab 4b: Per-model outputs

A list, one entry per model:

```
🤖 Claude Opus 4.7 (anthropic)           ✓ Success
   Run at 2026-04-19 10:32 UTC
   Tokens: 42k in / 8.5k out
   [Voir JSON] [Télécharger]

🤖 GPT-5 (openai)                        ✓ Success
   Run at 2026-04-19 10:31 UTC
   ...

🤖 Gemini Ultra (google)                 ✓ Success
   ...

🤖 Mistral Large (mistral)               ⚠ Partial (section missing)
   ...

🤖 Grok (xai)                            ✗ Failed (invalid JSON after retries)
   [Voir logs]
```

Click any "Voir JSON" → inline JSON tree view with syntax highlighting. Collapsible sections matching the schema structure.

#### Sub-tab 4c: Agreement map

A visual representation of `aggregated.json > agreement_map`:

```
Claim                                          Models supporting
─────────────────────────────────────────────  ─────────────────
Economic axis placement                        ●●●●● (5/5)
Pension math sustainability                    ●●●●○ (4/5 — Grok dissented)
Housing access projection                      ●●●○○ (3/5 — contested)
Counterfactual direction                       ●●●●● (5/5)
...
```

- Filters: show all / show only contested / show only consensus
- Click any claim → reveals per-model positions and reasoning

---

## Side-panel: ever-visible summary

At the top of the drawer, a small always-visible summary:

```
Analyse de <nom candidat>
Version: 2026-04-19
5 modèles d'IA utilisés • 4 succès / 1 échec
4 claims controversés • 12 claims en consensus
Revue humaine: complète le 2026-04-20 par <reviewer>
Repository: github.com/<repo> (commit a7b3...)
```

This summary is information-dense on purpose: it lets a skeptical reader assess the credibility signal at a glance before diving in.

---

## Downloads

Every artifact has a download affordance:

- Individual files (PDFs, text, JSON)
- Bulk download: "Télécharger toute l'analyse de ce candidat" → zip of the entire `versions/<date>/` folder

The bulk download is deliberately easy to access. We want people to be able to take our data and do their own analysis.

---

## Deep-linking

Stable URLs:

- `/candidat/<id>?tab=sources&file=manifesto.pdf`
- `/candidat/<id>?tab=document&anchor=retraite`
- `/candidat/<id>?tab=prompts&file=analyze-candidate.md`
- `/candidat/<id>?tab=results&model=claude-opus-4-7`
- `/candidat/<id>?tab=results&claim=<claim-id>`

These URLs are shareable and stable across deployments as long as the underlying artifacts exist.

---

## Closing the drawer

- ESC key
- Click outside drawer
- Close button top-right
- Closing preserves the current URL without the drawer query params (so back button doesn't reopen)

---

## Accessibility

- Fully keyboard-navigable
- Focus trapped inside drawer when open
- Screen-reader-announced tab changes
- All content inside drawer accessible without JavaScript (progressive enhancement)

---

## Performance

- JSON viewer lazy-loaded (the syntax highlight library is heavy)
- PDFs use native browser viewer (no custom PDF.js by default)
- Large JSON files (raw outputs) are paginated or virtualized

---

## Future considerations

- **Version history UI**: navigate across dated versions of the same candidate
- **Diff view** between two versions of same candidate's aggregated output
- **Cross-candidate inspection**: see how models differed across candidates
- **Saved views**: bookmarkable specific filters on the agreement map

These are future milestones, not v1.

---

## What the drawer does NOT include

- Reader comments or discussion (no UGC)
- Third-party "fact check" embeds
- Social share buttons (encouraging shallow sharing of claims out of context)
- AI chatbot for "ask questions about this candidate" (this would undermine the "read our static analysis" contract)

These are deliberate non-features.

---

## Related Specs

- [`structure.md`](structure.md)
- [`visual-components.md`](visual-components.md)
- [`../candidates/repository-structure.md`](../candidates/repository-structure.md)
- [`../analysis/aggregation.md`](../analysis/aggregation.md)
- [`../analysis/editorial-principles.md`](../analysis/editorial-principles.md)
