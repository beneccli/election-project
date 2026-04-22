// See docs/specs/website/comparison-page.md §5.
// Page-shell tests for task 0097. ComparisonBody itself has router +
// localStorage side effects we do not want to reach for in a node env;
// instead we unit-test the three components it composes (selector,
// sticky header, scoped transparency footer) by mocking the context
// hook they share.
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComparisonProjection, ComparisonEntry } from "@/lib/derived/comparison-projection";
import { DIMENSION_KEYS } from "@/lib/derived/keys";
import type { RiskLevelIndex } from "@/lib/derived/comparison-projection";

// ---- Mocks ---------------------------------------------------------------

const mockCtx = {
  entries: [] as ComparisonEntry[],
  selectedIds: [] as string[],
  slotOf: (id: string) => mockCtx.selectedIds.indexOf(id),
  toggle: () => {},
  maxReached: false,
  excludeFictional: false,
};

vi.mock("@/components/comparison/ComparisonBody", () => ({
  useComparison: () => mockCtx,
}));

vi.mock("@/lib/lang-context", () => ({
  useLang: () => ({ lang: "fr", setLang: () => {} }),
}));

// Imports must follow mocks.
const { CandidateSelector } = await import(
  "@/components/comparison/CandidateSelector"
);
const { SelectedHeader } = await import(
  "@/components/comparison/SelectedHeader"
);
const { ComparisonTransparencyFooter } = await import(
  "@/components/comparison/ComparisonTransparencyFooter"
);

// ---- Helpers -------------------------------------------------------------

function makeProjection(
  id: string,
  name: string,
  opts: Partial<ComparisonProjection> = {},
): ComparisonProjection {
  const dimGrades = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, "C" as const]),
  ) as ComparisonProjection["dimGrades"];
  const risks = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, [-1, -1, -1, -1] as RiskLevelIndex[]]),
  ) as ComparisonProjection["risks"];
  return {
    id,
    displayName: name,
    party: "Parti Exemple",
    partyShort: "PEX",
    updatedAt: "2026-01-01T00:00:00Z",
    versionDate: "2026-01-01",
    isFictional: false,
    analyzable: true,
    overallGrade: "B",
    overallGradeModifier: null,
    positioning: [0, 0, 0, 0, 0],
    dimGrades,
    risks,
    intergen: {
      pensions: 0,
      public_debt: 0,
      climate: 0,
      health: 0,
      education: 0,
      housing: 0,
    },
    ...opts,
  };
}

function setCtx(partial: Partial<typeof mockCtx>) {
  Object.assign(mockCtx, partial);
}

// ---- Tests ---------------------------------------------------------------

describe("ComparisonBody page-shell — CandidateSelector", () => {
  it("renders an accessible label including name, party and grade", () => {
    setCtx({
      entries: [makeProjection("alpha", "Alpha One")],
      selectedIds: [],
      maxReached: false,
      excludeFictional: false,
    });
    const html = renderToStaticMarkup(<CandidateSelector />);
    expect(html).toMatch(
      /aria-label="Sélectionner Alpha One, Parti Exemple, note globale B"/,
    );
    expect(html).toContain('data-candidate="alpha"');
  });

  it("disables unselected tiles when maxReached", () => {
    setCtx({
      entries: [
        makeProjection("a", "A"),
        makeProjection("b", "B"),
      ],
      selectedIds: ["a"],
      maxReached: true,
    });
    const html = renderToStaticMarkup(<CandidateSelector />);
    // Tile "b" is not selected → must be disabled.
    expect(html).toMatch(/<button[^>]*disabled[^>]*data-candidate="b"/);
    // Tile "a" is selected → aria-pressed true.
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*data-candidate="a"/);
  });

  it("hides fictional entries when excludeFictional is true", () => {
    setCtx({
      entries: [
        makeProjection("a", "A", { isFictional: true }),
        makeProjection("b", "B", { isFictional: false }),
      ],
      selectedIds: [],
      maxReached: false,
      excludeFictional: true,
    });
    const html = renderToStaticMarkup(<CandidateSelector />);
    expect(html).not.toContain('data-candidate="a"');
    expect(html).toContain('data-candidate="b"');
  });
});

describe("ComparisonBody page-shell — SelectedHeader", () => {
  it("renders nothing when fewer than 2 are selected", () => {
    setCtx({
      entries: [makeProjection("a", "Alpha")],
      selectedIds: ["a"],
    });
    const html = renderToStaticMarkup(<SelectedHeader />);
    expect(html).toBe("");
  });

  it("renders a chip per selected candidate with slot color", () => {
    setCtx({
      entries: [
        makeProjection("a", "Alpha Alpha"),
        makeProjection("b", "Bravo Bravo"),
      ],
      selectedIds: ["a", "b"],
    });
    const html = renderToStaticMarkup(<SelectedHeader />);
    expect(html).toContain('data-candidate="a"');
    expect(html).toContain('data-candidate="b"');
    // First-name only in chip.
    expect(html).toMatch(/>Alpha</);
    expect(html).toMatch(/>Bravo</);
    // Sticky positioning class present.
    expect(html).toMatch(/sticky/);
    expect(html).toMatch(/top-nav-h/);
  });
});

describe("ComparisonBody page-shell — ComparisonTransparencyFooter", () => {
  it("links to per-version metadata.json for each selected candidate", () => {
    setCtx({
      entries: [
        makeProjection("alpha", "Alpha", { versionDate: "2026-03-15" }),
        makeProjection("bravo", "Bravo", { versionDate: "2026-04-01" }),
      ],
      selectedIds: ["alpha", "bravo"],
    });
    const html = renderToStaticMarkup(<ComparisonTransparencyFooter />);
    expect(html).toContain(
      'href="/candidates/alpha/versions/2026-03-15/metadata.json"',
    );
    expect(html).toContain(
      'href="/candidates/bravo/versions/2026-04-01/metadata.json"',
    );
    // And a link back to the candidate page.
    expect(html).toContain('href="/candidat/alpha"');
    // No drawer / raw-outputs exposure on this page.
    expect(html).not.toContain("raw-outputs");
    expect(html).not.toContain("data-transparency-trigger");
  });

  it("shows the empty-state line when nothing is selected", () => {
    setCtx({ entries: [], selectedIds: [] });
    const html = renderToStaticMarkup(<ComparisonTransparencyFooter />);
    expect(html).toMatch(/Aucun candidat sélectionné/);
  });
});
