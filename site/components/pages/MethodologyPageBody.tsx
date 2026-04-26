// See docs/specs/website/methodology-page.md §3 and §6.
//
// Top-level server component for the /methodologie page. Assembles
// the navbar, sticky TOC (lg+), and the eleven sections in the
// canonical order. No client islands.

import { ComparisonNavBar } from "@/components/chrome/ComparisonNavBar";
import { MethodologyHero } from "@/components/methodology/MethodologyHero";
import { PipelineDiagram } from "@/components/methodology/PipelineDiagram";
import { EditorialPrinciplesSection } from "@/components/methodology/EditorialPrinciplesSection";
import { PositioningSection } from "@/components/methodology/PositioningSection";
import { AggregationSection } from "@/components/methodology/AggregationSection";
import { DimensionsSection } from "@/components/methodology/DimensionsSection";
import { TransparencyLinksSection } from "@/components/methodology/TransparencyLinksSection";
import { NotThisSection } from "@/components/methodology/NotThisSection";
import { LimitationsSection } from "@/components/methodology/LimitationsSection";
import { GovernanceSection } from "@/components/methodology/GovernanceSection";
import { MethodologyTOC } from "@/components/methodology/MethodologyTOC";
import type { Lang } from "@/lib/i18n";

export interface MethodologyPageBodyProps {
  lang: Lang;
}

export function MethodologyPageBody({ lang }: MethodologyPageBodyProps) {
  return (
    <>
      <ComparisonNavBar lang={lang} />
      <main className="mx-auto max-w-6xl">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
          <aside className="px-6 py-8">
            <MethodologyTOC lang={lang} />
          </aside>
          <div>
            <MethodologyHero lang={lang} />
            <PipelineDiagram lang={lang} />
            <EditorialPrinciplesSection lang={lang} />
            <PositioningSection lang={lang} />
            <AggregationSection lang={lang} />
            <DimensionsSection lang={lang} />
            <TransparencyLinksSection lang={lang} />
            <NotThisSection lang={lang} />
            <LimitationsSection lang={lang} />
            <GovernanceSection lang={lang} />
          </div>
        </div>
      </main>
    </>
  );
}
