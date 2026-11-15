import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { registrationRange } from "@/lib/cost-display";
import { TARIFFS_CHECKED_ON, type CostEstimate } from "@/lib/domain/costs";
import { formatEur } from "@/lib/format";

interface DetailRowProps {
  label: ReactNode;
  value: string;
  /** A line of small print under the row. */
  note?: string;
  /** The row the others add up to. */
  strong?: boolean;
  valueClassName?: string;
}

/** A label and its amount, as on a receipt. */
export function DetailRow({ label, value, note, strong, valueClassName }: DetailRowProps) {
  return (
    <div className="py-1">
      <div className={cn("flex items-center justify-between gap-3", strong ? "text-fg" : "text-sm text-fg-muted")}>
        <span className={cn("min-w-0", strong && "font-semibold")}>{label}</span>
        <span
          className={cn(
            "shrink-0 whitespace-nowrap tabular-nums",
            strong ? "font-display text-2xl font-bold tracking-tight" : "font-medium text-fg",
            valueClassName,
          )}
        >
          {value}
        </span>
      </div>
      {note ? <p className="mt-0.5 text-xs leading-snug text-pretty text-fg-faint">{note}</p> : null}
    </div>
  );
}

interface CostBreakdownProps {
  costs: CostEstimate;
  /** The seller charges VAT, so the buyer owes no transfer tax. */
  chargesVat: boolean;
  /** The top-up or cash line the costs are added to, when there is a swap. */
  swapLine?: { label: string; value: string } | null;
  /** Everything on the day, added up. Left out when there is no swap to add to. */
  total?: { receives: boolean; amount: number } | null;
  /** Only the rows: no small print and no panel around them, for a place that brings its own. */
  compact?: boolean;
}

/**
 * What an ad leaves for the counter: the tax, the paperwork, what it all comes
 * to on the day, and a year of registration.
 */
export function CostBreakdown({ costs, chargesVat, swapLine, total, compact = false }: CostBreakdownProps) {
  // In the compact form the notes are dropped; the figures stand by themselves.
  const note = (text: string) => (compact ? undefined : text);

  return (
    <div className={compact ? undefined : "rounded-2xl bg-raised p-4"}>
      {swapLine ? <DetailRow label={swapLine.label} value={swapLine.value} /> : null}
      <DetailRow
        label={copy.costs.transferTax}
        value={costs.transferTax === 0 ? formatEur(0) : copy.costs.about(formatEur(costs.transferTax))}
        note={note(
          chargesVat
            ? copy.costs.transferTaxVat(formatEur(costs.privateSaleTransferTax))
            : copy.costs.transferTaxPrivate,
        )}
      />
      <DetailRow
        label={copy.costs.paperwork}
        value={copy.costs.about(formatEur(costs.paperwork))}
        note={note(copy.costs.paperworkNote)}
      />
      {total ? (
        <>
          <div className="my-3 h-px bg-line" />
          <DetailRow
            strong
            label={total.receives ? copy.costs.totalReceive : copy.costs.totalPay}
            value={copy.costs.about(formatEur(total.amount))}
            note={note(copy.costs.onTheDay)}
          />
        </>
      ) : null}
      <div className="my-3 h-px bg-line" />
      <DetailRow
        label={copy.costs.registrationYear}
        value={copy.costs.about(registrationRange(costs))}
        note={note(copy.costs.registrationNote)}
      />
      {compact ? null : (
        <p className="mt-3 text-[13px] leading-relaxed text-fg-faint">
          {copy.costs.footnote(TARIFFS_CHECKED_ON.slice(0, 4))}
        </p>
      )}
    </div>
  );
}
