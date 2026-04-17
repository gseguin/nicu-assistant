import { describe, it, expect } from 'vitest';
import { defaults, inputs, glucoseBuckets, getBucketById } from './gir-config.js';

describe('gir-config shape', () => {
  it('defaults match spreadsheet reference example', () => {
    expect(defaults.weightKg).toBe(3.93);
    expect(defaults.dextrosePct).toBe(12.5);
    expect(defaults.mlPerKgPerDay).toBe(65);
  });

  it('inputs define advisory ranges for all three fields', () => {
    expect(inputs.weightKg).toEqual({ min: 0.3, max: 10, step: 0.1 });
    expect(inputs.dextrosePct).toEqual({ min: 2.5, max: 25, step: 0.5 });
    expect(inputs.mlPerKgPerDay).toEqual({ min: 40, max: 200, step: 5 });
  });

  it('glucoseBuckets has exactly 6 entries in correct order', () => {
    expect(glucoseBuckets.map((b) => b.id)).toEqual([
      'severe-neuro',
      'lt40',
      '40-50',
      '50-60',
      '60-70',
      'gt70'
    ]);
  });

  it('glucoseBuckets targetGirDelta values match clinical spec', () => {
    expect(glucoseBuckets.map((b) => b.targetGirDelta)).toEqual([1.5, 1.0, 0.5, -0.5, -1.0, -1.5]);
  });

  it('getBucketById resolves by id', () => {
    expect(getBucketById('40-50')?.targetGirDelta).toBe(0.5);
    expect(getBucketById('nope')).toBeUndefined();
  });
});
