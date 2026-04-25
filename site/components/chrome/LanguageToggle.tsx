// See docs/specs/website/i18n.md §4.4 (URL-driven locale toggle).
"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { t, UI_STRINGS, type Lang } from "@/lib/i18n";

const SUPPORTED_LANGS: ReadonlySet<Lang> = new Set(["fr", "en"]);

/**
 * Compute the equivalent path in `target` locale.
 * - FR routes have no prefix.
 * - Non-FR routes are prefixed with `/<lang>`.
 */
export function swapLocalePath(pathname: string, target: Lang): string {
  const trimmed = pathname || "/";
  const segments = trimmed.split("/").filter(Boolean);
  const head = segments[0];
  const isLocalePrefixed =
    head !== undefined && SUPPORTED_LANGS.has(head as Lang);
  const rest = isLocalePrefixed ? segments.slice(1) : segments;
  if (target === "fr") {
    return rest.length === 0 ? "/" : `/${rest.join("/")}`;
  }
  return rest.length === 0 ? `/${target}` : `/${target}/${rest.join("/")}`;
}

function LanguageToggleInner() {
  const { lang } = useLang();
  const pathname = usePathname() ?? "/";
  // useSearchParams must live inside a Suspense boundary at static-export
  // time, hence the wrapper below.
  const searchParams = useSearchParams();
  const next: Lang = lang === "fr" ? "en" : "fr";
  const label =
    next === "en"
      ? t(UI_STRINGS.TOGGLE_LANG_EN, lang)
      : t(UI_STRINGS.TOGGLE_LANG_FR, lang);
  const targetPath = swapLocalePath(pathname, next);
  const query = searchParams?.toString() ?? "";
  const href = query.length > 0 ? `${targetPath}?${query}` : targetPath;

  return (
    <Link
      href={href}
      aria-label={label}
      data-language-toggle={next}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-text-subtle transition-colors hover:border-text-subtle hover:text-text"
    >
      <span>{lang.toUpperCase()}</span>
      <span aria-hidden="true">→</span>
      <span>{next.toUpperCase()}</span>
    </Link>
  );
}

export function LanguageToggle() {
  return (
    <Suspense fallback={null}>
      <LanguageToggleInner />
    </Suspense>
  );
}
