"use client";
// See docs/specs/website/comparison-page.md §4 (Domaines).
import { DIMENSION_KEYS, type DimensionKey } from "@/lib/derived/keys";
import { dimensionLabel } from "@/lib/dimension-labels";
import { GradeBadge } from "@/components/widgets/GradeBadge";
import { COMPARISON_COLORS } from "@/lib/comparison-colors";
import { useLang } from "@/lib/lang-context";
import { gradeValue } from "@/lib/grade-value";
import type { ComparisonProjection } from "@/lib/derived/comparison-projection";
import { useComparison } from "./ComparisonBody";
import { SectionHead } from "../chrome/SectionHead";

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

function ecartClass(spread: number): string {
  if (spread >= 3) return "text-[color:var(--risk-red)] font-semibold";
  if (spread === 2) return "text-[color:var(--risk-amber)] font-semibold";
  return "text-text-tertiary";
}

function formatSpread(spread: number): string {
  return spread >= 2 ? `⚡ ${spread}` : `${spread}`;
}

export function DomainesComparison() {
  const { entries, selectedIds } = useComparison();
  const { lang } = useLang();

  if (selectedIds.length < 2) return null;
  const selected: ComparisonProjection[] = selectedIds
    .map((id) => entries.find((e) => e.analyzable && e.id === id))
    .filter((e): e is ComparisonProjection =>
      Boolean(e && e.analyzable === true),
    );
  if (selected.length < 2) return null;

  return <DomainesTable selected={selected} lang={lang} />;
}

export function DomainesTable({
  selected,
  lang,
}: {
  selected: ComparisonProjection[];
  lang: "fr" | "en";
}) {
  return (
    <section id="domaines" className="mb-16">
      <header className="mb-5">
        <SectionHead label={lang === "en" ? "Domains" : "Domaines"} />
        {/* <p className="mt-1 max-w-prose text-sm text-text-secondary">
          {lang === "en"
            ? "Consensus grade per dimension. The ↑ marker signals the unique top of each row; Écart is the ordinal distance max − min."
            : "Grade de consensus par dimension. La flèche ↑ marque le haut strict de la ligne ; « Écart » est la distance ordinale max − min."}
        </p> */}
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="w-48 border-b border-rule px-3 pb-2 text-left text-xs font-medium uppercase tracking-wide text-text-secondary"
              >
                {lang === "en" ? "Dimension" : "Dimension"}
              </th>
              {selected.map((c, slot) => {
                const color = COMPARISON_COLORS[slot % COMPARISON_COLORS.length];
                return (
                  <th
                    key={c.id}
                    scope="col"
                    className="border-b border-rule px-3 pb-2 text-center text-xs font-medium"
                  >
                    <span
                      aria-hidden
                      className="mx-auto mb-1 block h-[3px] w-8 rounded"
                      style={{ backgroundColor: color }}
                    />
                    <span className="block">{firstName(c.displayName)}</span>
                    {/* <span className="block text-[10px] font-normal text-text-secondary">
                      {c.partyShort}
                    </span> */}
                  </th>
                );
              })}
              <th
                scope="col"
                className="border-b border-rule px-3 pb-2 text-center text-xs font-medium uppercase tracking-wide text-text-secondary"
              >
                {lang === "en" ? "Spread" : "Écart"}
              </th>
            </tr>
          </thead>
          <tbody>
            {DIMENSION_KEYS.map((dim: DimensionKey) => {
              const values: Array<{ v: number; id: string }> = [];
              const letters = selected.map((c) => c.dimGrades[dim]);
              selected.forEach((c) => {
                const v = gradeValue(c.dimGrades[dim]);
                if (v !== null) values.push({ v, id: c.id });
              });
              const max = values.length > 0
                ? Math.max(...values.map((x) => x.v))
                : null;
              const min = values.length > 0
                ? Math.min(...values.map((x) => x.v))
                : null;
              const argmax = values.filter((x) => x.v === max).map((x) => x.id);
              const uniqueTopId = argmax.length === 1 ? argmax[0] : null;
              const spread = max !== null && min !== null ? max - min : null;

              return (
                <tr key={dim}>
                  <th
                    scope="row"
                    className="border-b border-rule px-3 py-2 text-left font-medium text-text-secondary"
                  >
                    {dimensionLabel(dim, lang)}
                  </th>
                  {selected.map((c, i) => {
                    const letter = letters[i];
                    const isTop = uniqueTopId === c.id;
                    return (
                      <td
                        key={c.id}
                        className="border-b border-rule px-3 py-2"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <GradeBadge grade={letter} size="xs" />
                          {isTop ? (
                            <span
                              aria-label={
                                lang === "en"
                                  ? "Top grade in this selection"
                                  : "Meilleure note de la sélection"
                              }
                              title={
                                lang === "en"
                                  ? "Top grade in this selection"
                                  : "Meilleure note de la sélection"
                              }
                              className="text-text-secondary"
                              data-top-marker={c.id}
                            >
                              ↑
                            </span>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                  <td
                    className={`border-b border-rule px-3 py-2 text-center ${
                      spread !== null ? ecartClass(spread) : "text-text-tertiary"
                    }`}
                  >
                    {spread === null ? "—" : formatSpread(spread)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
