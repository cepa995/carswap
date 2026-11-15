import { describe, expect, it } from "vitest";
import { allIn, registrationRange, typicalRegistration } from "./cost-display";
import type { CostEstimate } from "./domain/costs";
import type { Deal } from "./domain/deal";

const costs: CostEstimate = { paperwork: 30, transferTax: 0, privateSaleTransferTax: 65, registration: [250, 270] };

const swap = (topUp: number, status: "swap" | "over-budget" = "swap"): Deal => ({
  status,
  credit: 8000,
  topUp,
  creditRange: [7400, 8600],
  overBy: 0,
});

describe("allIn", () => {
  it("adds tax and paperwork to a top-up", () => {
    expect(allIn(swap(2400), costs)).toEqual({ receives: false, amount: 2430 });
    expect(allIn(swap(2400), { ...costs, transferTax: 65 })).toEqual({ receives: false, amount: 2495 });
  });

  it("takes them out of the cash a visitor gets back", () => {
    expect(allIn(swap(-3600), costs)).toEqual({ receives: true, amount: 3570 });
  });

  it("shows only the costs for a straight swap, whichever side of zero it falls on", () => {
    expect(allIn(swap(100), costs)).toEqual({ receives: false, amount: 30 });
    expect(allIn(swap(-120), costs)).toEqual({ receives: false, amount: 30 });
  });

  it("covers a swap that is over budget too", () => {
    expect(allIn(swap(6000, "over-budget"), costs)).toEqual({ receives: false, amount: 6030 });
  });

  it("has nothing to say without a swap", () => {
    expect(allIn({ status: "no-car" }, costs)).toBeNull();
    expect(allIn({ status: "not-accepted", reason: "age" }, costs)).toBeNull();
  });
});

describe("registration", () => {
  it("picks the middle of the range as the one figure for a card", () => {
    expect(typicalRegistration(costs)).toBe(260);
    expect(typicalRegistration({ ...costs, registration: [1150, 1185] })).toBe(1170);
  });

  it("writes the range out, or one figure when both ends are the same", () => {
    // Amounts keep the non-breaking space before the euro sign.
    expect(registrationRange(costs)).toBe("250–270\u00a0€");
    expect(registrationRange({ ...costs, registration: [300, 300] })).toBe("300\u00a0€");
  });
});
