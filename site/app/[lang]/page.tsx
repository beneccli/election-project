// See docs/specs/website/i18n.md §4 (EN landing route)
import type { Metadata } from "next";
import { LandingPageBody } from "@/components/pages/LandingPageBody";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

interface RouteParams {
  params: Promise<{ lang: string }>;
}

export const metadata: Metadata = {
  title: t(UI_STRINGS.META_LANDING_TITLE, "en"),
  description: t(UI_STRINGS.META_LANDING_DESCRIPTION, "en"),
};

export default async function LangHomePage({ params }: RouteParams) {
  const { lang } = await params;
  return <LandingPageBody lang={lang as Lang} />;
}
