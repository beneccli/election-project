// See docs/specs/website/i18n.md §4 (EN comparison route)
import type { Metadata } from "next";
import { ComparerPageBody } from "@/components/pages/ComparerPageBody";
import type { Lang } from "@/lib/i18n";

interface RouteParams {
  params: Promise<{ lang: string }>;
}

export const metadata: Metadata = {
  title: "Compare programmes · Élection 2027",
  description:
    "Compare 2 to 4 French presidential 2027 programmes side by side.",
};

export default async function LangComparerPage({ params }: RouteParams) {
  const { lang } = await params;
  return <ComparerPageBody lang={lang as Lang} />;
}
