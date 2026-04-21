import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { AggregatedOutput } from "@/lib/schema";
import { DIMENSION_KEYS, type DimensionKey } from "@/lib/derived/keys";
import { RiskSummaryMatrix } from "./RiskSummaryMatrix";

type Dimensions = AggregatedOutput["dimensions"];
type RiskCategory = Dimensions[DimensionKey]["risk_profile"]["budgetary"];
type RiskLevel = "low" | "limited" | "moderate" | "high";

function category(
  level: RiskLevel,
  dissenters: string[] = [],
  note = "note",
): RiskCategory {
  return {
    modal_level: level,
    level_interval: [level, level],
    note,
    supported_by: ["model-a"],
    dissenters,
    per_model: [
      { model: "model-a", level, note: "a" },
      {
        model: "model-b",
        level: (dissenters.includes("model-b") ? "high" : level) as RiskLevel,
        note: "b",
      },
    ],
  };
}

function buildDimensions(
  overrides: Partial<
    Record<
      DimensionKey,
      Partial<Record<keyof Dimensions[DimensionKey]["risk_profile"], RiskCategory>>
    >
  > = {},
): Dimensions {
  const baseProfile = {
    budgetary: category("low"),
    implementation: category("low"),
    dependency: category("low"),
    reversibility: category("low"),
  };
  const dims = {} as Dimensions;
  for (const key of DIMENSION_KEYS) {
    const prof = { ...baseProfile, ...(overrides[key] ?? {}) };
    dims[key] = {
      // Only risk_profile is used by the widget; fill the rest with minimal
      // type-compatible placeholders via a cast — these fields are unread.
      risk_profile: prof,
    } as unknown as Dimensions[DimensionKey];
  }
  return dims;
}

describe("RiskSummaryMatrix", () => {
  it("renders 5 dimension rows and 4 category columns with FR labels", () => {
    const html = renderToStaticMarkup(
      <RiskSummaryMatrix dimensions={buildDimensions()} />,
    );
    for (const label of [
      "Économique &amp; fiscal",
      "Social &amp; démographique",
      "Sécurité &amp; souveraineté",
      "Institutionnel &amp; démocratique",
      "Environnemental &amp; long terme",
    ]) {
      expect(html).toContain(label);
    }
    for (const cat of [
      "Budgétaire",
      "Mise en œuvre",
      "Dépendance",
      "Réversibilité",
    ]) {
      expect(html).toContain(cat);
    }
  });

  it("shows the level label text in every cell", () => {
    const dims = buildDimensions({
      economic_fiscal: {
        budgetary: category("high"),
        implementation: category("moderate"),
        dependency: category("limited"),
        reversibility: category("low"),
      },
    });
    const html = renderToStaticMarkup(
      <RiskSummaryMatrix dimensions={dims} />,
    );
    expect(html).toContain("Élevé");
    expect(html).toContain("Modéré");
    expect(html).toContain("Limité");
    expect(html).toContain("Faible");
  });

  it("exposes dissenters via tooltip content (no inline badge)", () => {
    const dims = buildDimensions({
      social_demographic: {
        budgetary: category("moderate", ["model-b"]),
      },
    });
    const html = renderToStaticMarkup(
      <RiskSummaryMatrix dimensions={dims} />,
    );
    // Inline ⚡ badge is disabled in the current design; dissenters live
    // inside the per-cell tooltip's per-model rows instead.
    expect(html).toContain("model-b");
  });

  it("exposes the note and per-model levels via tooltip content", () => {
    const dims = buildDimensions({
      security_sovereignty: {
        implementation: category("high", [], "Mise en œuvre complexe"),
      },
    });
    const html = renderToStaticMarkup(
      <RiskSummaryMatrix dimensions={dims} />,
    );
    expect(html).toContain("Mise en œuvre complexe");
    // per-model rows
    expect(html).toContain("model-a");
    expect(html).toContain("model-b");
  });

  it("uses semantic <table> markup with scoped headers", () => {
    const html = renderToStaticMarkup(
      <RiskSummaryMatrix dimensions={buildDimensions()} />,
    );
    expect(html).toContain("<table");
    expect(html).toContain("<thead");
    expect(html).toContain("<tbody");
    expect(html).toContain('scope="row"');
    expect(html).toContain('scope="col"');
  });

  it("renders every ordinal level label in the matrix body", () => {
    const dims = buildDimensions({
      economic_fiscal: {
        budgetary: category("low"),
        implementation: category("limited"),
        dependency: category("moderate"),
        reversibility: category("high"),
      },
    });
    const html = renderToStaticMarkup(
      <RiskSummaryMatrix dimensions={dims} />,
    );
    // The legend is currently disabled in the design; the four ordinal
    // labels must still appear inline in the matrix itself.
    for (const label of ["Faible", "Limité", "Modéré", "Élevé"]) {
      expect(html).toContain(label);
    }
  });
});
