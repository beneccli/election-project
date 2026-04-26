# Methodology Page (`/methodologie`)

> **Version:** 1.0
> **Status:** Draft (finalized by spike `0140`, 2026-04-26)
> **Milestone:** M_Methodology
> **Scope:** The `/methodologie` route — long-form public-facing
> explanation of how the project produces an analysis, the editorial
> guardrails that constrain it, and the project's nature as an
> unfunded experiment.
> **Out of scope:** Election-period legal copy (→ `M_Legal`),
> mentions légales / about page, full accessibility audit (→
> `M_Accessibility`), changelog page, contact form / analytics widget,
> any change to prompts, schemas, aggregation, or candidate data.

---

## 1. Problem statement

Three places on the site send readers to `/methodologie`:

- The landing page's `MethodologyBlock` "En savoir plus →" link
  ([`site/components/landing/MethodologyBlock.tsx`](../../../site/components/landing/MethodologyBlock.tsx)).
- Every candidate page's transparency footer "Méthodologie complète →"
  link ([`site/components/chrome/TransparencyFooter.tsx`](../../../site/components/chrome/TransparencyFooter.tsx)).
- The success criteria for launch in
  [`docs/ROADMAP.md`](../../ROADMAP.md) ("Methodology page explains
  every design decision").

Today that route 404s. A reader who clicks it is told the project
exists but cannot inspect how it works — which is the worst possible
state for a project whose entire value proposition is *check us, don't
trust us*. This milestone closes that gap.

The page must serve a sceptical first-time reader. It is **not** a
documentation index for contributors (that lives in `docs/`). It is the
public-facing answer to: *who made this, why, on what grounds can I
trust it, and where do I verify a specific claim?*

## 2. Editorial contract for methodology copy

Audited against
[`../analysis/editorial-principles.md`](../analysis/editorial-principles.md).
The methodology page is the surface most exposed to advocacy drift —
it is a single-author voice describing process, written without the
discipline of a structured prompt. The following constraints are
binding on every paragraph:

| Rule | What it forbids | What it allows |
|---|---|---|
| Candidate-agnostic | Naming any 2027 candidate, party, or person being analyzed by the site, in copy or examples. | Generic placeholders ("a candidate", "candidat A"), and historical anchor figures already named in `political-positioning.md` (Hollande 2012, Mélenchon 2022 — used as ordinal anchors, not as objects of judgment). |
| No moral verbs | "sacrifice", "betray", "save", "rescue", "crush", "catastrophe", "désastre", "scandale", or their EN equivalents. | "shifts", "redistributes", "reduces", "increases", "trades off". The same forbidden-vocabulary list as `comparison-editorial.test.tsx` plus the additions catalogued by `landing-editorial.test.tsx`. The methodology smoke test reuses that list. |
| Measurement language | Adjectives doing analytical work ("a massive transfer"). | Quantities or "not quantifiable from sources". Where the methodology page makes meta-claims about the pipeline ("≥ 4 frontier models per candidate"), it links to the artifact (a sample `metadata.json`) or to the spec. |
| Symmetry | "We are tougher on X than Y", "this approach catches Z's contradictions", anything implying differential treatment. | Statements about the uniform process. |
| No self-promotion | "This is the only honest analysis of the 2027 election." Superlatives. Comparisons to other media outlets. | "An experiment in objective-driven AI analysis." Plain disclosure. |
| No partisan framing | Stating that "media bias" or "partisan distortion" motivated the project. | "An experiment in whether multi-model AI can produce candidate-agnostic analysis." The motivation is method-curiosity, not media critique. |

The smoke test in task `0145` enforces the first three rules
mechanically against the rendered HTML for both locales.

### What this page deliberately does **not** claim

- It does not claim the project is unbiased.
- It does not claim AI models are unbiased.
- It does not claim that quantification eliminates judgment.
- It does not claim that aggregating models produces "the truth".

The page states what it does, what its limitations are, and lets the
reader form a verdict on whether the methodology earns their trust.

## 3. Page sections (top to bottom)

A single scrollable page with a sticky table of contents on
viewport ≥ 1024px (à la candidate page side rail). Sections in order:

### 3.1 Hero — *Pourquoi ce site existe*

One paragraph. Establishes the project as an **experiment in
objective-driven AI analysis**, distinct from partisan commentary,
applied to the 2027 French presidential election. States plainly:

- Single maintainer, unfunded, side project.
- The experiment: can a multi-model pipeline with strict editorial
  guardrails produce something more useful than a single AI's hot
  take, while remaining candidate-agnostic?
- Reader is invited to verify, not to trust.

No statistic boxes here (those belong on the landing). One paragraph
plus a one-line tagline.

### 3.2 *Comment une analyse est produite* — the pipeline

Visual flow diagram + accompanying narrative. Five steps, each a
named stage from
[`docs/specs/data-pipeline/overview.md`](../data-pipeline/overview.md):

```
[ sources-raw/ ]  →  [ consolidate ]  →  [ sources.md (human-reviewed) ]
                                                  ↓
                                          [ analyze × N models ]
                                                  ↓
                                          [ raw-outputs/*.json ]
                                                  ↓
                                          [ aggregate (meta-LLM) ]
                                                  ↓
                                  [ aggregated.json + agreement_map ]
                                                  ↓
                                       [ human review (CLI gate) ]
                                                  ↓
                                  [ optional: translate (en) ]
                                                  ↓
                                       [ publish (current symlink) ]
```

For each stage, two columns:
- **What happens** (1–2 sentences, mechanism-only)
- **Where to verify** (link to a real artifact in the repo, e.g. a
  `versions/<date>/sources.md`, a `raw-outputs/` JSON, the prompt file)

Component: `<PipelineDiagram>` — a server-rendered SVG (no client JS),
nodes positioned via static layout. No animation. Mobile fallback:
vertical stack of step cards.

The diagram is **derived from the spec, not duplicated**: each stage
links to the corresponding section of `data-pipeline/overview.md` so a
reader following the trail ends up in the spec, not in
methodology-page prose.

### 3.3 *Les cinq garde-fous éditoriaux*

Five blocks, one per editorial principle, in the order they appear in
[`editorial-principles.md`](../analysis/editorial-principles.md):

1. Analyse, pas plaidoyer
2. Examen symétrique
3. Mesure, pas réquisitoire
4. Désaccord préservé
5. Transparence radicale

Each block:
- Title (the principle name)
- One-sentence statement (verbatim summary from the spec)
- One concrete example of *what this prevents in the output*
- A link to the spec section

Implementation: a static array `EDITORIAL_PRINCIPLES` in
`site/lib/methodology-content.ts`, rendered by
`<EditorialPrinciplesSection>`. The array is the page's source of
truth for principle copy; the spec remains the binding contract.

### 3.4 *Positionnement politique : ordinal, pas cardinal*

Short section explaining one of the project's most counter-intuitive
choices: positioning scores are **never arithmetic-mean averaged**
across models. Rationale, link to
[`../analysis/political-positioning.md`](../analysis/political-positioning.md),
and the four anchor figures used per axis.

This section exists because the design choice surprises readers more
than any other. Failing to explain it makes every radar chart on the
site look amateurish; explaining it makes them look principled.

### 3.5 *Comment les modèles sont agrégés*

Short section on aggregation:

- Meta-LLM aggregation, single designated aggregator.
- `agreement_map` — every aggregated claim records which models
  supported it and which dissented.
- No averaging on positioning.
- Hard human-review gate before publish.

Links to [`../analysis/aggregation.md`](../analysis/aggregation.md).

### 3.6 *Dimensions analysées*

A simple list of the seven analytical dimensions (from
[`../analysis/dimensions.md`](../analysis/dimensions.md)) with
one-line glosses. Localized via existing
`UI_STRINGS.DIMENSION_LABEL_*`. No content beyond the list — the
dimension spec is the binding source.

### 3.7 *Transparence : où vérifier*

A short anchored list (each item is a link):

- Repository on GitHub (uses `process.env.NEXT_PUBLIC_REPO_URL` like
  the existing footer).
- Per-version artifacts: `sources.md`, `raw-outputs/`, `aggregated.json`,
  `aggregation-notes.md`, `metadata.json` (with prompt SHA256 hashes).
- The prompt files: `prompts/analyze-candidate.md`,
  `prompts/aggregate-analyses.md`, `prompts/translate-aggregated.md`.
- The editorial-principles spec.
- This very page's source.

Each link uses `localePath()` for in-site URLs and is rendered as a
plain anchor (no styling beyond existing `text-accent` hover).

### 3.8 *Ce que ce site n'est pas*

Bullet list, six items, mirroring the "What this project is not"
section of [`editorial-principles.md`](../analysis/editorial-principles.md):

- Pas un guide de vote.
- Pas une plate-forme de soutien.
- Pas un site de fact-checking sur déclarations en débat.
- Pas un agrégateur de préférences politiques.
- Pas une plate-forme "neutre" qui refuse les constats.
- Pas un service financé par un parti, un média, ou un sponsor.

The last bullet is added beyond the spec, as the
funding/governance disclosure required by §3.10.

### 3.9 *Limites connues*

Three short paragraphs:

1. **Limites des modèles.** Frontier models share training data,
   pretraining biases, and English-corpus skew. Aggregating them
   reduces single-model variance; it does not eliminate correlated
   error.
2. **Limites des sources.** The pipeline reads what each candidate
   has published. An eloquent program with weak math grades
   differently from a sparse program; this is faithfully reflected
   and must not be confused with an evaluation of the candidate
   themselves.
3. **Limite humaine.** A single maintainer reviews every
   `sources.md` and every `aggregated.json`. The project's
   throughput is bounded by that. Bus-factor risk acknowledged.

### 3.10 *Gouvernance et financement*

Plain disclosure. Five lines:

- Maintainer: a single person.
- Financement : aucun. Pas de sponsor, pas de don, pas de
  subvention, pas de partenariat média.
- Affiliation politique : aucune déclarée. Le code et les prompts
  sont vérifiables.
- Coût marginal : appels API LLM payés par le maintainer (souvent
  exécutés via les modes manuel ou Copilot pour éviter les coûts —
  voir [`../data-pipeline/analysis-modes.md`](../data-pipeline/analysis-modes.md)).
- Code source ouvert ; toute personne peut reproduire la
  méthodologie sur d'autres scrutins.

### 3.11 Footer

Reuses the standard site `<TransparencyFooter>` (or a thinner variant
without the per-candidate fields). Pinned model versions and prompt
hashes are NOT shown here (they belong on candidate pages); the
methodology page links to them generically.

## 4. Routing

Two route shells, mirroring the existing FR-canonical / EN-prefixed
pattern used by `/comparer`:

| Route | File | Lang |
|---|---|---|
| `/methodologie` | `site/app/methodologie/page.tsx` | `fr` |
| `/en/methodologie` | `site/app/[lang]/methodologie/page.tsx` | `en` |

Both shells delegate to a shared server component
`site/components/pages/MethodologyPageBody.tsx` that takes
`{ lang: Lang }` and renders all sections. Pattern is identical to
`ComparerPageBody`.

The page is fully static (server components only, no client islands).
No data dependencies on `candidates/` — the page is the same regardless
of which candidates are present.

### 4.1 Existing dead links

| Source | Current href | Action in task `0144` |
|---|---|---|
| `MethodologyBlock.tsx:42` | `href="/methodologie"` | Wrap in `localePath("/methodologie", lang)`. |
| `TransparencyFooter.tsx:183` | `href="/methodologie"` | Same. |
| `Candidate page transparency drawer` (per `i18n.md`) | `/methodologie` | Same. |

The FR href is correct as-is for FR pages, but breaks on EN pages
(currently sends `/en/...` users to a missing `/methodologie` instead
of `/en/methodologie`). The fix is ambient; this milestone only adds
the missing routes and corrects the hrefs.

## 5. Data model

No persistent data model. Two static modules:

```ts
// site/lib/methodology-content.ts
export interface PipelineStage {
  key: "consolidate" | "analyze" | "aggregate" | "review" | "translate" | "publish";
  titleKey: I18nKey;
  bodyKey: I18nKey;
  artifactLabelKey: I18nKey;
  artifactHref: string;          // e.g. "https://github.com/.../prompts/analyze-candidate.md"
  specHref: string;              // in-repo spec link rendered as external github link
}

export interface EditorialPrinciple {
  key: "analysis" | "symmetry" | "measurement" | "dissent" | "transparency";
  titleKey: I18nKey;
  statementKey: I18nKey;
  exampleKey: I18nKey;
  specHref: string;              // anchor in editorial-principles.md
}

export const PIPELINE_STAGES: readonly PipelineStage[];
export const EDITORIAL_PRINCIPLES: readonly EditorialPrinciple[];
export const NOT_THIS_BULLETS: readonly I18nKey[];
```

```ts
// site/lib/methodology-i18n.ts (or extend site/lib/i18n.ts)
// New UI_STRINGS keys: METHODOLOGY_HERO_TITLE, METHODOLOGY_HERO_BODY,
// METHODOLOGY_PIPELINE_TITLE, METHODOLOGY_PIPELINE_STAGE_*_TITLE,
// METHODOLOGY_PIPELINE_STAGE_*_BODY, METHODOLOGY_PRINCIPLES_TITLE,
// METHODOLOGY_PRINCIPLE_*_TITLE/STATEMENT/EXAMPLE,
// METHODOLOGY_POSITIONING_TITLE/BODY,
// METHODOLOGY_AGGREGATION_TITLE/BODY,
// METHODOLOGY_DIMENSIONS_TITLE/INTRO,
// METHODOLOGY_TRANSPARENCY_TITLE,
// METHODOLOGY_NOT_THIS_TITLE, METHODOLOGY_NOT_THIS_*,
// METHODOLOGY_LIMITS_TITLE/MODELS/SOURCES/HUMAN,
// METHODOLOGY_GOVERNANCE_TITLE/MAINTAINER/FUNDING/AFFILIATION/COST/SOURCE,
// METHODOLOGY_TOC_TITLE,
// METHODOLOGY_LEARN_MORE_LINK_TEXT (re-export of LANDING_METHOD_LEARN_MORE
// label for the breadcrumb), META_METHODOLOGIE_TITLE,
// META_METHODOLOGIE_DESCRIPTION.
```

## 6. Components

| Component | Type | Responsibility |
|---|---|---|
| `<MethodologyPageBody>` | Server | Top-level page assembly; renders TOC + all sections. |
| `<MethodologyHero>` | Server | §3.1 hero block. |
| `<PipelineDiagram>` | Server (SVG) | §3.2 visual flow + per-stage cards. No client JS. |
| `<EditorialPrinciplesSection>` | Server | §3.3 five blocks, mapped from `EDITORIAL_PRINCIPLES`. |
| `<PositioningSection>` | Server | §3.4 ordinal-vs-cardinal explainer. |
| `<AggregationSection>` | Server | §3.5 dissent preservation explainer. |
| `<DimensionsSection>` | Server | §3.6 dimension list reusing `UI_STRINGS.DIMENSION_LABEL_*`. |
| `<TransparencyLinksSection>` | Server | §3.7 verification links. |
| `<NotThisSection>` | Server | §3.8 "this is not …" bullets. |
| `<LimitationsSection>` | Server | §3.9 known limits. |
| `<GovernanceSection>` | Server | §3.10 governance / no-funding disclosure. |
| `<MethodologyTOC>` | Server | Sticky on lg+, hidden on mobile. Anchors to `id`'d section headings. |

All components are server components. No client islands. No charts
beyond the SVG diagram.

## 7. Test strategy

### 7.1 Unit / smoke

- `site/components/pages/__tests__/MethodologyPageBody.test.tsx` —
  renders FR and EN, asserts every required section anchor ID
  (`#hero`, `#pipeline`, `#principes`, `#positionnement`,
  `#agregation`, `#dimensions`, `#transparence`, `#ce-que-non`,
  `#limites`, `#gouvernance`) is present in both locales.
- `site/lib/__tests__/methodology-content.test.ts` — `EDITORIAL_PRINCIPLES`
  has exactly five entries in the same order as the spec; every entry
  has all four keys; every `specHref` resolves to the
  `editorial-principles.md` file path.

### 7.2 Editorial regression

- `site/app/methodologie/methodology-editorial.test.tsx` — pattern
  copied from `comparer/comparison-editorial.test.tsx`. Builds the
  exported HTML for `/methodologie/index.html` and
  `/en/methodologie/index.html`, asserts:
  1. No forbidden vocabulary (reuse the existing forbidden lists
     from `comparison-editorial.test.tsx` and
     `landing-editorial.test.tsx`).
  2. No 2027 candidate name in the rendered text (asserts none of
     the live `candidates/*/metadata.json` `display_name`s appear in
     the rendered HTML, except inside attribute values that carry
     dimension labels — none are expected).
  3. Anchor IDs match the spec list above.
  4. The FR and EN exports contain the same set of anchor IDs (parity).

### 7.3 i18n parity

- Reuse the existing translatable-string parity validator pattern.
  All new `METHODOLOGY_*` keys must have both `fr` and `en`.

### 7.4 Build smoke

The existing `site` build pipeline (`pnpm --filter site build`)
exports both routes to `out/methodologie/index.html` and
`out/en/methodologie/index.html`. Task `0145` adds an assertion that
both files exist after build.

## 8. Integration plan

1. Land i18n strings (task `0141`).
2. Land static content modules (`methodology-content.ts`) — task
   `0143` covers components which import this module; the module
   itself can ship in `0143` since there is no consumer before then.
3. Build sections + page body (`0143`).
4. Wire route shells (`0142`).
5. Patch landing/footer hrefs through `localePath` (`0144`).
6. Editorial smoke + parity tests (`0145`).

Tasks `0142` and `0143` can be parallelized after `0141` lands.

## 9. Success metrics

- A first-time reader who reads the page can answer:
  1. *Who made this and how is it funded?* — Yes (§3.10).
  2. *How is an analysis produced, end to end?* — Yes (§3.2).
  3. *Why aren't positioning scores averaged?* — Yes (§3.4).
  4. *Where do I find the raw output of model X for candidate Y?* —
     Yes (§3.7 → repo → `candidates/<id>/current/raw-outputs/`).
- Editorial smoke test passes on both locales.
- Page has zero client JS (verified by Next build output: no
  `chunks/app/methodologie-*.js` runtime entry beyond the layout).
- LCP on a slow-3G profile remains under the existing site budget
  (no measurement gating in v1, but no large images and no client JS
  — should be trivially within budget).

## 10. Open questions

None blocking. Possible follow-ups for future milestones:

- (`M_Methodology+`) A short "How to reproduce on another
  election" guide. Out of scope for v1 — adds a tutorial surface that
  needs separate testing.
- (`M_Legal`) Statutory disclosures during the official
  campaign-financing period. Will likely add a banner near §3.10 but
  is owned by `M_Legal`.

## 11. Related specs

- [`../analysis/editorial-principles.md`](../analysis/editorial-principles.md)
- [`../analysis/dimensions.md`](../analysis/dimensions.md)
- [`../analysis/political-positioning.md`](../analysis/political-positioning.md)
- [`../analysis/aggregation.md`](../analysis/aggregation.md)
- [`../data-pipeline/overview.md`](../data-pipeline/overview.md)
- [`../data-pipeline/analysis-modes.md`](../data-pipeline/analysis-modes.md)
- [`./structure.md`](./structure.md)
- [`./landing-page.md`](./landing-page.md)
- [`./transparency.md`](./transparency.md)
- [`./i18n.md`](./i18n.md)
