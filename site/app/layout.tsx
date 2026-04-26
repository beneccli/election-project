// See docs/specs/website/nextjs-architecture.md §5.2
import type { ReactNode } from "react";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { LangProvider } from "../lib/lang-context";
import { THEME_INIT_SCRIPT } from "../lib/theme-init";
import { t, UI_STRINGS } from "../lib/i18n";
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
  title: t(UI_STRINGS.META_ROOT_TITLE, "fr"),
  description: t(UI_STRINGS.META_ROOT_DESCRIPTION, "fr"),
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
        <LangProvider initial="fr">{children}</LangProvider>
      </body>
    </html>
  );
}
