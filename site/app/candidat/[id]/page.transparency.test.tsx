// See docs/specs/website/transparency.md §8 "Deep-linking (URL scheme)" + §10
//
// End-to-end smoke test for the transparency drawer.
//
// Vitest runs in a node environment without jsdom. Because the drawer
// panel is rendered inside `@radix-ui/react-dialog`'s `<Dialog.Portal>`,
// its *open-state* markup does not appear in SSR output — Radix requires
// a live DOM to portal. Accordingly, this test:
//
//   1. Asserts the candidate page chrome wires the entry points
//      specified in §10 (NavBar anchor + footer primary action), which
//      ARE rendered during SSR.
//
//   2. Asserts the drawer produces no tablist markup when closed.
//
//   3. Asserts `TransparencyDrawerChrome` does not throw when given
//      every open-state variant listed in §8.
//
//   4. Renders `ResultsTab` directly (no portal) to confirm each of
//      the three sub-views (`notes`, `per-model`, `agreement`) produces
//      the expected content markers.
//
// Hash-string parsing is covered by `lib/transparency-hash.test.ts`.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CandidatePage from "./page";
import { TransparencyDrawerChrome } from "@/components/chrome/TransparencyDrawer";
import { ResultsTab } from "@/components/transparency/ResultsTab";
import { loadCandidate } from "@/lib/candidates";
import type { TransparencyHashState } from "@/lib/transparency-hash";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES_DIR = path.resolve(HERE, "..", "..", "..", "..", "candidates");

async function withCandidates<T>(fn: () => Promise<T>): Promise<T> {
  const prev = process.env.CANDIDATES_DIR;
  process.env.CANDIDATES_DIR = CANDIDATES_DIR;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env.CANDIDATES_DIR;
    else process.env.CANDIDATES_DIR = prev;
  }
}

function loadOmega() {
  const v = loadCandidate("test-omega");
  return { versionMeta: v.versionMeta, aggregated: v.aggregated };
}

describe("candidate page entry points (§10)", () => {
  it("renders a functional NavBar Transparence link", async () => {
    const html = await withCandidates(async () => {
      const node = await CandidatePage({
        params: Promise.resolve({ id: "test-omega" }),
      });
      return renderToStaticMarkup(node);
    });
    expect(html).toContain('href="#transparence=document"');
    expect(html).toContain(">Transparence<");
  });

  it("renders a primary footer action 'Ouvrir la transparence complète'", async () => {
    const html = await withCandidates(async () => {
      const node = await CandidatePage({
        params: Promise.resolve({ id: "test-omega" }),
      });
      return renderToStaticMarkup(node);
    });
    expect(html).toContain("Ouvrir la transparence complète");
    expect(html).toContain('data-transparency-trigger="footer-primary"');
  });
});

describe("TransparencyDrawerChrome (§8 hash states)", () => {
  it("closed drawer (state=null) emits no tablist markup", async () => {
    await withCandidates(async () => {
      const { versionMeta, aggregated } = loadOmega();
      const html = renderToStaticMarkup(
        <TransparencyDrawerChrome
          id="test-omega"
          versionMeta={versionMeta}
          aggregated={aggregated}
          state={null}
          onStateChange={() => {}}
        />,
      );
      expect(html).not.toContain('role="tablist"');
    });
  });

  it("does not throw for any §8 open state", async () => {
    await withCandidates(async () => {
      const { versionMeta, aggregated } = loadOmega();
      const states: readonly TransparencyHashState[] = [
        { tab: "sources" },
        { tab: "sources", file: "program.pdf" },
        { tab: "document" },
        { tab: "document", anchor: "retraites" },
        { tab: "prompts" },
        { tab: "prompts", sha: "a".repeat(64) },
        { tab: "results" },
        { tab: "results", view: "notes" },
        { tab: "results", view: "per-model" },
        { tab: "results", view: "per-model", model: "claude-opus-4-6" },
        { tab: "results", view: "agreement" },
        { tab: "results", view: "agreement", claim: "economic_fiscal.grade.B" },
      ];
      for (const state of states) {
        expect(() =>
          renderToStaticMarkup(
            <TransparencyDrawerChrome
              id="test-omega"
              versionMeta={versionMeta}
              aggregated={aggregated}
              state={state}
              onStateChange={() => {}}
            />,
          ),
        ).not.toThrow();
      }
    });
  });
});

describe("ResultsTab sub-view routing (§7)", () => {
  it("notes view renders the loading placeholder before the fetch resolves", async () => {
    await withCandidates(async () => {
      const { versionMeta, aggregated } = loadOmega();
      const html = renderToStaticMarkup(
        <ResultsTab
          id="test-omega"
          versionMeta={versionMeta}
          aggregated={aggregated}
          state={{ tab: "results", view: "notes" }}
          onStateChange={() => {}}
        />,
      );
      expect(html).toContain("Chargement des notes");
    });
  });

  it("per-model view lists every analysis model for the candidate", async () => {
    await withCandidates(async () => {
      const { versionMeta, aggregated } = loadOmega();
      const html = renderToStaticMarkup(
        <ResultsTab
          id="test-omega"
          versionMeta={versionMeta}
          aggregated={aggregated}
          state={{ tab: "results", view: "per-model" }}
          onStateChange={() => {}}
        />,
      );
      const modelIds = Object.keys(versionMeta.analysis?.models ?? {});
      expect(modelIds.length).toBeGreaterThan(0);
      for (const modelId of modelIds) {
        expect(html).toContain(`id="model-${modelId}"`);
      }
    });
  });

  it("agreement view renders the consensus / dissent / positioning sections", async () => {
    await withCandidates(async () => {
      const { versionMeta, aggregated } = loadOmega();
      const html = renderToStaticMarkup(
        <ResultsTab
          id="test-omega"
          versionMeta={versionMeta}
          aggregated={aggregated}
          state={{ tab: "results", view: "agreement" }}
          onStateChange={() => {}}
        />,
      );
      expect(html).toContain("Consensus");
      expect(html).toContain("Désaccords");
      expect(html).toContain("Positionnement agrégé");
    });
  });
});
