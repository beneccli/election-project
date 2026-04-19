/**
 * Zod schemas for all pipeline JSON artifacts.
 *
 * See docs/specs/candidates/repository-structure.md
 * See docs/specs/data-pipeline/source-gathering.md
 * See docs/specs/analysis/output-schema.md
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared patterns
// ---------------------------------------------------------------------------

/** Kebab-case candidate ID: lowercase ASCII, hyphens allowed */
const candidateIdPattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** SHA256 hex string (64 lowercase hex chars) */
const sha256Pattern = /^[a-f0-9]{64}$/;

/** ISO date string YYYY-MM-DD */
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** ISO-8601 datetime */
const isoDatetime = z.string().datetime({ offset: true }).or(
  z.string().datetime()
);

// ---------------------------------------------------------------------------
// CandidateMetadataSchema — candidates/<id>/metadata.json
// See docs/specs/candidates/repository-structure.md
// ---------------------------------------------------------------------------

export const CandidateMetadataSchema = z.object({
  id: z.string().regex(candidateIdPattern),
  display_name: z.string().min(1),
  party: z.string().min(1),
  party_id: z.string().min(1),
  photo_url: z.string().url().optional(),
  photo_credit: z.string().optional(),
  declared_candidate_date: isoDateString.optional(),
  official_website: z.string().url().optional(),
  created: isoDateString,
  updated: isoDateString,
});

export type CandidateMetadata = z.infer<typeof CandidateMetadataSchema>;

// ---------------------------------------------------------------------------
// SourceMetaSchema — sources-raw/*.meta.json
// See docs/specs/data-pipeline/source-gathering.md
// ---------------------------------------------------------------------------

export const SourceMetaSchema = z.object({
  origin_url: z.string().url(),
  accessed_at: isoDatetime,
  sha256: z.string().regex(sha256Pattern),
  notes: z.string().optional(),
  license: z.string().optional(),
});

export type SourceMeta = z.infer<typeof SourceMetaSchema>;

// ---------------------------------------------------------------------------
// VersionMetadataSchema — versions/<date>/metadata.json
// See docs/specs/candidates/repository-structure.md
// ---------------------------------------------------------------------------

const ModelRunEntrySchema = z.object({
  provider: z.string().min(1),
  exact_version: z.string().min(1),
  temperature: z.number().min(0).max(2),
  run_at: isoDatetime,
  tokens_in: z.number().int().nonnegative(),
  tokens_out: z.number().int().nonnegative(),
  cost_estimate_usd: z.number().nonnegative(),
  duration_ms: z.number().int().nonnegative().optional(),
  status: z.enum(["success", "failed"]),
});

export type ModelRunEntry = z.infer<typeof ModelRunEntrySchema>;

export const VersionMetadataSchema = z.object({
  candidate_id: z.string().regex(candidateIdPattern),
  version_date: isoDateString,
  schema_version: z.string().min(1),
  sources: z
    .object({
      consolidation_method: z.string().min(1),
      consolidation_prompt_sha256: z.string().regex(sha256Pattern).optional(),
      consolidation_prompt_version: z.string().optional(),
      sources_md_sha256: z.string().regex(sha256Pattern).optional(),
      reviewed_by: z.string().optional(),
      reviewed_at: isoDatetime.optional(),
    })
    .optional(),
  analysis: z
    .object({
      prompt_file: z.string().min(1),
      prompt_sha256: z.string().regex(sha256Pattern),
      prompt_version: z.string().min(1),
      models: z.record(z.string(), ModelRunEntrySchema),
    })
    .optional(),
  aggregation: z
    .object({
      prompt_file: z.string().min(1),
      prompt_sha256: z.string().regex(sha256Pattern),
      prompt_version: z.string().min(1),
      aggregator_model: z.object({
        provider: z.string().min(1),
        exact_version: z.string().min(1),
        run_at: isoDatetime,
      }),
      human_review_completed: z.boolean(),
      reviewer: z.string().optional(),
      reviewed_at: isoDatetime.optional(),
    })
    .optional(),
  total_cost_estimate_usd: z.number().nonnegative().optional(),
});

export type VersionMetadata = z.infer<typeof VersionMetadataSchema>;

// ---------------------------------------------------------------------------
// AnalysisOutputSchema — raw-outputs/<model>.json
// See docs/specs/analysis/output-schema.md (Stable)
// See docs/specs/analysis/dimensions.md (Stable)
// See docs/specs/analysis/political-positioning.md (Stable)
// See docs/specs/analysis/intergenerational-audit.md (Stable)
// ---------------------------------------------------------------------------

/** Confidence in [0, 1]. Used throughout the analysis schema. */
const ConfidenceSchema = z.number().min(0).max(1);

/**
 * Ordinal positioning score on a political axis.
 * Integer in [-5, +5]. Never cardinally averaged across models.
 * See docs/specs/analysis/political-positioning.md.
 */
const PositioningScoreSchema = z.number().int().min(-5).max(5);

/** A citation into sources.md (anchor, line range, or direct quote reference). */
const SourceRefSchema = z.string().min(1);

/** An evidence quote tied to a source_ref. Used in positioning and intergen. */
const EvidenceRefSchema = z
  .object({
    quote: z.string().min(1),
    source_ref: SourceRefSchema,
  })
  .strict();

/** Dimension grade. Coherence + evidence, not ideology. */
const DimensionGradeSchema = z.enum([
  "A",
  "B",
  "C",
  "D",
  "F",
  "NOT_ADDRESSED",
]);

/** Per-axis positioning result. */
const PositioningAxisSchema = z
  .object({
    score: PositioningScoreSchema,
    anchor_comparison: z.string().min(1),
    evidence: z.array(EvidenceRefSchema).min(1),
    confidence: ConfidenceSchema,
    reasoning: z.string().min(1),
  })
  .strict();

/** Positioning block — the 5 fixed axes. */
const PositioningSchema = z
  .object({
    economic: PositioningAxisSchema,
    social_cultural: PositioningAxisSchema,
    sovereignty: PositioningAxisSchema,
    institutional: PositioningAxisSchema,
    ecological: PositioningAxisSchema,
  })
  .strict();

// Claim-shaped sub-objects for dimensions.

const ProblemAddressedSchema = z
  .object({
    problem: z.string().min(1),
    approach: z.string().min(1),
    strength: ConfidenceSchema,
    source_refs: z.array(SourceRefSchema).min(1),
    reasoning: z.string().min(1),
  })
  .strict();

/**
 * `problems_ignored` represents an *absence* finding — the candidate does not
 * address this problem. `source_refs` may therefore be empty: the analytical
 * content is the absence itself, not a positive citation.
 */
const ProblemIgnoredSchema = z
  .object({
    problem: z.string().min(1),
    significance: z.string().min(1),
    source_refs: z.array(SourceRefSchema),
  })
  .strict();

const ProblemWorsenedSchema = z
  .object({
    problem: z.string().min(1),
    mechanism: z.string().min(1),
    severity: ConfidenceSchema,
    source_refs: z.array(SourceRefSchema).min(1),
    reasoning: z.string().min(1),
  })
  .strict();

const ExecutionRiskSchema = z
  .object({
    risk: z.string().min(1),
    probability: ConfidenceSchema,
    severity: ConfidenceSchema,
    reasoning: z.string().min(1),
    source_refs: z.array(SourceRefSchema).min(1),
  })
  .strict();

const KeyMeasureSchema = z
  .object({
    measure: z.string().min(1),
    source_ref: SourceRefSchema,
    quantified: z.boolean(),
    magnitude: z.string().min(1).nullable(),
  })
  .strict();

const DimensionSchema = z
  .object({
    grade: DimensionGradeSchema,
    summary: z.string().min(1),
    problems_addressed: z.array(ProblemAddressedSchema),
    problems_ignored: z.array(ProblemIgnoredSchema),
    problems_worsened: z.array(ProblemWorsenedSchema),
    execution_risks: z.array(ExecutionRiskSchema),
    key_measures: z.array(KeyMeasureSchema),
    confidence: ConfidenceSchema,
  })
  .strict();

/** The 6 dimension clusters. Intergenerational is cross-cutting (separate block). */
const DimensionsSchema = z
  .object({
    economic_fiscal: DimensionSchema,
    social_demographic: DimensionSchema,
    security_sovereignty: DimensionSchema,
    institutional_democratic: DimensionSchema,
    environmental_long_term: DimensionSchema,
  })
  .strict();

/** A quantified-or-qualitative impact cell in the intergenerational block. */
const IntergenImpactCellSchema = z
  .object({
    summary: z.string().min(1),
    quantified: z.string().min(1).nullable(),
  })
  .strict();

const Impact25YoSchema = z
  .object({
    fiscal: IntergenImpactCellSchema,
    housing: IntergenImpactCellSchema,
    pension_outlook: IntergenImpactCellSchema,
    labor_market: IntergenImpactCellSchema,
    environmental_debt: IntergenImpactCellSchema,
    narrative_summary: z.string().min(1),
  })
  .strict();

const Impact65YoSchema = z
  .object({
    fiscal: IntergenImpactCellSchema,
    pension: IntergenImpactCellSchema,
    healthcare: IntergenImpactCellSchema,
    narrative_summary: z.string().min(1),
  })
  .strict();

const NetTransferDirectionSchema = z.enum([
  "young_to_old",
  "old_to_young",
  "neutral",
  "mixed",
]);

const IntergenerationalSchema = z
  .object({
    net_transfer_direction: NetTransferDirectionSchema,
    magnitude_estimate: z
      .object({
        value: z.string().min(1),
        units: z.string().min(1),
        confidence: ConfidenceSchema,
        caveats: z.string().min(1),
      })
      .strict(),
    impact_on_25yo_in_2027: Impact25YoSchema,
    impact_on_65yo_in_2027: Impact65YoSchema,
    reasoning: z.string().min(1),
    source_refs: z.array(SourceRefSchema).min(1),
    confidence: ConfidenceSchema,
  })
  .strict();

const DirectionOfChangeSchema = z.enum([
  "improvement",
  "worsening",
  "neutral",
  "mixed",
]);

const CounterfactualSchema = z
  .object({
    status_quo_trajectory: z.string().min(1),
    does_program_change_trajectory: z.boolean(),
    direction_of_change: DirectionOfChangeSchema,
    dimensions_changed: z.array(z.string().min(1)),
    dimensions_unchanged: z.array(z.string().min(1)),
    reasoning: z.string().min(1),
    confidence: ConfidenceSchema,
  })
  .strict();

const SeverityLabelSchema = z.enum(["high", "medium", "low"]);

/**
 * `unsolved_problems` are problems the program leaves unresolved even under
 * full and successful execution. Like `problems_ignored`, these are absence
 * findings and `source_refs` may be empty.
 */
const UnsolvedProblemSchema = z
  .object({
    problem: z.string().min(1),
    why_unsolved: z.string().min(1),
    severity_if_unsolved: SeverityLabelSchema,
    source_refs: z.array(SourceRefSchema),
  })
  .strict();

const DownsideScenarioSchema = z
  .object({
    scenario: z.string().min(1),
    trigger: z.string().min(1),
    probability: ConfidenceSchema,
    severity: ConfidenceSchema,
    reasoning: z.string().min(1),
  })
  .strict();

const WeakClaimSchema = z
  .object({
    claim_location: z.string().min(1),
    critique: z.string().min(1),
    alternative_interpretation: z.string().min(1),
  })
  .strict();

const AdversarialPassSchema = z
  .object({
    weakest_claims: z.array(WeakClaimSchema),
    potential_bias: z.string().min(1),
    evidence_gaps: z.string().min(1),
    confidence_in_critique: ConfidenceSchema,
  })
  .strict();

export const AnalysisOutputSchema = z
  .object({
    schema_version: z.string().min(1),
    candidate_id: z.string().regex(candidateIdPattern),
    version_date: isoDateString,
    model: z
      .object({
        provider: z.string().min(1),
        version: z.string().min(1),
      })
      .strict(),
    run_metadata: z
      .object({
        run_at: isoDatetime,
        prompt_sha256: z.string().regex(sha256Pattern),
        temperature: z.number().min(0).max(2),
      })
      .strict(),
    summary: z.string().min(1).max(2000),
    positioning: PositioningSchema,
    dimensions: DimensionsSchema,
    intergenerational: IntergenerationalSchema,
    counterfactual: CounterfactualSchema,
    unsolved_problems: z.array(UnsolvedProblemSchema),
    downside_scenarios: z.array(DownsideScenarioSchema),
    adversarial_pass: AdversarialPassSchema,
    confidence_self_assessment: ConfidenceSchema,
  })
  .strict();

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

/** Placeholder — real schema defined in M_Aggregation */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AggregatedOutputSchema: z.ZodType<any> = z.any();
