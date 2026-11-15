"use client";

import { Warehouse } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { copy } from "@/lib/copy";
import { springs } from "@/lib/motion";

/** Header link to the garage. The count pops each time a car is saved. */
export function GarageLink({ count }: { count: number }) {
  return (
    <Link
      href="/garage"
      transitionTypes={["nav-forward"]}
      aria-label={`${copy.nav.garage}, ${copy.garage.saved(count)}`}
      className="relative flex h-10 items-center gap-2 rounded-full bg-surface pr-3.5 pl-3 text-sm font-semibold shadow-chip ring-1 ring-line transition duration-150 ease-out-expo hover:bg-raised active:scale-[0.97]"
    >
      <Warehouse className="size-[1.15rem] text-fg-muted" aria-hidden />
      <span aria-hidden>{copy.nav.garage}</span>
      {count > 0 ? (
        <motion.span
          key={count}
          aria-hidden
          initial={{ scale: 1.7 }}
          animate={{ scale: 1 }}
          transition={springs.bouncy}
          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-on-accent tabular-nums"
        >
          {count}
        </motion.span>
      ) : null}
    </Link>
  );
}
