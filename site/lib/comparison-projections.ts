// See docs/specs/website/comparison-page.md §4.2
//
// Build-time listing of every analyzable candidate projected to the
// flat `ComparisonProjection` view-model. Failing-to-load candidates
// are surfaced as `analyzable: false` so the picker UI can grey them
// out without throwing.
//
// This module MUST only be imported from server components / build-time
// scripts. It uses `node:fs` via `./candidates`.

import { listCandidates, loadCandidate } from "./candidates";
import {
  deriveComparisonProjection,
  type ComparisonEntry,
} from "./derived/comparison-projection";

export function listComparisonProjections(): ComparisonEntry[] {
  const entries: ComparisonEntry[] = [];
  for (const row of listCandidates()) {
    try {
      const bundle = loadCandidate(row.id);
      entries.push(deriveComparisonProjection(bundle));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      entries.push({
        id: row.id,
        displayName: row.displayName,
        updatedAt: row.updatedAt,
        analyzable: false,
        reason: message,
      });
    }
  }
  return entries;
}
