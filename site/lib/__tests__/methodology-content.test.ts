// See docs/specs/website/methodology-page.md §6.

import { describe, expect, test } from "vitest";
import { UI_STRINGS } from "@/lib/i18n";
import {
  DIMENSION_LABEL_KEYS,
  EDITORIAL_PRINCIPLES,
  METHODOLOGY_SECTION_IDS,
  NOT_THIS_BULLETS,
  PIPELINE_STAGES,
  REPO_URL,
} from "@/lib/methodology-content";

describe("methodology-content", () => {
  test("REPO_URL is an https URL", () => {
    expect(REPO_URL.startsWith("https://")).toBe(true);
  });

  test("section IDs match the spec count and are unique", () => {
    expect(METHODOLOGY_SECTION_IDS).toHaveLength(10);
    expect(new Set(METHODOLOGY_SECTION_IDS).size).toBe(10);
  });

  test("PIPELINE_STAGES has 6 stages with i18n keys that exist", () => {
    expect(PIPELINE_STAGES).toHaveLength(6);
    for (const stage of PIPELINE_STAGES) {
      expect(UI_STRINGS[stage.titleKey]).toBeDefined();
      expect(UI_STRINGS[stage.bodyKey]).toBeDefined();
      expect(stage.specHref.startsWith("https://")).toBe(true);
    }
  });

  test("EDITORIAL_PRINCIPLES has 5 principles with i18n keys that exist", () => {
    expect(EDITORIAL_PRINCIPLES).toHaveLength(5);
    for (const p of EDITORIAL_PRINCIPLES) {
      expect(UI_STRINGS[p.titleKey]).toBeDefined();
      expect(UI_STRINGS[p.statementKey]).toBeDefined();
      expect(UI_STRINGS[p.exampleKey]).toBeDefined();
    }
  });

  test("NOT_THIS_BULLETS has 6 entries that resolve to UI strings", () => {
    expect(NOT_THIS_BULLETS).toHaveLength(6);
    for (const k of NOT_THIS_BULLETS) {
      expect(UI_STRINGS[k]).toBeDefined();
    }
  });

  test("DIMENSION_LABEL_KEYS has 7 entries that resolve to UI strings", () => {
    expect(DIMENSION_LABEL_KEYS).toHaveLength(7);
    for (const k of DIMENSION_LABEL_KEYS) {
      expect(UI_STRINGS[k]).toBeDefined();
    }
  });
});
