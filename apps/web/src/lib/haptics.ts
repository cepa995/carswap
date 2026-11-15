type HapticKind = "tick" | "commit" | "match";

const PATTERNS: Record<HapticKind, number | number[]> = {
  /** Crossing the point where letting go commits the swipe. */
  tick: 8,
  /** A swipe was committed. */
  commit: 14,
  /** The dealer takes the visitor's car. */
  match: [16, 60, 32],
};

/** Vibration where the platform has it (Android browsers). A no-op elsewhere. */
export function haptic(kind: HapticKind): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Some browsers throw when vibration is blocked by policy; it is only a nicety.
  }
}
