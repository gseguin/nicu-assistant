// src/lib/pert/__tests__/dosing.test.ts
// Comprehensive unit tests for PERT dosing pure calculation functions.
// Ported from pert-calculator with adaptations for nicu-assistant's maxFatGrams validation.

import { describe, it, expect } from 'vitest';
import {
  validateFatGrams,
  calculateTotalLipase,
  calculateCapsules,
  resolveOptionLabel,
  runFormula
} from '$lib/pert/dosing';
import { CLINICAL_CONFIG, parseClinicalConfig, type FormulaDefinition } from '$lib/pert/clinical-config';
import { getStrengthsForBrand, MEDICATIONS, LIPASE_RATES } from '$lib/pert/medications';

// ============================================================
// calculateTotalLipase
// ============================================================

describe('calculateTotalLipase', () => {
  it('multiplies fat grams by lipase rate', () => {
    expect(calculateTotalLipase(30, 1000)).toBe(30000);
  });

  it('handles decimal fat grams', () => {
    expect(calculateTotalLipase(25.5, 2000)).toBe(51000);
  });

  it('returns 0 for 0 fat grams', () => {
    expect(calculateTotalLipase(0, 1000)).toBe(0);
  });
});

// ============================================================
// calculateCapsules
// ============================================================

describe('calculateCapsules', () => {
  it('rounds result to nearest whole number', () => {
    // 30g × 1000 units/g = 30000 total / 12000 strength = 2.5 → rounds to 3
    expect(calculateCapsules(30, 1000, 12000)).toBe(3);
  });

  it('rounds down when fractional part is below 0.5', () => {
    // 20g × 1000 units/g = 20000 total / 12000 strength = 1.666... → rounds to 2
    expect(calculateCapsules(20, 1000, 12000)).toBe(2);
  });

  it('rounds up when fractional part is exactly 0.5', () => {
    // 30g × 1000 = 30000 / 12000 = 2.5 → rounds to 3 (Math.round rounds half-up)
    expect(calculateCapsules(30, 1000, 12000)).toBe(3);
  });

  it('returns 1 for very small fat amounts', () => {
    expect(calculateCapsules(4, 500, 3000)).toBe(1); // 2000/3000 = 0.666 → 1
  });

  it('handles the Creon 24000 scenario correctly', () => {
    // 60g fat × 2000 units/g = 120000 / 24000 = 5 capsules (exact)
    expect(calculateCapsules(60, 2000, 24000)).toBe(5);
  });

  it('handles the Zenpep 10000 scenario', () => {
    // 45g fat × 1000 units/g = 45000 / 10000 = 4.5 → rounds to 5
    expect(calculateCapsules(45, 1000, 10000)).toBe(5);
  });

  it('handles large values without floating point overflow', () => {
    expect(calculateCapsules(100, 4000, 36000)).toBe(11); // 400000/36000 = 11.11 → 11
  });

  it('returns correct capsule count for Creon 6000 with 15g fat at 2000 units/g', () => {
    // Formula: ROUND((15 * 2000) / 6000) = ROUND(30000 / 6000) = ROUND(5) = 5
    expect(calculateCapsules(15, 2000, 6000)).toBe(5);
  });

  it('returns correct capsule count for Creon 3000 with 10g fat at 1000 units/g', () => {
    // Formula: ROUND((10 * 1000) / 3000) = ROUND(3.333) = 3
    expect(calculateCapsules(10, 1000, 3000)).toBe(3);
  });

  it('returns a positive integer for tube-feed Pancreaze 2600 strength', () => {
    const result = calculateCapsules(20, 2000, 2600);
    expect(result).toBeGreaterThan(0);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ============================================================
// validateFatGrams
// ============================================================

describe('validateFatGrams', () => {
  it('returns error message for empty string', () => {
    expect(validateFatGrams('')).toBe('Enter fat grams to calculate');
  });

  it('returns error message for whitespace-only string', () => {
    expect(validateFatGrams('   ')).toBe('Enter fat grams to calculate');
  });

  it('returns error for non-numeric input', () => {
    expect(validateFatGrams('abc')).toBe('Enter a valid fat amount (e.g. 30 or 25.5)');
  });

  it('returns error for negative value', () => {
    expect(validateFatGrams('-5')).toBe('Enter a valid fat amount (e.g. 30 or 25.5)');
  });

  it('returns error for zero', () => {
    expect(validateFatGrams('0')).toBe('Enter a fat amount greater than zero');
  });

  it('returns error for 0.0', () => {
    expect(validateFatGrams('0.0')).toBe('Enter a fat amount greater than zero');
  });

  it('returns null for valid integer', () => {
    expect(validateFatGrams('30')).toBeNull();
  });

  it('returns null for valid decimal', () => {
    expect(validateFatGrams('25.5')).toBeNull();
  });

  it('returns null for value of 1', () => {
    expect(validateFatGrams('1')).toBeNull();
  });

  it('handles leading decimal like .5', () => {
    expect(validateFatGrams('.5')).toBeNull();
  });

  it('returns error for standalone minus sign', () => {
    expect(validateFatGrams('-')).toBe('Enter a valid fat amount (e.g. 30 or 25.5)');
  });

  it('parses numeric prefix from mixed string — matches browser parseFloat behaviour', () => {
    expect(validateFatGrams('30g')).toBeNull();
  });

  // nicu-assistant specific: maxFatGrams validation
  it('returns error when fat grams exceeds maxFatGrams (200)', () => {
    expect(validateFatGrams('201')).toBe('Maximum is 200 g');
  });

  it('returns null at exactly maxFatGrams boundary (200)', () => {
    expect(validateFatGrams('200')).toBeNull();
  });

  it('returns error for very large value exceeding maxFatGrams', () => {
    expect(validateFatGrams('999')).toBe('Maximum is 200 g');
  });
});

// ============================================================
// resolveOptionLabel
// ============================================================

describe('resolveOptionLabel', () => {
  const options = [
    { value: '1000', label: '1,000 units/g' },
    { value: '2000', label: '2,000 units/g' },
    { value: 'Creon', label: 'Creon' },
  ];

  it('returns label for matching value', () => {
    expect(resolveOptionLabel('1000', options)).toBe('1,000 units/g');
  });

  it('returns label for second option', () => {
    expect(resolveOptionLabel('2000', options)).toBe('2,000 units/g');
  });

  it('falls back to value string when no match', () => {
    expect(resolveOptionLabel('unknown', options)).toBe('unknown');
  });

  it('falls back to empty string when value is empty and no match', () => {
    expect(resolveOptionLabel('', options)).toBe('');
  });

  it('works with string brand values', () => {
    expect(resolveOptionLabel('Creon', options)).toBe('Creon');
  });

  it('returns value when options array is empty', () => {
    expect(resolveOptionLabel('500', [])).toBe('500');
  });
});

// ============================================================
// medications data integrity
// ============================================================

describe('medications data integrity', () => {
  it('loads medication data from clinical config', () => {
    expect(MEDICATIONS).toEqual(CLINICAL_CONFIG.medications);
  });

  it('Creon has exactly the approved strengths', () => {
    expect(getStrengthsForBrand('Creon')).toEqual([3000, 6000, 12000, 24000, 36000]);
  });

  it('Zenpep has exactly the approved strengths', () => {
    expect(getStrengthsForBrand('Zenpep')).toEqual([3000, 5000, 10000, 15000, 20000, 25000, 40000]);
  });

  it('Pancreaze has exactly the approved strengths', () => {
    expect(getStrengthsForBrand('Pancreaze')).toEqual([4200, 10500, 16800, 21000]);
  });

  it('Pertzye has exactly the approved strengths', () => {
    expect(getStrengthsForBrand('Pertzye')).toEqual([8000, 16000]);
  });

  it('Viokace has exactly the approved strengths', () => {
    expect(getStrengthsForBrand('Viokace')).toEqual([10440, 20880]);
  });

  it('all brands are present', () => {
    const brands = MEDICATIONS.map(m => m.brand);
    expect(brands).toContain('Creon');
    expect(brands).toContain('Zenpep');
    expect(brands).toContain('Pancreaze');
    expect(brands).toContain('Pertzye');
    expect(brands).toContain('Viokace');
  });

  it('returns empty array for unknown brand', () => {
    expect(getStrengthsForBrand('Unknown')).toEqual([]);
  });

  it('strengths for every brand are in ascending order', () => {
    for (const med of MEDICATIONS) {
      const sorted = [...med.strengths].sort((a, b) => a - b);
      expect(med.strengths).toEqual(sorted);
    }
  });

  it('all strength values are positive integers', () => {
    for (const med of MEDICATIONS) {
      for (const s of med.strengths) {
        expect(s).toBeGreaterThan(0);
        expect(Number.isInteger(s)).toBe(true);
      }
    }
  });
});

// ============================================================
// LIPASE_RATES
// ============================================================

describe('LIPASE_RATES', () => {
  it('loads rates from clinical config', () => {
    expect(LIPASE_RATES).toEqual(CLINICAL_CONFIG.lipaseRates);
  });

  it('contains expected clinical rates', () => {
    expect(LIPASE_RATES).toEqual([500, 1000, 2000, 4000]);
  });

  it('are in ascending order', () => {
    const sorted = [...LIPASE_RATES].sort((a, b) => a - b);
    expect(LIPASE_RATES).toEqual(sorted);
  });

  it('all rates are positive integers', () => {
    for (const r of LIPASE_RATES) {
      expect(r).toBeGreaterThan(0);
      expect(Number.isInteger(r)).toBe(true);
    }
  });
});

// ============================================================
// SelectPicker string-to-number round-trip
// ============================================================

describe('SelectPicker string-to-number round-trip', () => {
  it('parseInt converts all LIPASE_RATES strings back to original numbers', () => {
    for (const rate of LIPASE_RATES) {
      expect(parseInt(String(rate), 10)).toBe(rate);
    }
  });

  it('parseInt converts all medication strength strings back to original numbers', () => {
    for (const med of MEDICATIONS) {
      for (const strength of med.strengths) {
        expect(parseInt(String(strength), 10)).toBe(strength);
      }
    }
  });

  it('default lipase rate (LIPASE_RATES[1]) survives string round-trip', () => {
    const defaultStr = String(LIPASE_RATES[1]);
    expect(parseInt(defaultStr, 10)).toBe(LIPASE_RATES[1]);
  });

  it('default strength (MEDICATIONS[0].strengths[1]) survives string round-trip', () => {
    const defaultStr = String(MEDICATIONS[0].strengths[1]);
    expect(parseInt(defaultStr, 10)).toBe(MEDICATIONS[0].strengths[1]);
  });
});

// ============================================================
// strength reset on brand change
// ============================================================

describe('strength reset on brand change', () => {
  function resolveStrengthForBrand(brand: string, currentStrengthStr: string): string {
    const strengths = getStrengthsForBrand(brand);
    const current = parseInt(currentStrengthStr, 10);
    if (strengths.length > 0 && !strengths.includes(current)) {
      return String(strengths[0]);
    }
    return currentStrengthStr;
  }

  it('keeps shared strength when switching brands (Creon 3000 → Zenpep)', () => {
    expect(resolveStrengthForBrand('Zenpep', '3000')).toBe('3000');
  });

  it('keeps shared strength when switching brands (Creon 12000 → Creon)', () => {
    expect(resolveStrengthForBrand('Creon', '12000')).toBe('12000');
  });

  it('keeps shared strength when switching brands (Zenpep 3000 → Creon)', () => {
    expect(resolveStrengthForBrand('Creon', '3000')).toBe('3000');
  });

  it('resets to first strength when new brand lacks current (Creon 36000 → Zenpep)', () => {
    expect(resolveStrengthForBrand('Zenpep', '36000')).toBe('3000');
  });

  it('resets when switching to Pancreaze with a Creon-only strength', () => {
    expect(resolveStrengthForBrand('Pancreaze', '36000')).toBe('4200');
  });

  it('resets when switching to Pertzye with unavailable strength', () => {
    expect(resolveStrengthForBrand('Pertzye', '12000')).toBe('8000');
  });

  it('keeps Pertzye 16000 when staying on Pertzye', () => {
    expect(resolveStrengthForBrand('Pertzye', '16000')).toBe('16000');
  });

  it('keeps Pancreaze 21000 when staying on Pancreaze', () => {
    expect(resolveStrengthForBrand('Pancreaze', '21000')).toBe('21000');
  });

  it('resets when switching to Viokace with unavailable strength', () => {
    expect(resolveStrengthForBrand('Viokace', '3000')).toBe('10440');
  });

  it('does not reset when strength is available on all 5 brands', () => {
    expect(resolveStrengthForBrand('Viokace', '3000')).toBe('10440');
  });

  it('preserves a shared strength across multiple brand switches until it becomes invalid', () => {
    let current = '3000';
    current = resolveStrengthForBrand('Zenpep', current);
    expect(current).toBe('3000');

    current = resolveStrengthForBrand('Creon', current);
    expect(current).toBe('3000');

    current = resolveStrengthForBrand('Viokace', current);
    expect(current).toBe('10440');
  });
});

// ============================================================
// formula config integrity
// ============================================================

describe('formula config integrity', () => {
  it('defines the expected total lipase formula', () => {
    expect(CLINICAL_CONFIG.formulas.totalLipase).toEqual({
      result: 'totalLipase',
      steps: [
        { op: 'multiply', left: 'fatGrams', right: 'lipaseUnitsPerGram', out: 'totalLipase' }
      ]
    });
  });

  it('defines the expected capsule formula pipeline', () => {
    expect(CLINICAL_CONFIG.formulas.capsulesNeeded).toEqual({
      result: 'capsulesNeeded',
      steps: [
        { op: 'multiply', left: 'fatGrams', right: 'lipaseUnitsPerGram', out: 'totalLipase' },
        { op: 'divide', left: 'totalLipase', right: 'capsuleStrength', out: 'capsulesRaw' },
        { op: 'round', input: 'capsulesRaw', out: 'capsulesNeeded' }
      ]
    });
  });

  it('has maxFatGrams set to 200', () => {
    expect(CLINICAL_CONFIG.maxFatGrams).toBe(200);
  });
});

// ============================================================
// parseClinicalConfig
// ============================================================

describe('parseClinicalConfig', () => {
  it('rejects a non-object root value', () => {
    expect(() => parseClinicalConfig(null)).toThrow('clinical config must be an object');
  });

  it('rejects missing medications', () => {
    expect(() => parseClinicalConfig({})).toThrow('medications must be a non-empty array');
  });

  it('rejects non-object medication entries', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        medications: [123]
      })
    ).toThrow('medications[0] must be an object');
  });

  it('rejects invalid strengths arrays', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        medications: [{ brand: 'Creon', strengths: [3000, 0] }]
      })
    ).toThrow('medications[0].strengths must contain positive integers only');
  });

  it('rejects an empty strengths array', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        medications: [{ brand: 'Creon', strengths: [] }]
      })
    ).toThrow('medications[0].strengths must be a non-empty array');
  });

  it('rejects an empty brand name', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        medications: [{ brand: '', strengths: [3000] }]
      })
    ).toThrow('medications[0].brand must be a non-empty string');
  });

  it('rejects missing validationMessages', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        validationMessages: null
      })
    ).toThrow('validationMessages must be an object');
  });

  it('rejects missing formulas', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        formulas: null
      })
    ).toThrow('formulas must be an object');
  });

  it('rejects formulas without steps', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        formulas: {
          ...CLINICAL_CONFIG.formulas,
          totalLipase: {
            result: 'totalLipase',
            steps: []
          }
        }
      })
    ).toThrow('formulas.totalLipase.steps must be a non-empty array');
  });

  it('rejects a non-object formula definition', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        formulas: {
          ...CLINICAL_CONFIG.formulas,
          totalLipase: null
        }
      })
    ).toThrow('formulas.totalLipase must be an object');
  });

  it('rejects non-object formula steps', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        formulas: {
          ...CLINICAL_CONFIG.formulas,
          totalLipase: {
            result: 'totalLipase',
            steps: [123]
          }
        }
      })
    ).toThrow('formulas.totalLipase.steps[0] must be an object');
  });

  it('rejects formulas with unsupported operations', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        formulas: {
          ...CLINICAL_CONFIG.formulas,
          capsulesNeeded: {
            result: 'capsulesNeeded',
            steps: [{ op: 'subtract', left: 'a', right: 'b', out: 'c' }]
          }
        }
      })
    ).toThrow('formulas.capsulesNeeded.steps[0].op must be multiply, divide, or round');
  });

  it('rejects missing disclaimer', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        disclaimer: null
      })
    ).toThrow('disclaimer must be an object');
  });

  it('rejects non-positive maxFatGrams', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        maxFatGrams: 0
      })
    ).toThrow('maxFatGrams must be a positive number');
  });

  it('rejects missing maxFatGrams', () => {
    expect(() =>
      parseClinicalConfig({
        ...CLINICAL_CONFIG,
        maxFatGrams: undefined
      })
    ).toThrow('maxFatGrams must be a positive number');
  });
});

// ============================================================
// runFormula
// ============================================================

describe('runFormula', () => {
  it('throws when the configured result is never produced', () => {
    const formula = {
      result: 'capsulesNeeded',
      steps: [{ op: 'multiply', left: 'fatGrams', right: 'lipaseUnitsPerGram', out: 'totalLipase' }]
    } as FormulaDefinition;

    expect(() =>
      runFormula(formula, {
        fatGrams: 10,
        lipaseUnitsPerGram: 1000
      })
    ).toThrow('Formula did not resolve capsulesNeeded');
  });

  it('throws when a step references a missing input', () => {
    const formula = {
      result: 'capsulesNeeded',
      steps: [{ op: 'round', input: 'capsulesRaw', out: 'capsulesNeeded' }]
    } as FormulaDefinition;

    expect(() => runFormula(formula, {})).toThrow('Formula input capsulesRaw is not available');
  });
});
