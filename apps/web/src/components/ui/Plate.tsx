import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The visitor's car, drawn as a licence plate. It is the one bright, physical
 * object in a dark interface, so "your car" is recognisable at a glance
 * wherever it appears. Sized in em: set the font size to scale it.
 */
export function Plate({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-[0.5em] bg-plate font-display font-bold tracking-[0.01em] text-plate-ink uppercase",
        "shadow-[0_0_0_0.09em_rgb(0_0_0/0.9)_inset,0_0.12em_0.5em_rgb(0_0_0/0.35)]",
        className,
      )}
    >
      {/* The blue band of a Serbian plate. Its lettering would be a smudge at chip sizes, so it is left out. */}
      <span aria-hidden className="w-[0.8em] shrink-0 bg-plate-band" />
      <span className="px-[0.55em] py-[0.32em] leading-none whitespace-nowrap">{children}</span>
    </span>
  );
}
