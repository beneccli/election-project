// See docs/specs/website/methodology-page.md §4-5.
// Thin route shell — body in MethodologyPageBody (shared with /en/methodologie).
import type { Metadata } from "next";
import { MethodologyPageBody } from "@/components/pages/MethodologyPageBody";
import { t, UI_STRINGS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t(UI_STRINGS.META_METHODOLOGIE_TITLE, "fr"),
  description: t(UI_STRINGS.META_METHODOLOGIE_DESCRIPTION, "fr"),
};

export default function MethodologiePage() {
  return <MethodologyPageBody lang="fr" />;
}
