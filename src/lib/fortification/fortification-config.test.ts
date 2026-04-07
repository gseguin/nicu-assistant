import { describe, it, expect } from 'vitest';
import { getFortificationFormulas, getFormulaById } from './fortification-config.js';

const REQUIRED_KEYS = [
  'id',
  'name',
  'manufacturer',
  'displacement_factor',
  'calorie_concentration',
  'grams_per_scoop',
] as const;

describe('fortification-config loader', () => {
  const formulas = getFortificationFormulas();

  it('contains exactly 30 formulas (xlsx Calculator A3:D35 row count)', () => {
    expect(formulas).toHaveLength(30);
  });

  it('every entry has all required fields', () => {
    for (const f of formulas) {
      for (const key of REQUIRED_KEYS) {
        expect(f, `formula ${f.name} missing ${key}`).toHaveProperty(key);
      }
      expect(typeof f.id).toBe('string');
      expect(f.id.length).toBeGreaterThan(0);
      expect(typeof f.name).toBe('string');
      expect(f.name.length).toBeGreaterThan(0);
      expect(typeof f.manufacturer).toBe('string');
    }
  });

  it('every displacement_factor is a finite number >= 0', () => {
    for (const f of formulas) {
      expect(Number.isFinite(f.displacement_factor)).toBe(true);
      expect(f.displacement_factor).toBeGreaterThanOrEqual(0);
    }
  });

  it('every calorie_concentration is a finite number > 0', () => {
    for (const f of formulas) {
      expect(Number.isFinite(f.calorie_concentration)).toBe(true);
      expect(f.calorie_concentration).toBeGreaterThan(0);
    }
  });

  it('every grams_per_scoop is a finite number >= 0', () => {
    for (const f of formulas) {
      expect(Number.isFinite(f.grams_per_scoop)).toBe(true);
      expect(f.grams_per_scoop).toBeGreaterThanOrEqual(0);
    }
  });

  it('all ids are unique', () => {
    const ids = formulas.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getFormulaById', () => {
  it('finds Neocate Infant by id', () => {
    const f = getFormulaById('neocate-infant');
    expect(f).toBeDefined();
    expect(f?.name).toBe('Neocate Infant');
    expect(f?.displacement_factor).toBe(0.7);
    expect(f?.calorie_concentration).toBe(4.83);
    expect(f?.grams_per_scoop).toBe(4.6);
  });

  it('finds Similac HMF by id (the only formula that supports Packets)', () => {
    // NOTE: xlsx labels this row "Similac HMF" verbatim, not "Similac Human Milk Fortifier".
    const f = getFormulaById('similac-hmf');
    expect(f).toBeDefined();
    expect(f?.name).toBe('Similac HMF');
  });

  it('returns undefined for unknown id', () => {
    expect(getFormulaById('not-a-real-formula')).toBeUndefined();
  });
});
