import type { Dealer } from "@/lib/domain/types";

/**
 * Demo dealers. The names are invented; any resemblance to a real business is
 * accidental. Each one states up front what it takes in part exchange, which
 * is what lets a like turn into a match immediately.
 */
export const dealers: Dealer[] = [
  {
    id: "dunav",
    name: "Auto centar Dunav",
    area: "Liman",
    city: "Novi Sad",
    rules: { creditFactor: 0.9, maxAgeYears: 18, maxKm: 280_000 },
  },
  {
    id: "tvrdjava",
    name: "Tvrđava Motors",
    area: "Petrovaradin",
    city: "Novi Sad",
    rules: { creditFactor: 0.88, maxAgeYears: 16, maxKm: 260_000 },
  },
  {
    id: "ravnica",
    name: "Ravnica Auto",
    area: "Veternik",
    city: "Novi Sad",
    rules: { creditFactor: 0.86, maxAgeYears: 24, maxKm: 330_000 },
  },
  {
    id: "bulevar",
    name: "Bulevar Cars",
    area: "Novo naselje",
    city: "Novi Sad",
    rules: { creditFactor: 0.91, maxAgeYears: 12, maxKm: 220_000 },
  },
  {
    id: "most",
    name: "Most Auto",
    area: "Telep",
    city: "Novi Sad",
    rules: { creditFactor: 0.87, maxAgeYears: 20, maxKm: 300_000 },
  },
];
