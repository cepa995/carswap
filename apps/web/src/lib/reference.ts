import type { UserCar } from "@/lib/domain/types";

/**
 * The year prerendered HTML and the seed inventory assume. Reading the clock
 * while a page is being prerendered would freeze "now" into the static shell,
 * so the server always answers with this and the browser corrects it.
 */
export const REFERENCE_YEAR = 2026;

/**
 * Stands in for the visitor's car until they enter their own: a 2011 Golf
 * diesel, about as typical as a car on Serbian roads gets.
 */
export const EXAMPLE_CAR: UserCar = { make: "Volkswagen", model: "Golf", year: 2011, km: 205_000, fuel: "diesel" };
