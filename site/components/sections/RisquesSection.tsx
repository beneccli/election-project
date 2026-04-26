"use client";

// See docs/specs/website/nextjs-architecture.md §5.2, §4.6
// See docs/specs/website/candidate-page-polish.md §5.4
// Primary: 5×4 risk summary matrix. Secondary: full per-risk heatmap in a
// right-side drawer.
import { useState } from "react";
import type { AggregatedOutput } from "@/lib/schema";
import { DIMENSION_KEYS, type DimensionKey } from "@/lib/derived/keys";
import { SectionHead } from "@/components/chrome/SectionHead";
import { Drawer } from "@/components/chrome/Drawer";
import {
  RiskHeatmap,
  type RiskGroup,
} from "@/components/widgets/RiskHeatmap";
import { RiskSummaryMatrix } from "@/components/widgets/RiskSummaryMatrix";
import { useLang } from "@/lib/lang-context";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";
import { Tooltip } from "../widgets/Tooltip";

function dimensionLabel(key: DimensionKey, lang: Lang): string {
  switch (key) {
    case "economic_fiscal":
      return t(UI_STRINGS.DIMENSION_LABEL_ECONOMIC_FISCAL, lang);
    case "social_demographic":
      return t(UI_STRINGS.DIMENSION_LABEL_SOCIAL_DEMOGRAPHIC, lang);
    case "security_sovereignty":
      return t(UI_STRINGS.DIMENSION_LABEL_SECURITY_SOVEREIGNTY, lang);
    case "institutional_democratic":
      return t(UI_STRINGS.DIMENSION_LABEL_INSTITUTIONAL_DEMOCRATIC, lang);
    case "environmental_long_term":
      return t(UI_STRINGS.DIMENSION_LABEL_ENVIRONMENTAL_LONG_TERM, lang);
  }
}

export function RisquesSection({
  aggregated,
}: {
  aggregated: AggregatedOutput;
}) {
  const { lang } = useLang();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const totalCoverage = Object.keys(aggregated.agreement_map.coverage).length;
  const groups: RiskGroup[] = DIMENSION_KEYS.map((key) => ({
    dimensionKey: key,
    label: dimensionLabel(key, lang),
    risks: aggregated.dimensions[key].execution_risks,
    totalCoverage,
  }));

  return (
    <section
      id="risques"
      data-screen-label={t(UI_STRINGS.RISQUES_SECTION, lang)}
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] border-t border-rule py-14"
    >
      <SectionHead label={t(UI_STRINGS.RISQUES_SECTION_LABEL, lang)} />
      <p className="mb-8 max-w-3xl text-base leading-[1.6] text-text-secondary">
        {t(UI_STRINGS.RISQUE_BUDGETARY_INTRO_BODY, lang)}{' '}
        {t(UI_STRINGS.RISQUE_IMPLEMENTATION_INTRO_BODY, lang)}{' '}
        {t(UI_STRINGS.RISQUE_DEPENDENCY_INTRO_BODY, lang)}
        <Tooltip
          as="span"
          content={t(UI_STRINGS.RISQUE_DEPENDENCY_NOTE, lang)}
        >
          <span className="mx-2 font-bold text-xs text-text-tertiary opacity-50 hover:opacity-100 border border-text-tertiary rounded-full px-1">?</span>
        </Tooltip>
        {t(UI_STRINGS.RISQUE_REVERSIBILITY_INTRO_BODY, lang)}
      </p>
      <RiskSummaryMatrix dimensions={aggregated.dimensions} lang={lang} />

      <div className="mt-6 flex justify-start">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-sm border border-rule bg-bg px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t(UI_STRINGS.RISQUES_DRAWER_OPEN, lang)}
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        size="xl"
        eyebrow={t(UI_STRINGS.RISQUES_SECTION_LABEL, lang)}
        title={t(UI_STRINGS.RISQUES_DRAWER_TITLE, lang)}
        description={t(UI_STRINGS.RISQUES_DRAWER_DESCRIPTION, lang)}
      >
        <RiskHeatmap groups={groups} lang={lang} />
      </Drawer>
    </section>
  );
}
