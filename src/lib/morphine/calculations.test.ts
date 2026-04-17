import { describe, it, expect } from 'vitest';
import { calculateLinearSchedule } from './calculations.js';

describe('calculateLinearSchedule', () => {
  const weight = 3.1;
  const maxDose = 0.04;
  const decreasePct = 0.1;

  it('returns exactly 10 steps', () => {
    const steps = calculateLinearSchedule(weight, maxDose, decreasePct);
    expect(steps).toHaveLength(10);
  });

  it('step 1 dose equals weight * maxDose with zero reduction', () => {
    const steps = calculateLinearSchedule(weight, maxDose, decreasePct);
    expect(steps[0].step).toBe(1);
    expect(steps[0].doseMg).toBeCloseTo(0.124, 6);
    expect(steps[0].reductionMg).toBe(0);
  });

  it('all reductions after step 1 are constant', () => {
    const steps = calculateLinearSchedule(weight, maxDose, decreasePct);
    const expectedReduction = 0.124 * 0.1; // 0.0124
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].reductionMg).toBeCloseTo(expectedReduction, 6);
    }
  });

  it('step 10 dose equals initial dose minus 9 reductions', () => {
    const steps = calculateLinearSchedule(weight, maxDose, decreasePct);
    const expected = 0.124 - 9 * 0.0124; // 0.0124
    expect(steps[9].doseMg).toBeCloseTo(expected, 6);
  });

  it('doseMgKgDose equals doseMg / weight', () => {
    const steps = calculateLinearSchedule(weight, maxDose, decreasePct);
    for (const step of steps) {
      expect(step.doseMgKgDose).toBeCloseTo(step.doseMg / weight, 6);
    }
  });

  it('clamps dose to 0 when reduction would make it negative', () => {
    const steps = calculateLinearSchedule(weight, maxDose, 0.2);
    // With 20% reduction per step: reduction = 0.0248 each step
    // By step 6: dose = 0.124 - 5*0.0248 = 0.0 (exact)
    // Steps 7-10 should be clamped to 0
    for (let i = 6; i < steps.length; i++) {
      expect(steps[i].doseMg).toBe(0);
    }
  });
});

describe('Morphine wean — xlsx Sheet1 spreadsheet parity', () => {
  // Source of truth: morphine-wean-calculator.xlsx Sheet1, cells B15..B24
  // Inputs: weight 3.1, maxDose 0.04 mg/kg/dose, decreasePct 0.10
  // Formula: step N = prev − (weight × maxDose × decreasePct) = prev − 0.0124
  const steps = calculateLinearSchedule(3.1, 0.04, 0.1);

  const expected: { step: number; doseMg: number; doseMgKgDose: number; reductionMg: number }[] = [
    { step: 1, doseMg: 0.124, doseMgKgDose: 0.04, reductionMg: 0 },
    { step: 2, doseMg: 0.1116, doseMgKgDose: 0.036, reductionMg: 0.0124 },
    { step: 3, doseMg: 0.0992, doseMgKgDose: 0.032, reductionMg: 0.0124 },
    { step: 4, doseMg: 0.0868, doseMgKgDose: 0.028, reductionMg: 0.0124 },
    { step: 5, doseMg: 0.0744, doseMgKgDose: 0.024, reductionMg: 0.0124 },
    { step: 6, doseMg: 0.062, doseMgKgDose: 0.02, reductionMg: 0.0124 },
    { step: 7, doseMg: 0.0496, doseMgKgDose: 0.016, reductionMg: 0.0124 },
    { step: 8, doseMg: 0.0372, doseMgKgDose: 0.012, reductionMg: 0.0124 },
    { step: 9, doseMg: 0.0248, doseMgKgDose: 0.008, reductionMg: 0.0124 },
    { step: 10, doseMg: 0.0124, doseMgKgDose: 0.004, reductionMg: 0.0124 }
  ];

  for (const row of expected) {
    it(`step ${row.step} matches Sheet1 row`, () => {
      const s = steps[row.step - 1];
      expect(s.step).toBe(row.step);
      expect(s.doseMg).toBeCloseTo(row.doseMg, 4);
      expect(s.doseMgKgDose).toBeCloseTo(row.doseMgKgDose, 4);
      expect(s.reductionMg).toBeCloseTo(row.reductionMg, 4);
    });
  }
});
