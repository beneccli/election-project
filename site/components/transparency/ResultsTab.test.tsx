// See docs/specs/website/transparency.md §7 "Résultats IA tab"
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AgreementMapView,
  NotesViewBody,
  PerModelView,
} from "./ResultsTab";
import type { AggregatedOutput, VersionMetadata } from "@/lib/schema";

function meta(
  override: Partial<VersionMetadata> = {},
): VersionMetadata {
  return {
    candidate_id: "test-omega",
    version_date: "2027-11-01",
    schema_version: "1.1",
    analysis: {
      prompt_file: "prompts/analyze-candidate.md",
      prompt_sha256: "a".repeat(64),
      prompt_version: "3",
      models: {
        "claude-opus-4-7": {
          provider: "anthropic",
          exact_version: "claude-opus-4-7",
          temperature: 0,
          run_at: "2027-11-01T12:00:00Z",
          tokens_in: 1234,
          tokens_out: 5678,
          cost_estimate_usd: 0.0421,
          duration_ms: 3200,
          status: "success",
          execution_mode: "api",
          provider_metadata_available: true,
        },
        "gpt-5": {
          provider: "openai",
          exact_version: "gpt-5",
          temperature: 0,
          run_at: "2027-11-01T12:01:00Z",
          duration_ms: 0,
          status: "success",
          execution_mode: "manual",
          attested_by: "alice",
          attested_model_version: "gpt-5",
          provider_metadata_available: false,
        },
      },
    },
    ...override,
  } as VersionMetadata;
}

function agg(
  override: Partial<AggregatedOutput> = {},
): AggregatedOutput {
  return {
    agreement_map: {
      high_confidence_claims: [
        {
          claim_id: "economic_fiscal.grade.B",
          models: ["claude-opus-4-7", "gpt-5"],
        },
      ],
      contested_claims: [
        {
          claim_id: "ecological.grade.C",
          positions: [
            { model: "claude-opus-4-7", position: "Note C — politique crédible" },
            { model: "gpt-5", position: "Note D — objectifs insuffisants" },
          ],
        },
      ],
      coverage: {
        "claude-opus-4-7": "complete",
        "gpt-5": "complete",
      },
      positioning_consensus: {
        economic: { interval: [-2, -1], modal: -2, dissent_count: 1 },
        ecological: { interval: [0, 2], modal: null, dissent_count: 3 },
      },
    },
    ...override,
  } as AggregatedOutput;
}

describe("NotesViewBody", () => {
  it("renders loaded markdown as HTML", () => {
    const html = renderToStaticMarkup(
      <NotesViewBody
        url="/x.md"
        state={{
          phase: "loaded",
          body: "## Désaccords\n\nModèle A vs. Modèle B.",
        }}
      />,
    );
    expect(html).toContain("<h2>Désaccords</h2>");
    expect(html).toContain("Modèle A vs. Modèle B.");
  });

  it("renders a loading placeholder", () => {
    const html = renderToStaticMarkup(
      <NotesViewBody url="/x.md" state={{ phase: "loading" }} />,
    );
    expect(html).toMatch(/Chargement/);
  });

  it("renders an error state with a fallback link", () => {
    const html = renderToStaticMarkup(
      <NotesViewBody
        url="/x.md"
        state={{ phase: "error", message: "HTTP 404" }}
      />,
    );
    expect(html).toContain("HTTP 404");
    expect(html).toContain('href="/x.md"');
  });
});

describe("PerModelView", () => {
  it("renders one card per model with provider + exact version", () => {
    const html = renderToStaticMarkup(
      <PerModelView
        id="test-omega"
        versionMeta={meta()}
        focusedModel={undefined}
        onFocusModel={() => {}}
      />,
    );
    expect(html).toContain("claude-opus-4-7");
    expect(html).toContain("gpt-5");
    expect(html).toContain("anthropic");
    expect(html).toContain("openai");
  });

  it("shows token / cost fields when provider metadata is available", () => {
    const html = renderToStaticMarkup(
      <PerModelView
        id="test-omega"
        versionMeta={meta()}
        focusedModel={undefined}
        onFocusModel={() => {}}
      />,
    );
    expect(html).toContain("tokens in : 1234");
    expect(html).toContain("tokens out : 5678");
    expect(html).toContain("0.0421");
  });

  it("omits token / cost fields when provider metadata is unavailable (manual mode)", () => {
    // The gpt-5 entry has provider_metadata_available=false
    const html = renderToStaticMarkup(
      <PerModelView
        id="test-omega"
        versionMeta={meta()}
        focusedModel={undefined}
        onFocusModel={() => {}}
      />,
    );
    // Assert per-model scope: find the gpt-5 card's surrounding section
    const gptSection = extractSection(html, 'id="model-gpt-5"');
    expect(gptSection).not.toContain("tokens in");
    expect(gptSection).not.toContain("tokens out");
    expect(gptSection).not.toContain("coût");
    // Attestation metadata is rendered
    expect(gptSection).toContain("attesté par alice");
  });

  it("marks the focused model card as expanded", () => {
    const html = renderToStaticMarkup(
      <PerModelView
        id="test-omega"
        versionMeta={meta()}
        focusedModel="claude-opus-4-7"
        onFocusModel={() => {}}
      />,
    );
    const section = extractSection(html, 'id="model-claude-opus-4-7"');
    expect(section).toContain('aria-expanded="true"');
    expect(section).toContain("Masquer");
  });

  it("renders a download link to the raw JSON", () => {
    const html = renderToStaticMarkup(
      <PerModelView
        id="test-omega"
        versionMeta={meta()}
        focusedModel={undefined}
        onFocusModel={() => {}}
      />,
    );
    expect(html).toContain(
      'href="/candidates/test-omega/2027-11-01/raw-outputs/claude-opus-4-7.json"',
    );
  });
});

describe("AgreementMapView", () => {
  it("renders the consensus and contested claims row-by-row", () => {
    const html = renderToStaticMarkup(<AgreementMapView aggregated={agg()} />);
    expect(html).toContain("economic_fiscal.grade.B");
    expect(html).toContain("ecological.grade.C");
    expect(html).toContain("Note C — politique crédible");
    expect(html).toContain("Note D — objectifs insuffisants");
  });

  it("renders positioning rows as integer text — no visual bar, no mean", () => {
    const html = renderToStaticMarkup(<AgreementMapView aggregated={agg()} />);
    const section = extractSection(
      html,
      'data-positioning-consensus=""',
    );
    // Integer text present
    expect(section).toMatch(/modal\s*:\s*−2/);
    expect(section).toMatch(/désaccords\s*:\s*3/);
    expect(section).toMatch(/intervalle\s*:\s*\[0,\s*\+2\]/);
    // Null modal rendered explicitly, not averaged
    expect(section).toContain("∅");
    // Forbidden visual aggregations
    expect(section).not.toMatch(/role="progressbar"/);
    expect(section).not.toMatch(/class="[^"]*\bbar\b[^"]*"/);
    // No cardinal mean computed programmatically. The French copy
    // *denies* computing a mean ("aucune moyenne …"), which is fine;
    // we only forbid a computed value being shown.
    expect(section).not.toMatch(/moyenne\s*:/i);
  });

  it("renders an anchor id per claim for deep-linking", () => {
    const html = renderToStaticMarkup(<AgreementMapView aggregated={agg()} />);
    expect(html).toContain('id="claim-economic_fiscal.grade.B"');
    expect(html).toContain('id="claim-ecological.grade.C"');
  });
});

/**
 * Return the substring of HTML starting at the element that contains
 * `marker` and ending at its closing tag (approximate — we bound the
 * search by the next `</section>` since our targets are `<section>`
 * blocks in the component).
 */
function extractSection(html: string, marker: string): string {
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`marker not found: ${marker}`);
  // Walk back to the opening `<`
  const openStart = html.lastIndexOf("<section", start);
  const openEnd = html.indexOf("</section>", start);
  if (openStart === -1 || openEnd === -1)
    throw new Error("section boundaries not found");
  return html.slice(openStart, openEnd + "</section>".length);
}
