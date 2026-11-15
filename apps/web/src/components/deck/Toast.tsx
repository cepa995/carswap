"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";

export interface ToastMessage {
  key: number;
  title: string;
  detail?: string;
  /** A swap the dealer accepts, as opposed to a car merely saved. */
  positive: boolean;
}

/** A line that drops in for a moment to say what the last decision did. The caller says where it sits. */
export function Toast({ message, className }: { message: ToastMessage | null; className?: string }) {
  return (
    <div className={cn("pointer-events-none z-40 flex justify-center px-6", className)} role="status">
      <AnimatePresence mode="popLayout">
        {message ? (
          <motion.div
            key={message.key}
            initial={{ y: -18, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0, scale: 0.96 }}
            transition={springs.snappy}
            className={
              message.positive
                ? "flex max-w-full items-center gap-2.5 rounded-full bg-accent py-2 pr-4 pl-3 text-sm font-semibold text-on-accent shadow-accent"
                : "flex max-w-full items-center gap-2 rounded-full bg-canvas/90 px-4 py-2 text-sm font-semibold dark-surface shadow-float"
            }
          >
            {message.positive ? <span aria-hidden className="size-2 shrink-0 rounded-full bg-on-accent" /> : null}
            <span className="truncate">
              {message.title}
              {message.detail ? <span className="font-medium opacity-75"> · {message.detail}</span> : null}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
