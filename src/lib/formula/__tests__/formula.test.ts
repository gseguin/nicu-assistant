// src/lib/formula/__tests__/formula.test.ts
// Comprehensive unit tests for infant formula recipe calculation pure functions.
// Ported from formula-calculator with adaptations for nicu-assistant import paths.
//
// Golden reference values are derived from the formula implemented in formula.ts,
// which was verified against Recipe Calculator.xlsx.ods "Modified Recipes" sheet.

import { describe, it, expect } from 'vitest';
import {
  calculateRecipe,
  calculateBMF,
  validateRecipeInputs,
  validateBMFInputs,
  calculateScoops,
  calculatePackets,
  parsePacketSize,
  formatOutput
} from '$lib/formula/formula';
import {
  FORMULA_CONFIG,
  BRANDS,
  getBrandById,
  getBrandByName,
  getBrandsByManufacturer,
  isPacketBrand,
  hasCalorieData,
  type BrandConfig
} from '$lib/formula/formula-config';

// ============================================================
// Golden Reference Values
// ============================================================

interface GoldenRef {
  brand: string;
  desired_kcal_oz: number;
  total_mL: number;
  expected_mL_water: number;
  expected_g_powder: number;
}

const GOLDEN_REFERENCES: GoldenRef[] = [
  // --- Abbott: Elecare Jr (disp=0.74, kcal/g=4.69) ---
  { brand: 'Elecare Jr', desired_kcal_oz: 28, total_mL: 237, expected_mL_water: 202, expected_g_powder: 47.9 },
  { brand: 'Elecare Jr', desired_kcal_oz: 20, total_mL: 100, expected_mL_water: 89,  expected_g_powder: 14.4 },
  { brand: 'Elecare Jr', desired_kcal_oz: 24, total_mL: 150, expected_mL_water: 131, expected_g_powder: 26.0 },
  { brand: 'Elecare Jr', desired_kcal_oz: 30, total_mL: 200, expected_mL_water: 168, expected_g_powder: 43.3 },

  // --- Abbott: Similac Advance (disp=0.76, kcal/g=5.1) ---
  { brand: 'Similac Advance', desired_kcal_oz: 20, total_mL: 100,  expected_mL_water: 90,  expected_g_powder: 13.3 },
  { brand: 'Similac Advance', desired_kcal_oz: 24, total_mL: 200,  expected_mL_water: 176, expected_g_powder: 31.8 },
  { brand: 'Similac Advance', desired_kcal_oz: 27, total_mL: 150,  expected_mL_water: 130, expected_g_powder: 26.9 },

  // --- Nutricia: Neocate Jr (disp=0.72, kcal/g=4.78) ---
  { brand: 'Neocate Jr', desired_kcal_oz: 20, total_mL: 100,  expected_mL_water: 90,  expected_g_powder: 14.1 },
  { brand: 'Neocate Jr', desired_kcal_oz: 24, total_mL: 237,  expected_mL_water: 208, expected_g_powder: 40.2 },
  { brand: 'Neocate Jr', desired_kcal_oz: 30, total_mL: 150,  expected_mL_water: 127, expected_g_powder: 31.8 },

  // --- Nutricia: Monogen (disp=0.83, kcal/g=4.4) ---
  { brand: 'Monogen', desired_kcal_oz: 20, total_mL: 100, expected_mL_water: 87,  expected_g_powder: 15.4 },
  { brand: 'Monogen', desired_kcal_oz: 24, total_mL: 180, expected_mL_water: 152, expected_g_powder: 33.2 },

  // --- Mead Johnson: Enfamil Enfacare (disp=0.76, kcal/g=4.9) ---
  { brand: 'Enfamil Enfacare', desired_kcal_oz: 20, total_mL: 100, expected_mL_water: 90,  expected_g_powder: 13.8 },
  { brand: 'Enfamil Enfacare', desired_kcal_oz: 22, total_mL: 180, expected_mL_water: 159, expected_g_powder: 27.3 },
  { brand: 'Enfamil Enfacare', desired_kcal_oz: 27, total_mL: 240, expected_mL_water: 206, expected_g_powder: 44.7 },

  // --- Mead Johnson: Portagen (disp=0.64, kcal/g=4.7) ---
  { brand: 'Portagen', desired_kcal_oz: 20, total_mL: 100, expected_mL_water: 91,  expected_g_powder: 14.4 },
  { brand: 'Portagen', desired_kcal_oz: 24, total_mL: 200, expected_mL_water: 178, expected_g_powder: 34.5 },

  // --- Nestlé: Renastart (disp=0.74, kcal/g=4.77) ---
  { brand: 'Renastart', desired_kcal_oz: 20, total_mL: 100, expected_mL_water: 89,  expected_g_powder: 14.2 },
  { brand: 'Renastart', desired_kcal_oz: 24, total_mL: 150, expected_mL_water: 131, expected_g_powder: 25.5 },

  // --- Nestlé: Tolerex — packet brand (disp=0.56, kcal/g=3.75, 1 pkt = 80 g) ---
  { brand: 'Tolerex', desired_kcal_oz: 20, total_mL: 100, expected_mL_water: 90,  expected_g_powder: 18.0 },
  { brand: 'Tolerex', desired_kcal_oz: 24, total_mL: 200, expected_mL_water: 176, expected_g_powder: 43.3 },

  // --- Nestlé: Vivonex Pediatric — packet brand (disp=0.62, kcal/g=4.15, 1 pkt = 48.5 g) ---
  { brand: 'Vivonex Pediatric', desired_kcal_oz: 20, total_mL: 100, expected_mL_water: 90,  expected_g_powder: 16.3 },
  { brand: 'Vivonex Pediatric', desired_kcal_oz: 24, total_mL: 150, expected_mL_water: 132, expected_g_powder: 29.3 },
];

// ============================================================
// calculateRecipe
// ============================================================

describe('calculateRecipe', () => {
  it('calculates correct g_powder for all golden reference values', () => {
    for (const ref of GOLDEN_REFERENCES) {
      const brand = FORMULA_CONFIG.brands.find((b) => b.brand === ref.brand);
      expect(brand, `Brand "${ref.brand}" not found in FORMULA_CONFIG`).toBeDefined();
      const result = calculateRecipe(brand!, ref.desired_kcal_oz, ref.total_mL);
      expect(result.g_powder, `g_powder mismatch for ${ref.brand} at ${ref.desired_kcal_oz} kcal/oz, ${ref.total_mL} mL`).toBeCloseTo(ref.expected_g_powder, 1);
    }
  });

  it('calculates correct mL_water for all golden reference values', () => {
    for (const ref of GOLDEN_REFERENCES) {
      const brand = FORMULA_CONFIG.brands.find((b) => b.brand === ref.brand);
      expect(brand, `Brand "${ref.brand}" not found in FORMULA_CONFIG`).toBeDefined();
      const result = calculateRecipe(brand!, ref.desired_kcal_oz, ref.total_mL);
      expect(Math.abs(result.mL_water - ref.expected_mL_water)).toBeLessThanOrEqual(1);
    }
  });

  it('handles edge case: very high calorie concentration (40 kcal/oz)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!;
    const result = calculateRecipe(brand, 40, 100);
    expect(isFinite(result.g_powder)).toBe(true);
    expect(isFinite(result.mL_water)).toBe(true);
    expect(result.g_powder).toBeCloseTo(28.8, 1);
    expect(result.mL_water).toBe(79);
  });

  it('handles edge case: minimum volume (30 mL)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!;
    const result = calculateRecipe(brand, 20, 30);
    expect(result.g_powder).toBeCloseTo(4.3, 1);
    expect(result.mL_water).toBe(27);
  });

  it('handles edge case: maximum volume (300 mL)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!;
    const result = calculateRecipe(brand, 20, 300);
    expect(result.g_powder).toBeCloseTo(43.3, 1);
    expect(result.mL_water).toBe(268);
  });

  it('handles edge case: displacement = 0 (pure water-based formula)', () => {
    const mockBrand = {
      ...FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!,
      displacementMlPerG: 0,
    };
    const result = calculateRecipe(mockBrand, 20, 100);
    expect(isFinite(result.g_powder)).toBe(true);
    expect(isFinite(result.mL_water)).toBe(true);
    expect(result.g_powder).toBeCloseTo(14.4, 1);
    expect(result.mL_water).toBe(100);
  });

  it('returns non-null scoops for powder brands with gPerScoop', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.gPerScoop !== null && b.packetLabel === null)!;
    expect(brand).toBeDefined();
    const result = calculateRecipe(brand, 20, 100);
    expect(result.scoops).not.toBeNull();
    expect(typeof result.scoops).toBe('number');
    expect(isFinite(result.scoops!)).toBe(true);
  });

  it('returns null scoops and non-null packets for packet-based brands', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.packetLabel !== null)!;
    expect(brand).toBeDefined();
    const result = calculateRecipe(brand, 20, 100);
    expect(result.scoops).toBeNull();
    expect(result.packets).not.toBeNull();
    expect(typeof result.packets).toBe('number');
    expect(isFinite(result.packets!)).toBe(true);
  });

  it('returns null scoops and null packets for weight-only brands (Ketocal)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.gPerScoop === null && b.packetLabel === null)!;
    expect(brand).toBeDefined();
    const result = calculateRecipe(brand, 20, 100);
    expect(result.scoops).toBeNull();
    expect(result.packets).toBeNull();
  });

  it('calculates correct scoops for Elecare Jr at 20 kcal/oz, 100 mL', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!;
    const result = calculateRecipe(brand, 20, 100);
    expect(result.scoops).toBeCloseTo(1.5, 1);
  });

  it('calculates correct packets for Tolerex at 20 kcal/oz, 100 mL', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Tolerex')!;
    const result = calculateRecipe(brand, 20, 100);
    expect(result.packets).toBeCloseTo(0.2, 1);
  });

  it('throws when kcal/oz is 0', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!;
    expect(() => calculateRecipe(brand, 0, 100)).toThrow();
  });

  it('throws when total_mL is 0', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!;
    expect(() => calculateRecipe(brand, 20, 0)).toThrow();
  });

  it('throws when brand kcalPerG is null (Alfamino)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Alfamino')!;
    expect(brand).toBeDefined();
    expect(() => calculateRecipe(brand, 20, 100)).toThrow();
  });
});

// ============================================================
// calculateBMF
// ============================================================

describe('calculateBMF', () => {
  it('calculates correct g_powder for BMF (Elecare Jr)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!;
    const result = calculateBMF(brand, 24, 100, 20);
    expect(result.g_powder).toBeCloseTo(3.2, 1);
    expect(result.mL_ebm).toBe(98);
  });

  it('calculates correct g_powder for BMF (Similac Advance)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Similac Advance')!;
    const result = calculateBMF(brand, 27, 150, 20);
    expect(result.g_powder).toBeCloseTo(7.7, 1);
    expect(result.mL_ebm).toBe(144);
  });

  it('calculates correct g_powder for BMF (Neocate Jr)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Neocate Jr')!;
    const result = calculateBMF(brand, 30, 200, 20);
    expect(result.g_powder).toBeCloseTo(15.8, 1);
    expect(result.mL_ebm).toBe(189);
  });

  it('throws if target kcal <= baseline kcal', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!;
    expect(() => calculateBMF(brand, 20, 100, 20)).toThrow();
    expect(() => calculateBMF(brand, 18, 100, 20)).toThrow();
  });

  it('throws when brand kcalPerG is null', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Alfamino')!;
    expect(() => calculateBMF(brand, 24, 100, 20)).toThrow();
  });
});

// ============================================================
// validateBMFInputs
// ============================================================

describe('validateBMFInputs', () => {
  it('accepts valid BMF inputs', () => {
    const result = validateBMFInputs(24, 100, 20);
    expect(result.valid).toBe(true);
  });

  it('rejects target kcal <= baseline kcal', () => {
    const result = validateBMFInputs(20, 100, 20);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/greater than baseline/i);
  });

  it('rejects baseline kcal <= 0', () => {
    const result = validateBMFInputs(24, 100, 0);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/greater than 0/i);
  });
});

// ============================================================
// validateRecipeInputs
// ============================================================

describe('validateRecipeInputs', () => {
  it('accepts valid inputs (kcal/oz > 0, mL > 0)', () => {
    const result = validateRecipeInputs(20, 200);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts typical clinical inputs (22 kcal/oz, 240 mL)', () => {
    const result = validateRecipeInputs(22, 240);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts high calorie concentration (40 kcal/oz)', () => {
    const result = validateRecipeInputs(40, 100);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects kcal/oz = 0', () => {
    const result = validateRecipeInputs(0, 200);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/greater than 0/i);
  });

  it('rejects negative kcal/oz', () => {
    const result = validateRecipeInputs(-5, 200);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects total_mL = 0', () => {
    const result = validateRecipeInputs(20, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/greater than 0/i);
  });

  it('rejects negative total_mL', () => {
    const result = validateRecipeInputs(20, -100);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects NaN inputs', () => {
    expect(validateRecipeInputs(NaN, 200).valid).toBe(false);
    expect(validateRecipeInputs(20, NaN).valid).toBe(false);
  });

  it('rejects Infinity inputs', () => {
    expect(validateRecipeInputs(Infinity, 200).valid).toBe(false);
    expect(validateRecipeInputs(20, Infinity).valid).toBe(false);
  });

  it('accumulates multiple errors when both inputs are invalid', () => {
    const result = validateRecipeInputs(-5, -10);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// calculateScoops
// ============================================================

describe('calculateScoops', () => {
  it('returns null for packet-based brands (no gPerScoop)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.packetLabel !== null)!;
    expect(brand).toBeDefined();
    const result = calculateScoops(20.0, brand);
    expect(result).toBeNull();
  });

  it('returns null for weight-only brands (Ketocal: no gPerScoop, no packetLabel)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.gPerScoop === null && b.packetLabel === null)!;
    expect(brand).toBeDefined();
    const result = calculateScoops(20.0, brand);
    expect(result).toBeNull();
  });

  it('calculates correct scoop count for Elecare Jr (gPerScoop = 9.5)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!;
    expect(calculateScoops(14.4, brand)).toBeCloseTo(1.5, 1);
  });

  it('calculates correct scoop count for Neocate Jr (gPerScoop = 7.3)', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Neocate Jr')!;
    expect(calculateScoops(14.1, brand)).toBeCloseTo(1.9, 1);
  });

  it('calculates scoop count to 1 decimal place precision', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.brand === 'Elecare Jr')!;
    const result = calculateScoops(9.5, brand);
    expect(result).toBe(1.0);
  });

  it('result is a finite positive number for valid inputs', () => {
    const brand = FORMULA_CONFIG.brands.find((b) => b.gPerScoop !== null && b.packetLabel === null)!;
    const result = calculateScoops(20.0, brand);
    expect(result).not.toBeNull();
    expect(isFinite(result!)).toBe(true);
    expect(result!).toBeGreaterThan(0);
  });
});

// ============================================================
// calculatePackets
// ============================================================

describe('calculatePackets', () => {
  it('calculates correct packet count for Tolerex at 18 g powder', () => {
    const result = calculatePackets(18, '1 pkt = 80 g');
    expect(result).toBeCloseTo(0.2, 1);
  });

  it('calculates correct packet count for Vivonex Pediatric at 16.3 g powder', () => {
    const result = calculatePackets(16.3, '1 pkt = 48.5 g');
    expect(result).toBeCloseTo(0.3, 1);
  });

  it('calculates correct packet count for Vivonex Plus at 29.3 g powder', () => {
    const result = calculatePackets(29.3, '1 pkt = 79.5 g');
    expect(result).toBeCloseTo(0.4, 1);
  });

  it('returns null for unparseable packet label', () => {
    expect(calculatePackets(20.0, 'unknown label')).toBeNull();
  });

  it('returns null for empty label string', () => {
    expect(calculatePackets(20.0, '')).toBeNull();
  });
});

// ============================================================
// parsePacketSize
// ============================================================

describe('parsePacketSize', () => {
  it('parses "1 pkt = 80 g" → 80', () => {
    expect(parsePacketSize('1 pkt = 80 g')).toBe(80);
  });

  it('parses "1 pkt = 48.5 g" → 48.5', () => {
    expect(parsePacketSize('1 pkt = 48.5 g')).toBe(48.5);
  });

  it('parses "1 pkt = 79.5 g" → 79.5', () => {
    expect(parsePacketSize('1 pkt = 79.5 g')).toBe(79.5);
  });

  it('returns null for invalid label format', () => {
    expect(parsePacketSize('unknown')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parsePacketSize('')).toBeNull();
  });
});

// ============================================================
// formatOutput
// ============================================================

describe('formatOutput', () => {
  it('formats a number with a unit', () => {
    expect(formatOutput(150, 'mL')).toBe('150 mL');
  });

  it('formats decimal values', () => {
    expect(formatOutput(9.5, 'g')).toBe('9.5 g');
  });

  it('returns empty string for null value', () => {
    expect(formatOutput(null, 'scoops')).toBe('');
  });

  it('formats zero correctly', () => {
    expect(formatOutput(0, 'mL')).toBe('0 mL');
  });
});

// ============================================================
// formula-config convenience functions
// ============================================================

describe('formula-config convenience functions', () => {
  it('getBrandById finds Similac Advance by id', () => {
    const brand = getBrandById('abbott-similac-advance');
    expect(brand).toBeDefined();
    expect(brand!.brand).toBe('Similac Advance');
  });

  it('getBrandById returns undefined for unknown id', () => {
    expect(getBrandById('nonexistent')).toBeUndefined();
  });

  it('getBrandByName finds Neocate Jr by name', () => {
    const brand = getBrandByName('Neocate Jr');
    expect(brand).toBeDefined();
    expect(brand!.manufacturer).toBe('Nutricia');
  });

  it('getBrandByName returns undefined for unknown name', () => {
    expect(getBrandByName('Nonexistent Brand')).toBeUndefined();
  });

  it('getBrandsByManufacturer returns brands for Abbott', () => {
    const abbottBrands = getBrandsByManufacturer('Abbott');
    expect(abbottBrands.length).toBeGreaterThan(0);
    for (const b of abbottBrands) {
      expect(b.manufacturer).toBe('Abbott');
    }
  });

  it('getBrandsByManufacturer returns empty for unknown manufacturer', () => {
    expect(getBrandsByManufacturer('Unknown')).toHaveLength(0);
  });

  it('isPacketBrand returns true for Tolerex', () => {
    const tolerex = getBrandByName('Tolerex')!;
    expect(isPacketBrand(tolerex)).toBe(true);
  });

  it('isPacketBrand returns false for Elecare Jr', () => {
    const elecare = getBrandByName('Elecare Jr')!;
    expect(isPacketBrand(elecare)).toBe(false);
  });

  it('hasCalorieData returns true for Elecare Jr', () => {
    const elecare = getBrandByName('Elecare Jr')!;
    expect(hasCalorieData(elecare)).toBe(true);
  });

  it('hasCalorieData returns false for Alfamino', () => {
    const alfamino = getBrandByName('Alfamino')!;
    expect(hasCalorieData(alfamino)).toBe(false);
  });
});

// ============================================================
// formula data integrity
// ============================================================

describe('formula data integrity', () => {
  it('has at least 25 brands in FORMULA_CONFIG', () => {
    expect(FORMULA_CONFIG.brands.length).toBeGreaterThanOrEqual(25);
  });

  it('BRANDS export matches FORMULA_CONFIG.brands', () => {
    expect(BRANDS).toBe(FORMULA_CONFIG.brands);
  });

  it('all brands have valid displacement (>= 0)', () => {
    for (const brand of FORMULA_CONFIG.brands) {
      expect(
        brand.displacementMlPerG,
        `${brand.brand}: displacementMlPerG should be >= 0`
      ).toBeGreaterThanOrEqual(0);
      expect(isFinite(brand.displacementMlPerG), `${brand.brand}: displacementMlPerG should be finite`).toBe(true);
    }
  });

  it('all brands with kcalPerG have valid calorie density (> 0)', () => {
    for (const brand of FORMULA_CONFIG.brands) {
      if (brand.kcalPerG !== null) {
        expect(
          brand.kcalPerG,
          `${brand.brand}: kcalPerG should be > 0`
        ).toBeGreaterThan(0);
        expect(isFinite(brand.kcalPerG), `${brand.brand}: kcalPerG should be finite`).toBe(true);
      }
    }
  });

  it('all brands have gPerScoop OR packetLabel (or are weight-only Ketocal)', () => {
    const WEIGHT_ONLY_BRANDS = new Set(['Ketocal 3:1', 'Ketocal 4:1']);
    for (const brand of FORMULA_CONFIG.brands) {
      if (WEIGHT_ONLY_BRANDS.has(brand.brand)) {
        continue;
      }
      const hasScoop = brand.gPerScoop !== null && brand.gPerScoop > 0;
      const hasPacket = brand.packetLabel !== null;
      expect(
        hasScoop || hasPacket,
        `${brand.brand}: must have gPerScoop OR packetLabel for dispensing`
      ).toBe(true);
    }
  });

  it('all packet brands have valid packetLabel format ("1 pkt = X g")', () => {
    const packetBrands = FORMULA_CONFIG.brands.filter((b) => b.packetLabel !== null);
    expect(packetBrands.length).toBeGreaterThan(0);
    for (const brand of packetBrands) {
      expect(
        brand.packetLabel,
        `${brand.brand}: packetLabel should match "1 pkt = X g" format`
      ).toMatch(/1\s+pkt\s*=\s*[\d.]+\s*g/i);
      const size = parsePacketSize(brand.packetLabel!);
      expect(size, `${brand.brand}: packetLabel size should be parseable and > 0`).not.toBeNull();
      expect(size!).toBeGreaterThan(0);
    }
  });

  it('all 4 required manufacturers are represented', () => {
    const manufacturers = new Set(FORMULA_CONFIG.brands.map((b) => b.manufacturer));
    expect(manufacturers.has('Abbott'), 'Abbott not found in brands').toBe(true);
    expect(manufacturers.has('Nutricia'), 'Nutricia not found in brands').toBe(true);
    expect(manufacturers.has('Mead Johnson'), 'Mead Johnson not found in brands').toBe(true);
    expect(manufacturers.has('Nestlé'), 'Nestlé not found in brands').toBe(true);
  });

  it('all brand IDs are unique', () => {
    const ids = FORMULA_CONFIG.brands.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all brand IDs are kebab-case', () => {
    const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const brand of FORMULA_CONFIG.brands) {
      expect(
        KEBAB_CASE.test(brand.id),
        `${brand.brand}: id "${brand.id}" must be kebab-case`
      ).toBe(true);
    }
  });

  it('all brand names are non-empty strings', () => {
    for (const brand of FORMULA_CONFIG.brands) {
      expect(typeof brand.brand).toBe('string');
      expect(brand.brand.length, `brand at id "${brand.id}" has empty name`).toBeGreaterThan(0);
    }
  });

  it('all gPerScoop values (when non-null) are > 0', () => {
    for (const brand of FORMULA_CONFIG.brands) {
      if (brand.gPerScoop !== null) {
        expect(
          brand.gPerScoop,
          `${brand.brand}: gPerScoop should be > 0`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('disclaimer is present with headline and body', () => {
    expect(FORMULA_CONFIG.disclaimer).toBeDefined();
    expect(typeof FORMULA_CONFIG.disclaimer.headline).toBe('string');
    expect(FORMULA_CONFIG.disclaimer.headline.length).toBeGreaterThan(0);
    expect(typeof FORMULA_CONFIG.disclaimer.body).toBe('string');
    expect(FORMULA_CONFIG.disclaimer.body.length).toBeGreaterThan(0);
  });

  it('validationMessages is present with all required keys', () => {
    const vm = FORMULA_CONFIG.validationMessages;
    expect(vm).toBeDefined();
    expect(typeof vm.invalidDisplacement).toBe('string');
    expect(typeof vm.invalidCalories).toBe('string');
    expect(typeof vm.invalidScoop).toBe('string');
  });

  it('Alfamino has null kcalPerG (known data gap from source spreadsheet)', () => {
    const alfamino = FORMULA_CONFIG.brands.find((b) => b.brand === 'Alfamino');
    expect(alfamino).toBeDefined();
    expect(alfamino!.kcalPerG).toBeNull();
  });

  it('Tolerex, Vivonex Pediatric, Vivonex Plus are all packet-based brands', () => {
    const packetBrandNames = ['Tolerex', 'Vivonex Pediatric', 'Vivonex Plus'];
    for (const name of packetBrandNames) {
      const brand = FORMULA_CONFIG.brands.find((b) => b.brand === name);
      expect(brand, `${name} not found in FORMULA_CONFIG`).toBeDefined();
      expect(brand!.packetLabel, `${name} should have a packetLabel`).not.toBeNull();
      expect(brand!.gPerScoop, `${name} should not have gPerScoop`).toBeNull();
    }
  });

  it('Ketocal 3:1 and Ketocal 4:1 are weight-only brands (no scoop or packet)', () => {
    const weightOnlyBrands = ['Ketocal 3:1', 'Ketocal 4:1'];
    for (const name of weightOnlyBrands) {
      const brand = FORMULA_CONFIG.brands.find((b) => b.brand === name);
      expect(brand, `${name} not found in FORMULA_CONFIG`).toBeDefined();
      expect(brand!.gPerScoop, `${name} should not have gPerScoop`).toBeNull();
      expect(brand!.packetLabel, `${name} should not have packetLabel`).toBeNull();
    }
  });
});
