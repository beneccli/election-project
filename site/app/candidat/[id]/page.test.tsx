// See docs/specs/website/candidate-page-polish.md
// Smoke integration test: renders the candidate page for test-omega and
// asserts structural markers for each of the four redesigned sections.
// Intentionally does NOT assert candidate-specific content (editorial
// symmetry — the test must pass for any candidate whose aggregated.json
// satisfies the v1.1 schema).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CandidatePage from "./page";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES_DIR = path.resolve(HERE, "..", "..", "..", "..", "candidates");

async function renderOmega(): Promise<string> {
  const prev = process.env.CANDIDATES_DIR;
  process.env.CANDIDATES_DIR = CANDIDATES_DIR;
  try {
    const node = await CandidatePage({
      params: Promise.resolve({ id: "test-omega" }),
    });
    return renderToStaticMarkup(node);
  } finally {
    if (prev === undefined) delete process.env.CANDIDATES_DIR;
    else process.env.CANDIDATES_DIR = prev;
  }
}

describe("candidate page smoke (test-omega)", () => {
  it("renders a positioning radar surface", async () => {
    const html = await renderOmega();
    // InteractivePositioningRadar emits an SVG; the AxisAgreementBars
    // section labels each axis. We assert the SVG is present as a
    // structural marker without asserting any axis value.
    expect(html).toContain("<svg");
    expect(html).toContain("positionnement");
  });

  it("renders one headline row per dimension (5)", async () => {
    const html = await renderOmega();
    // DomainesSection emits a <ul> where each row is a <button
    // aria-expanded aria-controls="dim-<key>-panel"> regardless of
    // open state. We count aria-controls occurrences as a stable
    // structural proxy.
    const controls = html.match(/aria-controls="deep-dive-[a-z_]+"/g) ?? [];
    expect(controls.length).toBe(5);
  });

  it("renders a 6×3 intergenerational horizon matrix", async () => {
    const html = await renderOmega();
    expect(html).toContain(
      "Matrice d&#x27;impact intergénérationnel par domaine et horizon",
    );
    // 6 rows × 3 cells = 18 score cells. We probe the horizon column
    // headers instead to avoid tight coupling to cell markup.
    expect(html).toContain("2027–2030");
    expect(html).toContain("2031–2037");
    expect(html).toContain("2038–2047");
  });

  it("renders a 5×4 risk summary matrix", async () => {
    const html = await renderOmega();
    expect(html).toContain("Matrice des risques par domaine et catégorie");
    // Column headers are the four canonical categories.
    expect(html).toContain("Budgétaire");
    expect(html).toContain("Mise en œuvre");
    expect(html).toContain("Dépendance");
    expect(html).toContain("Réversibilité");
  });

  it("renders the drawer trigger on the risques section", async () => {
    const html = await renderOmega();
    expect(html).toContain("Voir tous les risques identifiés");
  });
});
