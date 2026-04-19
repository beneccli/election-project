import { describe, it, expect } from "vitest";
import { estimateCost } from "./providers.js";
import {
  MockProvider,
  createSuccessMock,
  createFailureMock,
  createMalformedMock,
} from "./mock-provider.js";
import type { LLMCallParams } from "./providers.js";

const defaultParams: LLMCallParams = {
  model: "test-model-v1",
  prompt: "Analyze the following program",
  sourceContent: "The candidate proposes...",
  temperature: 0,
};

describe("providers", () => {
  describe("estimateCost", () => {
    it("calculates_cost_correctly_for_known_tokens", () => {
      // 1M input tokens at $15/M + 500K output tokens at $75/M = $15 + $37.5 = $52.5
      const cost = estimateCost(1_000_000, 500_000, {
        inputPerMillion: 15,
        outputPerMillion: 75,
      });
      expect(cost).toBeCloseTo(52.5);
    });

    it("returns_zero_for_zero_tokens", () => {
      const cost = estimateCost(0, 0, {
        inputPerMillion: 15,
        outputPerMillion: 75,
      });
      expect(cost).toBe(0);
    });

    it("handles_small_token_counts", () => {
      // 42000 in at $15/M + 8500 out at $75/M = $0.63 + $0.6375 = $1.2675
      const cost = estimateCost(42000, 8500, {
        inputPerMillion: 15,
        outputPerMillion: 75,
      });
      expect(cost).toBeCloseTo(1.2675, 2);
    });
  });
});

describe("MockProvider", () => {
  it("returns_configured_response", async () => {
    const provider = new MockProvider({
      id: "test",
      modelVersion: "test-v1",
      response: '{"result": "success"}',
    });
    const result = await provider.call(defaultParams);
    expect(result.content).toBe('{"result": "success"}');
    expect(result.model).toBe("test-v1");
  });

  it("tracks_calls", async () => {
    const provider = new MockProvider({ id: "test" });
    expect(provider.callCount).toBe(0);
    await provider.call(defaultParams);
    await provider.call(defaultParams);
    expect(provider.callCount).toBe(2);
    expect(provider.calls[0]?.params.model).toBe("test-model-v1");
  });

  it("reset_clears_calls", async () => {
    const provider = new MockProvider({ id: "test" });
    await provider.call(defaultParams);
    expect(provider.callCount).toBe(1);
    provider.reset();
    expect(provider.callCount).toBe(0);
  });

  it("throws_configured_error", async () => {
    const provider = new MockProvider({
      id: "test",
      error: new Error("API rate limit"),
    });
    await expect(provider.call(defaultParams)).rejects.toThrow("API rate limit");
  });

  it("uses_params_model_as_fallback", async () => {
    const provider = new MockProvider({ id: "test" });
    const result = await provider.call(defaultParams);
    expect(result.model).toBe("test-model-v1");
  });
});

describe("createSuccessMock", () => {
  it("returns_provider_with_configured_response", async () => {
    const provider = createSuccessMock("anthropic", "claude-opus-4-7", '{"ok": true}');
    expect(provider.id).toBe("anthropic");
    const result = await provider.call(defaultParams);
    expect(result.content).toBe('{"ok": true}');
    expect(result.model).toBe("claude-opus-4-7");
  });
});

describe("createFailureMock", () => {
  it("returns_provider_that_throws", async () => {
    const provider = createFailureMock("openai");
    expect(provider.id).toBe("openai");
    await expect(provider.call(defaultParams)).rejects.toThrow("simulated failure");
  });

  it("uses_custom_error", async () => {
    const provider = createFailureMock("openai", new Error("custom error"));
    await expect(provider.call(defaultParams)).rejects.toThrow("custom error");
  });
});

describe("createMalformedMock", () => {
  it("returns_provider_with_non_json_response", async () => {
    const provider = createMalformedMock("google", "gemini-2.5-pro");
    const result = await provider.call(defaultParams);
    expect(() => JSON.parse(result.content)).toThrow();
  });
});
