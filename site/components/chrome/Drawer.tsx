"use client";

// See docs/specs/website/candidate-page-polish.md §5.4–5.5
// Reusable right-side modal drawer backed by Radix Dialog. Framework-agnostic
// wrapper — callers control open state. Intended for transparency/risks/PDF
// preview use cases.
import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={[
            "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]",
            "data-[state=open]:motion-safe:animate-in data-[state=open]:motion-safe:fade-in",
            "data-[state=closed]:motion-safe:animate-out data-[state=closed]:motion-safe:fade-out",
          ].join(" ")}
        />
        <Dialog.Content
          className={[
            "fixed right-0 top-0 z-50 flex h-full w-[min(90vw,640px)] flex-col",
            "border-l border-rule bg-bg shadow-xl focus:outline-none",
            "data-[state=open]:motion-safe:animate-in data-[state=open]:motion-safe:slide-in-from-right",
            "data-[state=closed]:motion-safe:animate-out data-[state=closed]:motion-safe:slide-out-to-right",
            "motion-reduce:data-[state=open]:animate-in motion-reduce:data-[state=open]:fade-in",
            "motion-reduce:data-[state=closed]:animate-out motion-reduce:data-[state=closed]:fade-out",
          ].join(" ")}
          aria-describedby={description ? undefined : undefined}
        >
          <header className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-lg font-semibold text-text">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-text-secondary">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              className="rounded-sm border border-rule px-2 py-1 text-sm text-text-secondary transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Fermer"
            >
              ✕
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
