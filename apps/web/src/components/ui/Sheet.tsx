"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { useIsDesktop } from "@/lib/media";
import { springs } from "@/lib/motion";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Read by screen readers; shown visually only when `showTitle` is set. */
  title: string;
  showTitle?: boolean;
  /** "content" hugs its content, "tall" always takes most of the screen. */
  height?: "content" | "tall";
  /** On a big screen: wide enough for two columns, for sheets that have that much to show. */
  wide?: boolean;
  /** On a big screen a close button sits in the corner. Turn it off when the content brings its own. */
  closeButton?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * On a phone, a bottom sheet: slides up, and closes on Escape, a tap on the
 * backdrop or a downward drag on the handle. On a big screen the same content
 * is a dialog in the middle, with a close button, because a sheet rising from
 * the bottom edge of a monitor is a long way from where the eyes are.
 *
 * Radix supplies the dialog semantics and the focus trap, Motion the physics.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  showTitle,
  height = "content",
  wide = false,
  closeButton = true,
  className,
  children,
}: SheetProps) {
  const dragControls = useDragControls();
  const reduceMotion = useReducedMotion();
  const desktop = useIsDesktop();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/45"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              {desktop ? (
                <motion.div
                  className={cn(
                    "fixed inset-0 z-50 m-auto flex w-full flex-col overflow-hidden rounded-sheet bg-surface shadow-card outline-none",
                    wide ? "max-w-5xl" : "max-w-[30rem]",
                    height === "tall" ? "h-[min(48rem,90dvh)]" : "h-fit max-h-[90dvh]",
                    className,
                  )}
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 10 }}
                  transition={reduceMotion ? { duration: 0 } : springs.snappy}
                >
                  <div className="flex shrink-0 items-center gap-4 pt-4 pr-4 pl-6">
                    <Dialog.Title
                      className={cn(showTitle ? "font-display text-2xl font-semibold tracking-tight" : "sr-only")}
                    >
                      {title}
                    </Dialog.Title>
                    {closeButton ? (
                      <Dialog.Close
                        aria-label={copy.common.close}
                        className="ml-auto flex size-10 shrink-0 items-center justify-center rounded-full text-fg-muted transition duration-150 ease-out-expo hover:bg-raised hover:text-fg active:scale-90"
                      >
                        <X className="size-5" aria-hidden />
                      </Dialog.Close>
                    ) : null}
                  </div>
                  {children}
                </motion.div>
              ) : (
                <motion.div
                  className={cn(
                    "fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[30rem] flex-col rounded-t-sheet bg-surface outline-none",
                    "shadow-[0_-16px_48px_rgb(40_22_8/0.22)]",
                    height === "tall" ? "h-[92dvh]" : "max-h-[92dvh]",
                    className,
                  )}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={reduceMotion ? { duration: 0 } : springs.sheet}
                  drag="y"
                  dragControls={dragControls}
                  dragListener={false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.7 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 110 || info.velocity.y > 700) onOpenChange(false);
                  }}
                >
                  <div
                    className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-2 active:cursor-grabbing"
                    onPointerDown={(event) => dragControls.start(event)}
                  >
                    <span aria-hidden className="h-1.5 w-11 rounded-full bg-line-strong" />
                  </div>
                  <Dialog.Title
                    className={cn(
                      showTitle ? "px-6 pb-1 font-display text-2xl font-semibold tracking-tight" : "sr-only",
                    )}
                  >
                    {title}
                  </Dialog.Title>
                  {children}
                </motion.div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
