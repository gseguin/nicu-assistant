// Fortification module shared types.

export type BaseType = 'breast-milk' | 'water';

export type UnitType = 'grams' | 'scoops' | 'teaspoons' | 'tablespoons' | 'packets';

export type TargetKcalOz = 22 | 24 | 26 | 28 | 30;

// A single formula reference row transcribed from recipe-calculator.xlsx.
export interface FortificationFormula {
  id: string;
  name: string;
  manufacturer: string;
  displacement_factor: number;
  calorie_concentration: number;
  grams_per_scoop: number;
}

// Inputs to calculateFortification (consumed by Plan 09-02).
export interface FortificationInputs {
  formula: FortificationFormula;
  base: BaseType;
  volumeMl: number;
  targetKcalOz: TargetKcalOz;
  unit: UnitType;
}

// Result returned by calculateFortification.
export interface FortificationResult {
  amountToAdd: number;
  yieldMl: number;
  exactKcalPerOz: number;
  suggestedStartingVolumeMl: string;
}

import type { NumericInputRange } from '$lib/shared/types.js';

export interface FortificationInputRanges {
  volumeMl: NumericInputRange;
}
