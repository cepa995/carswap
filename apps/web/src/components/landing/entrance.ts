"use client";

import { useReducedMotion, type Variants } from "motion/react";
import { useEffect, useState, type RefObject } from "react";
import { springs } from "@/lib/motion";

/**
 * Where a piece of the landing page is in its entrance.
 *
 * - `static`   The finished picture, and nothing moves. It is what the server
 *              sends, and all a visitor who asked for less motion ever gets.
 * - `armed`    Holding its first frame, off screen, until someone can watch.
 * - `playing`  Performing, or done performing.
 *
 * The middle state is what keeps a piece from being seen finished, vanishing,
 * and then playing: by the time it scrolls into view it is already waiting at
 * its first frame.
 */
export type Phase = "static" | "armed" | "playing";

/** What is known about a piece: nothing yet, it was on screen from the start, it is waiting below, or it has come into view. */
type Sighting = "unknown" | "there-from-the-start" | "waiting" | "seen";

/** Every tenth, so a piece taller than the screen is still looked at as it scrolls through. */
const STEPS = Array.from({ length: 11 }, (_, index) => index / 10);

/**
 * The phase of something that plays once, when enough of `target` is on
 * screen to be watched: `amount` of the piece, or of the screen if the piece
 * is the taller of the two.
 *
 * A piece that is already on screen when the page comes to life is left as it
 * was drawn. Someone who reloads half-way down the page should find it there,
 * not watch it vanish and perform again.
 */
export function useEntrance(target: RefObject<Element | null>, amount = 0.35): Phase {
  const reduceMotion = useReducedMotion() ?? false;
  const [sighting, setSighting] = useState<Sighting>("unknown");

  useEffect(() => {
    const element = target.current;
    if (!element) return;

    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (first) {
          first = false;
          if (entry.isIntersecting) {
            setSighting("there-from-the-start");
            observer.disconnect();
          } else {
            setSighting("waiting");
          }
          return;
        }
        const enoughOfThePiece = entry.intersectionRatio >= amount;
        const enoughOfTheScreen = entry.intersectionRect.height >= window.innerHeight * amount;
        if (enoughOfThePiece || enoughOfTheScreen) {
          setSighting("seen");
          observer.disconnect();
        }
      },
      { threshold: [...STEPS, amount] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target, amount]);

  // "Unknown" is also what the server has, so its HTML and the first render in the browser agree.
  if (reduceMotion || sighting === "unknown" || sighting === "there-from-the-start") return "static";
  return sighting === "seen" ? "playing" : "armed";
}

/**
 * Props for the motion element at the top of a staged entrance. Everything
 * under it that has `hidden` and `shown` variants follows.
 */
export function stage(phase: Phase) {
  return {
    initial: phase === "static" ? (false as const) : "hidden",
    animate: phase === "armed" ? "hidden" : "shown",
  };
}

/** Pops in after `delay` seconds. */
export const pop = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.7, y: 8 },
  shown: { opacity: 1, scale: 1, y: 0, transition: { ...springs.settle, delay } },
});

/** Fades up into place after `delay` seconds. */
export const rise = (delay = 0, distance = 12): Variants => ({
  hidden: { opacity: 0, y: distance },
  shown: { opacity: 1, y: 0, transition: { duration: 0.4, delay } },
});
