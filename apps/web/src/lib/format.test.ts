import { describe, expect, it } from "vitest";
import { carsCount, formatEur, formatInt, formatKm, formatPower, roundPrice } from "./format";

describe("formatInt", () => {
  it("groups thousands with a dot, the Serbian way", () => {
    expect(formatInt(0)).toBe("0");
    expect(formatInt(999)).toBe("999");
    expect(formatInt(1000)).toBe("1.000");
    expect(formatInt(148000)).toBe("148.000");
    expect(formatInt(1234567)).toBe("1.234.567");
  });

  it("rounds fractions and marks negatives with a real minus sign", () => {
    expect(formatInt(2399.6)).toBe("2.400");
    expect(formatInt(-1500)).toBe("−1.500");
  });
});

describe("units", () => {
  it("keeps the unit on the same line as the number", () => {
    expect(formatEur(11900)).toBe("11.900 €");
    expect(formatKm(189000)).toBe("189.000 km");
  });

  it("quotes power in horsepower", () => {
    expect(formatPower(81)).toBe("110 KS");
    expect(formatPower(110)).toBe("150 KS");
  });
});

describe("carsCount", () => {
  it("uses the singular only for 1, 21, 31… but not 11", () => {
    expect(carsCount(1)).toBe("1 automobil");
    expect(carsCount(21)).toBe("21 automobil");
    expect(carsCount(11)).toBe("11 automobila");
    expect(carsCount(0)).toBe("0 automobila");
    expect(carsCount(2)).toBe("2 automobila");
    expect(carsCount(14)).toBe("14 automobila");
  });
});

describe("roundPrice", () => {
  it("rounds to 50 below 5.000 and to 100 from there up", () => {
    expect(roundPrice(3724)).toBe(3700);
    expect(roundPrice(3726)).toBe(3750);
    expect(roundPrice(7249)).toBe(7200);
    expect(roundPrice(7250)).toBe(7300);
  });
});
