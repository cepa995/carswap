/**
 * Number formatting for Serbian (Latin). Hand-rolled instead of Intl so the
 * server and every browser produce the same string and hydration never
 * disagrees over a thin space.
 */

const NBSP = " ";

/** 12345 → "12.345" */
export function formatInt(value: number): string {
  const rounded = Math.round(value);
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return rounded < 0 ? `−${digits}` : digits;
}

/** 12345 → "12.345 €" */
export function formatEur(value: number): string {
  return `${formatInt(value)}${NBSP}€`;
}

/** 148000 → "148.000 km" */
export function formatKm(value: number): string {
  return `${formatInt(value)}${NBSP}km`;
}

/** 81 → "110 KS" (dealers in Serbia quote horsepower, not kilowatts). */
export function formatPower(kw: number): string {
  return `${Math.round(kw * 1.35962)}${NBSP}KS`;
}

/**
 * Serbian has three plural forms, but for "automobil" two of them are spelled
 * the same, so only the 1 / 21 / 31… case differs.
 */
export function carsWord(count: number): string {
  const singular = count % 10 === 1 && count % 100 !== 11;
  return singular ? "automobil" : "automobila";
}

/** 12 → "12 automobila" */
export function carsCount(count: number): string {
  return `${formatInt(count)} ${carsWord(count)}`;
}

/** Rounds to a step that reads naturally in a price: 50 below 5.000, else 100. */
export function roundPrice(value: number): number {
  const step = Math.abs(value) < 5000 ? 50 : 100;
  return Math.round(value / step) * step;
}
