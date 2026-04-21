// See docs/specs/website/transparency.md §8
"use client";
import { useCallback, useEffect, useState } from "react";
import {
  formatTransparencyHash,
  parseTransparencyHash,
  type TransparencyHashState,
} from "./transparency-hash";

function readHash(): TransparencyHashState | null {
  if (typeof window === "undefined") return null;
  return parseTransparencyHash(window.location.hash);
}

/**
 * Subscribe to the drawer's `#transparence=…` hash fragment.
 *
 * - Returns the parsed state, or `null` when the drawer should be closed.
 * - `setState(null)` strips the fragment cleanly via `history.replaceState`
 *   so closing does not pollute browser history.
 * - Always uses `replaceState` (never `pushState`) — each drawer state
 *   change is conceptually a UI mode, not a navigation event.
 */
export function useTransparencyHash(): [
  TransparencyHashState | null,
  (next: TransparencyHashState | null) => void,
] {
  const [state, setStateInternal] = useState<TransparencyHashState | null>(
    readHash,
  );

  useEffect(() => {
    // Sync once on mount in case SSR initialized to null.
    setStateInternal(readHash());
    const onHashChange = () => setStateInternal(readHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setState = useCallback((next: TransparencyHashState | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const fragment = formatTransparencyHash(next);
    url.hash = fragment; // empty string → URL has no hash
    window.history.replaceState(null, "", url.toString());
    setStateInternal(next);
  }, []);

  return [state, setState];
}
