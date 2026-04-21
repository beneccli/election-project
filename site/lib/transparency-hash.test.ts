// See docs/specs/website/transparency.md §8
import { describe, expect, it } from "vitest";
import {
  formatTransparencyHash,
  parseTransparencyHash,
  type TransparencyHashState,
} from "./transparency-hash";

describe("parseTransparencyHash", () => {
  it("returns null when hash is empty, null, or non-transparency", () => {
    expect(parseTransparencyHash("")).toBeNull();
    expect(parseTransparencyHash(null)).toBeNull();
    expect(parseTransparencyHash(undefined)).toBeNull();
    expect(parseTransparencyHash("#foo=bar")).toBeNull();
    expect(parseTransparencyHash("#other")).toBeNull();
  });

  it("accepts hashes with or without leading #", () => {
    expect(parseTransparencyHash("#transparence=sources")).toEqual({
      tab: "sources",
    });
    expect(parseTransparencyHash("transparence=sources")).toEqual({
      tab: "sources",
    });
  });

  it("parses all four tabs", () => {
    expect(parseTransparencyHash("#transparence=sources")).toEqual({
      tab: "sources",
    });
    expect(parseTransparencyHash("#transparence=document")).toEqual({
      tab: "document",
    });
    expect(parseTransparencyHash("#transparence=prompts")).toEqual({
      tab: "prompts",
    });
    expect(parseTransparencyHash("#transparence=results")).toEqual({
      tab: "results",
    });
  });

  it("parses secondary parameters", () => {
    expect(
      parseTransparencyHash("#transparence=sources&file=manifesto.pdf"),
    ).toEqual({ tab: "sources", file: "manifesto.pdf" });
    expect(
      parseTransparencyHash("#transparence=document&anchor=retraites"),
    ).toEqual({ tab: "document", anchor: "retraites" });
    expect(
      parseTransparencyHash("#transparence=prompts&sha=abc123"),
    ).toEqual({ tab: "prompts", sha: "abc123" });
    expect(
      parseTransparencyHash("#transparence=results&view=agreement"),
    ).toEqual({ tab: "results", view: "agreement" });
    expect(
      parseTransparencyHash(
        "#transparence=results&view=per-model&model=claude-opus",
      ),
    ).toEqual({ tab: "results", view: "per-model", model: "claude-opus" });
    expect(
      parseTransparencyHash(
        "#transparence=results&view=agreement&claim=claim-42",
      ),
    ).toEqual({ tab: "results", view: "agreement", claim: "claim-42" });
  });

  it("rejects an unknown tab or results view", () => {
    expect(parseTransparencyHash("#transparence=nope")).toBeNull();
    expect(
      parseTransparencyHash("#transparence=results&view=unknown"),
    ).toEqual({ tab: "results" });
  });

  it("rejects the malformed 'transparence' without = token", () => {
    expect(parseTransparencyHash("#transparence")).toBeNull();
  });
});

describe("formatTransparencyHash", () => {
  it("returns empty string for null", () => {
    expect(formatTransparencyHash(null)).toBe("");
  });

  it("round-trips every documented state", () => {
    const cases: TransparencyHashState[] = [
      { tab: "sources" },
      { tab: "sources", file: "manifesto.pdf" },
      { tab: "document" },
      { tab: "document", anchor: "retraites" },
      { tab: "prompts" },
      { tab: "prompts", sha: "abc" },
      { tab: "results" },
      { tab: "results", view: "notes" },
      { tab: "results", view: "per-model" },
      { tab: "results", view: "agreement" },
      { tab: "results", view: "per-model", model: "claude-opus" },
      { tab: "results", view: "agreement", claim: "claim-42" },
    ];
    for (const state of cases) {
      const formatted = formatTransparencyHash(state);
      expect(formatted.startsWith("#transparence=")).toBe(true);
      expect(parseTransparencyHash(formatted)).toEqual(state);
    }
  });
});
