export interface WeanStep {
  step: number;           // 1-based step number
  doseMg: number;         // Dose in mg
  doseMgKgDose: number;   // Dose in mg/kg/dose
  reductionMg: number;    // Reduction from previous step in mg (0 for step 1)
}

export interface MorphineStateData {
  weightKg: number | null;
  maxDoseMgKgDose: number | null;
  decreasePct: number | null;
}

import type { NumericInputRange } from '$lib/shared/types.js';

export interface MorphineInputRanges {
  weightKg: NumericInputRange;
  maxDoseMgKgDose: NumericInputRange;
  decreasePct: NumericInputRange;
}
