// See docs/specs/analysis/political-spectrum-label.md §8.1
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AggregatedOutputSchema,
  CandidateMetadataSchema,
  VersionMetadataSchema,
  type AggregatedOutput,
  type CandidateMetadata,
  type VersionMetadata,
} from "@/lib/schema";
import { Hero } from "./Hero";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VERSION_DIR = path.resolve(
  HERE,
  "..",
  "..",
  "..",
  "candidates",
  "test-omega",
  "current",
);

function loadFixtures(): {
  meta: CandidateMetadata;
  versionMeta: VersionMetadata;
  aggregated: AggregatedOutput;
} {
  const meta = CandidateMetadataSchema.parse(
    JSON.parse(
      fs.readFileSync(path.join(VERSION_DIR, "..", "metadata.json"), "utf8"),
    ),
  );
  const versionMeta = VersionMetadataSchema.parse(
    JSON.parse(fs.readFileSync(path.join(VERSION_DIR, "metadata.json"), "utf8")),
  );
  const aggregated = AggregatedOutputSchema.parse(
    JSON.parse(fs.readFileSync(path.join(VERSION_DIR, "aggregated.json"), "utf8")),
  );
  return { meta, versionMeta, aggregated };
}

function render(agg: AggregatedOutput): string {
  const { meta, versionMeta } = loadFixtures();
  return renderToStaticMarkup(
    <Hero meta={meta} versionMeta={versionMeta} aggregated={agg} />,
  );
}

describe("Hero spectrum chip", () => {
  it("renders the French display label when a modal label is present", () => {
    const { aggregated } = loadFixtures();
    const html = render(aggregated);
    expect(html).toContain('data-testid="hero-spectrum-chip"');
    expect(html).toContain('data-spectrum-status="present"');
    expect(html).toContain("Gauche");
    expect(html).toContain('href="#positionnement"');
  });

  it("renders 'Hors spectre' when modal_label is inclassable", () => {
    const { aggregated } = loadFixtures();
    aggregated.positioning.overall_spectrum!.modal_label = "inclassable";
    const html = render(aggregated);
    expect(html).toContain('data-spectrum-status="inclassable"');
    expect(html).toContain("Hors spectre");
  });

  it("renders 'Positionnement partagé' when modal_label is null", () => {
    const { aggregated } = loadFixtures();
    aggregated.positioning.overall_spectrum!.modal_label = null;
    const html = render(aggregated);
    expect(html).toContain('data-spectrum-status="split"');
    expect(html).toContain("Positionnement partag");
  });

  it("renders no chip when the overall_spectrum field is absent", () => {
    const { aggregated } = loadFixtures();
    delete (aggregated.positioning as { overall_spectrum?: unknown })
      .overall_spectrum;
    const html = render(aggregated);
    expect(html).not.toContain("hero-spectrum-chip");
  });
});
