// See docs/specs/website/nextjs-architecture.md §5.2
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listCandidates, loadCandidate } from "@/lib/candidates";
import { NavBar } from "@/components/chrome/NavBar";
import { Hero } from "@/components/chrome/Hero";
import { SectionNav } from "@/components/chrome/SectionNav";
import { TransparencyFooter } from "@/components/chrome/TransparencyFooter";
import { SyntheseSection } from "@/components/sections/SyntheseSection";
import { PositionnementSection } from "@/components/sections/PositionnementSection";
import { DomainesSection } from "@/components/sections/DomainesSection";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return listCandidates().map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: RouteParams): Promise<Metadata> {
  const { id } = await params;
  try {
    const { meta } = loadCandidate(id);
    return { title: `${meta.display_name} — Analyse · Élection 2027` };
  } catch {
    return { title: "Candidat introuvable · Élection 2027" };
  }
}

export default async function CandidatePage({ params }: RouteParams) {
  const { id } = await params;
  let data;
  try {
    data = loadCandidate(id);
  } catch {
    notFound();
  }
  const { meta, versionMeta, aggregated } = data;

  return (
    <>
      <NavBar meta={meta} />
      <Hero meta={meta} versionMeta={versionMeta} aggregated={aggregated} />
      <SectionNav />
      <main className="mx-auto max-w-content px-8 pb-32">
        <SyntheseSection aggregated={aggregated} />
        <PositionnementSection aggregated={aggregated} />
        <DomainesSection aggregated={aggregated} />
        <SectionPlaceholder
          id="intergen"
          title="Impact intergénérationnel"
        />
        <SectionPlaceholder id="risques" title="Risques" />
      </main>
      <TransparencyFooter versionMeta={versionMeta} />
    </>
  );
}

function SectionPlaceholder({ id, title }: { id: string; title: string }) {
  return (
    <section
      id={id}
      className="scroll-mt-[calc(var(--nav-h)+var(--section-nav-h))] py-14"
    >
      <h2 className="mb-4 font-display text-3xl font-bold tracking-[-0.01em] text-text">
        {title}
      </h2>
      <p className="text-sm text-text-secondary">
        Section en construction.
      </p>
    </section>
  );
}
