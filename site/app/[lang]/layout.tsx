// See docs/specs/website/i18n.md §4 ([lang] sub-route layout)
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LangProvider } from "@/lib/lang-context";
import type { Lang } from "@/lib/i18n";

const SUPPORTED_LOCALES: ReadonlyArray<Exclude<Lang, "fr">> = ["en"];

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export default async function LangLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  if (!SUPPORTED_LOCALES.includes(lang as Exclude<Lang, "fr">)) {
    notFound();
  }
  const typed = lang as Lang;
  return <LangProvider initial={typed}>{children}</LangProvider>;
}
