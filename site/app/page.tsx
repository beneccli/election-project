// See docs/specs/website/landing-page.md §5.1
// Thin route shell. Body rendered by LandingPageBody (shared with the
// /[lang] EN tree) — see docs/specs/website/i18n.md §4.
import type { Metadata } from "next";
import { LandingPageBody } from "@/components/pages/LandingPageBody";

export const metadata: Metadata = {
  title: "Élection 2027 · Analyse multi-IA des programmes",
  description:
    "Que proposent vraiment les candidats à l'Élysée ? Analyse indépendante par 4 à 5 grands modèles d'IA. Désaccords préservés. Sources publiques.",
};

export default function HomePage() {
  return <LandingPageBody lang="fr" />;
}
