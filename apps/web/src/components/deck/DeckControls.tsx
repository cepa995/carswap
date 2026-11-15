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
  "flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-fg-muted shadow-chip ring-1 ring-line " +
  "transition duration-200 ease-out-expo hover:bg-raised hover:text-fg active:scale-90 disabled:pointer-events-none disabled:opacity-35";

/**
 * The two decisions are spelled out, not left to icons: not everyone arriving
 * from an ad has used a swipe app, and "Menjam" is the word they would use.
 * On the narrowest phones there is room for the word or the icon, not both,
 * and the word wins.
 */
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
  const passScale = useTransform(intent, [-1, 0], [1.08, 1]);
  const likeScale = useTransform(intent, [0, 1], [1, 1.08]);

  return (
    <div className="mx-auto flex w-full max-w-[26rem] flex-col items-center gap-3">
      <div className="flex w-full items-center gap-2.5">
        <button type="button" className={small} onClick={onUndo} disabled={!canUndo} aria-label={copy.deck.undo}>
          <Undo2 className="size-5" strokeWidth={2.2} />
        </button>

        <motion.button
          type="button"
          style={{ scale: passScale }}
          whileTap={{ scale: 0.94 }}
          onClick={onPass}
          disabled={!hasCard}
          className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-surface text-base font-semibold text-fg shadow-float ring-1 ring-line-strong hover:bg-raised disabled:pointer-events-none disabled:opacity-35"
        >
          <X className="size-5 max-[22rem]:hidden" strokeWidth={3} aria-hidden />
          {copy.deck.pass}
        </motion.button>

        <div className="relative min-w-0 flex-[1.3]">
          {likePulse > 0 ? (
            <motion.span
              key={likePulse}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full bg-accent"
              initial={{ scaleX: 1, scaleY: 1, opacity: 0.5 }}
              animate={{ scaleX: 1.14, scaleY: 1.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : null}
          <motion.button
            type="button"
            style={{ scale: likeScale }}
            whileTap={{ scale: 0.94 }}
            onClick={onLike}
            disabled={!hasCard}
            className="relative flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent text-base font-semibold text-on-accent shadow-accent hover:bg-accent-strong disabled:pointer-events-none disabled:opacity-35"
          >
            <Heart className="size-5 fill-current max-[22rem]:hidden" strokeWidth={2} aria-hidden />
            {copy.deck.like}
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
      <kbd className="flex size-5 items-center justify-center rounded-md bg-surface font-sans text-[11px] font-semibold text-fg-muted ring-1 ring-line-strong">
        {Icon ? <Icon className="size-3" strokeWidth={2.6} /> : letter}
      </kbd>
      {label}
    </li>
  );
}
