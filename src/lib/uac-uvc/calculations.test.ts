import { describe, it, expect } from 'vitest';
import { calculateUacDepth, calculateUvcDepth, calculateUacUvc } from './calculations.js';
import fixtures from './uac-uvc-parity.fixtures.json';

const EPSILON = 0.01; // 1% relative
const ABS_FLOOR = 0.01; // 0.01 cm absolute floor (per Phase 42 D-13)

function closeEnough(actual: number, expected: number): boolean {
  const absDiff = Math.abs(actual - expected);
  if (absDiff <= ABS_FLOOR) return true;
  if (expected === 0) return absDiff < EPSILON;
  return Math.abs(absDiff / expected) <= EPSILON;
}

describe('UAC/UVC calculations — spreadsheet parity (xlsx B3/B7)', () => {
  for (const c of fixtures.cases) {
    it(`parity @ ${c.input.weightKg} kg`, () => {
      expect(closeEnough(calculateUacDepth(c.input.weightKg), c.expected.uacCm)).toBe(true);
      expect(closeEnough(calculateUvcDepth(c.input.weightKg), c.expected.uvcCm)).toBe(true);
    });
  }
});

describe('calculateUacUvc aggregator', () => {
  it('returns null when weightKg is null', () => {
    expect(calculateUacUvc({ weightKg: null })).toBeNull();
  });

  it('returns full UacUvcResult at xlsx default (2.5 kg)', () => {
    const result = calculateUacUvc({ weightKg: 2.5 });
    expect(result).not.toBeNull();
    expect(result!.uacCm).toBe(16.5);
    expect(result!.uvcCm).toBe(8.25);
  });
});
