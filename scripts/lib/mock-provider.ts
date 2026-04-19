/**
 * Mock LLM provider for testing.
 * See docs/specs/data-pipeline/overview.md — test with fixtures, not live APIs.
 */
import type { LLMProvider, LLMCallParams, LLMCallResult } from "./providers.js";

export interface MockCall {
  params: LLMCallParams;
  timestamp: number;
}

export interface MockProviderOptions {
  /** Provider ID */
  id?: string;
  /** Model version string to return */
  modelVersion?: string;
  /** Content to return (simulated LLM response) */
  response?: string;
  /** If set, the call will reject with this error */
  error?: Error;
  /** Simulated token counts */
  tokensIn?: number;
  tokensOut?: number;
  /** Simulated duration in ms */
  durationMs?: number;
}

export class MockProvider implements LLMProvider {
  readonly id: string;
  private options: MockProviderOptions;
  private _calls: MockCall[] = [];

  constructor(options: MockProviderOptions = {}) {
    this.id = options.id ?? "mock";
    this.options = options;
  }

  /** All calls made to this provider. */
  get calls(): readonly MockCall[] {
    return this._calls;
  }

  /** Number of calls made. */
  get callCount(): number {
    return this._calls.length;
  }

  /** Reset call tracking. */
  reset(): void {
    this._calls = [];
  }

  async call(params: LLMCallParams): Promise<LLMCallResult> {
    this._calls.push({ params, timestamp: Date.now() });

    if (this.options.error) {
      throw this.options.error;
    }

    const tokensIn = this.options.tokensIn ?? 1000;
    const tokensOut = this.options.tokensOut ?? 500;

    return {
      content: this.options.response ?? '{"mock": true}',
      model: this.options.modelVersion ?? params.model,
      tokensIn,
      tokensOut,
      costEstimateUsd: 0.01,
      durationMs: this.options.durationMs ?? 100,
    };
  }
}

/** Create a mock provider that returns valid JSON content. */
export function createSuccessMock(
  id: string,
  modelVersion: string,
  response: string,
): MockProvider {
  return new MockProvider({ id, modelVersion, response });
}

/** Create a mock provider that simulates a failure. */
export function createFailureMock(
  id: string,
  error?: Error,
): MockProvider {
  return new MockProvider({
    id,
    error: error ?? new Error(`Mock provider ${id} simulated failure`),
  });
}

/** Create a mock provider that returns malformed (non-JSON) content. */
export function createMalformedMock(
  id: string,
  modelVersion: string,
): MockProvider {
  return new MockProvider({
    id,
    modelVersion,
    response: "This is not valid JSON {{{",
  });
}
