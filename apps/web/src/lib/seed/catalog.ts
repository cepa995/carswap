/**
 * Placeholder vehicle catalogue for the "my car" picker and the estimate.
 *
 * `base` is roughly what a comparable new car costs today, in EUR. The
 * estimate depreciates from it. This whole file goes away once the vehicle
 * reference catalogue and the valuation model exist.
 */

export interface CatalogModel {
  name: string;
  base: number;
}

export interface CatalogMake {
  name: string;
  /** Shown in the first screen of the picker. */
  popular?: boolean;
  models: CatalogModel[];
}

const m = (name: string, baseThousands: number): CatalogModel => ({
  name,
  base: baseThousands * 1000,
});

export const catalog: CatalogMake[] = [
  {
    name: "Volkswagen",
    popular: true,
    models: [
      m("Golf", 29),
      m("Polo", 21),
      m("Passat", 40),
      m("Tiguan", 38),
      m("Touran", 36),
      m("Caddy", 30),
      m("Jetta", 27),
      m("T-Roc", 30),
      m("Touareg", 70),
      m("Up", 15),
    ],
  },
  {
    name: "Škoda",
    popular: true,
    models: [
      m("Octavia", 28),
      m("Fabia", 19),
      m("Superb", 38),
      m("Rapid", 20),
      m("Yeti", 26),
      m("Kodiaq", 40),
      m("Karoq", 32),
      m("Scala", 23),
    ],
  },
  {
    name: "Opel",
    popular: true,
    models: [
      m("Astra", 26),
      m("Corsa", 19),
      m("Insignia", 36),
      m("Zafira", 30),
      m("Meriva", 21),
      m("Mokka", 26),
      m("Vectra", 28),
    ],
  },
  {
    name: "Renault",
    popular: true,
    models: [
      m("Clio", 19),
      m("Megane", 26),
      m("Scenic", 29),
      m("Laguna", 30),
      m("Captur", 24),
      m("Kadjar", 29),
      m("Talisman", 35),
      m("Twingo", 14),
    ],
  },
  {
    name: "Peugeot",
    popular: true,
    models: [
      m("308", 27),
      m("208", 20),
      m("207", 16),
      m("206", 15),
      m("307", 22),
      m("407", 30),
      m("508", 38),
      m("2008", 25),
      m("3008", 34),
      m("5008", 37),
    ],
  },
  {
    name: "Fiat",
    popular: true,
    models: [
      m("Punto", 15),
      m("Grande Punto", 15),
      m("500", 17),
      m("500L", 21),
      m("Panda", 14),
      m("Tipo", 19),
      m("Bravo", 20),
      m("Stilo", 19),
      m("Doblo", 22),
    ],
  },
  {
    name: "Ford",
    popular: true,
    models: [
      m("Focus", 26),
      m("Fiesta", 19),
      m("Mondeo", 35),
      m("Kuga", 34),
      m("C-Max", 27),
      m("S-Max", 38),
      m("EcoSport", 23),
    ],
  },
  {
    name: "Audi",
    popular: true,
    models: [m("A3", 34), m("A4", 44), m("A6", 58), m("A1", 25), m("A5", 50), m("Q3", 40), m("Q5", 54), m("Q7", 75)],
  },
  {
    name: "BMW",
    popular: true,
    models: [m("Serija 3", 47), m("Serija 5", 60), m("Serija 1", 34), m("X1", 42), m("X3", 55), m("X5", 78)],
  },
  {
    name: "Mercedes-Benz",
    popular: true,
    models: [
      m("C klasa", 48),
      m("E klasa", 62),
      m("A klasa", 36),
      m("B klasa", 37),
      m("GLA", 42),
      m("GLC", 56),
      m("ML / GLE", 78),
    ],
  },
  {
    name: "Toyota",
    popular: true,
    models: [
      m("Yaris", 21),
      m("Corolla", 28),
      m("Auris", 25),
      m("Avensis", 32),
      m("RAV4", 38),
      m("C-HR", 31),
      m("Aygo", 15),
    ],
  },
  {
    name: "Dacia",
    popular: true,
    models: [m("Duster", 20), m("Sandero", 14), m("Logan", 14), m("Dokker", 17), m("Lodgy", 18)],
  },
  {
    name: "Hyundai",
    models: [m("i30", 24), m("i20", 18), m("i10", 14), m("Tucson", 33), m("ix35", 28), m("Santa Fe", 45)],
  },
  {
    name: "Kia",
    models: [m("Ceed", 24), m("Sportage", 33), m("Rio", 18), m("Picanto", 14), m("Sorento", 46)],
  },
  {
    name: "Citroën",
    models: [m("C3", 18), m("C4", 24), m("C4 Cactus", 22), m("C4 Picasso", 28), m("C5", 33), m("Berlingo", 24)],
  },
  {
    name: "Seat",
    models: [m("Leon", 26), m("Ibiza", 19), m("Altea", 24), m("Ateca", 31), m("Toledo", 21)],
  },
  {
    name: "Nissan",
    models: [m("Qashqai", 31), m("Juke", 24), m("Micra", 17), m("Note", 18), m("X-Trail", 38)],
  },
  {
    name: "Mazda",
    models: [m("3", 26), m("6", 34), m("2", 18), m("CX-3", 24), m("CX-5", 35)],
  },
  {
    name: "Volvo",
    models: [m("V40", 31), m("S60", 42), m("V60", 44), m("XC60", 55), m("XC90", 75)],
  },
  {
    name: "Honda",
    models: [m("Civic", 28), m("Jazz", 21), m("Accord", 36), m("CR-V", 38)],
  },
  {
    name: "Suzuki",
    models: [m("Swift", 18), m("Vitara", 25), m("SX4", 22)],
  },
  {
    name: "Alfa Romeo",
    models: [m("Giulietta", 27), m("147", 22), m("159", 34), m("MiTo", 20)],
  },
  {
    name: "Chevrolet",
    models: [m("Aveo", 14), m("Cruze", 20), m("Spark", 11)],
  },
  {
    name: "Mini",
    models: [m("Cooper", 27), m("Countryman", 34)],
  },
  {
    name: "Tesla",
    models: [m("Model 3", 45), m("Model Y", 50)],
  },
  {
    name: "Zastava",
    models: [m("10", 11), m("Yugo", 8), m("Skala", 8)],
  },
];

/** Used when a make or model is not in the catalogue. */
export const FALLBACK_BASE_PRICE = 22_000;

export function findBasePrice(make: string, model: string): number {
  const entry = catalog.find((c) => c.name === make)?.models.find((x) => x.name === model);
  return entry?.base ?? FALLBACK_BASE_PRICE;
}
