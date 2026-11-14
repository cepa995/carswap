import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { buttonClass } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Wordmark />
      <h1 className="mt-10 font-display text-5xl leading-none font-extrabold tracking-tight">{copy.notFound.title}</h1>
      <p className="mt-4 max-w-sm text-fg-muted">{copy.notFound.body}</p>
      <Link href="/swipe" className={buttonClass({ size: "lg", className: "mt-8" })}>
        {copy.notFound.cta}
      </Link>
    </div>
  );
}
