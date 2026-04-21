// See docs/specs/website/transparency.md §8 "Deep-linking (URL scheme)"
//
// Pure parsing and formatting of the drawer's `#transparence=…` URL
// hash. Kept free of React so parse/format round-trip is trivially
// testable. The `useTransparencyHash` hook (in a separate module)
// wraps these for client-side reactive usage.

export type TransparencyTab = "sources" | "document" | "prompts" | "results";

export type ResultsView = "notes" | "per-model" | "agreement";

export type TransparencyHashState =
  | { tab: "sources"; file?: string }
  | { tab: "document"; anchor?: string }
  | { tab: "prompts"; sha?: string }
  | {
      tab: "results";
      view?: ResultsView;
      model?: string;
      claim?: string;
    };

const VALID_TABS: readonly TransparencyTab[] = [
  "sources",
  "document",
  "prompts",
  "results",
];

const VALID_RESULTS_VIEWS: readonly ResultsView[] = [
  "notes",
  "per-model",
  "agreement",
];

/**
 * Parse a URL hash (leading `#` optional) into a drawer state, or
 * `null` when the hash does not select the transparency drawer.
 *
 * Grammar:
 *   transparence=<tab>[&<key>=<value>…]
 */
export function parseTransparencyHash(
  hash: string | null | undefined,
): TransparencyHashState | null {
  if (!hash) return null;
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!trimmed.startsWith("transparence=")) return null;
  const params = new URLSearchParams(trimmed);
  const tab = params.get("transparence");
  if (!tab || !(VALID_TABS as readonly string[]).includes(tab)) return null;

  switch (tab as TransparencyTab) {
    case "sources": {
      const file = params.get("file");
      return file ? { tab: "sources", file } : { tab: "sources" };
    }
    case "document": {
      const anchor = params.get("anchor");
      return anchor ? { tab: "document", anchor } : { tab: "document" };
    }
    case "prompts": {
      const sha = params.get("sha");
      return sha ? { tab: "prompts", sha } : { tab: "prompts" };
    }
    case "results": {
      const viewRaw = params.get("view");
      const view =
        viewRaw && (VALID_RESULTS_VIEWS as readonly string[]).includes(viewRaw)
          ? (viewRaw as ResultsView)
          : undefined;
      const model = params.get("model") ?? undefined;
      const claim = params.get("claim") ?? undefined;
      const state: TransparencyHashState = { tab: "results" };
      if (view) state.view = view;
      if (model) state.model = model;
      if (claim) state.claim = claim;
      return state;
    }
  }
}

/**
 * Inverse of {@link parseTransparencyHash}. Returns an empty string for
 * `null` so `history.replaceState` can strip the fragment cleanly.
 */
export function formatTransparencyHash(
  state: TransparencyHashState | null,
): string {
  if (!state) return "";
  const params = new URLSearchParams();
  params.set("transparence", state.tab);
  switch (state.tab) {
    case "sources":
      if (state.file) params.set("file", state.file);
      break;
    case "document":
      if (state.anchor) params.set("anchor", state.anchor);
      break;
    case "prompts":
      if (state.sha) params.set("sha", state.sha);
      break;
    case "results":
      if (state.view) params.set("view", state.view);
      if (state.model) params.set("model", state.model);
      if (state.claim) params.set("claim", state.claim);
      break;
  }
  return `#${params.toString()}`;
}
