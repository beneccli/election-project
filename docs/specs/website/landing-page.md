# Landing Page (`/`)

> **Version:** 1.0
> **Status:** Stable (finalized by M_Landing spike `0110`, 2026-04-22)
> **Milestone:** M_Landing
> **Scope:** The `/` route — stakes framing, candidate grid, entry
> points to the comparison page and methodology.
> **Out of scope:** New analytical output, schema or prompt changes,
> methodology/changelog/legal page content, real English translation of
> aggregated content, server-side analytics.

---

## 1. Problem statement

The landing page is the first surface every visitor meets. It has three
jobs and exactly three jobs:

1. **Frame the stakes.** A handful of France-level facts and two
   context charts establish what any 2027 program is being judged
   against.
2. **List the analyzed candidates.** A grid of uniform cards, ordered
   in a way that never insinuates a ranking, each linking to its full
   analysis.
3. **Hand off to the two other primary surfaces** — the comparison page
   (`/comparer`) and the methodology page (planned, linked with a
   placeholder anchor in v1).

A design prototype (`Landing Page.html`) fixes the visual contract. This
spec defines how that prototype is wired to real data and what
editorial safeguards apply.

---

## 2. Editorial review of the prototype

Audited against [`../analysis/editorial-principles.md`](../analysis/editorial-principles.md):

| Prototype choice | Verdict | Safeguard in v1 |
|---|---|---|
| Hero stats colored red/amber on headline numbers (`.bad`, `.warn`) | ⚠ Adjusted | Headline numbers render in neutral text color; source pills remain. Color is reserved for chart reference lines and chart-internal annotations, not the big stat figure. See §3.2. |
| Hero area charts (public debt 2000–2025; population 65+ 2000–2050) | ✅ Safe | Factual series with source pills. Projection segment visibly dashed; the label "projection" is rendered on-chart. |
| Candidate grid with per-card grade badge | ✅ Safe | Grade is the already-aggregated `TopLevelGrade`; same component as the candidate page and the comparison table. |
| Per-card single-axis mini-bar (`ecoPos`) | ✅ Safe | Ordinal modal on the economic axis, identical derivation to the comparison-page axis dot row. No composite score, no cross-axis arithmetic. |
| Family filter `Gauche / Centre / Droite / Écologie` | ⚠ Kept w/ mapping rule | See §4.3. Spectrum label → filter bucket is a deterministic, public mapping. "Écologie" is an optional party-family override sourced from candidate metadata; candidates with no override fall back to the spectrum mapping. |
| "Coming soon" cards for unanalyzed candidates | ✅ Safe | Grade, axis mini-bar, summary, grade-derived sub-modifier hidden. Card renders party, name, declared date, and the literal "Analyse à venir" pill. |
| Prototype's fake `CANDIDATES` array | ❌ Discard | Landing reads real data only via `listLandingCards()`. |
| `onclick="location.href='Comparison Page.html'"` + `onclick="location.href='Candidate Page.html'"` | ❌ Discard | Replaced with `next/link`. |
| `postMessage` edit-mode hooks + `#tweaks-panel` | ❌ Discard | Prototype-only scaffolding. |

**Non-negotiables carried over:**

1. No ranking of candidates. Order is `updatedAt` desc, with
   `displayName` asc as tie-breaker. No "featured" slot.
2. No cardinal averaging on any card field.
3. Symmetric cards: every candidate of the same status (analyzed /
   coming-soon) gets the exact same tile. No party-specific treatment.
4. Context charts cite their sources inline.
5. Copy uses measurement, not indictment. "Dette publique / PIB 112 %"
   is a fact. "Dette catastrophique" would be advocacy — banned.

---

## 3. Data model

### 3.1 Landing card view-model

Built at build time in `site/lib/landing-cards.ts`. No schema changes.

```ts
// site/lib/landing-cards.ts
export type LandingCardStatus = "analyzed" | "pending";

export interface LandingCardAnalyzed {
  id: string;
  status: "analyzed";
  displayName: string;
  party: string;
  partyShort: string;
  partyColor: string;            // metadata.party_color ?? FAMILY_DEFAULT_COLOR[family]
  family: LandingFamily;         // see §4.3
  spectrumLabel: string | null;  // localized via i18n at render time (fr canonical)
  spectrumStatus: SpectrumStatus;
  overallGrade: TopGradeLetter;
  overallGradeModifier: GradeModifier;
  /** Economic-axis modal in [-5, +5] or null. */
  ecoAxis: number | null;
  /** Version folder date (YYYY-MM-DD). */
  versionDate: string;
  /** Root metadata `updated`. Used ONLY for ordering. */
  updatedAt: string;
  /** Number of successful per-model analyses underpinning the aggregate. */
  modelsCount: number;
  isFictional: boolean;
}

export interface LandingCardPending {
  id: string;
  status: "pending";
  displayName: string;
  party: string;
  partyShort: string;
  partyColor: string;
  family: LandingFamily;
  declaredDate: string | null;   // metadata.declared_candidate_date ?? null
  updatedAt: string;             // root metadata.updated (used for ordering only)
  isFictional: boolean;
}

export type LandingCard = LandingCardAnalyzed | LandingCardPending;
```

Derivation (pure, unit-tested):

- **Analyzed rows** reuse `deriveComparisonProjection(bundle)` and
  flatten the result. `ecoAxis = projection.positioning[AXIS_INDEX.economic]`.
- **Pending rows** come from a new loader variant `listCandidatesWithPending()`
  which *does not skip* candidates lacking `aggregated.json`; the
  pending branch does NOT read `aggregated.json` and so is safe when
  only `metadata.json` exists.
- **`modelsCount`** = count of `versionMeta.analysis.models` entries
  whose `status === "success"`. Displayed on the card footer as
  `"{N} modèles · {date}"`.
- **`partyColor` / `partyShort`** — `metadata.party_color` and
  `metadata.party_short` are not yet required by the schema. In v1 both
  default to family-bucket fallbacks (§4.3) so no schema change is
  forced. A follow-up under `M_CandidateOnboarding` may promote them to
  required.

### 3.2 France-level context data

```ts
// site/lib/landing-context.ts
export interface ContextStat {
  key: "debt" | "deficit" | "carbonNeutrality";
  headline: string;        // e.g. "112%"
  label: I18nString;       // "Dette publique / PIB"
  sourceNote: I18nString;  // "2025 · Eurostat"
}

export interface ContextSeries {
  key: "debt" | "demographics";
  points: Array<[year: number, value: number]>;
  source: { label: I18nString; url: string };
  /** For `demographics`: first projected year (dashed from here on). */
  projectionFrom?: number;
  refLine?: { y: number; label: I18nString };  // e.g. Maastricht 60 %
}
```

Values are baked in; each series ships with a `source.url` that the
chart component renders as a clickable pill under the chart title.

Editorial: the three headline stats in the hero (`debt`, `deficit`,
`carbonNeutrality`) render in the **default text color** — never red or
amber. Color on context charts is confined to:
- the reference line (dashed rule on debt chart = Maastricht 60 %)
- the filled area under the curve (muted accent gradient)
- the projection separator label

Rationale: a neutral factual presentation sidesteps the advocacy risk
without sacrificing legibility, and the charts still carry the visual
weight the prototype intends.

---

## 4. Routing, ordering, filtering

### 4.1 Route

`/` — static (static export, no client fetches, no ISR).

### 4.2 Ordering

Same rule as the existing landing CTA in `site/app/page.tsx`:

1. `updatedAt` descending
2. `displayName` ascending (tie-breaker)

Analyzed and pending cards are **interleaved** by this rule — we do
not put all analyzed first. A pending card declared yesterday ranks
ahead of an analyzed card last updated a month ago.

Rationale: "analyzed first" would push attention toward whomever we
chose to analyze first, which is a different kind of ranking.

### 4.3 Family filter

The prototype filter has four buckets: `gauche`, `centre`, `droite`,
`ecologie`. Mapping rule:

| Family bucket | Sourced from | Rule |
|---|---|---|
| `gauche` | spectrum label | `extreme_gauche`, `gauche`, `centre_gauche` |
| `centre` | spectrum label | `centre` |
| `droite` | spectrum label | `centre_droit`, `droite`, `extreme_droite` |
| `ecologie` | **optional** `metadata.family_override === "ecologie"` | Overrides the spectrum-derived bucket. When absent, the candidate falls into the spectrum bucket. |
| `(all)` | — | No filter. Default. |

A candidate with spectrum status `split` or `inclassable` falls into
the bucket closest to the modal integer on the global spectrum axis
when one exists; otherwise they appear only under "Tous".

`metadata.family_override` is an **additive, optional** field added to
`CandidateMetadataSchema` with an enum `["ecologie"]` in v1 — the only
value needed to distinguish an ecology-platform candidate whose
spectrum label is (e.g.) `centre_gauche`. Leaving it open-ended as a
string enum enables later expansion without breaking the schema.

**Editorial check:** this is a taxonomy of party families, not a
ranking. The mapping is public, deterministic, and identical for every
candidate. No candidate-specific logic.

### 4.4 Filter state

Client-side only. No URL sync, no localStorage persistence. Landing
filters are ephemeral navigation aids; the canonical candidate URL is
always `/candidat/<id>`.

---

## 5. Component inventory

All file paths under `site/components/landing/` unless noted.

### 5.1 `<LandingPage>` (server)

File: `site/app/page.tsx` (replaces current placeholder).

- Builds `LandingCard[]` via `listLandingCards()` at build time.
- Builds compare-CTA href via the existing helper (kept, moved to
  `site/lib/compare-cta.ts` for reuse).
- Renders `<LandingNavBar>`, `<LandingHero>`,
  `<CandidateGrid>` (which owns the filter pills), `<CompareCta>`,
  `<MethodologyBlock>`, `<LandingFooter>`.

### 5.2 `<LandingNavBar>` (server)

File: `site/components/chrome/LandingNavBar.tsx`.

Same visual shell as `NavBar.tsx`, but the middle slot shows the
project tagline instead of a candidate name, and there is no
"Transparence" link (no candidate in context). Pattern copied from
`ComparisonNavBar.tsx`.

### 5.3 `<LandingHero>` (server + one client island for the charts)

- Title, body, stats panel (3 neutral-text items with source pills).
- Two-panel chart row rendered by the client island `<StakesCharts>`
  (SVG with CSS transitions for the theme swap — needs `useEffect` on
  the `data-theme` attribute to re-pick OKLCH colors).
- Divider row with analyzed-count label: `"{N} candidats analysés · {M} à venir"`.

### 5.4 `<StakesAreaChart>` (client)

File: `site/components/landing/StakesAreaChart.tsx`.

Generic SVG area chart. Inputs: `data`, `yMin`, `yMax`, optional
`refLine`, optional `projectionFrom`, `colorToken` (CSS variable name).
Pure function of props. No D3. Port of the prototype's
`makeAreaChart()` helper with three changes:

1. Reads CSS custom properties (`--rule`, `--text-tertiary`, …) via
   `getComputedStyle` on mount and on `data-theme` change.
2. Renders the source pill below the chart
   (`<a href={source.url}>…</a>`).
3. No inline template strings — built with React elements for a11y
   hooks (`<title>` elements on `<svg>` and reference lines).

### 5.5 `<CandidateGrid>` (client)

File: `site/components/landing/CandidateGrid.tsx`.

- Owns the filter-pill state.
- Renders filter pills + grid. Grid uses CSS grid, four columns at
  `≥1024px`, responsive down to one.
- IntersectionObserver-driven fade-in (same pattern as prototype, but
  `prefers-reduced-motion` short-circuits the animation).

### 5.6 `<CandidateCard>` (client)

File: `site/components/landing/CandidateCard.tsx`.

Two internal variants, both rendered by the same component with
discriminated-union props:

- **Analyzed:**
  - Party stripe (3 px, `partyColor`).
  - Party pill (same visual grammar as the candidate-page Hero).
  - `<GradeBadge size="md">`.
  - Axis mini-bar: `var(--bg-subtle)` track with centre rule at 50 %,
    one `partyColor` dot at `((ecoAxis + 5) / 10) * 100 %`. When
    `ecoAxis === null`, no dot is rendered and the row shows a small
    "—".
  - Spectrum label pill (reused from the Hero).
  - Footer: `"{date}"` + CTA "Voir l'analyse →".
- **Pending:**
  - Party stripe + party pill as above (so the card shape matches).
  - No grade badge, no axis bar.
  - Footer: `"{declaredDate ?? '—'}"` + pill "Analyse à venir" in
    muted chrome.
- Both variants have `aria-label` with candidate name + status so
  screen readers do not rely on visual color.

### 5.7 `<CompareCta>` (server)

- Reuses the existing compare-CTA helper. Two-up preselection is the
  same logic already shipped on the placeholder landing.
- Copy from the prototype. The "Bientôt" pill from the prototype is
  **dropped** — comparison is live.

### 5.8 `<MethodologyBlock>` (server)

- Two-paragraph FR/EN copy with 5 method pills.
- "Méthode" anchor is `#methode` on the landing page AND links to the
  future `/methodologie` page via a small "En savoir plus →" link.
  Until that page exists, the link points to `/methodologie` and the
  404 case is acceptable v1 behavior (noted in ROADMAP).

### 5.9 `<LandingFooter>` (server)

- Footer note + three links: Méthode (anchor), Dépôt (repo URL from
  a `NEXT_PUBLIC_REPO_URL` env with a compile-time default),
  Mentions légales (`/mentions-legales`, placeholder target same as
  `/methodologie`).

---

## 6. i18n

Landing-specific strings join the existing `UI_STRINGS` object in
`site/lib/i18n.ts`. Keys are prefixed `LANDING_` to keep diffs tidy.
Aggregated content (grade letter, candidate name, party) never goes
through i18n — already the project-wide rule.

The FR/EN toggle already exists (`LanguageToggle`). EN entries are
cosmetic placeholders; real translation is owned by a future `M_I18n`.

---

## 7. Integration with existing site

- **Shared chrome:** `LanguageToggle`, `ThemeToggle`, OKLCH tokens,
  `LangProvider`, `useLang()`. No new tokens.
- **Shared primitives:** `GradeBadge`, the spectrum pill markup
  (factored out of `Hero.tsx` in task `0116` into
  `site/components/widgets/SpectrumPill.tsx`).
- **Landing → comparison:** the compare CTA preselects the two most
  recently updated **analyzable** candidates (helper kept; moved from
  `app/page.tsx` to `lib/compare-cta.ts`).
- **Landing → candidate page:** analyzed card → `/candidat/<id>`.
  Pending card has no link target and is rendered with
  `aria-disabled="true"` and no tabindex.
- **Build-time data load:** landing card list is produced during the
  static export pass, same as comparison projections. Broken bundles
  surface as `status: "pending"` (safe-fallback) rather than crashing
  the build.

---

## 8. Test strategy

- **Unit:** `site/lib/landing-cards.test.ts`
  - `analyzed` row built from the `test-omega` bundle has the expected
    `ecoAxis`, `spectrumStatus`, `overallGrade`.
  - `pending` row built from a candidate folder with only
    `metadata.json` has no aggregated-dependent fields.
  - Family-bucket mapping: every one of the seven spectrum statuses
    lands in exactly one bucket, plus the `ecologie` override.
  - Ordering is `updatedAt` desc, `displayName` asc.
- **Component:** `CandidateCard.test.tsx`
  - Analyzed variant renders grade, spectrum pill, axis dot (or "—").
  - Pending variant has no grade, is `aria-disabled`, and its link
    target is absent.
  - Family filter hides non-matching cards and keeps the count label
    in sync.
- **Chart:** `StakesAreaChart.test.tsx`
  - Renders the expected number of points on the path.
  - Projection separator is rendered iff `projectionFrom` is set.
  - Reference line renders a `<title>` with the FR label.
- **Editorial regression:** `landing-editorial.test.tsx`
  - The rendered landing DOM contains NONE of:
    `["classement", "gagnant", "meilleur", "winner", "catastrophique", "crise", "désastre", "disaster"]`.
  - Headline stat numbers have no `bad` / `warn` / `red` / `amber`
    class or inline color style.
- **Build smoke:** `pnpm --filter site build` succeeds with only
  `test-omega` as an analyzable candidate (1-analyzed + 0-pending
  scenario).

---

## 9. Success metrics

- Visual: prototype `Landing Page.html` and implemented `/` are
  indistinguishable at 1280×900 with the `test-omega` analyzed and
  one synthetic pending candidate.
- Build: full landing is produced by the static export; no
  client-side fetches to the filesystem.
- Performance: landing HTML ≤ 150 KB gzipped; charts render
  synchronously (no lazy-loaded chart library).
- Editorial: regression test passes; no cardinal averaging introduced.

---

## 10. Open questions (resolved)

- **Q:** How do we render a candidate whose spectrum is `split` or
  `inclassable` in the family filter?
  **A:** Appears in "Tous" only, unless `metadata.family_override`
  pins them. A dedicated "Autres" bucket is deferred — splitting
  across more buckets risks appearing judgmental.
- **Q:** Should pending cards be clickable?
  **A:** No. `aria-disabled`, no `href`, muted chrome, explicit
  "Analyse à venir" copy. Editorial: clicking a pending card would
  imply we have partial analysis we are withholding; we do not.
- **Q:** Where do the France-level numbers live and who updates them?
  **A:** `site/lib/landing-context.ts` as a single typed constant.
  Updating them is a documented manual step in the `README.md` of
  that module (noted in task `0111`) — never auto-fetched.

---

## 11. Related Specs

- [`structure.md`](structure.md) — overall page inventory; this spec
  realizes §"Landing page".
- [`nextjs-architecture.md`](nextjs-architecture.md) — build-time loader,
  derivation rules, chrome primitives.
- [`comparison-page.md`](comparison-page.md) — adjacent surface; shares
  the `ComparisonProjection` view-model source.
- [`visual-components.md`](visual-components.md) — `GradeBadge`,
  spectrum pill markup.
- [`../analysis/editorial-principles.md`](../analysis/editorial-principles.md)
  — non-negotiable editorial stance applied to §2.
