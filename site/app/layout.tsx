// See docs/specs/website/nextjs-architecture.md §1
import type { ReactNode } from "react";

export const metadata = {
  title: "Élection 2027 — Analyse IA des programmes présidentiels",
  description:
    "Analyse transparente multi-IA des programmes des candidats à la présidentielle 2027.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
