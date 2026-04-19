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
