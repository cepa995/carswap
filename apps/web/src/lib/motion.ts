/** Shared spring presets, so every surface moves with the same character. */
export const springs = {
  /** Buttons, chips, small state changes. */
  snappy: { type: "spring", stiffness: 520, damping: 38, mass: 0.9 },
  /** Cards settling into place. */
  settle: { type: "spring", stiffness: 420, damping: 34 },
  /** Sheets and full-screen moments. */
  sheet: { type: "spring", stiffness: 360, damping: 38 },
  /** Celebrations. The only preset that overshoots. */
  bouncy: { type: "spring", stiffness: 380, damping: 20 },
} as const;

export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
