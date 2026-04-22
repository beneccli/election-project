import { describe, it, expect } from "vitest";
import {
  AggregatedOutputSchema,
  AnalysisOutputSchema,
  CandidateMetadataSchema,
  SourceMetaSchema,
  VersionMetadataSchema,
} from "./schema";
import { buildValidAnalysisOutput } from "./fixtures/analysis-output/builder";
import { buildValidAggregatedOutput } from "./fixtures/aggregated-output/builder";

// ---------------------------------------------------------------------------
// CandidateMetadataSchema
// ---------------------------------------------------------------------------

describe("schema CandidateMetadataSchema", () => {
  const validCandidate = {
    id: "jane-dupont",
    display_name: "Jane Dupont",
    party: "Parti Exemple",
    party_id: "PE",
    photo_url: "https://example.com/photo.jpg",
    photo_credit: "Source + license",
    declared_candidate_date: "2026-02-15",
    official_website: "https://example.com",
    created: "2026-04-19",
    updated: "2026-04-19",
  };

  it("schema_validates_valid_candidate_metadata", () => {
    const result = CandidateMetadataSchema.safeParse(validCandidate);
    expect(result.success).toBe(true);
  });

  it("schema_validates_minimal_candidate_metadata", () => {
    const minimal = {
      id: "pierre-moreau",
      display_name: "Pierre Moreau",
      party: "Parti Test",
      party_id: "PT",
      created: "2026-04-19",
      updated: "2026-04-19",
    };
    const result = CandidateMetadataSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("schema_validates_candidate_with_optional_fields_as_undefined", () => {
    const data = {
      ...validCandidate,
      photo_url: undefined,
      photo_credit: undefined,
      declared_candidate_date: undefined,
      official_website: undefined,
    };
    const result = CandidateMetadataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("schema_rejects_candidate_with_missing_id", () => {
    const { id: _, ...noId } = validCandidate;
    const result = CandidateMetadataSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });

  it("schema_rejects_candidate_with_invalid_id_format", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      id: "Jane Dupont", // not kebab-case
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_candidate_with_uppercase_id", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      id: "Jane-dupont",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_candidate_with_invalid_date", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      created: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_candidate_with_invalid_photo_url", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      photo_url: "not a url",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_candidate_with_empty_display_name", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      display_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("schema_validates_candidate_with_is_fictional_true", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      id: "test-dupont",
      is_fictional: true,
    });
    expect(result.success).toBe(true);
  });

  it("schema_validates_candidate_with_is_fictional_false", () => {
    const result = CandidateMetadataSchema.safeParse({
      ...validCandidate,
      is_fictional: false,
    });
    expect(result.success).toBe(true);
  });

  it("schema_validates_candidate_with_is_fictional_absent_treated_as_false", () => {
    const { ...noFlag } = validCandidate;
    const result = CandidateMetadataSchema.safeParse(noFlag);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_fictional).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// SourceMetaSchema
// ---------------------------------------------------------------------------

describe("schema SourceMetaSchema", () => {
  const validSourceMeta = {
    origin_url: "https://example.com/manifesto.pdf",
    accessed_at: "2026-04-19T10:00:00Z",
    sha256:
      "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef",
    notes: "Retrieved from candidate's official site",
    license: "presumed fair use",
  };

  it("schema_validates_valid_source_meta", () => {
    const result = SourceMetaSchema.safeParse(validSourceMeta);
    expect(result.success).toBe(true);
  });

  it("schema_validates_minimal_source_meta", () => {
    const minimal = {
      origin_url: "https://example.com/doc.pdf",
      accessed_at: "2026-04-19T10:00:00Z",
      sha256:
        "0000000000000000000000000000000000000000000000000000000000000000",
    };
    const result = SourceMetaSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("schema_validates_source_meta_with_offset_datetime", () => {
    const data = {
      ...validSourceMeta,
      accessed_at: "2026-04-19T12:00:00+02:00",
    };
    const result = SourceMetaSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("schema_rejects_source_meta_with_invalid_sha256", () => {
    const result = SourceMetaSchema.safeParse({
      ...validSourceMeta,
      sha256: "tooshort",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_source_meta_with_uppercase_sha256", () => {
    const result = SourceMetaSchema.safeParse({
      ...validSourceMeta,
      sha256:
        "A1B2C3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_source_meta_with_invalid_url", () => {
    const result = SourceMetaSchema.safeParse({
      ...validSourceMeta,
      origin_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_source_meta_with_missing_accessed_at", () => {
    const { accessed_at: _, ...noDate } = validSourceMeta;
    const result = SourceMetaSchema.safeParse(noDate);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// VersionMetadataSchema
// ---------------------------------------------------------------------------

describe("schema VersionMetadataSchema", () => {
  const validVersionMetadata = {
    candidate_id: "jane-dupont",
    version_date: "2026-04-19",
    schema_version: "1.0",
    sources: {
      consolidation_method: "human_review_of_llm_draft",
      consolidation_prompt_sha256:
        "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef",
      consolidation_prompt_version: "1.0",
      sources_md_sha256:
        "b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef12",
      reviewed_by: "human-reviewer",
      reviewed_at: "2026-04-19T14:00:00Z",
    },
    analysis: {
      prompt_file: "prompts/analyze-candidate.md",
      prompt_sha256:
        "c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef1234",
      prompt_version: "1.0",
      models: {
        "claude-opus-4-7": {
          provider: "anthropic",
          exact_version: "claude-opus-4-7",
          temperature: 0,
          run_at: "2026-04-19T15:00:00Z",
          tokens_in: 42000,
          tokens_out: 8500,
          cost_estimate_usd: 1.23,
          duration_ms: 45000,
          status: "success" as const,
          execution_mode: "api" as const,
          provider_metadata_available: true,
        },
      },
    },
    aggregation: {
      prompt_file: "prompts/aggregate-analyses.md",
      prompt_sha256:
        "d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef123456",
      prompt_version: "1.0",
      aggregator_model: {
        provider: "anthropic",
        exact_version: "claude-opus-4-7",
        run_at: "2026-04-19T16:00:00Z",
        execution_mode: "api" as const,
        provider_metadata_available: true,
      },
      human_review_completed: true,
      reviewer: "human-reviewer",
      reviewed_at: "2026-04-19T17:00:00Z",
    },
    total_cost_estimate_usd: 5.67,
  };

  it("schema_validates_full_version_metadata", () => {
    const result = VersionMetadataSchema.safeParse(validVersionMetadata);
    expect(result.success).toBe(true);
  });

  it("schema_validates_minimal_version_metadata", () => {
    const minimal = {
      candidate_id: "jane-dupont",
      version_date: "2026-04-19",
      schema_version: "1.0",
    };
    const result = VersionMetadataSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("schema_validates_version_metadata_with_only_sources", () => {
    const data = {
      candidate_id: "jane-dupont",
      version_date: "2026-04-19",
      schema_version: "1.0",
      sources: {
        consolidation_method: "manual",
      },
    };
    const result = VersionMetadataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("schema_validates_version_with_failed_model", () => {
    const data = {
      ...validVersionMetadata,
      analysis: {
        ...validVersionMetadata.analysis,
        models: {
          "claude-opus-4-7": {
            ...validVersionMetadata.analysis.models["claude-opus-4-7"],
            status: "failed" as const,
          },
        },
      },
    };
    const result = VersionMetadataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("schema_rejects_version_metadata_with_invalid_candidate_id", () => {
    const result = VersionMetadataSchema.safeParse({
      ...validVersionMetadata,
      candidate_id: "Invalid ID",
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_version_metadata_with_invalid_date", () => {
    const result = VersionMetadataSchema.safeParse({
      ...validVersionMetadata,
      version_date: "19-04-2026", // wrong format
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_version_metadata_with_invalid_model_status", () => {
    const result = VersionMetadataSchema.safeParse({
      ...validVersionMetadata,
      analysis: {
        ...validVersionMetadata.analysis,
        models: {
          "claude-opus-4-7": {
            ...validVersionMetadata.analysis.models["claude-opus-4-7"],
            status: "pending", // invalid enum
          },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_version_metadata_with_negative_tokens", () => {
    const result = VersionMetadataSchema.safeParse({
      ...validVersionMetadata,
      analysis: {
        ...validVersionMetadata.analysis,
        models: {
          "claude-opus-4-7": {
            ...validVersionMetadata.analysis.models["claude-opus-4-7"],
            tokens_in: -100,
          },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("schema_rejects_version_metadata_with_invalid_prompt_sha256", () => {
    const result = VersionMetadataSchema.safeParse({
      ...validVersionMetadata,
      analysis: {
        ...validVersionMetadata.analysis,
        prompt_sha256: "not-a-hash",
      },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AnalysisOutputSchema
// See docs/specs/analysis/output-schema.md
// ---------------------------------------------------------------------------

describe("schema AnalysisOutputSchema", () => {
  it("analysis_schema_validates_fully_populated_fixture", () => {
    const result = AnalysisOutputSchema.safeParse(buildValidAnalysisOutput());
    expect(result.success).toBe(true);
  });

  it("analysis_schema_accepts_each_valid_grade", () => {
    for (const grade of ["A", "B", "C", "D", "F", "NOT_ADDRESSED"] as const) {
      const fixture = buildValidAnalysisOutput();
      fixture.dimensions.economic_fiscal.grade = grade;
      const result = AnalysisOutputSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    }
  });

  it("analysis_schema_accepts_boundary_positioning_scores", () => {
    for (const score of [-5, -4, 0, 4, 5]) {
      const fixture = buildValidAnalysisOutput();
      fixture.positioning.economic.score = score;
      const result = AnalysisOutputSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    }
  });

  it("analysis_schema_accepts_each_net_transfer_direction", () => {
    for (const dir of ["young_to_old", "old_to_young", "neutral", "mixed"] as const) {
      const fixture = buildValidAnalysisOutput();
      fixture.intergenerational.net_transfer_direction = dir;
      const result = AnalysisOutputSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    }
  });

  it("analysis_schema_allows_empty_source_refs_on_problems_ignored", () => {
    // Absence findings are permitted to carry empty source_refs.
    // See docs/specs/analysis/editorial-principles.md (principle 2).
    const fixture = buildValidAnalysisOutput();
    fixture.dimensions.economic_fiscal.problems_ignored[0].source_refs = [];
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it("analysis_schema_rejects_missing_source_refs_on_problem_addressed", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.dimensions.economic_fiscal.problems_addressed[0].source_refs = [];
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_positioning_score_above_range", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.economic.score = 6;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_positioning_score_below_range", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.economic.score = -6;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_non_integer_positioning_score", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.economic.score = 2.5 as unknown as number;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_invalid_grade", () => {
    const fixture = buildValidAnalysisOutput();
    (fixture.dimensions.economic_fiscal as { grade: string }).grade = "A+";
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_confidence_above_one", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.economic.confidence = 1.5;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_negative_confidence", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.confidence_self_assessment = -0.1;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_unknown_top_level_field", () => {
    const fixture = {
      ...buildValidAnalysisOutput(),
      rogue_field: "should not be accepted",
    };
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_missing_required_dimension_cluster", () => {
    const fixture = buildValidAnalysisOutput();
    delete (fixture.dimensions as Partial<typeof fixture.dimensions>)
      .environmental_long_term;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_missing_positioning_axis", () => {
    const fixture = buildValidAnalysisOutput();
    delete (fixture.positioning as Partial<typeof fixture.positioning>).ecological;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_empty_positioning_evidence", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.economic.evidence = [];
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_invalid_candidate_id", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.candidate_id = "Test Candidate";
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_invalid_prompt_sha256", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.run_metadata.prompt_sha256 = "not-a-sha";
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AggregatedOutputSchema
// See docs/specs/analysis/aggregation.md (Stable)
// ---------------------------------------------------------------------------

describe("schema AggregatedOutputSchema", () => {
  it("aggregated_schema_validates_fully_populated_fixture", () => {
    const result = AggregatedOutputSchema.safeParse(buildValidAggregatedOutput());
    expect(result.success).toBe(true);
  });

  it("aggregated_schema_accepts_single_model_coverage_warning", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.coverage_warning = true;
    fixture.source_models = [fixture.source_models[0]];
    const onlyModel = fixture.source_models[0].version;
    fixture.agreement_map.coverage = {
      [onlyModel]: "complete",
      "gpt-4.1-2025-04-14": "failed",
      "gemini-2.5-pro": "failed",
    };
    fixture.agreement_map.high_confidence_claims = [];
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it("aggregated_schema_allows_empty_source_refs_on_problems_ignored", () => {
    // Inherit the absence-finding carve-out from the per-model schema.
    const fixture = buildValidAggregatedOutput();
    fixture.dimensions.economic_fiscal.problems_ignored[0].source_refs = [];
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  // --- Guardrail: no cardinal positioning --------------------------------

  it("aggregated_schema_rejects_positioning_score_field", () => {
    // The cardinal-averaging guardrail. If this test ever fails to reject,
    // the editorial principle "positioning is never cardinally averaged"
    // has silently been weakened. See docs/specs/analysis/aggregation.md §Q5.
    const fixture = buildValidAggregatedOutput();
    const rogue = {
      ...fixture,
      positioning: {
        ...fixture.positioning,
        economic: {
          ...fixture.positioning.economic,
          score: -2.5,
        },
      },
    };
    const result = AggregatedOutputSchema.safeParse(rogue);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_non_integer_modal_score", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.positioning.economic.modal_score = 2.5 as unknown as number;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_modal_score_out_of_range", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.positioning.economic.modal_score = 6;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_reversed_consensus_interval", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.positioning.economic.consensus_interval = [3, 1];
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_consensus_interval_out_of_range", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.positioning.economic.consensus_interval = [
      -6, 2,
    ] as unknown as [number, number];
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  // --- Guardrail: provenance is mandatory --------------------------------

  it("aggregated_schema_rejects_claim_with_empty_supported_by", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.dimensions.economic_fiscal.problems_addressed[0].supported_by = [];
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_missing_source_refs_on_problem_addressed", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.dimensions.economic_fiscal.problems_addressed[0].source_refs = [];
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  // --- Other structural rejections ---------------------------------------

  it("aggregated_schema_rejects_flagged_item_missing_issue", () => {
    const fixture = buildValidAggregatedOutput();
    const flagged = fixture.flagged_for_review[0] as unknown as Record<
      string,
      unknown
    >;
    delete flagged.issue;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_unknown_top_level_field", () => {
    const fixture = {
      ...buildValidAggregatedOutput(),
      rogue_field: "should not be accepted",
    };
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_empty_source_models", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.source_models = [];
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_confidence_out_of_range", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.summary_agreement = 1.5;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_invalid_grade_consensus", () => {
    const fixture = buildValidAggregatedOutput();
    (
      fixture.dimensions.economic_fiscal.grade as { consensus: string }
    ).consensus = "A+";
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_invalid_aggregation_method_type", () => {
    const fixture = buildValidAggregatedOutput();
    (
      fixture.aggregation_method as unknown as { type: string }
    ).type = "deterministic";
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_invalid_resolution_enum", () => {
    const fixture = buildValidAggregatedOutput();
    (
      fixture.flagged_for_review[0] as unknown as { resolution: string }
    ).resolution = "maybe";
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_accepts_resolution_enum_values", () => {
    for (const resolution of [
      "approved",
      "rejected",
      "edited",
      "skipped",
    ] as const) {
      const fixture = buildValidAggregatedOutput();
      fixture.flagged_for_review[0].resolution = resolution;
      const result = AggregatedOutputSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Schema v1.1: headline, risk_profile, horizon_matrix, positioning per_model
// See docs/specs/website/candidate-page-polish.md §3
// ---------------------------------------------------------------------------

describe("schema v1.1 analysis output extensions", () => {
  it("analysis_schema_rejects_schema_version_1_0", () => {
    const fixture = buildValidAnalysisOutput() as unknown as {
      schema_version: string;
    };
    fixture.schema_version = "1.0";
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_accepts_headline_overshoot_up_to_280_chars", () => {
    // The prompt targets ≤140 chars, but ingest tolerates up to 2×
    // overshoot so that a 160-char headline from a verbose model does
    // not reject an otherwise-valid raw output. See schema.ts comment
    // above RiskProfileCategorySchema.
    const fixture = buildValidAnalysisOutput();
    fixture.dimensions.economic_fiscal.headline = "a".repeat(280);
    const okAtBoundary = AnalysisOutputSchema.safeParse(fixture);
    expect(okAtBoundary.success).toBe(true);
    fixture.dimensions.economic_fiscal.headline = "a".repeat(281);
    const failsAboveBoundary = AnalysisOutputSchema.safeParse(fixture);
    expect(failsAboveBoundary.success).toBe(false);
  });

  it("analysis_schema_rejects_missing_risk_profile_category", () => {
    const fixture = buildValidAnalysisOutput();
    delete (fixture.dimensions.economic_fiscal.risk_profile as Partial<
      typeof fixture.dimensions.economic_fiscal.risk_profile
    >).dependency;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_invalid_risk_level_enum", () => {
    const fixture = buildValidAnalysisOutput();
    (
      fixture.dimensions.economic_fiscal.risk_profile.budgetary as {
        level: string;
      }
    ).level = "extreme";
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_horizon_matrix_with_missing_row", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.intergenerational.horizon_matrix =
      fixture.intergenerational.horizon_matrix.slice(0, 5);
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_horizon_matrix_with_duplicate_row", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.intergenerational.horizon_matrix[0] = {
      ...fixture.intergenerational.horizon_matrix[1],
    };
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_horizon_cell_missing_horizon_key", () => {
    const fixture = buildValidAnalysisOutput();
    const row = fixture.intergenerational.horizon_matrix[0];
    delete (row.cells as Partial<typeof row.cells>).h_2038_2047;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_impact_score_above_range", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.intergenerational.horizon_matrix[0].cells.h_2027_2030.impact_score =
      4;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_impact_score_below_range", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.intergenerational.horizon_matrix[0].cells.h_2027_2030.impact_score =
      -4;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_non_integer_impact_score", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.intergenerational.horizon_matrix[0].cells.h_2027_2030.impact_score =
      1.5 as unknown as number;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });
});

describe("schema v1.1 aggregated output extensions", () => {
  it("aggregated_schema_rejects_schema_version_1_0", () => {
    const fixture = buildValidAggregatedOutput() as unknown as {
      schema_version: string;
    };
    fixture.schema_version = "1.0";
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_reversed_level_interval", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.dimensions.economic_fiscal.risk_profile.budgetary.level_interval = [
      "high",
      "low",
    ];
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_reversed_score_interval", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.intergenerational.horizon_matrix[0].cells.h_2027_2030.score_interval =
      [3, -2];
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_headline_missing_supported_by", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.dimensions.economic_fiscal.headline.supported_by = [];
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_positioning_per_model_entry_missing_reasoning", () => {
    const fixture = buildValidAggregatedOutput();
    const entry = fixture.positioning.economic.per_model[0] as unknown as {
      reasoning?: string;
    };
    delete entry.reasoning;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_positioning_per_model_score_out_of_range", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.positioning.economic.per_model[0].score = 6;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_accepts_null_modal_level_and_null_modal_score", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.dimensions.economic_fiscal.risk_profile.budgetary.modal_level =
      null;
    fixture.intergenerational.horizon_matrix[0].cells.h_2027_2030.modal_score =
      null;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Schema v1.2 — overall_spectrum (M_PoliticalSpectrum)
// See docs/specs/analysis/political-spectrum-label.md
// ---------------------------------------------------------------------------

describe("schema v1.2 overall_spectrum extensions", () => {
  it("analysis_schema_validates_v1_2_minimal_with_overall_spectrum", () => {
    const fixture = buildValidAnalysisOutput();
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schema_version).toBe("1.2");
      expect(result.data.positioning.overall_spectrum.label).toBe(
        "centre_gauche",
      );
    }
  });

  it("analysis_schema_rejects_schema_version_1_1", () => {
    const fixture = buildValidAnalysisOutput() as unknown as {
      schema_version: string;
    };
    fixture.schema_version = "1.1";
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_extra_score_on_overall_spectrum", () => {
    const fixture = buildValidAnalysisOutput() as unknown as {
      positioning: { overall_spectrum: Record<string, unknown> };
    };
    fixture.positioning.overall_spectrum.score = 1.5;
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_empty_derived_from_axes", () => {
    const fixture = buildValidAnalysisOutput();
    fixture.positioning.overall_spectrum.derived_from_axes = [];
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("analysis_schema_rejects_unknown_spectrum_label", () => {
    const fixture = buildValidAnalysisOutput() as unknown as {
      positioning: { overall_spectrum: { label: string } };
    };
    fixture.positioning.overall_spectrum.label = "liberal";
    const result = AnalysisOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_validates_v1_2_minimal_with_overall_spectrum", () => {
    const fixture = buildValidAggregatedOutput();
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schema_version).toBe("1.2");
      expect(result.data.positioning.overall_spectrum.modal_label).toBe(
        "centre_gauche",
      );
    }
  });

  it("aggregated_schema_rejects_extra_numeric_keys_on_overall_spectrum", () => {
    const fixture = buildValidAggregatedOutput() as unknown as {
      positioning: { overall_spectrum: Record<string, unknown> };
    };
    fixture.positioning.overall_spectrum.mean = 2.1;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_rejects_negative_label_distribution_count", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.positioning.overall_spectrum.label_distribution.gauche = -1;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it("aggregated_schema_accepts_null_modal_label_when_inconclusive", () => {
    const fixture = buildValidAggregatedOutput();
    fixture.positioning.overall_spectrum.modal_label = null;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it("aggregated_schema_rejects_missing_overall_spectrum_in_consensus", () => {
    const fixture = buildValidAggregatedOutput() as unknown as {
      agreement_map: {
        positioning_consensus: Record<string, unknown>;
      };
    };
    delete fixture.agreement_map.positioning_consensus.overall_spectrum;
    const result = AggregatedOutputSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Execution modes on ModelRunEntry / aggregator_model
// See docs/specs/data-pipeline/analysis-modes.md
// ---------------------------------------------------------------------------

describe("schema ModelRunEntry execution_mode", () => {
  const baseApiRow = {
    provider: "anthropic",
    exact_version: "claude-opus-4-7",
    temperature: 0,
    run_at: "2026-04-19T15:00:00Z",
    tokens_in: 42000,
    tokens_out: 8500,
    cost_estimate_usd: 1.23,
    duration_ms: 45000,
    status: "success" as const,
  };

  const versionWith = (model: Record<string, unknown>) => ({
    candidate_id: "jane-dupont",
    version_date: "2026-04-19",
    schema_version: "1.0",
    analysis: {
      prompt_file: "prompts/analyze-candidate.md",
      prompt_sha256:
        "c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef1234",
      prompt_version: "1.0",
      models: { "claude-opus-4-7": model },
    },
  });

  it("schema_accepts_api_row_with_execution_mode_explicit", () => {
    const row = {
      ...baseApiRow,
      execution_mode: "api",
      provider_metadata_available: true,
    };
    const result = VersionMetadataSchema.safeParse(versionWith(row));
    expect(result.success).toBe(true);
  });

  it("schema_rejects_row_missing_execution_mode", () => {
    const result = VersionMetadataSchema.safeParse(versionWith(baseApiRow));
    expect(result.success).toBe(false);
  });

  it("schema_rejects_row_missing_provider_metadata_available", () => {
    const row = { ...baseApiRow, execution_mode: "api" } as Record<
      string,
      unknown
    >;
    const result = VersionMetadataSchema.safeParse(versionWith(row));
    expect(result.success).toBe(false);
  });

  it("schema_accepts_manual_webchat_row_with_attestation", () => {
    const row = {
      provider: "anthropic",
      exact_version: "claude-opus-4-1 (web chat)",
      temperature: 0,
      run_at: "2026-04-19T15:00:00Z",
      status: "success" as const,
      execution_mode: "manual-webchat",
      attested_by: "benoit",
      attested_model_version: "claude-opus-4-1 (web chat)",
      provider_metadata_available: false,
    };
    const result = VersionMetadataSchema.safeParse(versionWith(row));
    expect(result.success).toBe(true);
  });

  it("schema_accepts_copilot_agent_row_with_attestation", () => {
    const row = {
      provider: "copilot",
      exact_version: "claude-opus-4-1 via copilot",
      temperature: 0,
      run_at: "2026-04-19T15:00:00Z",
      status: "success" as const,
      execution_mode: "copilot-agent",
      attested_by: "benoit",
      attested_model_version: "claude-opus-4-1 via copilot",
      provider_metadata_available: false,
    };
    const result = VersionMetadataSchema.safeParse(versionWith(row));
    expect(result.success).toBe(true);
  });

  it("schema_rejects_manual_webchat_row_missing_attested_by", () => {
    const row = {
      provider: "anthropic",
      exact_version: "claude-opus-4-1",
      temperature: 0,
      run_at: "2026-04-19T15:00:00Z",
      status: "success" as const,
      execution_mode: "manual-webchat",
      attested_model_version: "claude-opus-4-1 (web chat)",
      provider_metadata_available: false,
    };
    const result = VersionMetadataSchema.safeParse(versionWith(row));
    expect(result.success).toBe(false);
  });

  it("schema_rejects_manual_webchat_row_missing_attested_model_version", () => {
    const row = {
      provider: "anthropic",
      exact_version: "claude-opus-4-1",
      temperature: 0,
      run_at: "2026-04-19T15:00:00Z",
      status: "success" as const,
      execution_mode: "manual-webchat",
      attested_by: "benoit",
      provider_metadata_available: false,
    };
    const result = VersionMetadataSchema.safeParse(versionWith(row));
    expect(result.success).toBe(false);
  });

  it("schema_rejects_manual_webchat_row_with_provider_metadata_available_true", () => {
    const row = {
      ...baseApiRow,
      execution_mode: "manual-webchat",
      attested_by: "benoit",
      attested_model_version: "claude-opus-4-1",
      provider_metadata_available: true,
    };
    const result = VersionMetadataSchema.safeParse(versionWith(row));
    expect(result.success).toBe(false);
  });

  it("schema_rejects_api_row_missing_tokens_in", () => {
    const row = { ...baseApiRow } as Record<string, unknown>;
    delete row.tokens_in;
    const result = VersionMetadataSchema.safeParse(versionWith(row));
    expect(result.success).toBe(false);
  });

  it("schema_rejects_api_row_with_provider_metadata_available_false", () => {
    const row = { ...baseApiRow, provider_metadata_available: false };
    const result = VersionMetadataSchema.safeParse(versionWith(row));
    expect(result.success).toBe(false);
  });

  it("schema_rejects_invalid_execution_mode_enum", () => {
    const row = { ...baseApiRow, execution_mode: "oracle" };
    const result = VersionMetadataSchema.safeParse(versionWith(row));
    expect(result.success).toBe(false);
  });
});

describe("schema aggregator_model execution_mode", () => {
  const versionWithAggregator = (aggregator_model: Record<string, unknown>) => ({
    candidate_id: "jane-dupont",
    version_date: "2026-04-19",
    schema_version: "1.0",
    aggregation: {
      prompt_file: "prompts/aggregate-analyses.md",
      prompt_sha256:
        "d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef123456",
      prompt_version: "1.0",
      aggregator_model,
      human_review_completed: false,
    },
  });

  it("schema_accepts_api_aggregator_model", () => {
    const result = VersionMetadataSchema.safeParse(
      versionWithAggregator({
        provider: "anthropic",
        exact_version: "claude-opus-4-7",
        run_at: "2026-04-19T16:00:00Z",
        execution_mode: "api",
        provider_metadata_available: true,
      }),
    );
    expect(result.success).toBe(true);
  });

  it("schema_accepts_manual_webchat_aggregator_with_attestation", () => {
    const result = VersionMetadataSchema.safeParse(
      versionWithAggregator({
        provider: "openai",
        exact_version: "gpt-5-thinking (web chat)",
        run_at: "2026-04-19T16:00:00Z",
        execution_mode: "manual-webchat",
        attested_by: "benoit",
        attested_model_version: "gpt-5-thinking (web chat)",
        provider_metadata_available: false,
      }),
    );
    expect(result.success).toBe(true);
  });

  it("schema_rejects_copilot_aggregator_missing_attestation", () => {
    const result = VersionMetadataSchema.safeParse(
      versionWithAggregator({
        provider: "copilot",
        exact_version: "claude-opus via copilot",
        run_at: "2026-04-19T16:00:00Z",
        execution_mode: "copilot-agent",
        provider_metadata_available: false,
      }),
    );
    expect(result.success).toBe(false);
  });
});
