"use client";

import { animate, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Parking a car: on a big screen, a liked car does not just vanish from the
 * gallery, its picture drives over to the garage and backs into a bay.
 *
 * Whoever shows cars calls `park()` with the picture's element at the moment
 * of the click. Whoever draws the garage marks each bay's picture frame with
 * `data-bay={id}`, and keeps that picture hidden while the id is in
 * `arriving`. The flight finds the bay by that mark, so the two sides need to
 * know nothing else about each other.
 */

/** As the gallery card asks for its photo, so the picture in flight is already loaded. */
export const GALLERY_PHOTO_SIZES = "(min-width: 96rem) 24rem, (min-width: 64rem) 22rem, 92vw";

const FLIGHT_SECONDS = 0.72;
/** Where in the flight the car is over the bay and starts backing in. */
const OVER_THE_BAY = 0.66;

interface Flight {
  id: string;
  src: string;
  from: { left: number; top: number; width: number; height: number };
}

export interface Parking {
  /** Send the picture shown in `from` to the bay marked with this id. Call it in the same handler that adds the car to the garage. */
  park: (id: string, from: Element | null | undefined, src: string) => void;
  /** Cars on their way. Their bay is taken, but its picture stays hidden until they land. */
  arriving: ReadonlySet<string>;
  /** The pictures in flight. Render it once, anywhere. */
  flights: React.ReactNode;
}

export function useParking(): Parking {
  const reduceMotion = useReducedMotion() ?? false;
  const [inFlight, setInFlight] = useState<Flight[]>([]);

  const park = useCallback(
    (id: string, from: Element | null | undefined, src: string) => {
      // Without motion the car is simply in its bay.
      if (reduceMotion || !from) return;
      const box = from.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;
      const flight = { id, src, from: { left: box.left, top: box.top, width: box.width, height: box.height } };
      setInFlight((current) => [...current.filter((other) => other.id !== id), flight]);
    },
    [reduceMotion],
  );

  const land = useCallback((id: string) => {
    setInFlight((current) => current.filter((flight) => flight.id !== id));
  }, []);

  const arriving = useMemo(() => new Set(inFlight.map((flight) => flight.id)), [inFlight]);

  const flights =
    inFlight.length > 0
      ? createPortal(
          inFlight.map((flight) => <Flyer key={flight.id} flight={flight} onLand={land} />),
          document.body,
        )
      : null;

  return { park, arriving, flights };
}

function Flyer({ flight, onLand }: { flight: Flight; onLand: (id: string) => void }) {
  const element = useRef<HTMLDivElement>(null);

  // After the commit that put the car in the garage, so its bay is there to aim at.
  useLayoutEffect(() => {
    const node = element.current;
    const bay = document.querySelector<HTMLElement>(`[data-bay="${CSS.escape(flight.id)}"]`);
    if (!node || !bay) {
      onLand(flight.id);
      return;
    }
    // A long garage scrolls inside its panel: bring the bay into it first.
    bay.scrollIntoView({ block: "nearest", inline: "nearest" });
    const to = bay.getBoundingClientRect();
    const scale = to.width / flight.from.width;
    const dx = to.left - flight.from.left;
    const dy = to.top - flight.from.top;

    // Over to a spot above the bay, leaning into the turn, then straight back into it.
    const controls = animate(
      node,
      {
        x: [0, dx, dx],
        y: [0, dy - to.height * 0.6, dy],
        scale: [1, scale * 1.1, scale],
        rotate: [0, -7, 0],
      },
      {
        duration: FLIGHT_SECONDS,
        times: [0, OVER_THE_BAY, 1],
        ease: ["easeInOut", "easeOut"],
        onComplete: () => onLand(flight.id),
      },
    );
    return () => controls.stop();
  }, [flight, onLand]);

  return (
    <div
      ref={element}
      aria-hidden
      className="pointer-events-none fixed z-[70] overflow-hidden rounded-2xl shadow-card ring-2 ring-white"
      style={{ ...flight.from, transformOrigin: "0 0" }}
    >
      <Image src={flight.src} alt="" fill sizes={GALLERY_PHOTO_SIZES} className="object-cover" />
    </div>
  );
}
