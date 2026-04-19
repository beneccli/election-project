---
id: "0014"
title: "LLM provider abstraction layer"
type: task
status: open
priority: high
created: 2026-04-19
milestone: M_DataPipeline
spec: docs/specs/data-pipeline/overview.md
context:
  - scripts/README.md
  - docs/specs/data-pipeline/overview.md
  - docs/specs/analysis/output-schema.md
test_command: npm run test -- providers
depends_on: ["0011", "0013"]
---

## Context

The pipeline calls 4–5 frontier LLMs from different providers (Anthropic, OpenAI, Google, Mistral, xAI). A unified abstraction insulates pipeline scripts from provider-specific SDKs and enables mock providers for testing.

## Objectives

1. **`scripts/lib/providers.ts`** — Provider abstraction
   - Define `LLMProvider` interface:
     ```ts
     interface LLMProvider {
       id: string;              // e.g. "anthropic"
       call(params: LLMCallParams): Promise<LLMCallResult>;
     }
     
     interface LLMCallParams {
       model: string;           // exact model version
       prompt: string;          // the full prompt text
       sourceContent: string;   // sources.md content
       temperature: number;     // typically 0
       maxTokens?: number;
     }
     
     interface LLMCallResult {
       content: string;         // raw response text (should be JSON)
       model: string;           // exact model version returned by API
       tokensIn: number;
       tokensOut: number;
       costEstimateUsd: number;
       durationMs: number;
     }
     ```
   - Implement concrete providers: `AnthropicProvider`, `OpenAIProvider`, `GoogleProvider`, `MistralProvider`, `GrokProvider`
   - Each reads API key from environment variable (e.g., `ANTHROPIC_API_KEY`)
   - Cost estimation using configurable per-model pricing

2. **`scripts/lib/mock-provider.ts`** — Mock provider for testing
   - Returns fixture responses from `scripts/test-fixtures/`
   - Configurable: success, failure, malformed JSON responses
   - Tracks call count and parameters for assertions

3. **`scripts/config/models.ts`** — Model configuration
   - Default model set (the 4–5 models to use)
   - Per-model pricing for cost estimation
   - Export as typed config object

4. **Tests** — `providers.test.ts`
   - Mock provider returns expected fixture
   - Mock provider simulates failure
   - Cost estimation math is correct
   - Real providers are NOT called in tests

## Acceptance Criteria

- [ ] `LLMProvider` interface defined and exported
- [ ] At least 2 concrete provider implementations (Anthropic + OpenAI minimum)
- [ ] Mock provider implemented with configurable responses
- [ ] Model config file with default model set
- [ ] API keys read from env vars, not hardcoded
- [ ] Cost estimation works for known token counts
- [ ] All tests pass: `npm run test -- providers`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`

## Hints for Agent

- Install LLM SDKs: `@anthropic-ai/sdk`, `openai`, `@google/generative-ai`, `@mistralai/mistralai`
- Provider implementations need not be perfect for v1 — the structure and interface matter more
- Use dependency injection pattern: scripts receive a provider list, tests inject mock providers
- Pricing can be approximate — it's for cost tracking, not billing

## Editorial check (if applicable)

- [ ] Any asymmetry introduced between candidates? → No, providers are candidate-agnostic
