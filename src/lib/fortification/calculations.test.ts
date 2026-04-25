import { describe, it, expect } from 'vitest';
import { calculateFortification } from './calculations.js';
import { getFormulaById } from './fortification-config.js';
import type { FortificationFormula } from './types.js';

const neocate = getFormulaById('neocate-infant') as FortificationFormula;
const hmf = getFormulaById('similac-hmf') as FortificationFormula;
const kendamilOrganic = getFormulaById('kendamil-organic') as FortificationFormula;
const kendamilClassic = getFormulaById('kendamil-classic') as FortificationFormula;
const kendamilGoat = getFormulaById('kendamil-goat') as FortificationFormula;

const SUGGESTED_RE = /^\d+ \(\d+(\.\d+)? oz\)$/;

describe('calculateFortification — documented case (VAL-01)', () => {
  it('Neocate Infant + breast milk + 180 mL + 24 kcal/oz + tsp matches spreadsheet', () => {
    const r = calculateFortification({
      formula: neocate,
      base: 'breast-milk',
      volumeMl: 180,
      targetKcalOz: 24,
      unit: 'teaspoons'
    });
    expect(r.amountToAdd).toBe(2);
    expect(r.yieldMl).toBeCloseTo(183.5, 4);
    expect(r.exactKcalPerOz).toBeCloseTo(23.5101662125341, 4);
    expect(r.suggestedStartingVolumeMl).toBe('180 (6.1 oz)');
  });
});

describe('calculateFortification — Packets special case (CALC-04)', () => {
  it('Similac HMF + water + 180 mL + 24 kcal/oz + packets → 7.2', () => {
    const r = calculateFortification({
      formula: hmf,
      base: 'water',
      volumeMl: 180,
      targetKcalOz: 24,
      unit: 'packets'
    });
    expect(r.amountToAdd).toBeCloseTo(7.2, 4);
    expect(r.yieldMl).toBeGreaterThanOrEqual(180);
    expect(Number.isFinite(r.exactKcalPerOz)).toBe(true);
    expect(r.suggestedStartingVolumeMl).toMatch(SUGGESTED_RE);
  });

  it('Similac HMF + water + 180 mL + 22 kcal/oz + packets → 3.6', () => {
    const r = calculateFortification({
      formula: hmf,
      base: 'water',
      volumeMl: 180,
      targetKcalOz: 22,
      unit: 'packets'
    });
    expect(r.amountToAdd).toBeCloseTo(3.6, 4);
  });

  it('Neocate Infant + water + 180 mL + 24 kcal/oz + packets → 0 (non-HMF)', () => {
    const r = calculateFortification({
      formula: neocate,
      base: 'water',
      volumeMl: 180,
      targetKcalOz: 24,
      unit: 'packets'
    });
    expect(r.amountToAdd).toBe(0);
    expect(r.yieldMl).toBe(0);
    expect(r.exactKcalPerOz).toBe(0);
    expect(r.suggestedStartingVolumeMl).toBe('0 (0 oz)');
  });
});

describe('calculateFortification — BM+Tsp shortcut (CALC-05)', () => {
  it('Neocate + breast milk + 180 mL + 22 kcal/oz + tsp → 1 (= (180/90) × 0.5)', () => {
    const r = calculateFortification({
      formula: neocate,
      base: 'breast-milk',
      volumeMl: 180,
      targetKcalOz: 22,
      unit: 'teaspoons'
    });
    expect(r.amountToAdd).toBe(1);
    expect(r.yieldMl).toBeGreaterThan(180);
    expect(Number.isFinite(r.exactKcalPerOz)).toBe(true);
    expect(r.suggestedStartingVolumeMl).toMatch(SUGGESTED_RE);
  });
});

describe('calculateFortification — general formula + units (CALC-02/03)', () => {
  // Values computed at test-authoring time using literal JSON values.
  // Neocate: disp=0.7, cal=4.83, gps=4.6. HMF: disp=1, cal=1.4, gps=5.

  it('Grams + water base (baseKcal=0): Neocate + water + 180 + 24 + grams', () => {
    // (180 * (24 - 0)) / (29.57 * 4.83 - 0.7 * 24) = 34.27942972359829
    const r = calculateFortification({
      formula: neocate,
      base: 'water',
      volumeMl: 180,
      targetKcalOz: 24,
      unit: 'grams'
    });
    expect(r.amountToAdd).toBeCloseTo(34.27942972359829, 4);
    expect(r.yieldMl).toBeGreaterThanOrEqual(180);
    expect(Number.isFinite(r.exactKcalPerOz)).toBe(true);
    expect(r.suggestedStartingVolumeMl).toMatch(SUGGESTED_RE);
  });

  it('Scoops: Similac HMF + breast milk + 180 + 24 + scoops', () => {
    // general grams = (180 * (24 - 20)) / (29.57 * 1.4 - 1 * 24) = 41.38406713415336
    // scoops = 41.38406713415336 / 5 = 8.276813426830673
    const r = calculateFortification({
      formula: hmf,
      base: 'breast-milk',
      volumeMl: 180,
      targetKcalOz: 24,
      unit: 'scoops'
    });
    expect(r.amountToAdd).toBeCloseTo(8.276813426830673, 4);
    expect(r.yieldMl).toBeGreaterThan(180);
    expect(Number.isFinite(r.exactKcalPerOz)).toBe(true);
    expect(r.suggestedStartingVolumeMl).toMatch(SUGGESTED_RE);
  });

  it('Tablespoons: Neocate + breast milk + 180 + 26 + tbsp', () => {
    // general grams = (180 * (26 - 20)) / (29.57 * 4.83 - 0.7 * 26) = 8.666130115524329
    // tbsp = 8.666130115524329 / 7.5 = 1.1554840154032437
    const r = calculateFortification({
      formula: neocate,
      base: 'breast-milk',
      volumeMl: 180,
      targetKcalOz: 26,
      unit: 'tablespoons'
    });
    expect(r.amountToAdd).toBeCloseTo(1.1554840154032437, 4);
    expect(r.yieldMl).toBeGreaterThan(180);
    expect(Number.isFinite(r.exactKcalPerOz)).toBe(true);
    expect(r.suggestedStartingVolumeMl).toMatch(SUGGESTED_RE);
  });
});

describe('calculateFortification — invalid input (IFERROR parity)', () => {
  it('volumeMl = 0 → zero result with "0 (0 oz)"', () => {
    const r = calculateFortification({
      formula: neocate,
      base: 'breast-milk',
      volumeMl: 0,
      targetKcalOz: 24,
      unit: 'teaspoons'
    });
    expect(r).toEqual({
      amountToAdd: 0,
      yieldMl: 0,
      exactKcalPerOz: 0,
      suggestedStartingVolumeMl: '0 (0 oz)'
    });
  });
});
