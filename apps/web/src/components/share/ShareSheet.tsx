"use client";

import { Check, Link2, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { track } from "@/lib/analytics";
import { copy } from "@/lib/copy";
import type { DeckCard } from "@/lib/domain/deck";
import type { UserCar } from "@/lib/domain/types";
import { haptic } from "@/lib/haptics";
import { useOrigin } from "@/lib/origin";
import { shareHeadline, shareMessage, sharePath, swapToShare, viberLink, whatsappLink } from "@/lib/share";

const COPIED_MS = 2000;

interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: DeckCard;
  car: UserCar | null;
}

type Channel = "viber" | "whatsapp" | "copy" | "native";

/** Writes to the clipboard, including on plain http, where the modern API is not offered. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const done = document.execCommand("copy");
    field.remove();
    return done;
  }
}

/**
 * Sends a car to someone. Viber first, because that is where car talk happens
 * in Serbia. With a car entered, the link carries the sender's own equation,
 * so the preview in the chat already says "Golf + 2.400 € = Octavia".
 */
export function ShareSheet({ open, onOpenChange, card, car }: ShareSheetProps) {
  const { listing, deal } = card;
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);

  const swap = swapToShare(deal, car?.model ?? null);
  const path = sharePath(listing.id, swap);
  const url = `${origin}${path}`;
  const headline = shareHeadline(listing, swap);
  const message = shareMessage(listing, swap, url);
  const canShareNatively = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const sent = (channel: Channel) => track("share_sent", { listingId: listing.id, channel, withSwap: swap !== null });

  async function copyLink() {
    if (!(await copyText(url))) return;
    setCopied(true);
    haptic("tick");
    sent("copy");
  }

  async function shareNatively() {
    try {
      await navigator.share({ title: headline, text: `${headline}. ${copy.share.look}`, url });
      sent("native");
    } catch {
      // Closing the system sheet without picking anything is not an error.
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={copy.share.title} showTitle>
      <div className="px-5 pt-3 pb-safe">
        <div className="flex items-center gap-3.5 rounded-3xl bg-raised p-2.5 pr-4 ring-1 ring-line ring-inset">
          <span className="relative aspect-[3/2] w-28 shrink-0 overflow-hidden rounded-2xl bg-hover">
            <Image src={listing.photo.src} alt="" fill sizes="7rem" className="object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-lg leading-tight font-bold tracking-tight text-balance">
              {headline}
            </span>
            <span className="mt-1 block truncate text-xs text-fg-faint">{url.replace(/^https?:\/\//, "")}</span>
          </span>
        </div>
        <p className="mt-3 px-1 text-[13px] leading-relaxed text-fg-faint">
          {swap ? copy.share.includes : copy.share.includesPlain}
        </p>

        <a
          href={viberLink(message)}
          onClick={() => sent("viber")}
          className={buttonClass({ size: "lg", className: "mt-4 w-full" })}
        >
          <Send className="size-5" aria-hidden />
          {copy.share.viber}
        </a>

        <div className="mt-2.5 flex gap-2.5">
          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noreferrer"
            onClick={() => sent("whatsapp")}
            className={tile}
          >
            <MessageCircle className="size-5" aria-hidden />
            {copy.share.whatsapp}
          </a>
          <Tile onClick={copyLink}>
            {copied ? (
              <Check className="size-5 text-accent-strong" aria-hidden />
            ) : (
              <Link2 className="size-5" aria-hidden />
            )}
            <span aria-live="polite">{copied ? copy.share.copied : copy.share.copyLink}</span>
          </Tile>
          {canShareNatively ? (
            <Tile onClick={shareNatively}>
              <MoreHorizontal className="size-5" aria-hidden />
              {copy.share.more}
            </Tile>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}

const tile =
  "flex h-[4.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-raised px-1 text-[13px] font-semibold " +
  "whitespace-nowrap ring-1 ring-line ring-inset transition duration-150 ease-out-expo hover:bg-hover active:scale-[0.97]";

function Tile({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={tile}>
      {children}
    </button>
  );
}
