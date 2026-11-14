"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import type { SwipeDirection } from "@/lib/domain/types";
import { haptic } from "@/lib/haptics";
import { springs } from "@/lib/motion";

/** Distance in px after which letting go commits the swipe. */
const COMMIT_DISTANCE = 110;
/** A flick faster than this (px/s) commits regardless of distance. */
const COMMIT_VELOCITY = 620;
/** Within this many px of the middle, a flick counts in whichever direction it goes. */
const FLICK_SLOP = 16;
/** Moving back towards the middle faster than this (px/s) at release cancels the swipe. */
const RETREAT_VELOCITY = 220;
const MAX_TILT_DEG = 18;
/** Cards drawn under the top one. One more is mounted, invisible, to preload. */
const STACK_BELOW = 2;
const STACK_SCALE_STEP = 0.05;
const STACK_OFFSET_PX = 14;
/** How long a first-time visitor is left alone before the top card demonstrates the gesture. */
const NUDGE_DELAY_MS = 2600;

export type SwipeMethod = "drag" | "button";

export interface SwipeDeckHandle {
  /** Swipes the top card as if it had been dragged. */
  swipe: (direction: SwipeDirection) => void;
}

interface SwipeDeckProps<T> {
  /** Cards still to be decided, top card first. */
  items: readonly T[];
  getId: (item: T) => string;
  renderCard: (item: T, state: { isTop: boolean }) => ReactNode;
  onSwipe: (item: T, direction: SwipeDirection, method: SwipeMethod) => void;
  onTap?: (item: T) => void;
  stamps: { like: string; pass: string };
  /**
   * Mirrors the top card's drag as −1 (pass) … 1 (like), so the surrounding
   * UI can lean into the gesture.
   */
  intent?: MotionValue<number>;
  /**
   * Show how it works: after a pause the top card leans right, then left, on
   * its own. For visitors who have not swiped anything yet.
   */
  nudge?: boolean;
  ref?: Ref<SwipeDeckHandle>;
}

interface Leaving<T> {
  id: string;
  item: T;
  direction: SwipeDirection;
  velocity: number;
}

/**
 * A stack of cards that can be thrown left or right.
 *
 * The parent owns which cards remain; this component owns the motion. A card
 * that has been swiped stays mounted under the same key until it has left the
 * screen, and a card that comes back (undo) returns from the side it left by.
 */
export function SwipeDeck<T>({
  items,
  getId,
  renderCard,
  onSwipe,
  onTap,
  stamps,
  intent,
  nudge = false,
  ref,
}: SwipeDeckProps<T>) {
  const ownIntent = useMotionValue(0);
  const signed = intent ?? ownIntent;
  const progress = useTransform(signed, (value) => Math.abs(value));

  const [leaving, setLeaving] = useState<Leaving<T>[]>([]);
  const [exits, setExits] = useState<Record<string, SwipeDirection>>({});

  const top = items[0];
  const topId = top === undefined ? null : getId(top);

  // A new card is on top: whatever drag moved the previous one is over.
  useLayoutEffect(() => {
    signed.set(0);
  }, [topId, signed]);

  const commit = useCallback(
    (item: T, direction: SwipeDirection, velocity: number, method: SwipeMethod) => {
      const id = getId(item);
      setExits((previous) => ({ ...previous, [id]: direction }));
      setLeaving((previous) => [...previous.filter((entry) => entry.id !== id), { id, item, direction, velocity }]);
      onSwipe(item, direction, method);
    },
    [getId, onSwipe],
  );

  const handleGone = useCallback((id: string) => {
    setLeaving((previous) => previous.filter((entry) => entry.id !== id));
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      swipe: (direction) => {
        if (top !== undefined) commit(top, direction, 0, "button");
      },
    }),
    [top, commit],
  );

  const stack = items.slice(0, STACK_BELOW + 2);
  const stackIds = new Set(stack.map(getId));
  // An undone card is back in the stack; it is no longer on its way out.
  const departing = leaving.filter((entry) => !stackIds.has(entry.id));

  const cards = [
    ...stack.map((item, depth) => ({ id: getId(item), item, depth, leaving: null as Leaving<T> | null })),
    ...departing.map((entry) => ({ id: entry.id, item: entry.item, depth: 0, leaving: entry })),
  ];

  return (
    <div className="relative size-full">
      {cards.map((card) => (
        <SwipeCard
          key={card.id}
          depth={card.depth}
          leaving={card.leaving}
          enterFrom={exits[card.id] ?? null}
          nudge={nudge}
          signed={signed}
          progress={progress}
          stamps={stamps}
          onCommit={(direction, velocity) => commit(card.item, direction, velocity, "drag")}
          onGone={() => handleGone(card.id)}
          onTap={onTap ? () => onTap(card.item) : undefined}
        >
          {renderCard(card.item, { isTop: card.depth === 0 && card.leaving === null })}
        </SwipeCard>
      ))}
    </div>
  );
}

// ── one card ─────────────────────────────────────────────────────────────

interface SwipeCardProps {
  depth: number;
  leaving: { direction: SwipeDirection; velocity: number } | null;
  /** Set when this card was swiped earlier: it re-enters from that side. */
  enterFrom: SwipeDirection | null;
  nudge: boolean;
  signed: MotionValue<number>;
  progress: MotionValue<number>;
  stamps: { like: string; pass: string };
  onCommit: (direction: SwipeDirection, velocity: number) => void;
  onGone: () => void;
  onTap?: () => void;
  children: ReactNode;
}

const side = (direction: SwipeDirection) => (direction === "like" ? 1 : -1);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Far enough that the card has fully left the screen, whatever the viewport. */
const flyDistance = (card: HTMLElement | null) => window.innerWidth / 2 + (card?.offsetWidth ?? 420);

function SwipeCard({
  depth,
  leaving,
  enterFrom,
  nudge,
  signed,
  progress,
  stamps,
  onCommit,
  onGone,
  onTap,
  children,
}: SwipeCardProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const isTop = depth === 0 && leaving === null;
  const element = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Grab a card by its top half and it swings one way, by the bottom half the other.
  const swing = useMotionValue(1);
  const rotate = useTransform(() => clamp(x.get() / 15, -MAX_TILT_DEG, MAX_TILT_DEG) * swing.get());
  const likeOpacity = useTransform(x, [18, COMMIT_DISTANCE], [0, 1]);
  const passOpacity = useTransform(x, [-COMMIT_DISTANCE, -18], [1, 0]);
  const likeWash = useTransform(x, [0, COMMIT_DISTANCE * 1.6], [0, 0.22]);
  const passWash = useTransform(x, [-COMMIT_DISTANCE * 1.6, 0], [0.22, 0]);

  const stackDepth = useStackDepth(depth, progress, reduceMotion);
  const scale = useTransform(stackDepth, (value) => 1 - Math.min(value, STACK_BELOW + 1) * STACK_SCALE_STEP);
  const lift = useTransform(stackDepth, (value) => Math.min(value, STACK_BELOW + 1) * STACK_OFFSET_PX);
  const opacity = useTransform(stackDepth, [STACK_BELOW, STACK_BELOW + 1], [1, 0]);

  const gone = useEffectEvent(onGone);

  // Returning after an undo: start off-screen on the side it left by.
  const entered = useRef(false);
  useLayoutEffect(() => {
    if (entered.current) return;
    entered.current = true;
    if (!enterFrom || leaving || reduceMotion) return;
    x.jump(side(enterFrom) * flyDistance(element.current));
    animate(x, 0, springs.settle);
  }, [enterFrom, leaving, reduceMotion, x]);

  const wasLeaving = useRef(false);
  useLayoutEffect(() => {
    if (leaving) {
      wasLeaving.current = true;
      const target = side(leaving.direction) * flyDistance(element.current);
      if (reduceMotion) {
        x.jump(target);
        gone();
        return;
      }
      const controls = animate(x, target, {
        type: "spring",
        stiffness: 150,
        damping: 24,
        velocity: leaving.velocity,
        restDelta: 6,
        restSpeed: 60,
        onComplete: () => gone(),
      });
      return () => controls.stop();
    }
    if (wasLeaving.current) {
      // Undone mid-flight: come back from wherever it got to.
      wasLeaving.current = false;
      animate(x, 0, springs.settle);
      animate(y, 0, springs.settle);
    }
  }, [leaving, reduceMotion, x, y]);

  const armed = useRef(false);
  useMotionValueEvent(x, "change", (latest) => {
    if (!isTop) return;
    signed.set(clamp(latest / COMMIT_DISTANCE, -1, 1));
    const past = Math.abs(latest) >= COMMIT_DISTANCE;
    if (past && !armed.current) haptic("tick");
    armed.current = past;
  });

  // A drag ends with the pointer still over the card, which would otherwise
  // also count as a tap and open the details of the card just thrown.
  const dragged = useRef(false);

  // The demonstration: lean towards "like", then towards "pass", then rest.
  // The stamps, the buttons and the edge glow all follow, as they would a finger.
  const stopNudge = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!nudge || !isTop || reduceMotion) return;
    let controls: ReturnType<typeof animate> | undefined;
    const timer = window.setTimeout(() => {
      controls = animate(x, [0, 62, 0, -52, 0], { duration: 2, times: [0, 0.24, 0.5, 0.74, 1], ease: "easeInOut" });
    }, NUDGE_DELAY_MS);
    const stop = () => {
      window.clearTimeout(timer);
      controls?.stop();
    };
    stopNudge.current = stop;
    return stop;
  }, [nudge, isTop, reduceMotion, x]);

  function handlePointerDown() {
    dragged.current = false;
    // A real touch ends the demonstration; if it was mid-lean, settle first.
    // A drag that follows takes over the value and stops this spring.
    stopNudge.current?.();
    stopNudge.current = null;
    if (x.get() !== 0 && !leaving) animate(x, 0, springs.settle);
  }

  function handleDragStart(event: MouseEvent | TouchEvent | PointerEvent) {
    dragged.current = true;
    const rect = element.current?.getBoundingClientRect();
    if (!rect || !("clientY" in event)) return;
    swing.set(event.clientY < rect.top + rect.height / 2 ? 1 : -1);
  }

  function handleTap() {
    if (!dragged.current) onTap?.();
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const offset = x.get();
    const velocity = info.velocity.x;
    // Positive when the card is travelling away from the middle, negative on its way back.
    const outwardSpeed = velocity * (Math.sign(offset) || Math.sign(velocity));

    // A flick commits whatever the distance. Near the middle it counts in
    // whichever direction it goes.
    const flicked =
      outwardSpeed > COMMIT_VELOCITY || (Math.abs(offset) < FLICK_SLOP && Math.abs(velocity) > COMMIT_VELOCITY);
    // Bringing the card back towards the middle is a change of mind, however far out it got.
    const retreating = outwardSpeed < -RETREAT_VELOCITY;

    if (flicked || (!retreating && Math.abs(offset) > COMMIT_DISTANCE)) {
      onCommit((flicked ? velocity : offset) > 0 ? "like" : "pass", velocity);
      return;
    }
    animate(x, 0, springs.settle);
    animate(y, 0, springs.settle);
  }

  return (
    <motion.div
      className="absolute inset-0 origin-bottom"
      style={{
        scale,
        y: lift,
        opacity,
        zIndex: leaving ? 30 : 20 - depth,
        pointerEvents: isTop ? "auto" : "none",
      }}
    >
      <motion.div
        ref={element}
        className={isTop ? "size-full cursor-grab touch-none active:cursor-grabbing" : "size-full"}
        style={{ x, y, rotate, willChange: isTop || leaving ? "transform" : undefined }}
        drag={isTop}
        dragMomentum={false}
        onPointerDown={handlePointerDown}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTap={isTop ? handleTap : undefined}
      >
        {children}

        {/* Colour wash and stamps: the card answers before the finger lets go. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-card bg-accent"
          style={{ opacity: likeWash }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-card bg-pass"
          style={{ opacity: passWash }}
        />
        <Stamp tone="like" style={{ opacity: likeOpacity }}>
          {stamps.like}
        </Stamp>
        <Stamp tone="pass" style={{ opacity: passOpacity }}>
          {stamps.pass}
        </Stamp>
      </motion.div>
    </motion.div>
  );
}

function Stamp({
  tone,
  style,
  children,
}: {
  tone: SwipeDirection;
  style: { opacity: MotionValue<number> };
  children: ReactNode;
}) {
  const position =
    tone === "like"
      ? "left-5 -rotate-12 border-accent text-accent"
      : "right-5 rotate-12 border-plate-band text-plate-band";
  return (
    <motion.div
      aria-hidden
      style={style}
      className={`pointer-events-none absolute top-9 rounded-2xl border-[5px] bg-plate px-3.5 py-1 font-display text-[2.25rem] leading-none font-extrabold tracking-tight shadow-float ${position}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * How far down the stack a card sits, as a smoothed number: 0 is the top card,
 * 1 the one beneath it. While the top card is dragged, the cards below rise
 * towards the next slot, so the stack moves as one object.
 */
function useStackDepth(depth: number, progress: MotionValue<number>, reduceMotion: boolean): MotionValue<number> {
  // Start one slot lower so freshly dealt cards rise into place.
  const target = useMotionValue(depth + 1);

  useLayoutEffect(() => {
    const update = () => target.set(depth === 0 ? 0 : Math.max(0, depth - progress.get()));
    update();
    return progress.on("change", update);
  }, [depth, progress, target]);

  const smoothed = useSpring(target, { stiffness: 480, damping: 40 });
  return reduceMotion ? target : smoothed;
}
