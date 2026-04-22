// See docs/specs/website/comparison-page.md §4 (Positionnement).
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { COMPARISON_COLORS } from "@/lib/comparison-colors";
import { AXIS_KEYS, DIMENSION_KEYS } from "@/lib/derived/keys";
import { ComparisonRadar } from "./ComparisonRadar";
import { PositionnementRows } from "./PositionnementRows";
import type { ComparisonProjection } from "@/lib/derived/comparison-projection";

function makeProjection(
  id: string,
  name: string,
  positioning: Array<number | null>,
): ComparisonProjection {
  const dimGrades = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, "C" as const]),
  ) as ComparisonProjection["dimGrades"];
  const risks = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, [-1, -1, -1, -1] as Array<-1>]),
  ) as ComparisonProjection["risks"];
  return {
    id,
    displayName: name,
    party: "Parti",
    partyShort: "PR",
    updatedAt: "2026-01-01T00:00:00Z",
    versionDate: "2026-01-01",
    isFictional: true,
    analyzable: true,
    overallGrade: "C",
    overallGradeModifier: null,
    positioning,
    dimGrades,
    risks,
    intergen: {
      pensions: null,
      public_debt: null,
      climate: null,
      health: null,
      education: null,
      housing: null,
    },
  };
}

describe("ComparisonRadar", () => {
  it("renders one polygon per candidate (2..4)", () => {
    for (const n of [2, 3, 4] as const) {
      const candidates = Array.from({ length: n }, (_, i) =>
        makeProjection(`c${i}`, `C${i}`, AXIS_KEYS.map(() => i)),
      );
      const html = renderToStaticMarkup(
        <ComparisonRadar
          candidates={candidates}
          slotColors={COMPARISON_COLORS}
        />,
      );
      const matches = html.match(/data-candidate="c\d"/g) ?? [];
      expect(matches).toHaveLength(n);
    }
  });

  it("does NOT render a median/average polygon", () => {
    const a = makeProjection("a", "A", AXIS_KEYS.map(() => 2));
    const b = makeProjection("b", "B", AXIS_KEYS.map(() => -2));
    const html = renderToStaticMarkup(
      <ComparisonRadar
        candidates={[a, b]}
        slotColors={COMPARISON_COLORS}
      />,
    );
    const matches = html.match(/data-candidate="[ab]"/g) ?? [];
    // Exactly 2 candidate polygons, no third "median" element.
    expect(matches).toHaveLength(2);
    expect(html).not.toMatch(/data-median/);
    expect(html).not.toMatch(/data-average/);
  });

  it("omits polygon when all axis modals are null", () => {
    const a = makeProjection("a", "A", AXIS_KEYS.map(() => null));
    const b = makeProjection("b", "B", AXIS_KEYS.map(() => 1));
    const html = renderToStaticMarkup(
      <ComparisonRadar
        candidates={[a, b]}
        slotColors={COMPARISON_COLORS}
      />,
    );
    expect(html).not.toMatch(/data-candidate="a"/);
    expect(html).toMatch(/data-candidate="b"/);
  });

  it("renders canonical axis labels (FR)", () => {
    const a = makeProjection("a", "A", AXIS_KEYS.map(() => 0));
    const b = makeProjection("b", "B", AXIS_KEYS.map(() => 0));
    const html = renderToStaticMarkup(
      <ComparisonRadar
        candidates={[a, b]}
        slotColors={COMPARISON_COLORS}
      />,
    );
    expect(html).toContain("Économique");
    expect(html).toContain("Institutionnel");
  });
});

describe("PositionnementRows", () => {
  it("renders a dot per candidate per axis when modal present", () => {
    const a = makeProjection("a", "A", AXIS_KEYS.map(() => 2));
    const b = makeProjection("b", "B", AXIS_KEYS.map(() => -1));
    const html = renderToStaticMarkup(
      <PositionnementRows
        candidates={[a, b]}
        slotColors={COMPARISON_COLORS}
      />,
    );
    const aDots = html.match(/data-candidate="a"/g) ?? [];
    const bDots = html.match(/data-candidate="b"/g) ?? [];
    expect(aDots).toHaveLength(AXIS_KEYS.length);
    expect(bDots).toHaveLength(AXIS_KEYS.length);
  });

  it("omits a dot when a candidate's modal is null on that axis", () => {
    const a = makeProjection(
      "a",
      "A",
      AXIS_KEYS.map((_, i) => (i === 0 ? null : 2)),
    );
    const b = makeProjection("b", "B", AXIS_KEYS.map(() => 1));
    const html = renderToStaticMarkup(
      <PositionnementRows
        candidates={[a, b]}
        slotColors={COMPARISON_COLORS}
      />,
    );
    const aDots = html.match(/data-candidate="a"/g) ?? [];
    expect(aDots).toHaveLength(AXIS_KEYS.length - 1);
  });

  it("renders spread marker '⚡ ±K' iff max − min ≥ 2", () => {
    // Spread 1 on all axes → no marker.
    const a1 = makeProjection("a", "A", AXIS_KEYS.map(() => 0));
    const b1 = makeProjection("b", "B", AXIS_KEYS.map(() => 1));
    const html1 = renderToStaticMarkup(
      <PositionnementRows
        candidates={[a1, b1]}
        slotColors={COMPARISON_COLORS}
      />,
    );
    expect(html1).not.toContain("⚡");

    // Spread exactly 2 on all axes → marker present.
    const a2 = makeProjection("a", "A", AXIS_KEYS.map(() => -1));
    const b2 = makeProjection("b", "B", AXIS_KEYS.map(() => 1));
    const html2 = renderToStaticMarkup(
      <PositionnementRows
        candidates={[a2, b2]}
        slotColors={COMPARISON_COLORS}
      />,
    );
    const markers = html2.match(/⚡ ±2/g) ?? [];
    expect(markers.length).toBeGreaterThanOrEqual(AXIS_KEYS.length);

    // Spread 4 → ±4 marker.
    const a3 = makeProjection("a", "A", AXIS_KEYS.map(() => -2));
    const b3 = makeProjection("b", "B", AXIS_KEYS.map(() => 2));
    const html3 = renderToStaticMarkup(
      <PositionnementRows
        candidates={[a3, b3]}
        slotColors={COMPARISON_COLORS}
      />,
    );
    expect(html3).toContain("⚡ ±4");
  });

  it("emits title='<name>: <modal>' per dot", () => {
    const a = makeProjection("a", "Alpha", AXIS_KEYS.map(() => 2));
    const b = makeProjection("b", "Beta", AXIS_KEYS.map(() => -1));
    const html = renderToStaticMarkup(
      <PositionnementRows
        candidates={[a, b]}
        slotColors={COMPARISON_COLORS}
      />,
    );
    expect(html).toContain('title="Alpha: 2"');
    expect(html).toContain('title="Beta: -1"');
  });
});
