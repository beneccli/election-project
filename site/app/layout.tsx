// See docs/specs/website/nextjs-architecture.md §5.2
import type { ReactNode } from "react";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { ThemeToggle } from "../components/chrome/ThemeToggle";
import { THEME_INIT_SCRIPT } from "../lib/theme-init";
import "../styles/globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const text = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-text",
  display: "swap",
});

export const metadata = {
  title: "Élection 2027 — Analyse IA des programmes présidentiels",
  description:
    "Analyse transparente multi-IA des programmes des candidats à la présidentielle 2027.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      data-theme="light"
      className={`${display.variable} ${text.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-bg text-text font-sans">
        <header className="flex items-center justify-end border-b border-rule px-6 py-2">
          <ThemeToggle />
        </header>
        {children}
      </body>
    </html>
  );
}
