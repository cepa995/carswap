import { CarFront } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CarChipProps {
  children: ReactNode;
  /** Shown after the name and never cut off, e.g. a chevron when the chip opens something. */
  trailing?: ReactNode;
  className?: string;
}

/**
 * The visitor's own car: a white chip with a red badge. It looks the same
 * wherever it appears (header, cards, garage, the match moment), so "your
 * car" is recognisable at a glance on paper and on photos alike. Sized in em:
 * set the font size to scale it. A long name is shortened with an ellipsis.
 */
export function CarChip({ children, trailing, className }: CarChipProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-[0.45em] rounded-full bg-chip py-[0.22em] pr-[0.8em] pl-[0.22em]",
        "font-display leading-none font-bold tracking-tight text-chip-ink shadow-chip ring-1 ring-black/10",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-[1.6em] shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
      >
        <CarFront className="size-[1em]" strokeWidth={2.3} />
      </span>
      <span className="truncate py-[0.15em]">{children}</span>
      {trailing}
    </span>
  );
}
