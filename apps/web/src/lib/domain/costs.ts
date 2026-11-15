import type { Dealer, Listing } from "./types";

/**
 * What a swap costs besides the top-up, and what the car then costs to keep
 * registered. Classified ads leave both for the buyer to discover at the desk.
 *
 * ESTIMATES. Every tariff below is public and has its source next to it, but
 * some vary by municipality or insurer, and all of them change. They were last
 * read on the date in `TARIFFS_CHECKED_ON`; the transfer tax follows the law
 * exactly, the registration figure is good to within about fifteen percent.
 */
export const TARIFFS_CHECKED_ON = "2026-11-15";

/** The dinar has been held between about 117.0 and 117.3 to the euro for years. */
export const RSD_PER_EUR = 117.2;

// ── Transfer tax (porez na prenos apsolutnih prava) ──────────────────────
// Zakon o porezima na imovinu:
//   čl. 27a  osnovica = (320 × cm³ + 6.400 × kW) × koeficijent starosti
//   čl. 30   stopa 2,5%
//   čl. 25   obveznik je kupac
//   čl. 24a  ne plaća se na promet na koji se plaća PDV
// https://www.paragraf.rs/propisi/zakon_o_porezima_na_imovinu.html

const TRANSFER_TAX_RATE = 0.025;
const TRANSFER_BASE_PER_CC = 320;
const TRANSFER_BASE_PER_KW = 6400;

/** [age in completed years, share of the base that still counts], oldest first. */
const TRANSFER_AGE_COEFFICIENT: ReadonlyArray<readonly [number, number]> = [
  [10, 0.3],
  [9, 0.35],
  [8, 0.4],
  [7, 0.45],
  [6, 0.5],
  [5, 0.6],
  [4, 0.7],
  [3, 0.8],
  [2, 0.9],
  [0, 1],
];

/** The tax a buyer owes on a used car bought from someone who does not charge VAT. */
export function transferTaxRsd(engineCc: number, powerKw: number, ageYears: number): number {
  const age = Math.max(0, ageYears);
  const coefficient = TRANSFER_AGE_COEFFICIENT.find(([from]) => age >= from)?.[1] ?? 1;
  const base = (TRANSFER_BASE_PER_CC * engineCc + TRANSFER_BASE_PER_KW * powerKw) * coefficient;
  return base * TRANSFER_TAX_RATE;
}

// ── Paperwork on the day ─────────────────────────────────────────────────
// MUP price list in force from 12 September 2026:
// https://biznis.kurir.rs/novcanik/10102412/nove-takse-mup-a-cene-licnih-dokumenata-i-tablica
// Notarised signature, per signature and copy: javnobeležnička tarifa.

const REGISTRATION_CERTIFICATE_RSD = 858;
const REGISTRATION_STICKER_RSD = 342;
const PLATES_RSD = 1380;
const NOTARISED_SIGNATURE_RSD = 360;
const CONTRACT_COPIES = 3;

/** New registration certificate, sticker and plates, and the notarised contract for the car handed over. */
export const PAPERWORK_RSD =
  REGISTRATION_CERTIFICATE_RSD + REGISTRATION_STICKER_RSD + PLATES_RSD + NOTARISED_SIGNATURE_RSD * CONTRACT_COPIES;

// ── A year of registration ───────────────────────────────────────────────

// Porez na upotrebu motornih vozila, iznosi za 2026. (Službeni glasnik RS 118/2025):
// https://www.super-registracija-vozila.rs/vesti/73/porez-na-upotrebu-motornih-vozila-za-2026-godinu
/** [up to this many cm³, full yearly amount in RSD]. */
const USE_TAX_2026: ReadonlyArray<readonly [number, number]> = [
  [1150, 1910],
  [1300, 3740],
  [1600, 8230],
  [2000, 16890],
  [2500, 83470],
  [3000, 169120],
  [Number.POSITIVE_INFINITY, 349560],
];

/** Yearly tax on use. Falls with age, and falls faster above two litres; electric and hybrid cars are exempt. */
export function usageTaxRsd(listing: Pick<Listing, "engineCc" | "fuel">, ageYears: number): number {
  if (listing.fuel === "electric" || listing.fuel === "hybrid") return 0;
  const full = USE_TAX_2026.find(([upTo]) => listing.engineCc <= upTo)?.[1] ?? 0;
  const large = listing.engineCc > 2000;
  if (ageYears >= 20) return full * 0.2;
  if (ageYears > 10) return full * (large ? 0.35 : 0.6);
  if (ageYears > 8) return full * (large ? 0.6 : 0.75);
  if (ageYears > 5) return full * (large ? 0.75 : 0.85);
  return full;
}

// Obavezno osiguranje od autoodgovornosti. The last full table in the press is
// from 2019 (4th premium step, the one a new policyholder starts on):
// https://www.danas.rs/zivot/auto/kako-se-odredjuje-cena-obaveznog-osiguranja/
// Premiums rose 12 to 15% in 2023 and about 5% in 2026; the uplift below lands
// on the worked examples published in September 2026.
/** [up to this many kW, premium in RSD at the 2019 tariff]. */
const LIABILITY_PREMIUM_2019: ReadonlyArray<readonly [number, number]> = [
  [22, 7840],
  [33, 9370],
  [44, 10900],
  [55, 12440],
  [66, 13970],
  [84, 16000],
  [110, 19100],
  [Number.POSITIVE_INFINITY, 22700],
];
const LIABILITY_UPLIFT_SINCE_2019 = 1.17;
/** Three claim-free years take 15% off the premium. */
const FULL_NO_CLAIMS_BONUS = 0.85;

// Lokalna komunalna taksa za držanje motornih vozila: set by each municipality
// within a legal ceiling, so this is the least exact line. Roughly, for 2026:
/** [up to this many cm³, yearly amount in RSD]. */
const COMMUNAL_TAX_APPROX: ReadonlyArray<readonly [number, number]> = [
  [1150, 800],
  [1300, 1600],
  [1600, 2400],
  [2000, 3200],
  [3000, 4800],
  [Number.POSITIVE_INFINITY, 8000],
];

/** The regulated price is between about 3.000 and 6.000 RSD; stations charge near the top. */
const TECHNICAL_INSPECTION_RSD = 5500;

const lookup = (table: ReadonlyArray<readonly [number, number]>, value: number) =>
  table.find(([upTo]) => value <= upTo)?.[1] ?? 0;

/** A year of registration as a range: with a full no-claims bonus, and without one. */
export function registrationRsd(
  listing: Pick<Listing, "engineCc" | "powerKw" | "fuel">,
  ageYears: number,
): readonly [number, number] {
  const premium = lookup(LIABILITY_PREMIUM_2019, listing.powerKw) * LIABILITY_UPLIFT_SINCE_2019;
  const fixed =
    usageTaxRsd(listing, ageYears) +
    lookup(COMMUNAL_TAX_APPROX, listing.engineCc) +
    TECHNICAL_INSPECTION_RSD +
    REGISTRATION_STICKER_RSD;
  return [fixed + premium * FULL_NO_CLAIMS_BONUS, fixed + premium];
}

// ── Everything for one listing ───────────────────────────────────────────

export interface CostEstimate {
  /** Paid once, on the day: documents, plates and the notary. In EUR. */
  paperwork: number;
  /** Transfer tax the buyer owes. Zero when the seller charges VAT. In EUR. */
  transferTax: number;
  /** The transfer tax the same car would carry bought from a private seller. In EUR. */
  privateSaleTransferTax: number;
  /** A year of registration, low to high. In EUR. */
  registration: readonly [number, number];
}

/** Whole euros, to the nearest five: these are estimates and should not look exact. */
export function rsdToEur(rsd: number): number {
  return Math.round(rsd / RSD_PER_EUR / 5) * 5;
}

export function estimateCosts(listing: Listing, dealer: Dealer, currentYear: number): CostEstimate {
  const age = Math.max(0, currentYear - listing.year);
  const privateSaleTax = transferTaxRsd(listing.engineCc, listing.powerKw, age);
  const [low, high] = registrationRsd(listing, age);

  return {
    paperwork: rsdToEur(PAPERWORK_RSD),
    transferTax: dealer.chargesVat ? 0 : rsdToEur(privateSaleTax),
    privateSaleTransferTax: rsdToEur(privateSaleTax),
    registration: [rsdToEur(low), rsdToEur(high)],
  };
}

/** What changes hands on the day: the top-up (or cash back, if negative) plus the one-off costs. */
export function dayTotal(topUp: number, costs: CostEstimate): number {
  return topUp + costs.paperwork + costs.transferTax;
}
