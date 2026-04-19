/**
 * Mistral LLM provider implementation.
 * See docs/specs/data-pipeline/overview.md
 */
import { Mistral } from "@mistralai/mistralai";
import type { LLMProvider, LLMCallParams, LLMCallResult } from "./providers.js";
import { estimateCost } from "./providers.js";
import { MODEL_PRICING } from "../config/models.js";

export class MistralProvider implements LLMProvider {
  readonly id = "mistral";
  private client: Mistral;

  constructor() {
    const apiKey = process.env["MISTRAL_API_KEY"];
    if (!apiKey) throw new Error("MISTRAL_API_KEY environment variable required");
    this.client = new Mistral({ apiKey });
  }

  async call(params: LLMCallParams): Promise<LLMCallResult> {
    const start = Date.now();
    const response = await this.client.chat.complete({
      model: params.model,
      maxTokens: params.maxTokens ?? 16384,
      temperature: params.temperature,
      messages: [
        { role: "system", content: params.prompt },
        { role: "user", content: params.sourceContent },
      ],
    });

    const tokensIn = response.usage?.promptTokens ?? 0;
    const tokensOut = response.usage?.completionTokens ?? 0;
    const pricing = MODEL_PRICING[params.model] ?? MODEL_PRICING["default-mistral"];
    const content =
      response.choices?.[0]?.message?.content ?? "";

    return {
      content: typeof content === "string" ? content : JSON.stringify(content),
      model: response.model ?? params.model,
      tokensIn,
      tokensOut,
      costEstimateUsd: estimateCost(tokensIn, tokensOut, pricing),
      durationMs: Date.now() - start,
    };
  }
}
