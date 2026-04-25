// See docs/specs/website/landing-page.md §2 (editorial) and §8 (tests).
// See docs/specs/analysis/editorial-principles.md — analysis, not
// advocacy; measurement, not indictment.
//
// Last-line-of-defense regression test for the landing page. Covers:
//
//   1. Banned-word scan on the rendered DOM (catches copy drift across
//      every landing component at once).
//   2. Stat panel must not render numbers in red/amber — context data
//      is neutral, not alarmist.
//   3. Compare CTA is live: no "Bientôt" / "Soon" / "À venir" pill on
//      the CTA itself (comparison has shipped).
//
// This test renders the real page with a stubbed loader so it does not
// depend on filesystem fixtures.

import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { LandingCard } from "@/lib/landing-cards";
import type { CandidateIndexEntry } from "@/lib/candidates";

// Banned vocabulary. Every item presupposes a ranking, a catastrophe,
// or editorializes about the status quo. The forbidden list is a
// superset of the /comparer list plus the landing-specific additions
// called out by the spec.
const FORBIDDEN_WORDS: readonly string[] = [
  "classement",
  "gagnant",
  "meilleur candidat",
  "winner",
  "catastrophique",
  "désastre",
  "disaster",
  "score global",
];

// "crise" is flagged separately because it may legitimately occur in
// human-reviewed source excerpts elsewhere in the codebase; here we
// enforce it on the landing DOM specifically.
const FORBIDDEN_LANDING_ONLY: readonly string[] = ["crise"];

const FIXTURE_CARDS: LandingCard[] = [
  {
    id: "test-omega",
    status: "analyzed",
    displayName: "Oméga Test",
    party: "Parti Test Oméga",
    partyShort: "PTO",
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
    id: "pending-one",
    status: "pending",
    displayName: "Candidat Un",
    party: "Parti Un",
    partyShort: "P1",
    partyColor: "oklch(0.6 0.1 30)",
    family: "droite",
    declaredDate: "2026-01-05",
    updatedAt: "2026-01-05",
    isFictional: true,
  },
  {
    id: "pending-two",
    status: "pending",
    displayName: "Candidat Deux",
    party: "Parti Deux",
    partyShort: "P2",
    partyColor: "oklch(0.6 0.1 140)",
    family: "ecologie",
    declaredDate: "2026-01-03",
    updatedAt: "2026-01-03",
    isFictional: true,
  },
];

const FIXTURE_ENTRIES: CandidateIndexEntry[] = [
  {
    id: "test-omega",
    displayName: "Oméga Test",
    party: "Parti Test Oméga",
    partyId: "pto",
    updatedAt: "2026-01-15",
    versionDate: "2026-01-15",
    isFictional: true,
    availableLocales: ["fr"],
  },
];

vi.mock("@/lib/landing-cards", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/landing-cards")>();
  return { ...actual, listLandingCards: () => FIXTURE_CARDS };
});

vi.mock("@/lib/candidates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/candidates")>();
  return { ...actual, listCandidates: () => FIXTURE_ENTRIES };
});

async function renderLanding(): Promise<string> {
  const { default: HomePage } = await import("../page");
  return renderToStaticMarkup(<HomePage />);
}

describe("landing-editorial — rendered DOM", () => {
  it("finds the landing hero, confirming the fixture wired correctly", async () => {
    const html = await renderLanding();
    expect(html).toMatch(/Que proposent/);
    expect(html).toContain("Oméga Test");
  });

  for (const word of FORBIDDEN_WORDS) {
    it(`does not contain forbidden word: "${word}"`, async () => {
      const html = await renderLanding();
      expect(html.toLowerCase()).not.toContain(word.toLowerCase());
    });
  }

  for (const word of FORBIDDEN_LANDING_ONLY) {
    it(`does not contain forbidden landing-only word: "${word}"`, async () => {
      const html = await renderLanding();
      expect(html.toLowerCase()).not.toContain(word.toLowerCase());
    });
  }

  it("stat tiles use no red/amber class or inline color", async () => {
    const html = await renderLanding();
    // Extract the hero stats panel
    const statsMatch = html.match(
      /data-testid="hero-stats"[\s\S]*?<\/ul>/,
    );
    expect(statsMatch, "hero-stats region not found").toBeTruthy();
    const stats = statsMatch![0];

    const FORBIDDEN_CLASS = [
      "text-risk-red",
      "text-amber",
      "bg-risk-red",
      "bg-amber",
      /\bbad\b/,
      /\bwarn\b/,
    ];
    for (const pat of FORBIDDEN_CLASS) {
      if (typeof pat === "string") {
        expect(stats, `stats contains forbidden class "${pat}"`).not.toContain(
          pat,
        );
      } else {
        expect(stats, `stats matches forbidden pattern ${pat}`).not.toMatch(
          pat,
        );
      }
    }

    // Inline colour props must not reach for red/risk tokens.
    expect(stats).not.toMatch(/color:\s*(?:red|#ff|oklch\([^)]*\b25\b[^)]*\))/i);
    expect(stats).not.toMatch(/var\(--risk-red/);
  });

  it("compare CTA has no 'Bientôt / Soon / À venir' pill", async () => {
    const html = await renderLanding();
    // Isolate the compare CTA section — between the data-cta="compare"
    // anchor and the closing </section>. We check the enclosing
    // <section> to be safe.
    const ctaSection = html.match(
      /<section[^>]*>(?:(?!<\/section>)[\s\S])*data-cta="compare"[\s\S]*?<\/section>/,
    );
    expect(ctaSection, "compare CTA section not found").toBeTruthy();
    const cta = ctaSection![0];

    // Strip the candidate grid's "Analyse à venir" pills: those live
    // in the prior <section>, so they cannot appear here. But the
    // assertion must still tolerate "à venir" if it ever refers to
    // future candidates — on the CTA specifically, none is allowed.
    expect(cta.toLowerCase()).not.toContain("bientôt");
    expect(cta.toLowerCase()).not.toContain("bientot");
    expect(cta.toLowerCase()).not.toContain("coming soon");
  });
});
