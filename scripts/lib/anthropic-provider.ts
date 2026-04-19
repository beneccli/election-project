/**
 * Anthropic LLM provider implementation.
 * See docs/specs/data-pipeline/overview.md
 */
import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, LLMCallParams, LLMCallResult } from "./providers.js";
import { estimateCost } from "./providers.js";
import { MODEL_PRICING } from "../config/models.js";

export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic";
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  async call(params: LLMCallParams): Promise<LLMCallResult> {
    const start = Date.now();
    const response = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 16384,
      temperature: params.temperature,
      system: params.prompt,
      messages: [{ role: "user", content: params.sourceContent }],
    });

    const tokensIn = response.usage.input_tokens;
    const tokensOut = response.usage.output_tokens;
    const pricing = MODEL_PRICING[params.model] ?? MODEL_PRICING["default-anthropic"];
    const content =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    return {
      content,
      model: response.model,
      tokensIn,
      tokensOut,
      costEstimateUsd: estimateCost(tokensIn, tokensOut, pricing),
      durationMs: Date.now() - start,
    };
  }
}
