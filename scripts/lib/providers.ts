/**
 * LLM provider abstraction for the analysis pipeline.
 * See docs/specs/data-pipeline/overview.md
 */

/** Parameters for an LLM call. */
export interface LLMCallParams {
  /** Exact model version string (e.g. "claude-opus-4-7") */
  model: string;
  /** The full prompt text */
  prompt: string;
  /** The source content (sources.md or aggregated inputs) */
  sourceContent: string;
  /** Sampling temperature (typically 0 for deterministic analysis) */
  temperature: number;
  /** Maximum output tokens */
  maxTokens?: number;
}

/** Result of an LLM call. */
export interface LLMCallResult {
  /** Raw response text (expected to be JSON for analysis calls) */
  content: string;
  /** Exact model version string as returned by the API */
  model: string;
  /** Input token count */
  tokensIn: number;
  /** Output token count */
  tokensOut: number;
  /** Estimated cost in USD */
  costEstimateUsd: number;
  /** Duration of call in milliseconds */
  durationMs: number;
}

/** A provider that can make LLM calls. */
export interface LLMProvider {
  /** Provider identifier (e.g. "anthropic", "openai") */
  readonly id: string;
  /** Execute an LLM call. */
  call(params: LLMCallParams): Promise<LLMCallResult>;
}

/** Pricing per million tokens for cost estimation. */
export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

/** Estimate cost based on token counts and pricing. */
export function estimateCost(
  tokensIn: number,
  tokensOut: number,
  pricing: ModelPricing,
): number {
  return (
    (tokensIn / 1_000_000) * pricing.inputPerMillion +
    (tokensOut / 1_000_000) * pricing.outputPerMillion
  );
}
