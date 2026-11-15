"use client";

import { ArrowLeftRight, Send } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { ShareButton } from "@/components/share/ShareButton";
import { Button } from "@/components/ui/Button";
import { CarChip } from "@/components/ui/CarChip";
import { copy } from "@/lib/copy";
import { dealLine, describeDeal } from "@/lib/deal-display";
import type { DeckCard } from "@/lib/domain/deck";
import type { UserCar } from "@/lib/domain/types";
import { springs } from "@/lib/motion";

interface MatchMomentProps {
  /** The swap to celebrate, or null when hidden. */
  card: DeckCard | null;
  car: UserCar | null;
  onContinue: () => void;
  onOpenGarage: () => void;
}

// Fixed directions so the burst looks the same on the server and the client.
const CONFETTI = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2 + (index % 3) * 0.21;
  const distance = 150 + ((index * 53) % 110);
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 40,
    rotate: ((index * 67) % 360) - 180,
    tone: ["bg-fg", "bg-canvas", "bg-fg", "bg-[#ffc2c5]"][index % 4],
    wide: index % 2 === 0,
    delay: (index % 6) * 0.018,
  };
});

/**
 * The first time a dealer takes the visitor's car, the whole screen says so,
 * in the one place the interface turns fully red. Later matches get a quiet
 * toast; this one is the product explaining itself.
 */
export function MatchMoment({ card, car, onContinue, onOpenGarage }: MatchMomentProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [last, setLast] = useState(card);
  if (card && card !== last) setLast(card);
  const shown = card ?? last;

  return (
    <Dialog.Root
      open={card !== null}
      onOpenChange={(open) => {
        if (!open) onContinue();
      }}
    >
      <AnimatePresence>
        {card !== null && shown ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-accent-strong"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-center dark-surface outline-none"
                style={{ "--glow": "#ff9aa0" } as React.CSSProperties}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <div aria-hidden className="pointer-events-none absolute inset-0 ambient" />
                <div aria-hidden className="pointer-events-none absolute inset-0 grain opacity-25 mix-blend-multiply" />

                <div className="relative">
                  {reduceMotion
                    ? null
                    : CONFETTI.map((piece, index) => (
                        <motion.span
                          key={index}
                          aria-hidden
                          className={`absolute top-1/2 left-1/2 rounded-full ${piece.tone} ${piece.wide ? "h-2 w-5" : "size-2.5"}`}
                          initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
                          animate={{ x: piece.x, y: piece.y, opacity: [0, 1, 1, 0], rotate: piece.rotate, scale: 1 }}
                          transition={{ duration: 1.25, delay: 0.12 + piece.delay, ease: [0.16, 1, 0.3, 1] }}
                        />
                      ))}

                  <motion.div
                    className="relative mx-auto aspect-[3/2] w-64 rotate-3 overflow-hidden rounded-[1.75rem] shadow-float ring-4 ring-fg"
                    initial={reduceMotion ? false : { scale: 0.6, rotate: 14, opacity: 0 }}
                    animate={{ scale: 1, rotate: 3, opacity: 1 }}
                    transition={{ ...springs.bouncy, delay: 0.05 }}
                  >
                    <Image
                      src={shown.listing.photo.src}
                      alt={`${shown.listing.make} ${shown.listing.model}`}
                      fill
                      sizes="16rem"
                      className="object-cover"
                    />
                  </motion.div>

                  {car ? (
                    <motion.div
                      className="absolute -bottom-5 -left-7"
                      initial={reduceMotion ? false : { x: -90, rotate: -24, opacity: 0 }}
                      animate={{ x: 0, rotate: -8, opacity: 1 }}
                      transition={{ ...springs.bouncy, delay: 0.22 }}
                    >
                      <CarChip className="text-xl">{car.model}</CarChip>
                    </motion.div>
                  ) : null}

                  <motion.div
                    aria-hidden
                    className="absolute -right-5 -bottom-6 flex size-14 items-center justify-center rounded-full bg-canvas text-fg shadow-float"
                    initial={reduceMotion ? false : { scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ ...springs.bouncy, delay: 0.34 }}
                  >
                    <ArrowLeftRight className="size-7" strokeWidth={2.6} />
                  </motion.div>
                </div>

                <Dialog.Title asChild>
                  <motion.h2
                    className="relative mt-14 -rotate-2 font-display text-[3.4rem] leading-[0.9] font-extrabold tracking-tight text-fg min-[23rem]:text-[4rem]"
                    initial={reduceMotion ? false : { y: 26, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ ...springs.bouncy, delay: 0.16 }}
                  >
                    {copy.match.title}
                  </motion.h2>
                </Dialog.Title>

                <motion.div
                  className="relative mt-5 max-w-sm"
                  initial={reduceMotion ? false : { y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <p className="font-display text-2xl font-bold tracking-tight">
                    {dealLine(describeDeal(shown.deal, shown.listing), car?.model ?? null)}
                  </p>
                  <p className="mt-2 text-[15px] font-medium">{copy.match.body(shown.dealer.name)}</p>
                  <p className="mt-2 text-[13px] leading-relaxed">{copy.match.note}</p>
                </motion.div>

                <motion.div
                  className="relative mt-8 flex w-full max-w-xs flex-col gap-2.5"
                  initial={reduceMotion ? false : { y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <Button size="lg" variant="light" onClick={onContinue}>
                    {copy.match.keepSwiping}
                  </Button>
                  <Button size="lg" variant="outline" onClick={onOpenGarage}>
                    {copy.match.openGarage}
                  </Button>
                  {/* The moment someone most wants to show this to somebody. */}
                  <ShareButton
                    card={shown}
                    car={car}
                    source="match"
                    className="mx-auto mt-1 flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-fg hover:bg-fg/10"
                  >
                    <Send className="size-4" aria-hidden />
                    {copy.share.toSomeone}
                  </ShareButton>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
