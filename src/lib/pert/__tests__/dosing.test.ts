// src/lib/pert/__tests__/dosing.test.ts
// Unit tests for PERT dosing pure calculation functions.

import { describe, it, expect } from 'vitest';
import {
  validateFatGrams,
  calculateTotalLipase,
  calculateCapsules
} from '$lib/pert/dosing';

// ============================================================
// validateFatGrams
// ============================================================

describe('validateFatGrams', () => {
  it('returns error for empty input', () => {
    const result = validateFatGrams('');
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
  });

  it('returns error for zero grams', () => {
    const result = validateFatGrams('0');
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
  });

  it('returns null for valid fat grams (15)', () => {
    expect(validateFatGrams('15')).toBeNull();
  });

  it('returns error for non-numeric input', () => {
    const result = validateFatGrams('abc');
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
  });
});

// ============================================================
// calculateTotalLipase
// ============================================================

describe('calculateTotalLipase', () => {
  it('returns fatGrams * lipaseUnitsPerGram (15g x 2000 = 30000)', () => {
    expect(calculateTotalLipase(15, 2000)).toBe(30000);
  });
});

// ============================================================
// calculateCapsules
// ============================================================

describe('calculateCapsules', () => {
  it('returns correct capsule count for Creon 6000 with 15g fat at 2000 units/g', () => {
    // Formula: ROUND((15 * 2000) / 6000) = ROUND(30000 / 6000) = ROUND(5) = 5
    expect(calculateCapsules(15, 2000, 6000)).toBe(5);
  });

  it('returns correct capsule count for Creon 3000 with 10g fat at 1000 units/g', () => {
    // Formula: ROUND((10 * 1000) / 3000) = ROUND(3.333) = 3
    expect(calculateCapsules(10, 1000, 3000)).toBe(3);
  });

  it('returns a positive integer for tube-feed Pancreaze 2600 strength', () => {
    // Tube-feed specific strength: Pancreaze 2600
    // Formula: ROUND((20 * 2000) / 2600) = ROUND(15.38) = 15
    const result = calculateCapsules(20, 2000, 2600);
    expect(result).toBeGreaterThan(0);
    expect(Number.isInteger(result)).toBe(true);
  });
});
