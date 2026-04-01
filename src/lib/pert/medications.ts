// src/lib/pert/medications.ts
// FDA-regulated PERT medication brands and their available capsule strengths (lipase units).
// Source: FDA-approved PERT medication prescribing information.
// This data mirrors the clinical spreadsheet exactly — do not add or remove entries
// without verifying against current FDA prescribing information.

import { CLINICAL_CONFIG, type Medication } from '$lib/pert/clinical-config';

export type { Medication } from '$lib/pert/clinical-config';

export const MEDICATIONS: Medication[] = CLINICAL_CONFIG.medications;

export const LIPASE_RATES: number[] = CLINICAL_CONFIG.lipaseRates; // Units per gram of fat

export const MEDICATION_BRANDS: string[] = MEDICATIONS.map(m => m.brand);

export function getStrengthsForBrand(brand: string): number[] {
  return MEDICATIONS.find(m => m.brand === brand)?.strengths ?? [];
}
