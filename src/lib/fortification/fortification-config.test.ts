import { describe, it, expect } from 'vitest';
import { getFortificationFormulas, getFormulaById } from './fortification-config.js';

const REQUIRED_KEYS = [
  'id',
  'name',
  'manufacturer',
  'displacement_factor',
  'calorie_concentration',
  'grams_per_scoop'
] as const;

describe('fortification-config loader', () => {
  const formulas = getFortificationFormulas();

  it('contains exactly 33 formulas (30 from xlsx Calculator A3:D35 + 3 Kendamil HCP)', () => {
    // 30 entries transcribe recipe-calculator.xlsx Calculator tab A3:D35.
    // 3 Kendamil entries (Organic, Classic, Goat) extend beyond xlsx —
    // sourced from hcp.kendamil.com per Phase 44 PLAN.md audit trail.
    expect(formulas).toHaveLength(33);
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

describe('Kendamil grouping (KEND-04 / KEND-TEST-02)', () => {
  it('exposes exactly 3 Kendamil entries', () => {
    const kendamils = getFortificationFormulas().filter((f) => f.manufacturer === 'Kendamil');
    expect(kendamils).toHaveLength(3);
  });

  it('Kendamil entries appear in alphabetical order by name (Classic, Goat, Organic) after the picker sort', () => {
    const names = getFortificationFormulas()
      .filter((f) => f.manufacturer === 'Kendamil')
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => f.name);
    expect(names).toEqual(['Kendamil Classic', 'Kendamil Goat', 'Kendamil Organic']);
  });

  it('each Kendamil variant resolvable by id (KEND-01/02/03)', () => {
    expect(getFormulaById('kendamil-organic')?.name).toBe('Kendamil Organic');
    expect(getFormulaById('kendamil-classic')?.name).toBe('Kendamil Classic');
    expect(getFormulaById('kendamil-goat')?.name).toBe('Kendamil Goat');
  });

  it('no Kendamil variant supports packets — default-false via omitted field (KEND-05)', () => {
    for (const f of getFortificationFormulas().filter((x) => x.manufacturer === 'Kendamil')) {
      expect(f.packetsSupported).toBeUndefined();
    }
  });

  it('Kendamil group sorts between Abbott and Mead Johnson (alphabetical localeCompare)', () => {
    const manufacturers = Array.from(
      new Set(
        getFortificationFormulas()
          .slice()
          .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer))
          .map((f) => f.manufacturer)
      )
    );
    const idxAbbott = manufacturers.indexOf('Abbott');
    const idxKendamil = manufacturers.indexOf('Kendamil');
    const idxMeadJohnson = manufacturers.indexOf('Mead Johnson');
    expect(idxAbbott).toBeGreaterThanOrEqual(0);
    expect(idxKendamil).toBe(idxAbbott + 1);
    expect(idxMeadJohnson).toBe(idxKendamil + 1);
  });
});
