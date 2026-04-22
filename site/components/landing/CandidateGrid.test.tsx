// See docs/specs/website/landing-page.md §5.5
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CandidateGrid from "./CandidateGrid";
import type { LandingCard } from "@/lib/landing-cards";

const CARDS: LandingCard[] = [
  {
    id: "a",
    status: "analyzed",
    displayName: "Alpha",
    party: "Parti A",
    partyShort: "A",
    partyColor: "#444",
    family: "gauche",
    spectrumLabel: "Gauche",
    spectrumStatus: "present",
    overallGrade: "B",
    overallGradeModifier: null,
    ecoAxis: -3,
    versionDate: "2026-04-01",
    updatedAt: "2026-04-01",
    modelsCount: 4,
    isFictional: false,
  },
  {
    id: "b",
    status: "pending",
    displayName: "Bravo",
    party: "Parti B",
    partyShort: "B",
    partyColor: "#444",
    family: "centre",
    declaredDate: null,
    updatedAt: "2026-03-01",
    isFictional: false,
  },
  {
    id: "c",
    status: "pending",
    displayName: "Charlie",
    party: "Parti C",
    partyShort: "C",
    partyColor: "#444",
    family: "ecologie",
    declaredDate: null,
    updatedAt: "2026-02-01",
    isFictional: false,
  },
];

describe("CandidateGrid", () => {
  it("renders all cards under the default 'all' filter", () => {
    const html = renderToStaticMarkup(
      <CandidateGrid cards={CARDS} lang="fr" />,
    );
    expect(html).toContain("Alpha");
    expect(html).toContain("Bravo");
    expect(html).toContain("Charlie");
  });

  it("renders the five filter buckets as role=radio buttons", () => {
    const html = renderToStaticMarkup(
      <CandidateGrid cards={CARDS} lang="fr" />,
    );
    // radiogroup + 5 radios
    expect(html).toContain('role="radiogroup"');
    const radioCount = (html.match(/role="radio"/g) ?? []).length;
    expect(radioCount).toBe(5);
    // Default "all" is active
    expect(html).toMatch(/aria-checked="true"[^>]*>Tous/);
  });

  it("exposes a count of visible cards", () => {
    const html = renderToStaticMarkup(
      <CandidateGrid cards={CARDS} lang="fr" />,
    );
    expect(html).toMatch(/3 candidats affichés/);
  });

  it("handles the empty state", () => {
    const html = renderToStaticMarkup(
      <CandidateGrid cards={[]} lang="fr" />,
    );
    expect(html).toMatch(/0 candidats affichés|0 candidat affiché/);
  });

  it("has no ranking copy (no top / meilleur / classement)", () => {
    const html = renderToStaticMarkup(
      <CandidateGrid cards={CARDS} lang="fr" />,
    );
    // Strip tags to get visible text only (Tailwind has `top-0` utilities).
    const text = html.replace(/<[^>]*>/g, " ").toLowerCase();
    expect(text).not.toMatch(/\bclassement\b/);
    expect(text).not.toMatch(/\bmeilleur\b/);
    expect(text).not.toMatch(/\btop\b/);
    expect(text).not.toMatch(/\bgagnant\b/);
  });
});
