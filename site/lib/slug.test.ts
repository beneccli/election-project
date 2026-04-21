import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("lowercases ascii", () => {
    expect(slugify("Retraites")).toBe("retraites");
  });

  it("strips French accents", () => {
    expect(slugify("Éducation")).toBe("education");
    expect(slugify("Énergie & Climat")).toBe("energie-climat");
    expect(slugify("Santé publique")).toBe("sante-publique");
    expect(slugify("Déficit intérêts œ")).toBe("deficit-interets");
  });

  it("collapses runs of punctuation and whitespace into a single dash", () => {
    expect(slugify("  Retraites   &   Pensions  ")).toBe(
      "retraites-pensions",
    );
    expect(slugify("art. 49-3 !!!")).toBe("art-49-3");
    expect(slugify("a--b__c")).toBe("a-b-c");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("---Retraites---")).toBe("retraites");
    expect(slugify("!!!")).toBe("");
  });

  it("is stable across invocations", () => {
    const input = "Dette publique & intergénérationnel";
    expect(slugify(input)).toBe(slugify(input));
  });
});
