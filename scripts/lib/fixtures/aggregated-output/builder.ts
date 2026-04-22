/**
 * Shared builder for a valid `AggregatedOutput` fixture.
 *
 * Used by schema tests and by downstream tests (aggregate pipeline, review
 * CLI) to keep a single source of truth for what a complete, schema-valid
 * aggregated JSON looks like.
 *
 * The synthetic candidate used below is fictional — "test-candidate" —
 * and must never be confused with a real 2027 candidate.
 *
 * See docs/specs/analysis/aggregation.md (Stable).
 */
import type { AggregatedOutput, HorizonRowKey } from "../../schema";

const MODEL_A = "claude-opus-4-0-20250514";
const MODEL_B = "gpt-4.1-2025-04-14";
const MODEL_C = "gemini-2.5-pro";

export function buildValidAggregatedOutput(): AggregatedOutput {
  const provenance = {
    supported_by: [MODEL_A, MODEL_B, MODEL_C],
    dissenters: [],
  };

  const positioningAxis = {
    consensus_interval: [-3, -1] as [number, number],
    modal_score: -2,
    anchor_narrative:
      "Positioning distilled from three models. Placement is more interventionist than Macron 2017 and less than Mélenchon 2022.",
    evidence: [
      {
        quote: "Nationalisation des autoroutes.",
        source_ref: "sources.md#economie",
      },
    ],
    confidence: 0.75,
    dissent: [],
    per_model: [
      {
        model: MODEL_A,
        score: -2,
        reasoning: "Multiple structural public-sector expansions.",
      },
      {
        model: MODEL_B,
        score: -2,
        reasoning: "Interventionist economic program signals.",
      },
      {
        model: MODEL_C,
        score: -3,
        reasoning: "Read as more strongly state-led.",
      },
    ],
  };

  const dimensionBody = {
    grade: { consensus: "B" as const, dissent: { [MODEL_C]: "C" as const } },
    headline: {
      text:
        "Déficit à 3% du PIB d'ici 2030 via revue ciblée des dépenses, sans chiffrage côté recettes.",
      supported_by: [MODEL_A, MODEL_B, MODEL_C],
      dissenters: [],
      per_model: [
        {
          model: MODEL_A,
          text:
            "Déficit à 3% du PIB d'ici 2030 via revue ciblée des dépenses, sans chiffrage côté recettes.",
        },
        {
          model: MODEL_B,
          text:
            "Trajectoire de déficit à 3% d'ici 2030, revue des dépenses non détaillée côté recettes.",
        },
        {
          model: MODEL_C,
          text: "Déficit ramené à 3% en 2030 sans détail sur les recettes.",
        },
      ],
    },
    summary: "Program addresses the main fiscal questions partially.",
    problems_addressed: [
      {
        problem: "Debt trajectory",
        approach: "Targeted spending review plus growth-linked receipts.",
        strength: 0.6,
        source_refs: ["sources.md#finances-publiques"],
        reasoning: "Targets are stated with budget envelopes.",
        ...provenance,
      },
    ],
    problems_ignored: [
      {
        problem: "Interest-burden sensitivity to rate path",
        significance: "Omitting this leaves a central fiscal risk unexamined.",
        source_refs: [],
        ...provenance,
      },
    ],
    problems_worsened: [
      {
        problem: "EU fiscal framework alignment",
        mechanism: "Program's deficit path exceeds permitted envelope.",
        severity: 0.5,
        source_refs: ["sources.md#finances-publiques"],
        reasoning: "Explicit rejection of the stability pact constraints.",
        ...provenance,
      },
    ],
    execution_risks: [
      {
        risk: "Parliamentary blockage on fiscal vote",
        probability: 0.4,
        severity: 0.5,
        reasoning: "Coalition arithmetic is tight on budget majorities.",
        source_refs: ["sources.md#institutions"],
        ...provenance,
      },
    ],
    key_measures: [
      {
        measure: "Spending review targeting €5bn/year",
        source_ref: "sources.md#finances-publiques",
        quantified: true,
        magnitude: "€5bn/year",
        ...provenance,
      },
    ],
    risk_profile: {
      budgetary: {
        modal_level: "moderate" as const,
        level_interval: ["limited", "moderate"] as [
          "limited",
          "moderate",
        ],
        note: "Targets stated but no counter-measures if growth underperforms.",
        supported_by: [MODEL_A, MODEL_B, MODEL_C],
        dissenters: [],
        per_model: [
          {
            model: MODEL_A,
            level: "moderate" as const,
            note: "No counter-measures described.",
          },
          {
            model: MODEL_B,
            level: "moderate" as const,
            note: "Assumes growth hits targets.",
          },
          {
            model: MODEL_C,
            level: "limited" as const,
            note: "Read as reasonably funded.",
          },
        ],
      },
      implementation: {
        modal_level: "limited" as const,
        level_interval: ["low", "limited"] as ["low", "limited"],
        note: "Relies on existing administrative levers.",
        supported_by: [MODEL_A, MODEL_B, MODEL_C],
        dissenters: [],
        per_model: [
          {
            model: MODEL_A,
            level: "limited" as const,
            note: "Standard levers only.",
          },
          {
            model: MODEL_B,
            level: "limited" as const,
            note: "No new institutions required.",
          },
          {
            model: MODEL_C,
            level: "low" as const,
            note: "Easy to implement.",
          },
        ],
      },
      dependency: {
        modal_level: "low" as const,
        level_interval: ["low", "low"] as ["low", "low"],
        note: "No single external dependency identified.",
        supported_by: [MODEL_A, MODEL_B, MODEL_C],
        dissenters: [],
        per_model: [
          { model: MODEL_A, level: "low" as const, note: "No lock-in." },
          { model: MODEL_B, level: "low" as const, note: "No lock-in." },
          { model: MODEL_C, level: "low" as const, note: "No lock-in." },
        ],
      },
      reversibility: {
        modal_level: "moderate" as const,
        level_interval: ["moderate", "moderate"] as ["moderate", "moderate"],
        note: "Could be reversed by a subsequent budget vote.",
        supported_by: [MODEL_A, MODEL_B, MODEL_C],
        dissenters: [],
        per_model: [
          {
            model: MODEL_A,
            level: "moderate" as const,
            note: "Budget-vote reversible.",
          },
          {
            model: MODEL_B,
            level: "moderate" as const,
            note: "Budget-vote reversible.",
          },
          {
            model: MODEL_C,
            level: "moderate" as const,
            note: "Budget-vote reversible.",
          },
        ],
      },
    },
    confidence: 0.65,
  };

  const aggHorizonCell = (score: number, note: string) => ({
    modal_score: score,
    score_interval: [
      Math.max(-3, score - 1),
      Math.min(3, score + 1),
    ] as [number, number],
    note,
    supported_by: [MODEL_A, MODEL_B, MODEL_C],
    dissenters: [],
    per_model: [
      { model: MODEL_A, score, note },
      { model: MODEL_B, score, note },
      { model: MODEL_C, score, note },
    ],
  });
  const aggHorizonRow = (row: HorizonRowKey, base: number) => ({
    row,
    dimension_note: `Aggregated effect on ${row} concentrated in later horizons.`,
    cells: {
      h_2027_2030: aggHorizonCell(
        Math.max(-3, Math.min(3, base - 1)),
        "Limited near-term effect under central assumptions.",
      ),
      h_2031_2037: aggHorizonCell(
        Math.max(-3, Math.min(3, base)),
        "Central-horizon effect described.",
      ),
      h_2038_2047: aggHorizonCell(
        Math.max(-3, Math.min(3, base + 1)),
        "Long-horizon effect amplified by cumulative dynamics.",
      ),
    },
    row_supported_by: [MODEL_A, MODEL_B, MODEL_C],
    row_dissenters: [],
  });

  return {
    schema_version: "1.2",
    candidate_id: "test-candidate",
    version_date: "2026-04-19",
    source_models: [
      { provider: "anthropic", version: MODEL_A },
      { provider: "openai", version: MODEL_B },
      { provider: "google", version: MODEL_C },
    ],
    aggregation_method: {
      type: "meta_llm",
      model: { provider: "anthropic", version: MODEL_A },
      prompt_sha256: "a".repeat(64),
      prompt_version: "1.0",
      run_at: "2026-04-19T11:00:00Z",
    },
    summary:
      "Three models converged on the program's fiscal direction while differing on execution risk magnitude.",
    summary_agreement: 0.8,
    positioning: {
      economic: { ...positioningAxis },
      social_cultural: {
        ...positioningAxis,
        consensus_interval: [0, 1],
        modal_score: 0,
      },
      sovereignty: {
        ...positioningAxis,
        consensus_interval: [1, 2],
        modal_score: 1,
        dissent: [
          {
            model: MODEL_C,
            position: 3,
            reasoning:
              "Model C read the sovereignty rhetoric as more assertive based on specific program passages.",
          },
        ],
      },
      institutional: {
        ...positioningAxis,
        consensus_interval: [-1, 0],
        modal_score: -1,
      },
      ecological: {
        ...positioningAxis,
        consensus_interval: [1, 3],
        modal_score: 2,
      },
      overall_spectrum: {
        modal_label: "centre_gauche" as const,
        label_distribution: {
          centre_gauche: 2,
          gauche: 1,
        },
        anchor_narrative:
          "Two of three models placed the program at centre-gauche; one read it as clearly gauche. Derivation weighted the economic axis (interventionist) and ecological axis (transition-prioritized).",
        confidence: 0.65,
        dissent: [
          {
            model: MODEL_C,
            label: "gauche" as const,
            reasoning:
              "Model C weighted the structural public-sector expansions more heavily.",
          },
        ],
        per_model: [
          {
            model: MODEL_A,
            label: "centre_gauche" as const,
            reasoning:
              "Economic interventionism moderate; social/cultural near-neutral; ecology prioritized.",
          },
          {
            model: MODEL_B,
            label: "centre_gauche" as const,
            reasoning: "Similar weighting; converged on centre-gauche.",
          },
          {
            model: MODEL_C,
            label: "gauche" as const,
            reasoning:
              "Model C weighted the structural public-sector expansions more heavily.",
          },
        ],
      },
    },
    dimensions: {
      economic_fiscal: { ...dimensionBody },
      social_demographic: {
        ...dimensionBody,
        grade: { consensus: "C" as const, dissent: {} },
      },
      security_sovereignty: {
        ...dimensionBody,
        grade: { consensus: "B" as const, dissent: {} },
      },
      institutional_democratic: {
        ...dimensionBody,
        grade: { consensus: "NOT_ADDRESSED" as const, dissent: {} },
      },
      environmental_long_term: {
        ...dimensionBody,
        grade: { consensus: "D" as const, dissent: {} },
      },
    },
    intergenerational: {
      net_transfer_direction: "young_to_old",
      magnitude_estimate: {
        value: "approximately €1,200/person/year",
        units: "€/person/year",
        confidence: 0.5,
        caveats: "Central scenario assumes stable interest rates.",
      },
      impact_on_25yo_in_2027: {
        fiscal: {
          summary: "Higher effective tax burden.",
          quantified: "+€600/year",
        },
        housing: {
          summary: "No supply-side relief; affordability declines.",
          quantified: null,
        },
        pension_outlook: {
          summary: "Replacement rate trending down.",
          quantified: "~52% vs current 60%",
        },
        labor_market: { summary: "Entry-wage compression.", quantified: null },
        environmental_debt: {
          summary: "Transition deferred, costs concentrated post-2035.",
          quantified: null,
        },
        narrative_summary: "Net negative distributional impact on under-35s.",
      },
      impact_on_65yo_in_2027: {
        fiscal: {
          summary: "Pension indexation preserved.",
          quantified: "+€0/year",
        },
        pension: {
          summary: "Replacement rate stable near current 74%.",
          quantified: "~74%",
        },
        healthcare: {
          summary: "Access unchanged under central assumptions.",
          quantified: null,
        },
        narrative_summary: "Net neutral-to-positive for current retirees.",
      },
      reasoning:
        "Aggregated from three models reading the same intergenerational fiscal signals.",
      source_refs: ["sources.md#retraites", "sources.md#finances-publiques"],
      confidence: 0.6,
      horizon_matrix: [
        aggHorizonRow("pensions", 1),
        aggHorizonRow("public_debt", -1),
        aggHorizonRow("climate", -1),
        aggHorizonRow("health", 0),
        aggHorizonRow("education", 0),
        aggHorizonRow("housing", -1),
      ],
      agreement: {
        direction_consensus: true,
        magnitude_consensus: "interval",
        dissenting_views: [],
      },
    },
    counterfactual: {
      status_quo_trajectory:
        "Debt rises toward 120% of GDP, housing access continues to decline.",
      does_program_change_trajectory: true,
      direction_of_change: "mixed",
      dimensions_changed: ["economic_fiscal", "environmental_long_term"],
      dimensions_unchanged: ["institutional_democratic"],
      reasoning: "Fiscal path bends, institutional arrangements unchanged.",
      confidence: 0.7,
      ...provenance,
    },
    unsolved_problems: [
      {
        problem: "Regional inequality in medical-desert districts",
        why_unsolved: "Program does not propose incentive structures.",
        severity_if_unsolved: "high",
        source_refs: [],
        ...provenance,
      },
    ],
    downside_scenarios: [
      {
        scenario: "Market-rate spike triggers debt-service crisis.",
        trigger: "10-year OAT yield above 4.5%.",
        probability: 0.3,
        severity: 0.8,
        reasoning: "Debt-service capacity is tight under central assumptions.",
        ...provenance,
      },
    ],
    agreement_map: {
      high_confidence_claims: [
        { claim_id: "economic_fiscal.problems_addressed.0", models: [MODEL_A, MODEL_B, MODEL_C] },
      ],
      contested_claims: [
        {
          claim_id: "positioning.sovereignty",
          positions: [
            { model: MODEL_A, position: "+1" },
            { model: MODEL_B, position: "+2" },
            { model: MODEL_C, position: "+3" },
          ],
        },
      ],
      coverage: {
        [MODEL_A]: "complete",
        [MODEL_B]: "complete",
        [MODEL_C]: "complete",
      },
      positioning_consensus: {
        economic: { interval: [-3, -1], modal: -2, dissent_count: 0 },
        social_cultural: { interval: [0, 1], modal: 0, dissent_count: 0 },
        sovereignty: { interval: [1, 3], modal: 1, dissent_count: 1 },
        institutional: { interval: [-1, 0], modal: -1, dissent_count: 0 },
        ecological: { interval: [1, 3], modal: 2, dissent_count: 0 },
        overall_spectrum: {
          modal_label: "centre_gauche" as const,
          distribution: { centre_gauche: 2, gauche: 1 },
          dissent_count: 1,
        },
      },
    },
    coverage_warning: false,
    flagged_for_review: [
      {
        claim: "A numeric claim about subsidies that sources.md does not support.",
        claimed_by: [MODEL_B],
        issue: "claim not supported by sources.md",
        suggested_action: "human review required",
      },
    ],
  };
}
