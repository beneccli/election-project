// See docs/specs/website/landing-page.md §5.1
//
// Route-level test for the landing page. Stubs `listLandingCards`
// and `listCandidates` so the render is deterministic and does not
// touch the filesystem.

import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { LandingCard } from "@/lib/landing-cards";
import type { CandidateIndexEntry } from "@/lib/candidates";

const FIXTURE_CARDS: LandingCard[] = [
  {
    id: "alpha-one",
    status: "analyzed",
    displayName: "Alpha One",
    party: "Parti Alpha",
    partyShort: "PA",
    partyColor: "oklch(0.6 0.1 200)",
    family: "centre",
    spectrumLabel: "centre",
    spectrumStatus: "present",
    overallGrade: "B",
    overallGradeModifier: null,
    ecoAxis: 0,
    versionDate: "2026-01-15",
    updatedAt: "2026-01-15",
    modelsCount: 4,
    isFictional: true,
  },
  {
    id: "beta-two",
    status: "analyzed",
    displayName: "Beta Two",
    party: "Parti Beta",
    partyShort: "PB",
    partyColor: "oklch(0.6 0.1 30)",
    family: "droite",
    spectrumLabel: "droite",
    spectrumStatus: "present",
    overallGrade: "C",
    overallGradeModifier: "+",
    ecoAxis: 2,
    versionDate: "2026-01-10",
    updatedAt: "2026-01-10",
    modelsCount: 4,
    isFictional: true,
  },
  {
    id: "gamma-three",
    status: "pending",
    displayName: "Gamma Three",
    party: "Parti Gamma",
    partyShort: "PG",
    partyColor: "oklch(0.6 0.1 140)",
    family: "ecologie",
    declaredDate: "2026-01-01",
    updatedAt: "2026-01-01",
    isFictional: true,
  },
];

const FIXTURE_ENTRIES: CandidateIndexEntry[] = [
  {
    id: "alpha-one",
    displayName: "Alpha One",
    party: "Parti Alpha",
    partyId: "pa",
    updatedAt: "2026-01-15",
    versionDate: "2026-01-15",
    isFictional: true,
  },
  {
    id: "beta-two",
    displayName: "Beta Two",
    party: "Parti Beta",
    partyId: "pb",
    updatedAt: "2026-01-10",
    versionDate: "2026-01-10",
    isFictional: true,
  },
];

vi.mock("@/lib/landing-cards", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/landing-cards")>();
  return {
    ...actual,
    listLandingCards: () => FIXTURE_CARDS,
  };
});

vi.mock("@/lib/candidates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/candidates")>();
  return {
    ...actual,
    listCandidates: () => FIXTURE_ENTRIES,
  };
});

describe("app/page (landing route)", () => {
  it("renders the hero count label from listLandingCards()", async () => {
    const { default: HomePage } = await import("../page");
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain("2 candidats analysés");
    expect(html).toContain("1 à venir");
  });

  it("renders all six landing regions", async () => {
    const { default: HomePage } = await import("../page");
    const html = renderToStaticMarkup(<HomePage />);
    // Hero title
    expect(html).toMatch(/Que proposent/);
    // At least one candidate card
    expect(html).toContain("Alpha One");
    // Methodology anchor
    expect(html).toContain('id="methode"');
    // Footer brand (rendered as é<span>27</span>)
    expect(html).toMatch(/<footer[\s\S]*é<span[^>]*>27<\/span>/);
    // Footer legal disclaimer
    expect(html).toContain("Aucune recommandation de vote");
  });

  it("compare CTA href has two c= params when ≥2 analyzable candidates", async () => {
    const { default: HomePage } = await import("../page");
    const html = renderToStaticMarkup(<HomePage />);
    const match = html.match(/data-cta="compare"[^>]*href="([^"]+)"/);
    // Next.js <Link> may reorder attributes; try the other way too.
    const altMatch = html.match(/href="([^"]+)"[^>]*data-cta="compare"/);
    const href = match?.[1] ?? altMatch?.[1];
    expect(href).toBeDefined();
    expect(href).toMatch(/^\/comparer\?/);
    const cParams = href!.match(/c=/g) ?? [];
    expect(cParams.length).toBe(2);
  });

  it("exports FR metadata", async () => {
    const mod = await import("../page");
    expect(mod.metadata?.title).toMatch(/Élection 2027/);
    expect(typeof mod.metadata?.description).toBe("string");
  });
});
