// See docs/specs/website/i18n.md §4
import type { Metadata } from "next";
import { listCandidates, loadCandidate } from "@/lib/candidates";
import { CandidatePageBody } from "@/components/pages/CandidatePageBody";
import { t, UI_STRINGS } from "@/lib/i18n";

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
    return {
      title: `${meta.display_name} ${t(UI_STRINGS.META_CANDIDATE_TITLE_SUFFIX, "fr")}`,
    };
  } catch {
    return { title: t(UI_STRINGS.META_CANDIDATE_NOT_FOUND_TITLE, "fr") };
  }
}

export default async function CandidatePage({ params }: RouteParams) {
  const { id } = await params;
  return <CandidatePageBody id={id} lang="fr" />;
}
