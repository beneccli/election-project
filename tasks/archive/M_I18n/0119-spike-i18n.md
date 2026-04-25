---
id: "0119"
title: "Spike: Internationalisation (FR canonical, EN translation)"
type: spike
status: done
priority: high
created: 2026-04-25
milestone: M_I18n
spec: docs/specs/website/i18n.md
context:
  - site/lib/i18n.ts
  - site/lib/lang-context.tsx
  - site/components/chrome/LanguageToggle.tsx
  - site/app/layout.tsx
  - site/app/page.tsx
  - site/app/candidat/[id]/page.tsx
  - site/app/comparer/page.tsx
  - site/lib/candidates.ts
  - site/lib/schema.ts
  - scripts/lib/schema.ts
  - scripts/ingest-aggregated.ts
  - scripts/prepare-manual-aggregation.ts
  - prompts/aggregate-analyses.md
  - candidates/bruno-retailleau/versions/2026-04-25/aggregated.json
  - docs/quick-start-zero-api.md
  - docs/specs/website/nextjs-architecture.md
  - docs/specs/website/structure.md
  - docs/specs/data-pipeline/analysis-modes.md
  - docs/specs/analysis/editorial-principles.md
  - docs/ROADMAP.md
depends_on: []
---

## Goal

Make the public site available in English in addition to French, on
**all three page types** (landing, candidate, comparison), without
compromising any of the project's editorial principles.

Two distinct surfaces must be translated:

1. **UI chrome** — static texts in components (nav, section headers,
   labels, footnotes, toggles). Already partially scaffolded in
   `site/lib/i18n.ts` with `LangProvider` + `LanguageToggle`. Most EN
   strings are placeholders today (`[EN] …`).
2. **Per-candidate aggregated content** — the prose inside
   `aggregated.json` (summary, headlines, dimension narratives,
   anchor narratives, dissent summaries, unsolved problems, downside
   scenarios, flagged-for-review reasons).

The pipeline's analysis stage stays **monolingual French**: the prompts
read FR sources and emit FR analyses. Translation is a separate,
human-driven post-processing step (the user pastes the FR
`aggregated.json` into a chat UI with a translation prompt and saves
the EN reply). The site picks up whatever translations exist on disk
at build time.

## Research Questions

1. **Filename convention — `aggregated.json` + `aggregated.en.json` or
   `aggregated.fr.json` + `aggregated.en.json`?**
   Decision: **bare `aggregated.json` is canonical FR**; translations
   are sibling files `aggregated.<lang>.json`. Rationale:
   - Backward compatible — every existing fixture, ingest script, and
     loader keeps working without rename.
   - The bare name signals "source of truth"; the locale suffix
     signals "derivative".
   - Matches the canonical FR principle stated in
     [`nextjs-architecture.md`](../../docs/specs/website/nextjs-architecture.md#fr-is-canonical).
   - The pipeline never writes `aggregated.<lang>.json`; only the
     translation ingest script does.

2. **What in `aggregated.json` is translatable?**
   The structure (numbers, IDs, scores, agreement maps, source_refs,
   model versions, candidate metadata) is **not** translated. Only
   prose string fields are. The spec enumerates the exact field-path
   allowlist; a `validate-translation.ts` script enforces it by
   diffing the translation against the FR source and rejecting any
   non-allowlisted change.

3. **Are party names translatable?** No. `party` and `party_id` in
   `metadata.json` stay verbatim across all locales (the user reminded
   us; the parity check enforces it because `metadata.json` is not in
   the translatable-paths allowlist).

4. **Routing under static export — how do we ship two languages?**
   Decision: **locale-prefixed route segment, FR canonical at root**.
   - `/`, `/candidat/[id]`, `/comparer` → French (canonical, unchanged
     URLs, preserves backlinks and SEO).
   - `/en`, `/en/candidat/[id]`, `/en/comparer` → English mirror.
   - Implemented as a Next.js `[lang]` route group with a single shared
     page implementation and `generateStaticParams` enumerating
     `lang × candidate`.
   - Static export generates both locale trees at build time.
   - Avoids client-side fetch of translation JSON (kept the build-time
     loader pattern from `nextjs-architecture.md` §2 intact).

5. **What does the `LanguageToggle` do now?**
   Today it flips a client-side context. Decision: it becomes a
   `Link` that **navigates to the equivalent route in the other
   locale** (preserves the page, swaps the URL prefix). Client state
   is removed — locale is derived from the URL path. Selection
   "stickiness" across navigation comes from the URL itself.

6. **What if a candidate has no EN translation?**
   Decision: the `/en/candidat/[id]` page **falls back to FR aggregated
   content** with a visible banner: "English translation not yet
   available — showing the original French analysis." UI chrome
   remains EN. The fallback is recorded so the comparison and landing
   pages can also flag candidates as "FR only" in the EN locale.
   Rationale: never drop a candidate from a locale (symmetric scrutiny
   — if a candidate appears in FR, they appear in EN; only the prose
   layer is missing).

7. **Aggregator + analyst prompts — do we touch them?** **No.** All
   prompts stay FR. Analysis remains monolingual. Touching the prompts
   would create a new analysis version (`AGENTS.md` editorial rule).
   The translation prompt is a **new, separate prompt
   (`prompts/translate-aggregated.md`)** that operates on the
   already-aggregated JSON.

8. **Editorial integrity of LLM-translated prose.** Translation is a
   human-gated step (same gate model as `sources.md`). The translator
   prompt explicitly forbids paraphrase, restructuring, advocacy
   verbs, or any change of meaning — only the language string is
   swapped. The parity validator enforces structural invariants
   (numbers, scores, IDs); the human review enforces semantic fidelity
   on the prose.

9. **`aggregation-notes.md` — translated too?** **Deferred.** v1
   translates only `aggregated.<lang>.json`. The notes file remains FR
   in both locales (with a small "available in French only" note
   under the Transparency drawer when the locale is EN). Surfacing
   this in the spec under "Scope boundary".

10. **`sources.md` — translated?** **No, never.** Sources are the
    primary-source artifact; translating them would compromise
    transparency (readers must be able to verify a claim against the
    candidate's actual French words). The Transparency drawer always
    links to the FR `sources.md`.

## Editorial principles check

Re-read against [`editorial-principles.md`](../../docs/specs/analysis/editorial-principles.md):

| Principle | Risk under this design | Mitigation |
|-----------|------------------------|------------|
| 1. Analysis, not advocacy | LLM translator could introduce moral/advocacy verbs not in the FR. | Translator prompt explicitly bans them; human review gate before ingest; parity check rejects added prose outside allowlisted fields. |
| 2. Symmetric scrutiny | If only some candidates have EN translations, EN site could appear to favour the translated ones. | Fallback policy: every candidate exists in `/en/`, FR-fallback banner shown when translation is missing. Landing/comparison pages mark FR-only candidates explicitly. |
| 3. Measurement over indictment | Translator could "smooth" numbers into adjectives. | Numeric fields are non-translatable (parity check); only prose string fields differ; reviewer compares EN against FR. |
| 4. Dissent preserved | Translator could collapse `dissent[*].summary` entries. | `agreement_map` structure is non-translatable (array lengths, model IDs, supported_by/dissenters lists); only the `summary` strings are translated, never added or removed. Parity check enforces array shapes. |
| 5. Radical transparency | Adding a translation layer could hide the original. | FR is canonical and always shipped; EN is additive. Transparency drawer always links to the FR aggregated + sources + raw outputs. The translator prompt is itself versioned and SHA256-hashed in the candidate's metadata under a new `translations.<lang>` block. |

No principle requires altering the design. **No red flags.**

## Existing Context

- **Prior art (UI chrome):** `site/lib/i18n.ts` already defines a
  `t()` helper, `UI_STRINGS` table, `Lang` type, and a
  `LangProvider`/`useLang` context. `LanguageToggle` flips between
  `fr`/`en` via `localStorage`. EN entries are mostly placeholder
  (`[EN] …`). M_I18n owns making them real and switching the
  context-driven model to URL-driven.
- **Prior art (FR canonical):** `nextjs-architecture.md` §1 already
  declares "FR is canonical; EN toggle is cosmetic (aggregated content
  stays in source language)". M_I18n revises this clause: aggregated
  content **may** ship in EN, gated by an explicit translation file +
  parity check.
- **Loader:** `site/lib/candidates.ts::loadCandidate(id)` reads
  `current/aggregated.json`. The function gains an optional `lang`
  parameter and resolves the locale-aware filename with FR fallback.
- **Manual workflow infrastructure:** `prepare-manual-analysis.ts`,
  `prepare-manual-aggregation.ts`, `ingest-raw-output.ts`,
  `ingest-aggregated.ts` already implement the
  "bundle → paste into chat → ingest" pattern. Translation reuses
  this exact pattern under a new pair of scripts.
- **Schema:** `AggregatedOutputSchema` (`scripts/lib/schema.ts:1192`)
  is the canonical structure. Translation files re-validate against
  the **same** schema (no new schema_version). This keeps the
  translation a "view of the same data, different prose".
- **Test fixture:** `candidates/test-omega` is the in-repo fictional
  candidate used by integration tests. M_I18n adds an EN translation
  of its `aggregated.json` and a build-smoke test that renders both
  locales.

## Acceptance Criteria

- [x] Spec document created in `docs/specs/website/i18n.md`
- [x] At least 9 backlog tasks created in `tasks/backlog/M_I18n/`
- [x] Tasks cover: spec promotion, schema/parity validator, translator
      prompt + manual scripts, loader update, locale routing for all
      three page types, language toggle as URL navigator, EN
      completion of UI strings, fixture translation + build smoke,
      docs update.
- [x] Each task has clear acceptance criteria, references the spec
      (not other tasks), and lists a `test_command`.
- [x] No circular dependencies (DAG: 0120 → 0121 → 0122 → {0123, 0127}
      → {0124, 0125} → 0126 → 0128 → 0129).
- [x] ROADMAP.md updated — `M_I18n` promoted from "under
      consideration" to a planned milestone with scope, dependencies,
      and explicit non-goals.
- [x] Editorial principles reviewed (table above) — no principle
      violation; risks have structural mitigations.

## Notes

- **`M_I18n` is reachable independently of M_PublicLaunch.** It can
  ship at any point a candidate has been analyzed — including before
  the public launch — because it is purely additive (FR remains the
  canonical experience).
- **Out of scope (v1):** translating `sources.md`, translating
  `aggregation-notes.md`, translating `metadata.json` (party / display
  name), translating raw model outputs, EN analysis prompts, automatic
  translation in CI, RTL languages, more than 2 locales.
- **Why not Next.js built-in i18n routing?** It is incompatible with
  `output: "export"` (the `i18n` config in `next.config` requires a
  Node runtime for locale negotiation). A manual `[lang]` segment is
  the supported static-export pattern.
- **Why not client-side fetch of translation JSON?** It would defeat
  the build-time loader contract from `nextjs-architecture.md` §2
  (Zod re-validation at build time). It would also hurt
  first-contentful-paint and SEO for the EN site. Static generation
  per locale is the simpler and more honest choice.
