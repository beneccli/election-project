/**
 * Model configuration for the analysis pipeline.
 * See docs/specs/data-pipeline/overview.md
 */
import type { ModelPricing } from "../lib/providers.js";

/** A configured model for the analysis pipeline. */
export interface ModelConfig {
  /** Exact model version string sent to the API */
  model: string;
  /** Provider identifier */
  provider: "anthropic" | "openai" | "google" | "mistral" | "xai";
  /** Temperature for this model (typically 0) */
  temperature: number;
  /** Max output tokens */
  maxTokens: number;
}

/** Default set of models for analysis runs. */
export const DEFAULT_MODELS: ModelConfig[] = [
  {
    model: "claude-opus-4-0-20250514",
    provider: "anthropic",
    temperature: 0,
    maxTokens: 16384,
  },
  {
    model: "gpt-4.1-2025-04-14",
    provider: "openai",
    temperature: 0,
    maxTokens: 16384,
  },
  {
    model: "gemini-2.5-pro",
    provider: "google",
    temperature: 0,
    maxTokens: 16384,
  },
  {
    model: "mistral-large-latest",
    provider: "mistral",
    temperature: 0,
    maxTokens: 16384,
  },
  {
    model: "grok-3",
    provider: "xai",
    temperature: 0,
    maxTokens: 16384,
  },
];

/**
 * Pricing per million tokens (approximate, for cost tracking — not billing).
 * Keyed by model string or "default-<provider>" fallback.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic
  "claude-opus-4-0-20250514": { inputPerMillion: 15, outputPerMillion: 75 },
  "default-anthropic": { inputPerMillion: 15, outputPerMillion: 75 },

  // OpenAI
  "gpt-4.1-2025-04-14": { inputPerMillion: 2, outputPerMillion: 8 },
  "default-openai": { inputPerMillion: 2, outputPerMillion: 8 },

  // Google
  "gemini-2.5-pro": { inputPerMillion: 1.25, outputPerMillion: 10 },
  "default-google": { inputPerMillion: 1.25, outputPerMillion: 10 },

  // Mistral
  "mistral-large-latest": { inputPerMillion: 2, outputPerMillion: 6 },
  "default-mistral": { inputPerMillion: 2, outputPerMillion: 6 },

  // xAI (Grok)
  "grok-3": { inputPerMillion: 3, outputPerMillion: 15 },
  "default-xai": { inputPerMillion: 3, outputPerMillion: 15 },
};
