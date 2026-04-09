import type { NumericInputRange } from '$lib/shared/types.js';

export interface GirStateData {
  weightKg: number | null;
  dextrosePct: number | null;
  mlPerKgPerDay: number | null;
  selectedBucketId: string | null;
}

export interface GirInputRanges {
  weightKg: NumericInputRange;
  dextrosePct: NumericInputRange;
  mlPerKgPerDay: NumericInputRange;
}

export interface GlucoseBucket {
  id: 'severe-neuro' | 'lt40' | '40-50' | '50-60' | '60-70' | 'gt70';
  label: string;
  action: string;
  targetGirDelta: number;
}

export interface GirTitrationRow {
  bucketId: GlucoseBucket['id'];
  label: string;
  action: string;
  targetGirMgKgMin: number;
  targetFluidsMlKgDay: number;
  targetRateMlHr: number;
  deltaRateMlHr: number;
}

export interface GirResult {
  currentGirMgKgMin: number;
  initialRateMlHr: number;
  titration: GirTitrationRow[];
}
