/**
 * xAI (Grok) LLM provider implementation.
 * Uses OpenAI-compatible API.
 * See docs/specs/data-pipeline/overview.md
 */
import OpenAI from "openai";
import type { LLMProvider, LLMCallParams, LLMCallResult } from "./providers.js";
import { estimateCost } from "./providers.js";
import { MODEL_PRICING } from "../config/models.js";

export class GrokProvider implements LLMProvider {
  readonly id = "xai";
  private client: OpenAI;

  constructor() {
    const apiKey = process.env["XAI_API_KEY"];
    if (!apiKey) throw new Error("XAI_API_KEY environment variable required");
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1",
    });
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
    const pricing = MODEL_PRICING[params.model] ?? MODEL_PRICING["default-xai"];
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
