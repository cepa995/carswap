import { describe, expect, it } from "vitest";
import { dealShape } from "@/lib/domain/deal";
import type { DeckCard } from "@/lib/domain/deck";
import { exampleEstimate, examples } from "./how-examples";

const shape = (card: DeckCard) => (card.deal.status === "swap" ? dealShape(card.deal.topUp) : card.deal.status);

describe("the walkthrough's examples", () => {
  it("show each kind of swap where the page says they do", () => {
    // "Skuplji" has to cost money, "Jeftiniji" has to pay some, and "Svejedno" is the straight swap.
    expect(shape(examples.up)).toBe("top-up");
    expect(shape(examples.down)).toBe("cash-back");
    expect(shape(examples.even)).toBe("even");
  });

  it("deal only cars the dealer would swap, so every like in the demo is a match", () => {
    expect(examples.deck.length).toBeGreaterThanOrEqual(3);
    for (const card of examples.deck) expect(card.deal.status).toBe("swap");
  });

  it("deal both a car that costs money and one that pays some", () => {
    const shapes = examples.deck.map(shape);
    expect(shapes).toContain("top-up");
    expect(shapes).toContain("cash-back");
  });

  it("never show the same car twice in the deck", () => {
    const ids = examples.deck.map((card) => card.listing.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("value the example car as a range", () => {
    expect(exampleEstimate.low).toBeLessThan(exampleEstimate.high);
  });
});
