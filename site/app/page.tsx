// See docs/specs/website/landing-page.md §5.1
// Thin route shell. Body rendered by LandingPageBody (shared with the
// /[lang] EN tree) — see docs/specs/website/i18n.md §4.
import type { Metadata } from "next";
import { LandingPageBody } from "@/components/pages/LandingPageBody";
import { t, UI_STRINGS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t(UI_STRINGS.META_LANDING_TITLE, "fr"),
  description: t(UI_STRINGS.META_LANDING_DESCRIPTION, "fr"),
};

export default function HomePage() {
  return <LandingPageBody lang="fr" />;
}
