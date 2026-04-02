import { describe, it, expect } from 'vitest';
import { calculateLinearSchedule, calculateCompoundingSchedule } from './calculations.js';

describe('calculateLinearSchedule', () => {
  const weight = 3.1;
  const maxDose = 0.04;
  const decreasePct = 0.10;

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
    const expectedReduction = 0.124 * 0.10; // 0.0124
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
    const steps = calculateLinearSchedule(weight, maxDose, 0.20);
    // With 20% reduction per step: reduction = 0.0248 each step
    // By step 6: dose = 0.124 - 5*0.0248 = 0.0 (exact)
    // Steps 7-10 should be clamped to 0
    for (let i = 6; i < steps.length; i++) {
      expect(steps[i].doseMg).toBe(0);
    }
  });
});

describe('calculateCompoundingSchedule', () => {
  const weight = 3.1;
  const maxDose = 0.04;
  const decreasePct = 0.10;

  it('returns exactly 10 steps', () => {
    const steps = calculateCompoundingSchedule(weight, maxDose, decreasePct);
    expect(steps).toHaveLength(10);
  });

  it('step 1 dose equals weight * maxDose with zero reduction', () => {
    const steps = calculateCompoundingSchedule(weight, maxDose, decreasePct);
    expect(steps[0].step).toBe(1);
    expect(steps[0].doseMg).toBeCloseTo(0.124, 6);
    expect(steps[0].reductionMg).toBe(0);
  });

  it('step 2 dose equals step 1 dose * (1 - decreasePct)', () => {
    const steps = calculateCompoundingSchedule(weight, maxDose, decreasePct);
    expect(steps[1].doseMg).toBeCloseTo(0.1116, 6);
  });

  it('step 3 dose equals step 2 dose * (1 - decreasePct)', () => {
    const steps = calculateCompoundingSchedule(weight, maxDose, decreasePct);
    expect(steps[2].doseMg).toBeCloseTo(0.10044, 6);
  });

  it('reductions decrease each step (exponential decay)', () => {
    const steps = calculateCompoundingSchedule(weight, maxDose, decreasePct);
    for (let i = 2; i < steps.length; i++) {
      expect(steps[i].reductionMg).toBeLessThan(steps[i - 1].reductionMg);
    }
  });

  it('doseMgKgDose equals doseMg / weight', () => {
    const steps = calculateCompoundingSchedule(weight, maxDose, decreasePct);
    for (const step of steps) {
      expect(step.doseMgKgDose).toBeCloseTo(step.doseMg / weight, 6);
    }
  });
});
