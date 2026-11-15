import { brand } from "@/lib/brand";
import { cn } from "@/lib/cn";

/** Two arrows passing each other: the swap. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="10" className="fill-accent" />
      <g fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="stroke-on-accent">
        <path d="M8.5 12.5h14.5M19 8.5l4 4-4 4" />
        <path d="M23.5 19.5H9M13 15.5l-4 4 4 4" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 font-display text-[1.35rem] font-bold tracking-tight", className)}
    >
      <Mark className="size-7" />
      <span>{brand.name}</span>
    </span>
  );
}
