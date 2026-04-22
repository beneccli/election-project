"use client";
// See docs/specs/website/comparison-page.md §5
//
// Client island that owns selected-ids state for the /comparer page,
// syncing URL query (`?c=<id>`) with localStorage and enforcing the
// 2..4 / fictional / unknown-id guards.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  COMPARISON_COLORS,
  MAX_COMPARISON_CANDIDATES,
  MIN_COMPARISON_CANDIDATES,
} from "@/lib/comparison-colors";
import type { ComparisonEntry } from "@/lib/derived/comparison-projection";

const STORAGE_KEY = "e27-compare";

interface ComparisonContextValue {
  entries: ComparisonEntry[];
  selectedIds: string[];
  /** Index into COMPARISON_COLORS, or -1 if not selected. */
  slotOf: (id: string) => number;
  toggle: (id: string) => void;
  maxReached: boolean;
  excludeFictional: boolean;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function useComparison(): ComparisonContextValue {
  const ctx = useContext(ComparisonContext);
  if (!ctx) {
    throw new Error("useComparison must be used within <ComparisonBody>");
  }
  return ctx;
}

function readIdsFromQuery(params: URLSearchParams): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of params.getAll("c")) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
    if (out.length >= MAX_COMPARISON_CANDIDATES) break;
  }
  return out;
}

function sanitize(
  ids: string[],
  analyzable: Set<string>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (!analyzable.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_COMPARISON_CANDIDATES) break;
  }
  return out;
}

export function ComparisonBody({
  entries,
  excludeFictional = false,
  children,
  emptyState,
}: {
  entries: ComparisonEntry[];
  excludeFictional?: boolean;
  children: ReactNode;
  emptyState: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const analyzableSet = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) {
      if (!e.analyzable) continue;
      if (excludeFictional && e.isFictional) continue;
      s.add(e.id);
    }
    return s;
  }, [entries, excludeFictional]);

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const initial = readIdsFromQuery(
      new URLSearchParams(searchParams?.toString() ?? ""),
    );
    return sanitize(initial, analyzableSet);
  });

  // Hydration: if the URL was empty, try localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = readIdsFromQuery(
      new URLSearchParams(window.location.search),
    );
    if (fromUrl.length > 0) {
      const clean = sanitize(fromUrl, analyzableSet);
      setSelectedIds(clean);
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const ids = parsed.filter((x): x is string => typeof x === "string");
      const clean = sanitize(ids, analyzableSet);
      if (clean.length > 0) setSelectedIds(clean);
    } catch {
      /* ignore */
    }
    // analyzableSet is stable for the life of the page; intentionally
    // run once on mount.
  }, []);

  // Persist selection to URL + localStorage on every change (client only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = readIdsFromQuery(
      new URLSearchParams(window.location.search),
    );
    const same =
      current.length === selectedIds.length &&
      current.every((id, i) => id === selectedIds[i]);
    if (!same) {
      const next = new URLSearchParams();
      for (const id of selectedIds) next.append("c", id);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      /* ignore */
    }
  }, [selectedIds, pathname, router]);

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (!analyzableSet.has(id)) return prev;
        if (prev.length >= MAX_COMPARISON_CANDIDATES) return prev;
        return [...prev, id];
      });
    },
    [analyzableSet],
  );

  const slotOf = useCallback(
    (id: string) => selectedIds.indexOf(id),
    [selectedIds],
  );

  const value = useMemo<ComparisonContextValue>(
    () => ({
      entries,
      selectedIds,
      slotOf,
      toggle,
      maxReached: selectedIds.length >= MAX_COMPARISON_CANDIDATES,
      excludeFictional,
    }),
    [entries, selectedIds, slotOf, toggle, excludeFictional],
  );

  const belowMin = selectedIds.length < MIN_COMPARISON_CANDIDATES;

  return (
    <ComparisonContext.Provider value={value}>
      {children}
      {belowMin ? emptyState : null}
    </ComparisonContext.Provider>
  );
}

export { COMPARISON_COLORS };
