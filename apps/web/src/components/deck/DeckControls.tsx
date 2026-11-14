"use client";

import { ArrowLeft, ArrowRight, ArrowUp, Heart, Info, Undo2, X, type LucideIcon } from "lucide-react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { copy } from "@/lib/copy";

interface DeckControlsProps {
  /** The top card's drag, −1 (pass) … 1 (like). The buttons lean into it. */
  intent: MotionValue<number>;
  hasCard: boolean;
  canUndo: boolean;
  /** Goes up by one with every like; each change sends a ring out from the like button. */
  likePulse: number;
  onUndo: () => void;
  onPass: () => void;
  onLike: () => void;
  onDetails: () => void;
}

const small =
  "flex size-12 items-center justify-center rounded-full bg-raised text-fg-muted ring-1 ring-line-strong ring-inset " +
  "transition duration-200 ease-out-expo hover:bg-hover hover:text-fg active:scale-90 disabled:pointer-events-none disabled:opacity-30";

export function DeckControls({
  intent,
  hasCard,
  canUndo,
  likePulse,
  onUndo,
  onPass,
  onLike,
  onDetails,
}: DeckControlsProps) {
  const passScale = useTransform(intent, [-1, 0], [1.18, 1]);
  const likeScale = useTransform(intent, [0, 1], [1, 1.18]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-center gap-4">
        <button type="button" className={small} onClick={onUndo} disabled={!canUndo} aria-label={copy.deck.undo}>
          <Undo2 className="size-5" strokeWidth={2.2} />
        </button>

        <motion.button
          type="button"
          style={{ scale: passScale }}
          whileTap={{ scale: 0.9 }}
          onClick={onPass}
          disabled={!hasCard}
          aria-label={copy.deck.pass}
          className="flex size-16 items-center justify-center rounded-full bg-raised text-pass shadow-float ring-2 ring-pass/40 ring-inset hover:bg-hover disabled:pointer-events-none disabled:opacity-30"
        >
          <X className="size-7" strokeWidth={3} />
        </motion.button>

        <div className="relative">
          {likePulse > 0 ? (
            <motion.span
              key={likePulse}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full bg-accent"
              initial={{ scale: 1, opacity: 0.55 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : null}
          <motion.button
            type="button"
            style={{ scale: likeScale }}
            whileTap={{ scale: 0.9 }}
            onClick={onLike}
            disabled={!hasCard}
            aria-label={copy.deck.like}
            className="relative flex size-[4.5rem] items-center justify-center rounded-full bg-accent text-on-accent shadow-accent hover:bg-accent-strong disabled:pointer-events-none disabled:opacity-30"
          >
            <Heart className="size-8 fill-current" strokeWidth={2} />
          </motion.button>
        </div>

        <button type="button" className={small} onClick={onDetails} disabled={!hasCard} aria-label={copy.deck.details}>
          <Info className="size-5" strokeWidth={2.2} />
        </button>
      </div>

      {/* Shortcuts, for anyone with a keyboard in front of them. */}
      <ul className="hidden gap-4 text-xs text-fg-faint pointer-fine:flex" aria-hidden>
        <Shortcut icon={ArrowLeft} label={copy.deck.keys.pass} />
        <Shortcut icon={ArrowRight} label={copy.deck.keys.like} />
        <Shortcut icon={ArrowUp} label={copy.deck.keys.details} />
        <Shortcut letter="Z" label={copy.deck.keys.undo} />
      </ul>
    </div>
  );
}

function Shortcut({ icon: Icon, letter, label }: { icon?: LucideIcon; letter?: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <kbd className="flex size-5 items-center justify-center rounded-md bg-raised font-sans text-[11px] font-semibold text-fg-muted ring-1 ring-line-strong ring-inset">
        {Icon ? <Icon className="size-3" strokeWidth={2.6} /> : letter}
      </kbd>
      {label}
    </li>
  );
}
