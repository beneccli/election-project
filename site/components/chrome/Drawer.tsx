"use client";

// See docs/specs/website/candidate-page-polish.md §5.4–5.5
// Reusable right-side modal drawer backed by Radix Dialog. Framework-agnostic
// wrapper — callers control open state. Visual design mirrors
// `Candidate Page.html` `TransparenceDrawer`: dim (not blurred) overlay,
// 560px-max right panel with slide-in animation, sticky header with a
// small uppercase eyebrow above the title.
import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";

const SIZE_WIDTHS = {
  sm: "min(92vw, 400px)",
  md: "min(92vw, 560px)",
  lg: "min(92vw, 760px)",
  xl: "min(92vw, 960px)",
} as const;

export function Drawer({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  size = "md",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Optional small uppercase label above the title (e.g. "Transparence"). */
  eyebrow?: string;
  description?: string;
  /** Panel width preset. Default "md" = 560px. Always ≤ 92vw. */
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-drawer-overlay=""
          className="fixed inset-0 z-[100] bg-black/35"
        />
        <Dialog.Content
          data-drawer-panel=""
          className="fixed right-0 top-0 z-[110] flex h-full flex-col bg-bg shadow-[-4px_0_40px_rgba(0,0,0,0.12)] focus:outline-none"
          style={{ width: SIZE_WIDTHS[size] }}
        >
          <header className="sticky top-0 z-[1] flex items-center justify-between gap-4 border-b border-rule bg-bg px-7 pt-6 pb-5">
            <div className="min-w-0">
              {eyebrow ? (
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-accent">
                  {eyebrow}
                </div>
              ) : null}
              <Dialog.Title className="font-display text-base font-semibold text-text">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-xs leading-[1.5] text-text-secondary">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              className="flex-shrink-0 bg-transparent p-1 text-[22px] leading-none text-text-secondary transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Fermer"
            >
              ✕
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

