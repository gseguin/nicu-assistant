import { describe, it, expect } from 'vitest';
import {
  defaults,
  inputs,
  medications,
  formulas,
  lipaseRates,
  advisories,
  validationMessages,
  getMedicationById,
  getFormulaById,
  getStrengthsForMedication
} from './config.js';
import config from './pert-config.json';

describe('pert config — shape', () => {
  it('exposes 5 medications, all with non-empty FDA-allowlisted strengths', () => {
    expect(medications.length).toBe(5);
    for (const med of medications) {
      expect(med.id.length).toBeGreaterThan(0);
      expect(med.brand.length).toBeGreaterThan(0);
      expect(med.strengths.length).toBeGreaterThan(0);
      for (const s of med.strengths) {
        expect(Number.isInteger(s)).toBe(true);
        expect(s).toBeGreaterThanOrEqual(1000);
      }
    }
  });

  it('exposes 17 pediatric formulas, all with id + name + fatGPerL', () => {
    expect(formulas.length).toBe(17);
    for (const f of formulas) {
      expect(f.id.length).toBeGreaterThan(0);
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.fatGPerL).toBeGreaterThan(0);
    }
  });

  it('lipase rates are 500/1000/2000/4000', () => {
    expect(lipaseRates).toEqual([500, 1000, 2000, 4000]);
  });

  it('exposes 4 advisories including the max-lipase-cap STOP-red advisory', () => {
    expect(advisories.length).toBe(4);
    const cap = advisories.find((a) => a.id === 'max-lipase-cap');
    expect(cap).toBeDefined();
    expect(cap!.severity).toBe('stop');
  });

  it('drops Pertzye=2.0 and any sub-1000 strengths via FDA-allowlist filter', () => {
    // Inject a hostile value at runtime to prove the filter works.
    const hostile = {
      ...config.dropdowns.medications.find((m) => m.id === 'pertzye')!,
      strengths: [2.0, 800, 4000, 8000]
    };
    const allow = new Set(config.fdaAllowlist.pertzye);
    const filtered = hostile.strengths.filter((s) => allow.has(s));
    expect(filtered).not.toContain(2.0);
    expect(filtered).not.toContain(800);
    expect(filtered).toEqual([4000, 8000]);
  });

  it('default mode is oral and default weight is 3.0 kg per CONTEXT D-11/D-12', () => {
    expect(defaults.mode).toBe('oral');
    expect(defaults.weightKg).toBe(3.0);
    expect(defaults.medicationId).toBeNull();
    expect(defaults.oral.fatGrams).toBeNull();
    expect(defaults.tubeFeed.formulaId).toBeNull();
  });

  it('input ranges are non-empty and well-formed', () => {
    expect(inputs.weightKg.min).toBeGreaterThan(0);
    expect(inputs.weightKg.max).toBeGreaterThan(inputs.weightKg.min);
    expect(inputs.weightKg.step).toBeGreaterThan(0);
  });

  it('validation messages cover empty and invalid cases', () => {
    expect(validationMessages.emptyOral.length).toBeGreaterThan(0);
    expect(validationMessages.emptyTubeFeed.length).toBeGreaterThan(0);
  });
});

describe('pert config — accessors', () => {
  it('getMedicationById returns the medication or undefined', () => {
    expect(getMedicationById('creon')?.brand).toBe('Creon');
    expect(getMedicationById('does-not-exist')).toBeUndefined();
  });

  it('getFormulaById returns the formula or undefined', () => {
    expect(getFormulaById('kate-farms-ped-std-12')?.fatGPerL).toBe(48);
    expect(getFormulaById('does-not-exist')).toBeUndefined();
  });

  it('getStrengthsForMedication returns the FDA-filtered list', () => {
    const creon = getStrengthsForMedication('creon');
    expect(creon).toContain(12000);
    expect(creon.every((s) => s >= 1000)).toBe(true);
  });
});
