import { describe, expect, it } from "vitest";
import { preferenceLabel } from "./preference";

const nbsp = (text: string) => text.replace(/ €/g, " €");

describe("preferenceLabel", () => {
  it("names the top-up limit when either direction will do", () => {
    expect(preferenceLabel({ direction: "any", budget: 3000, minCash: 0 })).toBe(nbsp("Doplata do 3.000 €"));
  });

  it("says which way the visitor is trading", () => {
    expect(preferenceLabel({ direction: "up", budget: 5000, minCash: 0 })).toBe(nbsp("Skuplji · do 5.000 €"));
    expect(preferenceLabel({ direction: "down", budget: 5000, minCash: 1500 })).toBe(nbsp("Jeftiniji · bar 1.500 €"));
  });

  it("does not print a zero", () => {
    expect(preferenceLabel({ direction: "any", budget: 0, minCash: 0 })).toBe("Bez doplate");
    expect(preferenceLabel({ direction: "up", budget: 0, minCash: 0 })).toBe("Bez doplate");
    expect(preferenceLabel({ direction: "down", budget: 3000, minCash: 0 })).toBe("Jeftiniji · keš meni");
  });

  it("ignores the amount that belongs to the other direction", () => {
    expect(preferenceLabel({ direction: "down", budget: 0, minCash: 500 })).toBe(nbsp("Jeftiniji · bar 500 €"));
    expect(preferenceLabel({ direction: "up", budget: 2000, minCash: 9000 })).toBe(nbsp("Skuplji · do 2.000 €"));
  });
});
