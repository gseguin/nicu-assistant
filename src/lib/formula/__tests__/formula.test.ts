// src/lib/formula/__tests__/formula.test.ts
// Unit tests for infant formula recipe calculation pure functions.

import { describe, it, expect } from 'vitest';
import {
  validateRecipeInputs,
  validateBMFInputs,
  calculateRecipe,
  calculateBMF,
  calculateScoops
} from '$lib/formula/formula';
import { getBrandById, BRANDS, type BrandConfig } from '$lib/formula/formula-config';

// ============================================================
// Test Fixtures
// ============================================================

// Use a well-known brand with scoop data for recipe tests
const SIMILAC_ADVANCE = getBrandById('abbott-similac-advance')!;

// Use Neocate Infant as a representative BMF brand (has kcalPerG)
const NEOCATE_INFANT = getBrandById('nutricia-neocate-infant')!;

// ============================================================
// validateRecipeInputs
// ============================================================

describe('validateRecipeInputs', () => {
  it('returns error when desired_kcal_oz is invalid (0)', () => {
    const result = validateRecipeInputs(0, 100);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns error when total_mL is invalid (0)', () => {
    const result = validateRecipeInputs(24, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns valid for correct inputs (24 kcal/oz, 100 mL)', () => {
    const result = validateRecipeInputs(24, 100);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================================
// calculateRecipe
// ============================================================

describe('calculateRecipe', () => {
  it('produces mL_water > 0 and g_powder > 0 for Similac Advance at 24 kcal/oz, 100 mL', () => {
    const result = calculateRecipe(SIMILAC_ADVANCE, 24, 100);
    expect(result.mL_water).toBeGreaterThan(0);
    expect(result.g_powder).toBeGreaterThan(0);
  });
});

// ============================================================
// validateBMFInputs
// ============================================================

describe('validateBMFInputs', () => {
  it('returns error when baseline_ebm_kcal_oz is invalid (0)', () => {
    const result = validateBMFInputs(24, 100, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ============================================================
// calculateBMF
// ============================================================

describe('calculateBMF', () => {
  it('produces mL_ebm > 0 and g_powder > 0 when target > baseline (24 > 20)', () => {
    const result = calculateBMF(NEOCATE_INFANT, 24, 100, 20);
    expect(result.mL_ebm).toBeGreaterThan(0);
    expect(result.g_powder).toBeGreaterThan(0);
  });

  it('throws when target <= baseline (20 <= 24)', () => {
    // calculateBMF calls validateBMFInputs which rejects target <= baseline
    expect(() => calculateBMF(NEOCATE_INFANT, 20, 100, 24)).toThrow();
  });
});

// ============================================================
// calculateScoops
// ============================================================

describe('calculateScoops', () => {
  it('returns a number for a brand with gPerScoop', () => {
    const result = calculateScoops(10, SIMILAC_ADVANCE);
    expect(typeof result).toBe('number');
    expect(result).not.toBeNull();
  });

  it('returns null for a brand without gPerScoop', () => {
    // Ketocal 3:1 has gPerScoop = null
    const ketocal = getBrandById('nutricia-ketocal-3-1')!;
    const result = calculateScoops(10, ketocal);
    expect(result).toBeNull();
  });
});
