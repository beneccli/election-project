// See docs/specs/website/i18n.md §4 (EN landing route)
import type { Metadata } from "next";
import { LandingPageBody } from "@/components/pages/LandingPageBody";
import type { Lang } from "@/lib/i18n";

interface RouteParams {
  params: Promise<{ lang: string }>;
}

export const metadata: Metadata = {
  title: "Élection 2027 · Multi-AI analysis of 2027 French presidential platforms",
  description:
    "What do the candidates for the French presidency really propose? Independent analysis by 4–5 frontier AI models. Disagreement preserved. Public sources.",
};

export default async function LangHomePage({ params }: RouteParams) {
  const { lang } = await params;
  return <LandingPageBody lang={lang as Lang} />;
}
