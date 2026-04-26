// See docs/specs/website/transparency.md §3, §7, §8
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  TransparencyDrawerChrome,
  TranslationSubsection,
} from "./TransparencyDrawer";
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

// See docs/specs/website/i18n.md §3.3 (per-locale provenance)
describe("TranslationSubsection — translation provenance", () => {
  function render(
    lang: "fr" | "en",
    versionMeta: VersionMetadata,
  ): string {
    return renderToStaticMarkup(
      <TranslationSubsection versionMeta={versionMeta} lang={lang} />,
    );
  }

  it("native_fr: renders nothing when lang=fr", () => {
    const { versionMeta } = loadFixtures();
    // test-omega's metadata.json carries a translations.en block, but
    // the FR canonical view must never surface it.
    expect(versionMeta.translations?.en).toBeDefined();
    const html = render("fr", versionMeta);
    expect(html).toBe("");
  });

  it("available: renders provenance fields when lang=en and translations.en is present", () => {
    const { versionMeta } = loadFixtures();
    const entry = versionMeta.translations?.en;
    expect(entry).toBeDefined();
    const html = render("en", versionMeta);
    expect(html).toContain("transparency-translation");
    expect(html).toContain("Translation");
    expect(html).toContain(entry!.attested_model_version);
    expect(html).toContain(entry!.prompt_sha256);
    expect(html).toContain(entry!.ingested_at);
    if (entry!.human_review_completed) {
      expect(html).toContain("Human review complete");
    } else {
      expect(html).toContain("Human review pending");
    }
  });

  it("missing: renders nothing when lang=en but translations.<lang> is absent", () => {
    const { versionMeta } = loadFixtures();
    const meta: VersionMetadata = { ...versionMeta, translations: undefined };
    const html = render("en", meta);
    expect(html).toBe("");
  });
});
