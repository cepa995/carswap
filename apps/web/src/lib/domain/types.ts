export type Fuel = "petrol" | "diesel" | "lpg" | "hybrid" | "electric";
export type Gearbox = "manual" | "automatic";
export type BodyStyle = "hatchback" | "sedan" | "wagon" | "suv" | "mpv" | "coupe";

export interface PhotoCredit {
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
}

export interface Photo {
  src: string;
  width: number;
  height: number;
  /** Tiny pre-blurred image as a data URL. Scaled up, it becomes the card's backdrop. */
  blur: string;
  /** A vivid colour pulled from the photo, used for the ambient glow. */
  tint: string;
  credit: PhotoCredit;
}

/** What a dealer takes in part exchange, and on what terms. */
export interface TradeInRules {
  /** Share of our mid estimate the dealer credits for the car. */
  creditFactor: number;
  maxAgeYears: number;
  maxKm: number;
}

export interface Dealer {
  id: string;
  name: string;
  /** Neighbourhood, shown next to the dealer name. */
  area: string;
  city: string;
  rules: TradeInRules;
}

export interface Listing {
  id: string;
  dealerId: string;
  make: string;
  model: string;
  /** Engine and trim, e.g. "1.6 TDI Comfortline". */
  variant: string;
  year: number;
  km: number;
  fuel: Fuel;
  gearbox: Gearbox;
  powerKw: number;
  body: BodyStyle;
  color: string;
  priceEur: number;
  highlights: string[];
  photo: Photo;
}

/** The visitor's own car, as entered in the "my car" flow. */
export interface UserCar {
  make: string;
  model: string;
  year: number;
  km: number;
  fuel: Fuel;
}

/** Estimated market value in EUR. Always a range, never a single figure. */
export interface Estimate {
  low: number;
  mid: number;
  high: number;
}

export type SwipeDirection = "like" | "pass";
