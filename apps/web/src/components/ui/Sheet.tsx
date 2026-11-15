"use client";

import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Read by screen readers; shown visually only when `showTitle` is set. */
  title: string;
  showTitle?: boolean;
  /** "content" hugs its content, "tall" always takes most of the screen. */
  height?: "content" | "tall";
  className?: string;
  children: ReactNode;
}

/**
 * Bottom sheet: slides up, traps focus, closes on Escape, backdrop tap, or a
 * downward drag on the handle. Radix supplies the dialog semantics, Motion
 * the physics.
 */
export function Sheet({ open, onOpenChange, title, showTitle, height = "content", className, children }: SheetProps) {
  const dragControls = useDragControls();
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : springs.sheet;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-black/45"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
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
                transition={transition}
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
                  className={cn(showTitle ? "px-6 pb-1 font-display text-2xl font-semibold tracking-tight" : "sr-only")}
                >
                  {title}
                </Dialog.Title>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
