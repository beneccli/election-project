// See docs/specs/website/comparison-page.md §4-5.
// Thin route shell — body in ComparerPageBody (shared with /en/comparer).
import type { Metadata } from "next";
import { ComparerPageBody } from "@/components/pages/ComparerPageBody";
import { t, UI_STRINGS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t(UI_STRINGS.META_COMPARER_TITLE, "fr"),
  description: t(UI_STRINGS.META_COMPARER_DESCRIPTION, "fr"),
};

export default function ComparerPage() {
  return <ComparerPageBody lang="fr" />;
}
