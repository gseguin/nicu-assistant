import { LIPASE_RATES } from '$lib/pert/medications';

import { TUBE_FEED_MEDICATIONS } from '$lib/pert/tube-feed/clinical-data';

export type { Medication } from '$lib/pert/clinical-config';

// Capsule math still lives in src/lib/pert/dosing.ts per SAFE-01; this module only exposes tube-feed data.
export const TUBE_FEED_LIPASE_RATES: number[] = LIPASE_RATES;

export const TUBE_FEED_MEDICATION_BRANDS: string[] = TUBE_FEED_MEDICATIONS.map(
  medication => medication.brand
);

export function getTubeFeedStrengthsForBrand(brand: string): number[] {
  return TUBE_FEED_MEDICATIONS.find(medication => medication.brand === brand)?.strengths ?? [];
}
