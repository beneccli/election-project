"use client";
// See docs/specs/website/nextjs-architecture.md §5.2, §4.5
// See docs/specs/website/candidate-page-polish.md §5.3
// See docs/specs/analysis/intergenerational-audit.md
//
// EDITORIAL: measurement, not indictment. No advocacy language.
import { useState } from "react";
import type { AggregatedOutput } from "@/lib/schema";
import { SectionHead } from "@/components/chrome/SectionHead";
import { Drawer } from "@/components/chrome/Drawer";
import { IntergenSplitPanel } from "@/components/widgets/IntergenSplitPanel";
import { IntergenHorizonTable } from "@/components/widgets/IntergenHorizonTable";
import { SourceRef } from "@/components/widgets/SourceRef";
import { useLang } from "@/lib/lang-context";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

function directionLabel(key: string, lang: Lang): string {
  switch (key) {
    case "young_to_old":
      return t(UI_STRINGS.INTERGEN_DIRECTION_YOUNG_TO_OLD, lang);
    case "old_to_young":
      return t(UI_STRINGS.INTERGEN_DIRECTION_OLD_TO_YOUNG, lang);
    case "neutral":
      return t(UI_STRINGS.INTERGEN_DIRECTION_NEUTRAL, lang);
    case "mixed":
      return t(UI_STRINGS.INTERGEN_DIRECTION_MIXED, lang);
    default:
      return key;
  }
}

export function IntergenSection({
  aggregated,
}: {
  aggregated: AggregatedOutput;
}) {
  const { lang } = useLang();
  const ig = aggregated.intergenerational;
  const direction = directionLabel(ig.net_transfer_direction, lang);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sectionLabel = t(UI_STRINGS.INTERGEN_SECTION, lang);

  return (
    <section
      id="intergen"
      data-screen-label={sectionLabel}
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] border-t border-rule py-14"
    >
      <SectionHead label={sectionLabel} />
      <p className="mb-6 max-w-3xl text-base leading-[1.6] text-text-secondary">
        {t(UI_STRINGS.INTERGEN_SECTION_INTRO, lang)}
      </p>

      <IntergenHorizonTable matrix={ig.horizon_matrix} lang={lang} />

      <div className="mt-6 flex justify-start">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-sm border border-rule bg-bg px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t(UI_STRINGS.INTERGEN_DRAWER_OPEN, lang)}
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        size="xl"
        eyebrow={sectionLabel}
        title={t(UI_STRINGS.INTERGEN_DRAWER_TITLE, lang)}
        description={t(UI_STRINGS.INTERGEN_DRAWER_DESCRIPTION, lang)}
      >
        <div className="mb-6 rounded-md border border-rule-light bg-bg-subtle p-4">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            {t(UI_STRINGS.INTERGEN_NET_TRANSFER_LABEL, lang)}
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-lg font-semibold text-text">
              {direction}
            </span>
            <span className="text-sm text-text-secondary">
              {ig.magnitude_estimate.value}{" "}
              <span className="text-text-tertiary">
                {ig.magnitude_estimate.units}
              </span>
            </span>
          </div>
          {ig.magnitude_estimate.caveats ? (
            <p className="mt-1 text-xs italic leading-[1.5] text-text-tertiary">
              {ig.magnitude_estimate.caveats}
            </p>
          ) : null}
        </div>

        <IntergenSplitPanel intergen={ig} lang={lang} />

        {ig.reasoning ? (
          <p className="mt-6 text-sm leading-[1.6] text-text-secondary [text-wrap:pretty]">
            {ig.reasoning}
          </p>
        ) : null}

        {ig.source_refs.length > 0 ? (
          <div className="mt-4">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              {t(UI_STRINGS.INTERGEN_SOURCES_LABEL, lang)} ({ig.source_refs.length})
            </div>
            <ul className="m-0 flex flex-wrap list-none gap-1 p-0">
              {ig.source_refs.map((ref, i) => (
                <li key={`${ref}-${i}`} className="inline-flex">
                  <SourceRef>{ref}</SourceRef>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Drawer>
    </section>
  );
}
