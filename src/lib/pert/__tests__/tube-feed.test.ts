// src/lib/pert/__tests__/tube-feed.test.ts
// Tube-feed clinical model tests — ported from pert-calculator.

import { describe, expect, it } from 'vitest';

import { CLINICAL_CONFIG, parseClinicalConfig } from '$lib/pert/clinical-config';
import { calculateCapsules, calculateTotalLipase } from '$lib/pert/dosing';
import { getStrengthsForBrand, LIPASE_RATES } from '$lib/pert/medications';
import {
  TUBE_FEED_MEDICATIONS,
  TUBE_FEED_NORMALIZATION_NOTES
} from '$lib/pert/tube-feed/clinical-data';
import { TUBE_FEED_EXAMPLES } from '$lib/pert/tube-feed/examples';
import {
  getTubeFeedStrengthsForBrand,
  TUBE_FEED_MEDICATION_BRANDS
} from '$lib/pert/tube-feed/medications';

describe('tube-feed clinical model', () => {
  it.each(TUBE_FEED_EXAMPLES)(
    'uses shared dosing helpers for $label',
    ({ fatGrams, lipaseUnitsPerGram, strength, expectedTotalLipase, expectedCapsules }) => {
      expect(calculateTotalLipase(fatGrams, lipaseUnitsPerGram)).toBe(expectedTotalLipase);
      expect(calculateCapsules(fatGrams, lipaseUnitsPerGram, strength)).toBe(expectedCapsules);
    }
  );

  it('accepts a config-shaped tube-feed medication table through the shared parser', () => {
    const parsedConfig = parseClinicalConfig({
      medications: TUBE_FEED_MEDICATIONS,
      lipaseRates: LIPASE_RATES,
      maxFatGrams: CLINICAL_CONFIG.maxFatGrams,
      disclaimer: CLINICAL_CONFIG.disclaimer,
      validationMessages: CLINICAL_CONFIG.validationMessages,
      formulas: CLINICAL_CONFIG.formulas
    });

    expect(parsedConfig.medications).toEqual(TUBE_FEED_MEDICATIONS);
    expect(parsedConfig.lipaseRates).toEqual(LIPASE_RATES);
    expect(parsedConfig.disclaimer).toEqual(CLINICAL_CONFIG.disclaimer);
    expect(parsedConfig.validationMessages).toEqual(CLINICAL_CONFIG.validationMessages);
    expect(parsedConfig.formulas).toEqual(CLINICAL_CONFIG.formulas);
  });

  it('keeps normalized tube-feed data free of spreadsheet noise', () => {
    expect(TUBE_FEED_MEDICATION_BRANDS).not.toContain('Viokase');
    expect(TUBE_FEED_MEDICATION_BRANDS).not.toContain('Pertzye 2');

    const tubeFeedStrengths = TUBE_FEED_MEDICATIONS.flatMap(medication => medication.strengths);

    expect(tubeFeedStrengths).not.toContain(10444);
    expect(tubeFeedStrengths).not.toContain(2);
    expect(TUBE_FEED_NORMALIZATION_NOTES).toEqual([
      'Viokase -> Viokace',
      'Viokase 10444 -> Viokace 10440',
      'Exclude Pertzye 2 as spreadsheet noise'
    ]);
  });

  it('keeps meal mode strengths isolated from tube-feed strengths', () => {
    expect(getStrengthsForBrand('Pancreaze')).toEqual([4200, 10500, 16800, 21000]);
    expect(getTubeFeedStrengthsForBrand('Pancreaze')).toEqual([
      2600, 4200, 10500, 16800, 21000, 37000
    ]);
  });

  it('keeps nearest-integer rounding for the Fibersource HN + Pertzye 4000 case', () => {
    // Worksheet ROUNDUP would produce 6 here, but product behavior must stay on Math.round.
    expect(calculateCapsules(21, 1000, 4000)).toBe(5);
  });
});

describe('tube-feed medication data integrity', () => {
  it('has all 5 brands in tube-feed data', () => {
    expect(TUBE_FEED_MEDICATION_BRANDS).toContain('Creon');
    expect(TUBE_FEED_MEDICATION_BRANDS).toContain('Zenpep');
    expect(TUBE_FEED_MEDICATION_BRANDS).toContain('Pancreaze');
    expect(TUBE_FEED_MEDICATION_BRANDS).toContain('Pertzye');
    expect(TUBE_FEED_MEDICATION_BRANDS).toContain('Viokace');
  });

  it('tube-feed strengths for every brand are in ascending order', () => {
    for (const med of TUBE_FEED_MEDICATIONS) {
      const sorted = [...med.strengths].sort((a, b) => a - b);
      expect(med.strengths).toEqual(sorted);
    }
  });

  it('all tube-feed strength values are positive integers', () => {
    for (const med of TUBE_FEED_MEDICATIONS) {
      for (const s of med.strengths) {
        expect(s).toBeGreaterThan(0);
        expect(Number.isInteger(s)).toBe(true);
      }
    }
  });

  it('returns empty array for unknown brand in tube-feed', () => {
    expect(getTubeFeedStrengthsForBrand('Unknown')).toEqual([]);
  });

  it('Pancreaze has extra tube-feed strengths not in meal mode', () => {
    const mealStrengths = getStrengthsForBrand('Pancreaze');
    const tubeFeedStrengths = getTubeFeedStrengthsForBrand('Pancreaze');
    // Tube-feed has 2600 and 37000 that meal mode doesn't
    expect(tubeFeedStrengths).toContain(2600);
    expect(tubeFeedStrengths).toContain(37000);
    expect(mealStrengths).not.toContain(2600);
    expect(mealStrengths).not.toContain(37000);
  });

  it('Pertzye has extra tube-feed strengths not in meal mode', () => {
    const mealStrengths = getStrengthsForBrand('Pertzye');
    const tubeFeedStrengths = getTubeFeedStrengthsForBrand('Pertzye');
    // Tube-feed has 4000 and 24000 that meal mode doesn't
    expect(tubeFeedStrengths).toContain(4000);
    expect(tubeFeedStrengths).toContain(24000);
    expect(mealStrengths).not.toContain(4000);
    expect(mealStrengths).not.toContain(24000);
  });
});
