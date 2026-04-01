import type { Medication } from '$lib/pert/clinical-config';

export const TUBE_FEED_NORMALIZATION_NOTES = [
  'Viokase -> Viokace',
  'Viokase 10444 -> Viokace 10440',
  'Exclude Pertzye 2 as spreadsheet noise'
] as const;

export const TUBE_FEED_MEDICATIONS: Medication[] = [
  { brand: 'Creon', strengths: [3000, 6000, 12000, 24000, 36000] },
  { brand: 'Zenpep', strengths: [3000, 5000, 10000, 15000, 20000, 25000, 40000] },
  { brand: 'Pancreaze', strengths: [2600, 4200, 10500, 16800, 21000, 37000] },
  { brand: 'Pertzye', strengths: [4000, 8000, 16000, 24000] },
  { brand: 'Viokace', strengths: [10440, 20880] }
];
