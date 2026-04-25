// See docs/specs/website/i18n.md §4 (EN candidate route)
import type { Metadata } from "next";
import { listCandidates, loadCandidate } from "@/lib/candidates";
import { CandidatePageBody } from "@/components/pages/CandidatePageBody";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

interface RouteParams {
  params: Promise<{ lang: string; id: string }>;
}

const SUPPORTED_LOCALES: ReadonlyArray<Exclude<Lang, "fr">> = ["en"];

export function generateStaticParams() {
  const ids = listCandidates().map((c) => c.id);
  const params: Array<{ lang: string; id: string }> = [];
  for (const lang of SUPPORTED_LOCALES) {
    for (const id of ids) params.push({ lang, id });
  }
  return params;
}

export async function generateMetadata({
  params,
}: RouteParams): Promise<Metadata> {
  const { lang: rawLang, id } = await params;
  const lang = rawLang as Lang;
  try {
    const { meta } = loadCandidate(id);
    return {
      title: `${meta.display_name} ${t(UI_STRINGS.META_CANDIDATE_TITLE_SUFFIX, lang)}`,
    };
  } catch {
    return { title: t(UI_STRINGS.META_CANDIDATE_NOT_FOUND_TITLE, lang) };
  }
}

export default async function LangCandidatePage({ params }: RouteParams) {
  const { lang, id } = await params;
  return <CandidatePageBody id={id} lang={lang as Lang} />;
}
