import { describe, expect, it } from "vitest";
import { t, UI_STRINGS } from "./i18n";
import { AXES, ANCHORS_BY_AXIS } from "./anchors";

describe("t()", () => {
  it("returns fr value when lang=fr", () => {
    expect(t({ fr: "Bonjour", en: "Hello" }, "fr")).toBe("Bonjour");
  });

  it("returns en value when lang=en", () => {
    expect(t({ fr: "Bonjour", en: "Hello" }, "en")).toBe("Hello");
  });

  it("falls back to fr if en is empty string? No — only for nullish", () => {
    expect(t({ fr: "A", en: "" }, "en")).toBe("");
  });
});

describe("UI_STRINGS", () => {
  it("every entry has non-empty fr and en", () => {
    for (const [key, value] of Object.entries(UI_STRINGS)) {
      expect(value.fr, `${key}.fr`).toBeTruthy();
      expect(value.en, `${key}.en`).toBeTruthy();
    }
  });

  it("no entry uses [EN] placeholders or matches the FR string verbatim where translation is meaningful", () => {
    // Allowlist of keys whose EN value is intentionally identical to FR
    // (proper nouns, numerals, symbols-only labels, etc.).
    const SAME_BY_DESIGN: ReadonlySet<string> = new Set([
      "COMPARISON_DOMAINES_DIMENSION_LABEL", // "Dimension" identical FR/EN
      "COMPARISON_TRANSPARENCY_TITLE", // "Transparence"/"Transparency" — duplicate of NAV
      "DOMAINES_CONSENSUS_BADGE", // Latin-rooted lowercase, identical
      "DOMAINES_CONSENSUS_PREFIX", // "Consensus" identical with arrow
      "DOMAINES_DISSENT_BADGE", // Symbol + uppercase loanword
      "DOMAINES_PROB_SHORT", // "Prob." abbreviation identical
      "INTERGEN_HORIZON_COHORT_2028_2037", // legacy alias for 2031_2037
      "INTERGEN_HORIZON_COHORT_2031_2037", // duplicates 2028_2037 alias
      "INTERGEN_HORIZON_NOTE_LABEL", // "Note" identical
      "INTERGEN_SOURCES_LABEL", // "Sources" identical in FR/EN
      "INTERGEN_SPLIT_FISCAL", // "Fiscal" identical
      "PROMPTS_COPIED",
      "RADAR_CONSENSUS_LABEL", // "Consensus" identical FR/EN
      "SPECTRUM_LABEL_CENTRE",
      "TRANSPARENCY_SUMMARY_VERSION", // "Version" identical in FR/EN
      "TRANSPARENCY_TAB_PROMPTS", // "Prompts" identical
      "TRANSPARENCY_TAB_SOURCES", // "Sources" identical
    ]);
    for (const [key, value] of Object.entries(UI_STRINGS)) {
      expect(value.en, `${key}.en starts with "[EN] "`).not.toMatch(/^\[EN\]\s/);
      if (!SAME_BY_DESIGN.has(key)) {
        expect(
          value.en,
          `${key}.en is identical to fr — write a real translation or add to allowlist`,
        ).not.toBe(value.fr);
      }
    }
  });

  it("keys are sorted alphabetically (enforces deterministic diffs)", () => {
    const keys = Object.keys(UI_STRINGS);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });
});

describe("anchors", () => {
  it("covers all 5 axes with exactly 4 anchors each", () => {
    expect(AXES).toHaveLength(5);
    for (const axis of AXES) {
      expect(axis.anchors, axis.axis).toHaveLength(4);
    }
  });

  it("ANCHORS_BY_AXIS lookup matches AXES", () => {
    for (const axis of AXES) {
      expect(ANCHORS_BY_AXIS[axis.axis]).toBe(axis);
    }
  });

  it("anchor positions are within [-5, 5]", () => {
    for (const axis of AXES) {
      for (const anchor of axis.anchors) {
        expect(anchor.position).toBeGreaterThanOrEqual(-5);
        expect(anchor.position).toBeLessThanOrEqual(5);
      }
    }
  });
});
