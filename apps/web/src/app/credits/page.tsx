import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { copy } from "@/lib/copy";
import { listings } from "@/lib/seed";

export const metadata: Metadata = { title: copy.credits.title };

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-safe pb-16 lg:px-8">
      <header className="flex h-16 items-center">
        <Link href="/" aria-label={copy.nav.home}>
          <Wordmark />
        </Link>
      </header>

      <h1 className="mt-8 font-display text-5xl leading-none font-extrabold tracking-tight">{copy.credits.title}</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-muted">{copy.credits.lead}</p>

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {listings.map((listing) => {
          const { credit } = listing.photo;
          return (
            <li
              key={listing.id}
              className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
            >
              <span className="font-semibold">
                {listing.make} {listing.model}
              </span>
              <span className="text-sm text-fg-muted">
                {copy.credits.author}: {credit.author} ·{" "}
                {credit.licenseUrl ? (
                  <a
                    href={credit.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-fg"
                  >
                    {credit.license}
                  </a>
                ) : (
                  credit.license
                )}{" "}
                ·{" "}
                <a
                  href={credit.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:text-fg"
                >
                  {copy.credits.source}
                </a>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
