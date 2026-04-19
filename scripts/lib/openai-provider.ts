/**
 * OpenAI LLM provider implementation.
 * See docs/specs/data-pipeline/overview.md
 */
import OpenAI from "openai";
import type { LLMProvider, LLMCallParams, LLMCallResult } from "./providers";
import { estimateCost } from "./providers";
import { MODEL_PRICING } from "../config/models";

export class OpenAIProvider implements LLMProvider {
  readonly id = "openai";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI();
  }

  async call(params: LLMCallParams): Promise<LLMCallResult> {
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 16384,
      temperature: params.temperature,
      messages: [
        { role: "system", content: params.prompt },
        { role: "user", content: params.sourceContent },
      ],
    });

    const tokensIn = response.usage?.prompt_tokens ?? 0;
    const tokensOut = response.usage?.completion_tokens ?? 0;
    const pricing = MODEL_PRICING[params.model] ?? MODEL_PRICING["default-openai"];
    const content = response.choices[0]?.message?.content ?? "";

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
