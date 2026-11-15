/**
 * Working brand. Everything user-facing reads the name from here, so renaming
 * the product is a one-line change.
 */
export const brand = {
  name: "carswap",
  city: "Novi Sad",
  /** Seed inventory is in use: dealers, cars and prices are examples. */
  isDemo: process.env.NEXT_PUBLIC_DEMO !== "0",
} as const;
