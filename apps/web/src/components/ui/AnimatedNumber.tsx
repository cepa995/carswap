"use client";

import { animate, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatInt } from "@/lib/format";
import { easeOutExpo } from "@/lib/motion";

interface AnimatedNumberProps {
  value: number;
  /** Must be a stable function (module scope), or the count restarts every render. */
  format?: (value: number) => string;
  /** Count up from this on first appearance instead of starting at `value`. */
  from?: number;
  className?: string;
}

/** A number that counts to its new value instead of jumping. */
export function AnimatedNumber({ value, format = formatInt, from, className }: AnimatedNumberProps) {
  const node = useRef<HTMLSpanElement>(null);
  const shown = useRef(from ?? value);
  // React renders the first value only; later updates are written straight to
  // the DOM so a re-render never flashes the final number mid-count.
  const [initial] = useState(() => format(from ?? value));
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const start = shown.current;
    if (reduceMotion || start === value) {
      shown.current = value;
      element.textContent = format(value);
      return;
    }
    const controls = animate(start, value, {
      duration: 0.55,
      ease: easeOutExpo,
      onUpdate: (latest) => {
        shown.current = latest;
        element.textContent = format(latest);
      },
    });
    return () => controls.stop();
  }, [value, format, reduceMotion]);

  return (
    <span ref={node} className={cn("tabular-nums", className)}>
      {initial}
    </span>
  );
}
