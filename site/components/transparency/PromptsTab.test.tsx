// See docs/specs/website/transparency.md §6
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildCards,
  PromptCardView,
  type PromptCardInput,
} from "./PromptsTab";
import type { VersionMetadata } from "@/lib/schema";

const SHA_A =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SHA_B =
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const SHA_C =
  "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

function meta(
  override: Partial<VersionMetadata> = {},
): VersionMetadata {
  return {
    candidate_id: "test-omega",
    version_date: "2027-11-01",
    schema_version: "1.1",
    analysis: {
      prompt_file: "prompts/analyze-candidate.md",
      prompt_sha256: SHA_A,
      prompt_version: "3",
      models: {},
    },
    aggregation: {
      prompt_file: "prompts/aggregate-analyses.md",
      prompt_sha256: SHA_B,
      prompt_version: "2",
      aggregator_model: {
        provider: "anthropic",
        exact_version: "claude-opus-4-7",
        execution_mode: "api",
        run_at: "2027-11-01T00:00:00Z",
      },
      human_review_completed: true,
    },
    ...override,
  } as VersionMetadata;
}

const SAMPLE_CARD: PromptCardInput = {
  role: "analysis",
  label: "Prompt d’analyse",
  promptFile: "prompts/analyze-candidate.md",
  promptVersion: "3",
  promptSha256: SHA_A,
};

describe("buildCards", () => {
  it("emits an analysis and aggregation card when both are present", () => {
    const cards = buildCards(meta());
    expect(cards.map((c) => c.role)).toEqual(["analysis", "aggregation"]);
    expect(cards[0]!.promptSha256).toBe(SHA_A);
    expect(cards[1]!.promptSha256).toBe(SHA_B);
  });

  it("omits the consolidation card when no consolidation SHA is recorded", () => {
    const cards = buildCards(meta());
    expect(cards.find((c) => c.role === "consolidation")).toBeUndefined();
  });

  it("includes the consolidation card when a SHA is present", () => {
    const cards = buildCards(
      meta({
        sources: {
          consolidation_method: "manual",
          consolidation_prompt_sha256: SHA_C,
          consolidation_prompt_version: "1",
        },
      }),
    );
    expect(cards.map((c) => c.role)).toEqual([
      "consolidation",
      "analysis",
      "aggregation",
    ]);
    expect(cards[0]!.promptSha256).toBe(SHA_C);
  });

  it("omits analysis and aggregation when absent from metadata", () => {
    const cards = buildCards(
      meta({ analysis: undefined, aggregation: undefined }),
    );
    expect(cards).toEqual([]);
  });
});

describe("PromptCardView", () => {
  it("renders the label, file, version, and full SHA256 in the loading state", () => {
    const html = renderToStaticMarkup(
      <PromptCardView
        card={SAMPLE_CARD}
        state={{ phase: "loading" }}
        highlighted={false}
      />,
    );
    expect(html).toContain("Prompt d’analyse");
    expect(html).toContain("prompts/analyze-candidate.md");
    expect(html).toContain("v3");
    // full SHA, never truncated
    expect(html).toContain(SHA_A);
    expect(html).toContain("Chargement");
  });

  it("renders the 'missing' state with a git-history link", () => {
    const html = renderToStaticMarkup(
      <PromptCardView
        card={SAMPLE_CARD}
        state={{ phase: "missing", status: 404 }}
        highlighted={false}
      />,
    );
    expect(html).toContain("Prompt non disponible");
    expect(html).toContain("github.com");
    expect(html).toContain(
      "/commits/HEAD/prompts/analyze-candidate.md",
    );
  });

  it("renders a red digest-mismatch warning when computed sha differs", () => {
    const html = renderToStaticMarkup(
      <PromptCardView
        card={SAMPLE_CARD}
        state={{
          phase: "match",
          body: "# hello",
          computedSha256: SHA_B,
        }}
        highlighted={false}
      />,
    );
    expect(html).toContain("Empreinte SHA256 divergente");
    expect(html).toContain(`attendue : ${SHA_A}`);
    expect(html).toContain(`calculée : ${SHA_B}`);
  });

  it("does not show the mismatch banner when the digest matches", () => {
    const html = renderToStaticMarkup(
      <PromptCardView
        card={SAMPLE_CARD}
        state={{
          phase: "match",
          body: "# hello",
          computedSha256: SHA_A,
        }}
        highlighted={false}
      />,
    );
    expect(html).not.toContain("Empreinte SHA256 divergente");
    expect(html).toContain("# hello");
  });

  it("applies a visible highlight when highlighted is true", () => {
    const plain = renderToStaticMarkup(
      <PromptCardView
        card={SAMPLE_CARD}
        state={{ phase: "loading" }}
        highlighted={false}
      />,
    );
    const hot = renderToStaticMarkup(
      <PromptCardView
        card={SAMPLE_CARD}
        state={{ phase: "loading" }}
        highlighted={true}
      />,
    );
    expect(plain).toContain("border-rule");
    expect(hot).toContain("border-accent");
  });
});
