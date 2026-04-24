import type { NumericInputRange } from '$lib/shared/types.js';

export interface UacUvcStateData {
  weightKg: number | null;
}

export interface UacUvcInputRanges {
  weightKg: NumericInputRange;
}

export interface UacUvcResult {
  uacCm: number;
  uvcCm: number;
}
