// See docs/specs/website/transparency.md §3, §7, §8
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TransparencyDrawerChrome } from "./TransparencyDrawer";
import {
  AggregatedOutputSchema,
  VersionMetadataSchema,
  type AggregatedOutput,
  type VersionMetadata,
} from "@/lib/schema";

// We intentionally test the *chrome* (pure, state-driven) component here.
// The `<TransparencyDrawer>` wrapper just binds state to the URL hash via
// `useTransparencyHash` (tested by `transparency-hash.test.ts`). The Drawer
// primitive itself is exercised by `Drawer.test.tsx`.
//
// Vitest runs in node env without jsdom; Radix `<Dialog.Portal>` yields
// no SSR output when open, so we assert on the closed-state markup and on
// the component *not throwing* when open.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OMEGA = path.resolve(HERE, "..", "..", "..", "candidates", "test-omega", "current");

function loadFixtures(): {
  aggregated: AggregatedOutput;
  versionMeta: VersionMetadata;
} {
  const aggregated = AggregatedOutputSchema.parse(
    JSON.parse(fs.readFileSync(path.join(OMEGA, "aggregated.json"), "utf8")),
  );
  const versionMeta = VersionMetadataSchema.parse(
    JSON.parse(fs.readFileSync(path.join(OMEGA, "metadata.json"), "utf8")),
  );
  return { aggregated, versionMeta };
}

describe("TransparencyDrawerChrome", () => {
  it("does not render drawer content when state is null", () => {
    const { aggregated, versionMeta } = loadFixtures();
    const html = renderToStaticMarkup(
      <TransparencyDrawerChrome id="test-omega"
        aggregated={aggregated}
        versionMeta={versionMeta}
        state={null}
        onStateChange={() => undefined}
      />,
    );
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain("À implémenter");
  });

  it("does not throw when opened on any tab (SSR)", () => {
    const { aggregated, versionMeta } = loadFixtures();
    for (const tab of ["sources", "document", "prompts", "results"] as const) {
      expect(() =>
        renderToStaticMarkup(
          <TransparencyDrawerChrome id="test-omega"
            aggregated={aggregated}
            versionMeta={versionMeta}
            state={{ tab }}
            onStateChange={() => undefined}
          />,
        ),
      ).not.toThrow();
    }
  });

  it("accepts warning-triggering inputs without throwing", () => {
    const { aggregated, versionMeta } = loadFixtures();
    const aggWithCoverage: AggregatedOutput = {
      ...aggregated,
      coverage_warning: true,
    };
    const metaWithoutReview: VersionMetadata = {
      ...versionMeta,
      aggregation: versionMeta.aggregation
        ? { ...versionMeta.aggregation, human_review_completed: false }
        : undefined,
    };
    expect(() =>
      renderToStaticMarkup(
        <TransparencyDrawerChrome id="test-omega"
          aggregated={aggWithCoverage}
          versionMeta={metaWithoutReview}
          state={{ tab: "sources" }}
          onStateChange={() => undefined}
        />,
      ),
    ).not.toThrow();
  });
});
