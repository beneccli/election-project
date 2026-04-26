// See docs/specs/website/methodology-page.md §4-5 and docs/specs/website/i18n.md §4.
import type { Metadata } from "next";
import { MethodologyPageBody } from "@/components/pages/MethodologyPageBody";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

interface RouteParams {
  params: Promise<{ lang: string }>;
}

export const metadata: Metadata = {
  title: t(UI_STRINGS.META_METHODOLOGIE_TITLE, "en"),
  description: t(UI_STRINGS.META_METHODOLOGIE_DESCRIPTION, "en"),
};

export default async function LangMethodologiePage({ params }: RouteParams) {
  const { lang } = await params;
  return <MethodologyPageBody lang={lang as Lang} />;
}
