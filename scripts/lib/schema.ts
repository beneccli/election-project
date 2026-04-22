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
  /**
   * When true, this candidate is a synthetic test candidate (see
   * docs/specs/data-pipeline/analysis-modes.md "Test-candidate
   * scaffolding"). Publish refuses such candidates unless
   * `--allow-fictional` is passed. Absence means false.
   */
  is_fictional: z.boolean().optional(),
  /**
   * Optional landing-page family override. When set to "ecologie", the
   * candidate is bucketed under the "Écologie" family filter on the
   * landing page regardless of their left/right spectrum modal. Additive
   * field — existing metadata files without it remain valid.
   * See docs/specs/website/landing-page.md §4.3.
   */
  family_override: z.enum(["ecologie"]).optional(),
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
// Execution modes (see docs/specs/data-pipeline/analysis-modes.md)
// ---------------------------------------------------------------------------

export const ExecutionModeSchema = z.enum([
  "api",
  "manual-webchat",
  "copilot-agent",
]);

export type ExecutionMode = z.infer<typeof ExecutionModeSchema>;

// ---------------------------------------------------------------------------
// VersionMetadataSchema — versions/<date>/metadata.json
// See docs/specs/candidates/repository-structure.md
// See docs/specs/data-pipeline/analysis-modes.md (execution_mode fields)
// ---------------------------------------------------------------------------

const ModelRunEntrySchema = z
  .object({
    provider: z.string().min(1),
    exact_version: z.string().min(1),
    temperature: z.number().min(0).max(2),
    run_at: isoDatetime,
    tokens_in: z.number().int().nonnegative().optional(),
    tokens_out: z.number().int().nonnegative().optional(),
    cost_estimate_usd: z.number().nonnegative().optional(),
    duration_ms: z.number().int().nonnegative().optional(),
    status: z.enum(["success", "failed"]),
    execution_mode: ExecutionModeSchema,
    attested_by: z.string().min(1).optional(),
    attested_model_version: z.string().min(1).optional(),
    provider_metadata_available: z.boolean(),
  })
  .superRefine((entry, ctx) => {
    // Non-api rows require attestation of who ran the model and what
    // model version they claim. See analysis-modes.md §2.
    if (entry.execution_mode !== "api") {
      if (!entry.attested_by) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attested_by"],
          message: `attested_by is required when execution_mode is "${entry.execution_mode}"`,
        });
      }
      if (!entry.attested_model_version) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attested_model_version"],
          message: `attested_model_version is required when execution_mode is "${entry.execution_mode}"`,
        });
      }
      if (entry.provider_metadata_available) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["provider_metadata_available"],
          message: `provider_metadata_available must be false when execution_mode is "${entry.execution_mode}"`,
        });
      }
    }
    // api rows must have provider metadata available AND the numeric
    // provider-reported fields required for cost tracking.
    if (entry.execution_mode === "api") {
      if (!entry.provider_metadata_available) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["provider_metadata_available"],
          message: "provider_metadata_available must be true for api mode",
        });
      }
      for (const field of ["tokens_in", "tokens_out", "cost_estimate_usd"] as const) {
        if (entry[field] === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${field} is required for api mode`,
          });
        }
      }
    }
  });

export type ModelRunEntry = z.infer<typeof ModelRunEntrySchema>;

const AggregatorModelSchema = z
  .object({
    provider: z.string().min(1),
    exact_version: z.string().min(1),
    run_at: isoDatetime,
    execution_mode: ExecutionModeSchema,
    attested_by: z.string().min(1).optional(),
    attested_model_version: z.string().min(1).optional(),
    provider_metadata_available: z.boolean(),
  })
  .superRefine((entry, ctx) => {
    if (entry.execution_mode !== "api") {
      if (!entry.attested_by) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attested_by"],
          message: `attested_by is required when execution_mode is "${entry.execution_mode}"`,
        });
      }
      if (!entry.attested_model_version) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["attested_model_version"],
          message: `attested_model_version is required when execution_mode is "${entry.execution_mode}"`,
        });
      }
      if (entry.provider_metadata_available) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["provider_metadata_available"],
          message: `provider_metadata_available must be false when execution_mode is "${entry.execution_mode}"`,
        });
      }
    }
    if (entry.execution_mode === "api" && !entry.provider_metadata_available) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provider_metadata_available"],
        message: "provider_metadata_available must be true for api mode",
      });
    }
  });

export type AggregatorModel = z.infer<typeof AggregatorModelSchema>;

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
      aggregator_model: AggregatorModelSchema,
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

// ---------------------------------------------------------------------------
// v1.2 addition — global political-spectrum label.
// See docs/specs/analysis/political-spectrum-label.md (Stable).
//
// NON-NEGOTIABLE GUARDRAILS encoded here:
//   1. The label is categorical, never cardinal. No `score`, `mean`,
//      `index`, or `numeric_value` key is accepted — enforced by
//      `.strict()` on both per-model and aggregated spectrum objects.
//   2. `derived_from_axes` is required non-empty — a label with no
//      axis support is a schema error (editorial: "evidence, not
//      convention").
//   3. `inclassable` is a first-class enum value, not a fallback for
//      tied aggregations.
//   4. Aggregated `modal_label` is nullable (no-unique-plurality is an
//      explicit valid outcome); aggregation never averages.
// ---------------------------------------------------------------------------

/** 8 canonical French-spectrum values. ASCII snake_case. */
export const SpectrumLabelSchema = z.enum([
  "extreme_gauche",
  "gauche",
  "centre_gauche",
  "centre",
  "centre_droit",
  "droite",
  "extreme_droite",
  "inclassable",
]);
export type SpectrumLabel = z.infer<typeof SpectrumLabelSchema>;

/** Which of the 5 axes drove the spectrum placement. */
export const SpectrumAxisKeySchema = z.enum([
  "economic",
  "social_cultural",
  "sovereignty",
  "institutional",
  "ecological",
]);
export type SpectrumAxisKey = z.infer<typeof SpectrumAxisKeySchema>;

/**
 * Per-model overall-spectrum block. Sibling of the 5 axes; derived
 * from them, not an independent analytical output.
 *
 * See docs/specs/analysis/political-spectrum-label.md §4.1.
 */
const OverallSpectrumSchema = z
  .object({
    label: SpectrumLabelSchema,
    derived_from_axes: z.array(SpectrumAxisKeySchema).min(1),
    evidence: z.array(EvidenceRefSchema).min(1),
    confidence: ConfidenceSchema,
    reasoning: z.string().min(60).max(600),
  })
  .strict();

// ---------------------------------------------------------------------------
// v1.1 additions — risk profile, horizon matrix, dimension headline.
// See docs/specs/website/candidate-page-polish.md §3.
// All fields added below are additive to v1.0.
// ---------------------------------------------------------------------------

/** 4 fixed risk categories. See spec §3.2. */
export const RiskCategoryKeySchema = z.enum([
  "budgetary",
  "implementation",
  "dependency",
  "reversibility",
]);
export type RiskCategoryKey = z.infer<typeof RiskCategoryKeySchema>;

/** Ordered 4-level risk scale. Never cardinally averaged across models. */
export const RiskLevelSchema = z.enum([
  "low",
  "limited",
  "moderate",
  "high",
]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

/** Canonical ordering for `level_interval` bounds checking. */
const RISK_LEVEL_ORDER: ReadonlyArray<RiskLevel> = [
  "low",
  "limited",
  "moderate",
  "high",
] as const;
const riskLevelIndex = (l: RiskLevel): number => RISK_LEVEL_ORDER.indexOf(l);

/** 6 fixed horizon-matrix row keys. See spec §3.3. */
export const HorizonRowKeySchema = z.enum([
  "pensions",
  "public_debt",
  "climate",
  "health",
  "education",
  "housing",
]);
export type HorizonRowKey = z.infer<typeof HorizonRowKeySchema>;

const HORIZON_ROW_KEYS: ReadonlyArray<HorizonRowKey> = [
  "pensions",
  "public_debt",
  "climate",
  "health",
  "education",
  "housing",
] as const;

/** 3 fixed horizon columns. */
export const HorizonKeySchema = z.enum([
  "h_2027_2030",
  "h_2031_2037",
  "h_2038_2047",
]);
export type HorizonKey = z.infer<typeof HorizonKeySchema>;

export const HORIZON_KEYS: ReadonlyArray<HorizonKey> = [
  "h_2027_2030",
  "h_2031_2037",
  "h_2038_2047",
] as const;

/** Integer impact score in [-3, +3]. Ordinal; not cardinally averaged. */
const ImpactScoreSchema = z.number().int().min(-3).max(3);

// -------- Per-model (analysis-output) risk & horizon cell shapes ----------
//
// Length caps on analyst prose fields are deliberately loose: the prompt
// targets (140 / 160 / 180 / 200 chars) stay in prompts/analyze-candidate.md
// §10 so the LLM writes toward them, but ingest tolerates ~2× overshoot so
// that a 160-character headline does not reject an otherwise-valid raw
// output. The aggregator synthesizes its own tighter prose — see the
// Aggregated* schemas below.

const RiskProfileCategorySchema = z
  .object({
    level: RiskLevelSchema,
    note: z.string().min(1).max(360),
    source_refs: z.array(SourceRefSchema),
  })
  .strict();

/** Refinement: every one of the 4 risk categories present, strict keys. */
const RiskProfileSchema = z
  .object({
    budgetary: RiskProfileCategorySchema,
    implementation: RiskProfileCategorySchema,
    dependency: RiskProfileCategorySchema,
    reversibility: RiskProfileCategorySchema,
  })
  .strict();

const HorizonCellSchema = z
  .object({
    impact_score: ImpactScoreSchema,
    note: z.string().min(1).max(320),
    source_refs: z.array(SourceRefSchema),
  })
  .strict();

const HorizonCellsSchema = z
  .object({
    h_2027_2030: HorizonCellSchema,
    h_2031_2037: HorizonCellSchema,
    h_2038_2047: HorizonCellSchema,
  })
  .strict();

const HorizonRowSchema = z
  .object({
    row: HorizonRowKeySchema,
    dimension_note: z.string().min(1).max(400),
    cells: HorizonCellsSchema,
  })
  .strict();

/**
 * Per-model horizon matrix: exactly 6 rows, one per HorizonRowKey,
 * no duplicates, any order.
 */
const HorizonMatrixSchema = z
  .array(HorizonRowSchema)
  .length(6)
  .refine(
    (rows) => {
      const seen = new Set(rows.map((r) => r.row));
      return (
        seen.size === 6 && HORIZON_ROW_KEYS.every((k) => seen.has(k))
      );
    },
    {
      message:
        "horizon_matrix must contain exactly one row per HorizonRowKey (pensions, public_debt, climate, health, education, housing)",
    },
  );

/** Positioning block — the 5 fixed axes plus the v1.2 derived spectrum label. */
const PositioningSchema = z
  .object({
    economic: PositioningAxisSchema,
    social_cultural: PositioningAxisSchema,
    sovereignty: PositioningAxisSchema,
    institutional: PositioningAxisSchema,
    ecological: PositioningAxisSchema,
    overall_spectrum: OverallSpectrumSchema,
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
    headline: z.string().min(1).max(280),
    summary: z.string().min(1),
    problems_addressed: z.array(ProblemAddressedSchema),
    problems_ignored: z.array(ProblemIgnoredSchema),
    problems_worsened: z.array(ProblemWorsenedSchema),
    execution_risks: z.array(ExecutionRiskSchema),
    key_measures: z.array(KeyMeasureSchema),
    risk_profile: RiskProfileSchema,
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
    horizon_matrix: HorizonMatrixSchema,
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
    schema_version: z.literal("1.2"),
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

// ---------------------------------------------------------------------------
// AggregatedOutputSchema — aggregated.draft.json / aggregated.json
// See docs/specs/analysis/aggregation.md (Stable)
//
// NON-NEGOTIABLE GUARDRAILS encoded here:
//   1. Aggregated positioning has NO `score` field. The per-model integer
//      `score` lives only in raw-outputs/. Aggregated positioning is an
//      ordinal interval + modal + dissent list. Cardinal averaging is
//      prohibited by editorial principle 4 and enforced by `.strict()`.
//   2. Every aggregated claim carries inline provenance
//      (`supported_by`, `dissenters`). `supported_by` is non-empty; a claim
//      with no supporting model is a schema error.
//   3. `consensus_interval` tuples satisfy `min <= max` via `.refine`.
//   4. Absence findings (`problems_ignored`, `unsolved_problems`) inherit
//      the per-model carve-out allowing empty `source_refs` — the analytical
//      content is the absence itself.
// ---------------------------------------------------------------------------

/** A model version string identifier (e.g. "claude-opus-4-0-20250514"). */
const ModelIdentifierSchema = z.string().min(1);

/**
 * Inline provenance attached to every aggregated claim.
 * `supported_by` must be non-empty. Claims with no supporting model are
 * routed to `flagged_for_review[]`, not published.
 */
const supportedBySchema = z.array(ModelIdentifierSchema).min(1);
const dissentersSchema = z.array(ModelIdentifierSchema);

/** Ordered integer interval in [-5, +5] with min <= max. */
const ConsensusIntervalSchema = z
  .tuple([PositioningScoreSchema, PositioningScoreSchema])
  .refine((t) => t[0] <= t[1], {
    message: "consensus_interval must satisfy min <= max",
  });

/** Per-axis dissent entry — verbatim model reasoning preserved. */
const PositioningDissentSchema = z
  .object({
    model: ModelIdentifierSchema,
    position: PositioningScoreSchema,
    reasoning: z.string().min(1),
  })
  .strict();

/** Per-axis per-model entry — complete list of model scores (v1.1). */
const PositioningPerModelSchema = z
  .object({
    model: ModelIdentifierSchema,
    score: PositioningScoreSchema,
    reasoning: z.string().min(1),
  })
  .strict();

/**
 * Aggregated per-axis positioning.
 * NOTE: no `score` field. `.strict()` enforces this — any `score` key in
 * input is an unknown key and rejected. This is the cardinal-averaging
 * guardrail. See docs/specs/analysis/political-positioning.md.
 */
const AggregatedPositioningAxisSchema = z
  .object({
    consensus_interval: ConsensusIntervalSchema,
    modal_score: PositioningScoreSchema.nullable(),
    anchor_narrative: z.string().min(1),
    evidence: z.array(EvidenceRefSchema),
    confidence: ConfidenceSchema,
    dissent: z.array(PositioningDissentSchema),
    per_model: z.array(PositioningPerModelSchema),
  })
  .strict();

// --------- v1.2 aggregated addition: overall_spectrum --------------------
// See docs/specs/analysis/political-spectrum-label.md §5.
// Same editorial discipline as per-axis positioning: modal plurality,
// distribution, dissent preserved — never averaged. `.strict()` rejects
// any `score`, `mean`, `index`, or `numeric_value` key.

/** Per-model dissent entry for the categorical spectrum label. */
const SpectrumDissentSchema = z
  .object({
    model: ModelIdentifierSchema,
    label: SpectrumLabelSchema,
    reasoning: z.string().min(1),
  })
  .strict();

/** Per-model entry listing every contributing model's label. */
const SpectrumPerModelSchema = z
  .object({
    model: ModelIdentifierSchema,
    label: SpectrumLabelSchema,
    reasoning: z.string().min(1),
  })
  .strict();

/**
 * Aggregated overall-spectrum block. Categorical; never averaged.
 * `modal_label` is nullable: no-unique-plurality is a valid outcome
 * (the site renders "Positionnement partagé" in that case).
 */
const AggregatedOverallSpectrumSchema = z
  .object({
    modal_label: SpectrumLabelSchema.nullable(),
    label_distribution: z.record(
      SpectrumLabelSchema,
      z.number().int().nonnegative(),
    ),
    anchor_narrative: z.string().min(1).max(600),
    confidence: ConfidenceSchema,
    dissent: z.array(SpectrumDissentSchema),
    per_model: z.array(SpectrumPerModelSchema),
    human_edit: z.boolean().optional(),
  })
  .strict();

const AggregatedPositioningSchema = z
  .object({
    economic: AggregatedPositioningAxisSchema,
    social_cultural: AggregatedPositioningAxisSchema,
    sovereignty: AggregatedPositioningAxisSchema,
    institutional: AggregatedPositioningAxisSchema,
    ecological: AggregatedPositioningAxisSchema,
    overall_spectrum: AggregatedOverallSpectrumSchema,
  })
  .strict();

/** Claim-shape extensions — per-model shape + inline provenance. */

const AggregatedProblemAddressedSchema = ProblemAddressedSchema.extend({
  supported_by: supportedBySchema,
  dissenters: dissentersSchema,
  human_edit: z.boolean().optional(),
}).strict();

const AggregatedProblemIgnoredSchema = ProblemIgnoredSchema.extend({
  supported_by: supportedBySchema,
  dissenters: dissentersSchema,
  human_edit: z.boolean().optional(),
}).strict();

const AggregatedProblemWorsenedSchema = ProblemWorsenedSchema.extend({
  supported_by: supportedBySchema,
  dissenters: dissentersSchema,
  human_edit: z.boolean().optional(),
}).strict();

const AggregatedExecutionRiskSchema = ExecutionRiskSchema.extend({
  supported_by: supportedBySchema,
  dissenters: dissentersSchema,
  human_edit: z.boolean().optional(),
}).strict();

const AggregatedKeyMeasureSchema = KeyMeasureSchema.extend({
  supported_by: supportedBySchema,
  dissenters: dissentersSchema,
  human_edit: z.boolean().optional(),
}).strict();

const AggregatedUnsolvedProblemSchema = UnsolvedProblemSchema.extend({
  supported_by: supportedBySchema,
  dissenters: dissentersSchema,
  human_edit: z.boolean().optional(),
}).strict();

const AggregatedDownsideScenarioSchema = DownsideScenarioSchema.extend({
  supported_by: supportedBySchema,
  dissenters: dissentersSchema,
  human_edit: z.boolean().optional(),
}).strict();

/** Per-dimension grade: consensus + per-model dissent map. */
const AggregatedGradeSchema = z
  .object({
    consensus: DimensionGradeSchema,
    dissent: z.record(ModelIdentifierSchema, DimensionGradeSchema),
  })
  .strict();

// -------- v1.1 aggregated additions: headline, risk_profile, horizon ------

// Per-model headline inside aggregated.json mirrors the analyst cap (280)
// because it stores each model's raw text verbatim. The synthesized
// AggregatedHeadlineSchema.text below keeps the tight 140 target.
const HeadlinePerModelSchema = z
  .object({
    model: ModelIdentifierSchema,
    text: z.string().min(1).max(280),
  })
  .strict();

const AggregatedHeadlineSchema = z
  .object({
    text: z.string().min(1).max(140),
    supported_by: supportedBySchema,
    dissenters: dissentersSchema,
    per_model: z.array(HeadlinePerModelSchema),
    human_edit: z.boolean().optional(),
  })
  .strict();

const RiskLevelIntervalSchema = z
  .tuple([RiskLevelSchema, RiskLevelSchema])
  .refine((t) => riskLevelIndex(t[0]) <= riskLevelIndex(t[1]), {
    message:
      "level_interval must be ordered low <= limited <= moderate <= high",
  });

const RiskProfilePerModelSchema = z
  .object({
    model: ModelIdentifierSchema,
    level: RiskLevelSchema,
    note: z.string().min(1).max(360),
  })
  .strict();

const AggregatedRiskCategorySchema = z
  .object({
    modal_level: RiskLevelSchema.nullable(),
    level_interval: RiskLevelIntervalSchema,
    note: z.string().min(1).max(180),
    supported_by: supportedBySchema,
    dissenters: dissentersSchema,
    per_model: z.array(RiskProfilePerModelSchema),
    human_edit: z.boolean().optional(),
  })
  .strict();

const AggregatedRiskProfileSchema = z
  .object({
    budgetary: AggregatedRiskCategorySchema,
    implementation: AggregatedRiskCategorySchema,
    dependency: AggregatedRiskCategorySchema,
    reversibility: AggregatedRiskCategorySchema,
  })
  .strict();

const ScoreIntervalSchema = z
  .tuple([ImpactScoreSchema, ImpactScoreSchema])
  .refine((t) => t[0] <= t[1], {
    message: "score_interval must satisfy min <= max",
  });

const HorizonCellPerModelSchema = z
  .object({
    model: ModelIdentifierSchema,
    score: ImpactScoreSchema,
    note: z.string().min(1).max(320),
  })
  .strict();

const AggregatedHorizonCellSchema = z
  .object({
    modal_score: ImpactScoreSchema.nullable(),
    score_interval: ScoreIntervalSchema,
    note: z.string().min(1).max(160),
    supported_by: supportedBySchema,
    dissenters: dissentersSchema,
    per_model: z.array(HorizonCellPerModelSchema),
    human_edit: z.boolean().optional(),
  })
  .strict();

const AggregatedHorizonCellsSchema = z
  .object({
    h_2027_2030: AggregatedHorizonCellSchema,
    h_2031_2037: AggregatedHorizonCellSchema,
    h_2038_2047: AggregatedHorizonCellSchema,
  })
  .strict();

const AggregatedHorizonRowSchema = z
  .object({
    row: HorizonRowKeySchema,
    dimension_note: z.string().min(1).max(200),
    cells: AggregatedHorizonCellsSchema,
    row_supported_by: supportedBySchema,
    row_dissenters: dissentersSchema,
  })
  .strict();

const AggregatedHorizonMatrixSchema = z
  .array(AggregatedHorizonRowSchema)
  .length(6)
  .refine(
    (rows) => {
      const seen = new Set(rows.map((r) => r.row));
      return (
        seen.size === 6 && HORIZON_ROW_KEYS.every((k) => seen.has(k))
      );
    },
    {
      message:
        "horizon_matrix must contain exactly one row per HorizonRowKey (pensions, public_debt, climate, health, education, housing)",
    },
  );

const AggregatedDimensionSchema = z
  .object({
    grade: AggregatedGradeSchema,
    headline: AggregatedHeadlineSchema,
    summary: z.string().min(1),
    problems_addressed: z.array(AggregatedProblemAddressedSchema),
    problems_ignored: z.array(AggregatedProblemIgnoredSchema),
    problems_worsened: z.array(AggregatedProblemWorsenedSchema),
    execution_risks: z.array(AggregatedExecutionRiskSchema),
    key_measures: z.array(AggregatedKeyMeasureSchema),
    risk_profile: AggregatedRiskProfileSchema,
    confidence: ConfidenceSchema,
  })
  .strict();

const AggregatedDimensionsSchema = z
  .object({
    economic_fiscal: AggregatedDimensionSchema,
    social_demographic: AggregatedDimensionSchema,
    security_sovereignty: AggregatedDimensionSchema,
    institutional_democratic: AggregatedDimensionSchema,
    environmental_long_term: AggregatedDimensionSchema,
  })
  .strict();

const MagnitudeConsensusSchema = z.enum(["interval", "point", "contested"]);

const IntergenerationalAgreementSchema = z
  .object({
    direction_consensus: z.boolean(),
    magnitude_consensus: MagnitudeConsensusSchema,
    dissenting_views: z.array(
      z
        .object({
          model: ModelIdentifierSchema,
          view: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

const AggregatedIntergenerationalSchema = IntergenerationalSchema.extend({
  horizon_matrix: AggregatedHorizonMatrixSchema,
  agreement: IntergenerationalAgreementSchema,
}).strict();

const AggregatedCounterfactualSchema = CounterfactualSchema.extend({
  supported_by: supportedBySchema,
  dissenters: dissentersSchema,
  human_edit: z.boolean().optional(),
}).strict();

/** Agreement map — top-level synthesis of provenance. */
const HighConfidenceClaimSchema = z
  .object({
    claim_id: z.string().min(1),
    models: z.array(ModelIdentifierSchema).min(1),
  })
  .strict();

const ContestedPositionSchema = z
  .object({
    model: ModelIdentifierSchema,
    position: z.string().min(1),
  })
  .strict();

const ContestedClaimSchema = z
  .object({
    claim_id: z.string().min(1),
    positions: z.array(ContestedPositionSchema).min(1),
  })
  .strict();

const CoverageStatusSchema = z.enum(["complete", "partial", "failed"]);

const PositioningConsensusEntrySchema = z
  .object({
    interval: ConsensusIntervalSchema,
    modal: PositioningScoreSchema.nullable(),
    dissent_count: z.number().int().nonnegative(),
  })
  .strict();

/**
 * Overall-spectrum entry inside `agreement_map.positioning_consensus`.
 * Categorical mirror of the numeric per-axis entry. No score field.
 * See docs/specs/analysis/political-spectrum-label.md §5.1.
 */
const OverallSpectrumConsensusEntrySchema = z
  .object({
    modal_label: SpectrumLabelSchema.nullable(),
    distribution: z.record(
      SpectrumLabelSchema,
      z.number().int().nonnegative(),
    ),
    dissent_count: z.number().int().nonnegative(),
  })
  .strict();

const AgreementMapSchema = z
  .object({
    high_confidence_claims: z.array(HighConfidenceClaimSchema),
    contested_claims: z.array(ContestedClaimSchema),
    coverage: z.record(ModelIdentifierSchema, CoverageStatusSchema),
    positioning_consensus: z
      .object({
        economic: PositioningConsensusEntrySchema,
        social_cultural: PositioningConsensusEntrySchema,
        sovereignty: PositioningConsensusEntrySchema,
        institutional: PositioningConsensusEntrySchema,
        ecological: PositioningConsensusEntrySchema,
        overall_spectrum: OverallSpectrumConsensusEntrySchema,
      })
      .strict(),
  })
  .strict();

const ResolutionSchema = z.enum([
  "approved",
  "rejected",
  "edited",
  "skipped",
]);

const FlaggedForReviewSchema = z
  .object({
    claim: z.string().min(1),
    claimed_by: z.array(ModelIdentifierSchema).min(1),
    issue: z.string().min(1),
    suggested_action: z.string().min(1),
    resolution: ResolutionSchema.nullable().optional(),
    reviewed_at: isoDatetime.optional(),
    reviewer_id: z.string().min(1).optional(),
    human_edit: z.boolean().optional(),
    edited_text: z.string().min(1).optional(),
  })
  .strict();

const AggregationMethodSchema = z
  .object({
    type: z.literal("meta_llm"),
    model: z
      .object({
        provider: z.string().min(1),
        version: z.string().min(1),
      })
      .strict(),
    prompt_sha256: z.string().regex(sha256Pattern),
    prompt_version: z.string().min(1),
    run_at: isoDatetime,
  })
  .strict();

const SourceModelEntrySchema = z
  .object({
    provider: z.string().min(1),
    version: z.string().min(1),
  })
  .strict();

export const AggregatedOutputSchema = z
  .object({
    schema_version: z.literal("1.2"),
    candidate_id: z.string().regex(candidateIdPattern),
    version_date: isoDateString,
    source_models: z.array(SourceModelEntrySchema).min(1),
    aggregation_method: AggregationMethodSchema,
    summary: z.string().min(1).max(2000),
    summary_agreement: ConfidenceSchema,
    positioning: AggregatedPositioningSchema,
    dimensions: AggregatedDimensionsSchema,
    intergenerational: AggregatedIntergenerationalSchema,
    counterfactual: AggregatedCounterfactualSchema,
    unsolved_problems: z.array(AggregatedUnsolvedProblemSchema),
    downside_scenarios: z.array(AggregatedDownsideScenarioSchema),
    agreement_map: AgreementMapSchema,
    coverage_warning: z.boolean(),
    flagged_for_review: z.array(FlaggedForReviewSchema),
  })
  .strict();

export type AggregatedOutput = z.infer<typeof AggregatedOutputSchema>;
