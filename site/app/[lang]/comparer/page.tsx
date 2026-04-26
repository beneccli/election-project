// See docs/specs/website/i18n.md §4 (EN comparison route)
import type { Metadata } from "next";
import { ComparerPageBody } from "@/components/pages/ComparerPageBody";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

interface RouteParams {
  params: Promise<{ lang: string }>;
}

export const metadata: Metadata = {
  title: t(UI_STRINGS.META_COMPARER_TITLE, "en"),
  description: t(UI_STRINGS.META_COMPARER_DESCRIPTION, "en"),
};

export default async function LangComparerPage({ params }: RouteParams) {
  const { lang } = await params;
  return <ComparerPageBody lang={lang as Lang} />;
}
