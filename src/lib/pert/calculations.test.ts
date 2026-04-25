// Spreadsheet-parity tests for src/lib/pert/calculations.ts.
// Locks xlsx-canonical math behavior against hand-derived fixtures in
// src/lib/pert/pert-parity.fixtures.json (CONTEXT D-06: derivation-locked,
// independent of the calc-layer implementation).
//
// Fixture field mapping note (CONTEXT D-17 + RESEARCH Pitfall 2):
//   fixture row.input.lipasePerGramOfFat  ->  calc.lipasePerKgPerMeal (oral)
//   fixture row.input.lipasePerGramOfFat  ->  calc.lipasePerKgPerDay  (tube)
// The JSON key in the calc-layer signature is the legacy name kept for state-
// schema continuity; semantically it is lipase units per gram of fat.
//
// Em-dash ban: this file is em-dash-free per Q1 broad convention. Use ASCII
// punctuation in all strings and comments.

import { describe, it, expect } from 'vitest';
import {
  computeOralResult,
  computeTubeFeedResult,
  getTriggeredAdvisories,
  dailyLipaseUnits,
  MAX_LIPASE_PER_KG_PER_DAY
} from './calculations.js';
import {
  advisories,
  getMedicationById,
  getFormulaById,
  getStrengthsForMedication
} from './config.js';
import type { PertStateData } from './types.js';
import fixtures from './pert-parity.fixtures.json';

// closeEnough helper inlined verbatim from src/lib/feeds/calculations.test.ts:23-31
// per CONTEXT D-02. EPSILON 1% relative; ABS_FLOOR 0.5 absolute.
const EPSILON = 0.01;
const ABS_FLOOR = 0.5;

function closeEnough(actual: number, expected: number): boolean {
  const absDiff = Math.abs(actual - expected);
  if (absDiff <= ABS_FLOOR) return true;
  if (expected === 0) return absDiff < EPSILON;
  return Math.abs(absDiff / expected) <= EPSILON;
}

// ---------------------------------------------------------------------------
// Block 1: Oral parity (xlsx Pediatric PERT Tool, B10)
// ---------------------------------------------------------------------------

describe('PERT Oral parity (xlsx Pediatric PERT Tool, B10)', () => {
  for (const [rowName, row] of Object.entries(fixtures.oral)) {
    if (rowName.startsWith('_')) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as { _derivation: string; input: any; expected: any };
    it(`${rowName}: ${r._derivation}`, () => {
      const actual = computeOralResult({
        fatGrams: r.input.fatGrams,
        lipasePerKgPerMeal: r.input.lipasePerGramOfFat, // Pitfall 2 mapping
        strengthValue: r.input.strengthValue
      });
      expect(closeEnough(actual.capsulesPerDose, r.expected.capsulesPerDose)).toBe(true);
      expect(closeEnough(actual.totalLipase, r.expected.totalLipase)).toBe(true);
      expect(closeEnough(actual.lipasePerDose, r.expected.lipasePerDose)).toBe(true);
      expect(closeEnough(actual.estimatedDailyTotal, r.expected.estimatedDailyTotal)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Block 2: Tube-Feed parity (xlsx Pediatric Tube Feed PERT, B14 + B15 + B13)
// ---------------------------------------------------------------------------

describe('PERT Tube-Feed parity (xlsx Pediatric Tube Feed PERT, B14 + B15 + B13)', () => {
  for (const [rowName, row] of Object.entries(fixtures.tubeFeed)) {
    if (rowName.startsWith('_')) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as { _derivation: string; input: any; expected: any };
    it(`${rowName}: ${r._derivation}`, () => {
      const formula = getFormulaById(r.input.formulaId);
      expect(formula, `formulaId ${r.input.formulaId} resolved`).toBeDefined();
      const actual = computeTubeFeedResult({
        formulaFatGPerL: formula!.fatGPerL,
        volumePerDayMl: r.input.volumePerDayMl,
        lipasePerKgPerDay: r.input.lipasePerGramOfFat, // Pitfall 2 mapping
        weightKg: r.input.weightKg,
        strengthValue: r.input.strengthValue
      });
      expect(closeEnough(actual.capsulesPerDay, r.expected.capsulesPerDay)).toBe(true);
      expect(closeEnough(actual.totalLipase, r.expected.totalLipase)).toBe(true);
      expect(closeEnough(actual.totalFatG, r.expected.totalFatG)).toBe(true);
      expect(closeEnough(actual.lipasePerKg, r.expected.lipasePerKg)).toBe(true);
      expect(closeEnough(actual.capsulesPerMonth, r.expected.capsulesPerMonth)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Block 3: Defensive zero-return (CONTEXT D-02; calculations.ts lines 79-93 + 121-140)
// ---------------------------------------------------------------------------

describe('PERT defensive zero-return', () => {
  it('Oral: NaN input produces all-zero result', () => {
    const r = computeOralResult({ fatGrams: NaN, lipasePerKgPerMeal: 1000, strengthValue: 12000 });
    expect(r.capsulesPerDose).toBe(0);
    expect(r.totalLipase).toBe(0);
    expect(r.lipasePerDose).toBe(0);
    expect(r.estimatedDailyTotal).toBe(0);
  });

  it('Oral: Infinity input produces all-zero result', () => {
    const r = computeOralResult({
      fatGrams: 25,
      lipasePerKgPerMeal: Number.POSITIVE_INFINITY,
      strengthValue: 12000
    });
    expect(r.capsulesPerDose).toBe(0);
    expect(r.totalLipase).toBe(0);
    expect(Number.isFinite(r.lipasePerDose)).toBe(true);
    expect(r.estimatedDailyTotal).toBe(0);
  });

  it('Oral: <= 0 input produces all-zero result', () => {
    const r = computeOralResult({ fatGrams: -5, lipasePerKgPerMeal: 1000, strengthValue: 12000 });
    expect(r.capsulesPerDose).toBe(0);
    expect(r.totalLipase).toBe(0);
    expect(r.lipasePerDose).toBe(0);
    expect(r.estimatedDailyTotal).toBe(0);
  });

  it('Oral: zero strengthValue produces all-zero result (no Infinity)', () => {
    const r = computeOralResult({ fatGrams: 25, lipasePerKgPerMeal: 1000, strengthValue: 0 });
    expect(Number.isFinite(r.capsulesPerDose)).toBe(true);
    expect(r.capsulesPerDose).toBe(0);
    expect(r.lipasePerDose).toBe(0);
  });

  it('Tube-Feed: NaN volume produces all-zero result', () => {
    const r = computeTubeFeedResult({
      formulaFatGPerL: 48,
      volumePerDayMl: NaN,
      lipasePerKgPerDay: 2500,
      weightKg: 15,
      strengthValue: 37000
    });
    expect(r.capsulesPerDay).toBe(0);
    expect(r.totalLipase).toBe(0);
    expect(r.totalFatG).toBe(0);
    expect(r.lipasePerKg).toBe(0);
    expect(r.capsulesPerMonth).toBe(0);
  });

  it('Tube-Feed: Infinity formulaFatGPerL produces all-zero result', () => {
    const r = computeTubeFeedResult({
      formulaFatGPerL: Number.POSITIVE_INFINITY,
      volumePerDayMl: 1500,
      lipasePerKgPerDay: 2500,
      weightKg: 15,
      strengthValue: 37000
    });
    expect(r.capsulesPerDay).toBe(0);
    expect(Number.isFinite(r.lipasePerKg)).toBe(true);
    expect(r.lipasePerKg).toBe(0);
  });

  it('Tube-Feed: <= 0 weight produces all-zero result (no Infinity in lipasePerKg)', () => {
    const r = computeTubeFeedResult({
      formulaFatGPerL: 48,
      volumePerDayMl: 1500,
      lipasePerKgPerDay: 2500,
      weightKg: 0,
      strengthValue: 37000
    });
    expect(Number.isFinite(r.lipasePerKg)).toBe(true);
    expect(r.lipasePerKg).toBe(0);
    expect(r.capsulesPerDay).toBe(0);
    expect(r.capsulesPerMonth).toBe(0);
  });

  it('Tube-Feed: zero strengthValue produces all-zero result', () => {
    const r = computeTubeFeedResult({
      formulaFatGPerL: 48,
      volumePerDayMl: 1500,
      lipasePerKgPerDay: 2500,
      weightKg: 15,
      strengthValue: 0
    });
    expect(r.capsulesPerDay).toBe(0);
    expect(r.capsulesPerMonth).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Block 4: Advisory engine (CONTEXT D-08 STOP-red trigger; PERT-SAFE-01; D-10 severity-DESC)
// ---------------------------------------------------------------------------

describe('PERT advisory engine - getTriggeredAdvisories', () => {
  function makeState(over: Partial<PertStateData> = {}): PertStateData {
    const base: PertStateData = {
      mode: 'oral',
      weightKg: 10,
      medicationId: 'creon',
      strengthValue: 12000,
      oral: { fatGrams: 25, lipasePerKgPerMeal: 1000 },
      tubeFeed: { formulaId: null, volumePerDayMl: null, lipasePerKgPerDay: 1000 }
    };
    return {
      ...base,
      ...over,
      oral: { ...base.oral, ...(over.oral ?? {}) },
      tubeFeed: { ...base.tubeFeed, ...(over.tubeFeed ?? {}) }
    };
  }

  it('empty-state input gate: result === null returns []', () => {
    const triggered = getTriggeredAdvisories('oral', makeState(), null, advisories);
    expect(triggered).toEqual([]);
  });

  it('max-lipase-cap fires for the dedicated stopRedTrigger fixture row (oral)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trig = fixtures.stopRedTrigger as { input: any; expected: any };
    const state = makeState({
      mode: 'oral',
      weightKg: trig.input.weightKg,
      medicationId: trig.input.medicationId,
      strengthValue: trig.input.strengthValue,
      oral: { fatGrams: trig.input.fatGrams, lipasePerKgPerMeal: trig.input.lipasePerGramOfFat }
    });
    const result = computeOralResult({
      fatGrams: trig.input.fatGrams,
      lipasePerKgPerMeal: trig.input.lipasePerGramOfFat,
      strengthValue: trig.input.strengthValue
    });
    const triggered = getTriggeredAdvisories('oral', state, result, advisories);
    const cap = triggered.find((a) => a.id === 'max-lipase-cap');
    expect(cap).toBeDefined();
    expect(cap!.severity).toBe('stop');
  });

  it('max-lipase-cap does NOT fire when dailyLipase <= weightKg * MAX_LIPASE_PER_KG_PER_DAY', () => {
    // Oral: weight 10kg, fat 10g, lipasePerG 1000, Zenpep 10000.
    // totalLipase = 10*1000 = 10000; capsulesPerDose = ROUND(1.0) = 1;
    // dailyLipase = 1*10000*3 = 30000; cap = 10*10000 = 100000; well under.
    const state = makeState({
      mode: 'oral',
      weightKg: 10,
      medicationId: 'zenpep',
      strengthValue: 10000,
      oral: { fatGrams: 10, lipasePerKgPerMeal: 1000 }
    });
    const result = computeOralResult({ fatGrams: 10, lipasePerKgPerMeal: 1000, strengthValue: 10000 });
    const triggered = getTriggeredAdvisories('oral', state, result, advisories);
    expect(triggered.find((a) => a.id === 'max-lipase-cap')).toBeUndefined();
  });

  it('weight-out-of-range warning fires when weightKg > 50 (config range max)', () => {
    const state = makeState({ weightKg: 60 });
    const result = computeOralResult({ fatGrams: 25, lipasePerKgPerMeal: 1000, strengthValue: 12000 });
    const triggered = getTriggeredAdvisories('oral', state, result, advisories);
    const wRange = triggered.find((a) => a.id === 'weight-out-of-range');
    expect(wRange).toBeDefined();
    expect(wRange!.severity).toBe('warning');
  });

  it('weight-out-of-range warning fires when weightKg < 0.5 (config range min)', () => {
    const state = makeState({ weightKg: 0.4 });
    const result = computeOralResult({ fatGrams: 25, lipasePerKgPerMeal: 1000, strengthValue: 12000 });
    const triggered = getTriggeredAdvisories('oral', state, result, advisories);
    const wRange = triggered.find((a) => a.id === 'weight-out-of-range');
    expect(wRange).toBeDefined();
    expect(wRange!.severity).toBe('warning');
  });

  it('severity-DESC ordering: stop entries appear before warning entries (CONTEXT D-10)', () => {
    // Trigger BOTH the cap (over-cap inputs) AND weight-out-of-range (weight=60).
    // weight=60, fat=200, lipG=4000, Creon 6000:
    //   totalLipase = 200*4000 = 800000; capsulesPerDose = ROUND(133.33) = 133;
    //   dailyLipase = 133*6000*3 = 2,394,000; cap = 60*10000 = 600000; FIRES (stop).
    //   weight=60 > 50 -> weight-out-of-range fires (warning).
    //   fat=200 > 100 -> fat-out-of-range fires (warning).
    const state = makeState({
      mode: 'oral',
      weightKg: 60,
      medicationId: 'creon',
      strengthValue: 6000,
      oral: { fatGrams: 200, lipasePerKgPerMeal: 4000 }
    });
    const result = computeOralResult({ fatGrams: 200, lipasePerKgPerMeal: 4000, strengthValue: 6000 });
    const triggered = getTriggeredAdvisories('oral', state, result, advisories);
    const stopIdx = triggered.findIndex((a) => a.severity === 'stop');
    const warnIdx = triggered.findIndex((a) => a.severity === 'warning');
    expect(stopIdx).toBeGreaterThanOrEqual(0);
    expect(warnIdx).toBeGreaterThan(stopIdx);
  });

  it('MAX_LIPASE_PER_KG_PER_DAY constant equals 10000 (CONTEXT D-03 hard literal)', () => {
    expect(MAX_LIPASE_PER_KG_PER_DAY).toBe(10000);
  });

  it('dailyLipaseUnits oral = capsules * strength * 3; tube = capsules * strength', () => {
    expect(dailyLipaseUnits('oral', 4, 12000)).toBe(144000);
    expect(dailyLipaseUnits('tube-feed', 5, 37000)).toBe(185000);
    expect(dailyLipaseUnits('oral', 0, 12000)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Block 5: PERT-TEST-04 config-to-calc integration delta (CONTEXT D-09)
// ---------------------------------------------------------------------------

// PERT-TEST-04 mostly covered by Phase 1 src/lib/pert/config.test.ts (11 tests
// including FDA-allowlist hostile-injection + medication shape + formula shape +
// accessor functions). Phase 3 adds end-to-end wiring delta: prove the config
// wrappers feed the calc layer correctly using fixture row 0 inputs.
describe('PERT-TEST-04 config-to-calc integration (D-09 delta)', () => {
  it('Oral fixture row 0: getMedicationById + getStrengthsForMedication -> computeOralResult produces fixture-expected', () => {
    // PERT-TEST-04 mostly covered by Phase 1 src/lib/pert/config.test.ts (11 tests);
    // Phase 3 adds end-to-end wiring delta.
    const med = getMedicationById('creon');
    expect(med).toBeDefined();
    expect(med!.brand).toBe('Creon');
    const strengths = getStrengthsForMedication('creon');
    expect(strengths).toContain(12000);
    const result = computeOralResult({
      fatGrams: 25,
      lipasePerKgPerMeal: 2000,
      strengthValue: 12000
    });
    expect(result.capsulesPerDose).toBe(4);
    expect(result.totalLipase).toBe(50000);
  });

  it('Tube fixture row 0: getFormulaById -> computeTubeFeedResult produces fixture-expected', () => {
    // PERT-TEST-04 mostly covered by Phase 1 src/lib/pert/config.test.ts (11 tests);
    // Phase 3 adds end-to-end wiring delta.
    const formula = getFormulaById('kate-farms-ped-std-12');
    expect(formula).toBeDefined();
    expect(formula!.fatGPerL).toBe(48);
    const result = computeTubeFeedResult({
      formulaFatGPerL: formula!.fatGPerL,
      volumePerDayMl: 1500,
      lipasePerKgPerDay: 2500,
      weightKg: 15,
      strengthValue: 37000
    });
    expect(result.capsulesPerDay).toBe(5);
    expect(result.capsulesPerMonth).toBe(150);
  });
});
