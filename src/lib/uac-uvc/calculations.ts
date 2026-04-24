import type { UacUvcResult } from './types.js';

/**
 * UAC (umbilical arterial catheter) insertion depth (cm).
 *
 * Formula: weightKg * 3 + 9    (xlsx uac-uvc-calculator.xlsx cell B3)
 *
 * Rule-of-thumb estimate attributed to Shukla/Dunn weight-based derivation.
 * Final placement MUST be confirmed by imaging per institutional protocol.
 * Exact under IEEE-754 for the input domain (0.3–10 kg); parity epsilon
 * exists for consistency with GIR/feeds/morphine, not because of drift.
 */
export function calculateUacDepth(weightKg: number): number {
  return weightKg * 3 + 9;
}

/**
 * UVC (umbilical venous catheter) insertion depth (cm) = UAC / 2.
 * xlsx cell B7 = (B6*3+9)/2.
 */
export function calculateUvcDepth(weightKg: number): number {
  return (weightKg * 3 + 9) / 2;
}

export function calculateUacUvc(state: { weightKg: number | null }): UacUvcResult | null {
  if (state.weightKg == null) return null;
  return {
    uacCm: calculateUacDepth(state.weightKg),
    uvcCm: calculateUvcDepth(state.weightKg)
  };
}
