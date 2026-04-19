/**
 * Google Generative AI provider implementation.
 * See docs/specs/data-pipeline/overview.md
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMProvider, LLMCallParams, LLMCallResult } from "./providers.js";
import { estimateCost } from "./providers.js";
import { MODEL_PRICING } from "../config/models.js";

export class GoogleProvider implements LLMProvider {
  readonly id = "google";
  private client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env["GOOGLE_API_KEY"];
    if (!apiKey) throw new Error("GOOGLE_API_KEY environment variable required");
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async call(params: LLMCallParams): Promise<LLMCallResult> {
    const start = Date.now();
    const model = this.client.getGenerativeModel({
      model: params.model,
      generationConfig: {
        temperature: params.temperature,
        maxOutputTokens: params.maxTokens ?? 16384,
      },
    });

    const response = await model.generateContent(
      params.prompt + "\n\n---\n\n" + params.sourceContent,
    );

    const result = response.response;
    const tokensIn = result.usageMetadata?.promptTokenCount ?? 0;
    const tokensOut = result.usageMetadata?.candidatesTokenCount ?? 0;
    const pricing = MODEL_PRICING[params.model] ?? MODEL_PRICING["default-google"];
    const content = result.text();

    return {
      content,
      model: params.model,
      tokensIn,
      tokensOut,
      costEstimateUsd: estimateCost(tokensIn, tokensOut, pricing),
      durationMs: Date.now() - start,
    };
  }
}
