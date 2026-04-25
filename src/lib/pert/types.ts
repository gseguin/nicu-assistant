import type { NumericInputRange } from '$lib/shared/types.js';

export type PertMode = 'oral' | 'tube-feed';

export interface PertOralInputs {
  fatGrams: number | null;
  lipasePerKgPerMeal: number | null;
}

export interface PertTubeFeedInputs {
  formulaId: string | null;
  volumePerDayMl: number | null;
  lipasePerKgPerDay: number | null;
}

export interface PertStateData {
  mode: PertMode;
  weightKg: number | null;
  medicationId: string | null;
  strengthValue: number | null;
  oral: PertOralInputs;
  tubeFeed: PertTubeFeedInputs;
}

export interface PertOralResult {
  capsulesPerDose: number;
  totalLipase: number;
  lipasePerDose: number;
  estimatedDailyTotal: number; // capsulesPerDose × 3
}

export interface PertTubeFeedResult {
  capsulesPerDay: number;
  totalLipase: number;
  totalFatG: number;
  lipasePerKg: number;
  capsulesPerMonth: number;
}

export interface PertInputRanges {
  weightKg: NumericInputRange;
  fatGrams: NumericInputRange;
  volumePerDayMl: NumericInputRange;
  lipasePerKgPerMeal: NumericInputRange;
  lipasePerKgPerDay: NumericInputRange;
}

export interface Medication {
  id: string;
  brand: string;
  strengths: number[];
  source?: { url: string; nda?: string };
}

export interface Formula {
  id: string;
  name: string;
  fatGPerL: number;
}

export type AdvisorySeverity = 'warning' | 'stop';

export interface Advisory {
  id: string;
  field: string; // input field id, or 'computed' for cross-input rules
  comparator: 'gt' | 'gte' | 'lt' | 'lte' | 'outside';
  value: number | { min: number; max: number };
  message: string;
  severity: AdvisorySeverity;
  mode?: PertMode | 'both';
}

export interface ValidationMessages {
  emptyOral: string;
  emptyTubeFeed: string;
  invalidWeight: string;
  invalidFatGrams: string;
  invalidVolume: string;
  invalidLipaseRate: string;
}
