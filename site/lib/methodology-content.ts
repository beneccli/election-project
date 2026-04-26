// See docs/specs/website/methodology-page.md §5 and §6.
//
// Static content for the /methodologie page. All prose lives in
// `UI_STRINGS` (see `site/lib/i18n.ts`); this module wires the
// section structure (counts, ordering, artifact links) and is the
// page's source of truth for "how many principles are there?",
// "in what order?", and "where does this stage point to in the repo?".
//
// The repo URL is centralized here so the methodology page (and any
// future page that needs it) shares one source of truth.

import type { UI_STRINGS } from "./i18n";

export const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL ??
  "https://github.com/beneccli/election-project";

type UiKey = keyof typeof UI_STRINGS;

export interface PipelineStage {
  key:
    | "consolidate"
    | "analyze"
    | "aggregate"
    | "review"
    | "translate"
    | "publish";
  titleKey: UiKey;
  bodyKey: UiKey;
  /** Optional public artifact (file or folder) that exemplifies the stage. */
  artifactHref?: string;
  /** In-repo spec section the reader can deep-dive into. */
  specHref: string;
}

export interface EditorialPrinciple {
  key: "analysis" | "symmetry" | "measurement" | "dissent" | "transparency";
  titleKey: UiKey;
  statementKey: UiKey;
  exampleKey: UiKey;
  /** Anchor in the editorial-principles.md file. */
  specHref: string;
}

const SPEC_BASE = `${REPO_URL}/blob/main/docs/specs`;
const PROMPT_BASE = `${REPO_URL}/blob/main/prompts`;

export const PIPELINE_STAGES: readonly PipelineStage[] = [
  {
    key: "consolidate",
    titleKey: "METHODOLOGY_PIPELINE_STAGE_CONSOLIDATE_TITLE",
    bodyKey: "METHODOLOGY_PIPELINE_STAGE_CONSOLIDATE_BODY",
    artifactHref: `${REPO_URL}/blob/main/candidates`,
    specHref: `${SPEC_BASE}/data-pipeline/source-gathering.md`,
  },
  {
    key: "analyze",
    titleKey: "METHODOLOGY_PIPELINE_STAGE_ANALYZE_TITLE",
    bodyKey: "METHODOLOGY_PIPELINE_STAGE_ANALYZE_BODY",
    artifactHref: `${PROMPT_BASE}/analyze-candidate.md`,
    specHref: `${SPEC_BASE}/analysis/analysis-prompt.md`,
  },
  {
    key: "aggregate",
    titleKey: "METHODOLOGY_PIPELINE_STAGE_AGGREGATE_TITLE",
    bodyKey: "METHODOLOGY_PIPELINE_STAGE_AGGREGATE_BODY",
    artifactHref: `${PROMPT_BASE}/aggregate-analyses.md`,
    specHref: `${SPEC_BASE}/analysis/aggregation.md`,
  },
  {
    key: "review",
    titleKey: "METHODOLOGY_PIPELINE_STAGE_REVIEW_TITLE",
    bodyKey: "METHODOLOGY_PIPELINE_STAGE_REVIEW_BODY",
    artifactHref: `${REPO_URL}/blob/main/scripts/review.ts`,
    specHref: `${SPEC_BASE}/analysis/aggregation.md`,
  },
  {
    key: "translate",
    titleKey: "METHODOLOGY_PIPELINE_STAGE_TRANSLATE_TITLE",
    bodyKey: "METHODOLOGY_PIPELINE_STAGE_TRANSLATE_BODY",
    artifactHref: `${PROMPT_BASE}/translate-aggregated.md`,
    specHref: `${SPEC_BASE}/website/i18n.md`,
  },
  {
    key: "publish",
    titleKey: "METHODOLOGY_PIPELINE_STAGE_PUBLISH_TITLE",
    bodyKey: "METHODOLOGY_PIPELINE_STAGE_PUBLISH_BODY",
    artifactHref: `${REPO_URL}/blob/main/scripts/publish.ts`,
    specHref: `${SPEC_BASE}/data-pipeline/overview.md`,
  },
] as const;

export const EDITORIAL_PRINCIPLES: readonly EditorialPrinciple[] = [
  {
    key: "analysis",
    titleKey: "METHODOLOGY_PRINCIPLE_ANALYSIS_TITLE",
    statementKey: "METHODOLOGY_PRINCIPLE_ANALYSIS_STATEMENT",
    exampleKey: "METHODOLOGY_PRINCIPLE_ANALYSIS_EXAMPLE",
    specHref: `${SPEC_BASE}/analysis/editorial-principles.md`,
  },
  {
    key: "symmetry",
    titleKey: "METHODOLOGY_PRINCIPLE_SYMMETRY_TITLE",
    statementKey: "METHODOLOGY_PRINCIPLE_SYMMETRY_STATEMENT",
    exampleKey: "METHODOLOGY_PRINCIPLE_SYMMETRY_EXAMPLE",
    specHref: `${SPEC_BASE}/analysis/editorial-principles.md`,
  },
  {
    key: "measurement",
    titleKey: "METHODOLOGY_PRINCIPLE_MEASUREMENT_TITLE",
    statementKey: "METHODOLOGY_PRINCIPLE_MEASUREMENT_STATEMENT",
    exampleKey: "METHODOLOGY_PRINCIPLE_MEASUREMENT_EXAMPLE",
    specHref: `${SPEC_BASE}/analysis/editorial-principles.md`,
  },
  {
    key: "dissent",
    titleKey: "METHODOLOGY_PRINCIPLE_DISSENT_TITLE",
    statementKey: "METHODOLOGY_PRINCIPLE_DISSENT_STATEMENT",
    exampleKey: "METHODOLOGY_PRINCIPLE_DISSENT_EXAMPLE",
    specHref: `${SPEC_BASE}/analysis/editorial-principles.md`,
  },
  {
    key: "transparency",
    titleKey: "METHODOLOGY_PRINCIPLE_TRANSPARENCY_TITLE",
    statementKey: "METHODOLOGY_PRINCIPLE_TRANSPARENCY_STATEMENT",
    exampleKey: "METHODOLOGY_PRINCIPLE_TRANSPARENCY_EXAMPLE",
    specHref: `${SPEC_BASE}/analysis/editorial-principles.md`,
  },
] as const;

export const NOT_THIS_BULLETS: readonly UiKey[] = [
  "METHODOLOGY_NOT_THIS_BULLET_VOTING_GUIDE",
  "METHODOLOGY_NOT_THIS_BULLET_ENDORSEMENT",
  "METHODOLOGY_NOT_THIS_BULLET_FACTCHECK",
  "METHODOLOGY_NOT_THIS_BULLET_AGGREGATOR",
  "METHODOLOGY_NOT_THIS_BULLET_NEUTRAL",
  "METHODOLOGY_NOT_THIS_BULLET_FUNDED",
] as const;

export const DIMENSION_LABEL_KEYS: readonly UiKey[] = [
  "DIMENSION_LABEL_ECONOMIC_FISCAL",
  "DIMENSION_LABEL_SOCIAL_DEMOGRAPHIC",
  "DIMENSION_LABEL_ENVIRONMENTAL_LONG_TERM",
  "DIMENSION_LABEL_INSTITUTIONAL_DEMOCRATIC",
  "DIMENSION_LABEL_SECURITY_SOVEREIGNTY",
  "DIMENSION_LABEL_HEALTH",
  "DIMENSION_LABEL_EDUCATION",
] as const;

/** Section anchor IDs — kept in sync with spec §7.1 (anchor list). */
export const METHODOLOGY_SECTION_IDS = [
  "hero",
  "pipeline",
  "principes",
  "positionnement",
  "agregation",
  "dimensions",
  "transparence",
  "ce-que-non",
  "limites",
  "gouvernance",
] as const;

export type MethodologySectionId = (typeof METHODOLOGY_SECTION_IDS)[number];
