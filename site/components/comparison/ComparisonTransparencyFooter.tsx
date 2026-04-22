"use client";
// See docs/specs/website/comparison-page.md §5.4 (scoped transparency).
//
// Scoped transparency footer for /comparer. Lists each *selected*
// candidate's per-version metadata.json — deliberately terse because
// every candidate page already renders the full transparency footer
// for its own run. No raw-outputs drawer on this page.

import type { ComparisonProjection } from "@/lib/derived/comparison-projection";
import { useLang } from "@/lib/lang-context";
import { useComparison } from "./ComparisonBody";

export function ComparisonTransparencyFooter() {
  const { entries, selectedIds } = useComparison();
  const { lang } = useLang();
  const selected: ComparisonProjection[] = selectedIds
    .map((id) => entries.find((e) => e.analyzable && e.id === id))
    .filter((e): e is ComparisonProjection =>
      Boolean(e && e.analyzable === true),
    );
  return (
    <footer className="mt-24 border-t border-rule bg-bg-subtle">
      <div className="mx-auto max-w-content px-8 py-10 text-sm text-text-secondary">
        <div className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-accent">
          {lang === "en" ? "Transparency" : "Transparence"}
        </div>
        <p className="mb-6 max-w-prose text-base text-text">
          {lang === "en"
            ? "This page renders the aggregated analyses already published on each candidate page — no new analysis is produced here. Open a candidate page for the full run (models, prompts, sources, raw outputs)."
            : "Cette page affiche les analyses agrégées déjà publiées sur chaque fiche candidat — aucune analyse supplémentaire n'est produite ici. Ouvrez une fiche candidat pour consulter le run complet (modèles, prompts, sources, sorties brutes)."}
        </p>
        {selected.length === 0 ? (
          <p className="text-text-tertiary">
            {lang === "en"
              ? "No candidate selected."
              : "Aucun candidat sélectionné."}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {selected.map((c) => {
              const metaHref = `/candidates/${c.id}/versions/${c.versionDate}/metadata.json`;
              const pageHref = `/candidat/${c.id}`;
              return (
                <li
                  key={c.id}
                  data-candidate={c.id}
                  className="inline-flex items-center gap-2 rounded-full border border-rule bg-bg px-3 py-1.5 text-xs"
                >
                  <a
                    href={pageHref}
                    className="font-semibold text-text no-underline hover:underline"
                  >
                    {c.displayName}
                  </a>
                  <span className="text-text-tertiary">·</span>
                  <span className="font-mono">{c.versionDate}</span>
                  <span className="text-text-tertiary">·</span>
                  <a
                    href={metaHref}
                    className="underline decoration-dotted underline-offset-4 hover:text-text"
                  >
                    metadata.json
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </footer>
  );
}
