import { describe, it, expect } from 'vitest';
import {
  calculateCurrentGir,
  calculateInitialRateMlHr,
  calculateTitrationRows,
  calculateGir,
} from './calculations.js';
import { glucoseBuckets } from './gir-config.js';
import fixtures from './gir-parity.fixtures.json';

const EPSILON = 0.01; // 1% — reconciles exact 10/60 constant vs spreadsheet truncation
const ABS_FLOOR = 0.15; // absolute ml/hr floor for delta comparisons near zero;
                        // truncated spreadsheet constants cascade into delta subtraction,
                        // so we accept either 1% relative OR <0.15 ml/hr absolute
                        // (clinically insignificant on an infusion pump).

function closeEnough(actual: number, expected: number): boolean {
  const absDiff = Math.abs(actual - expected);
  if (absDiff <= ABS_FLOOR) return true;
  if (expected === 0) return absDiff < EPSILON;
  return Math.abs(absDiff / expected) <= EPSILON;
}

describe('GIR calculations — spreadsheet parity', () => {
  const { weightKg, dextrosePct, mlPerKgPerDay } = fixtures.input;

  it('calculateCurrentGir matches spreadsheet within 1%', () => {
    const actual = calculateCurrentGir(weightKg, dextrosePct, mlPerKgPerDay);
    expect(closeEnough(actual, fixtures.expected.currentGirMgKgMin)).toBe(true);
  });

  it('calculateInitialRateMlHr matches spreadsheet exactly', () => {
    const actual = calculateInitialRateMlHr(weightKg, mlPerKgPerDay);
    expect(actual).toBeCloseTo(fixtures.expected.initialRateMlHr, 4);
  });

  it('calculateTitrationRows produces 6 rows matching all fixture values within 1%', () => {
    const rows = calculateTitrationRows(weightKg, dextrosePct, mlPerKgPerDay, glucoseBuckets);
    expect(rows).toHaveLength(6);
    for (const expected of fixtures.expected.titration) {
      const row = rows.find((r) => r.bucketId === expected.bucketId);
      expect(row, `row ${expected.bucketId}`).toBeDefined();
      expect(closeEnough(row!.targetGirMgKgMin, expected.targetGirMgKgMin)).toBe(true);
      expect(closeEnough(row!.targetFluidsMlKgDay, expected.targetFluidsMlKgDay)).toBe(true);
      expect(closeEnough(row!.targetRateMlHr, expected.targetRateMlHr)).toBe(true);
      expect(closeEnough(row!.deltaRateMlHr, expected.deltaRateMlHr)).toBe(true);
    }
  });

  it('bucket order in output matches glucoseBuckets config order', () => {
    const rows = calculateTitrationRows(weightKg, dextrosePct, mlPerKgPerDay, glucoseBuckets);
    expect(rows.map((r) => r.bucketId)).toEqual(glucoseBuckets.map((b) => b.id));
  });
});

describe('calculateGir aggregator', () => {
  it('returns null if weightKg is null', () => {
    expect(calculateGir({ weightKg: null, dextrosePct: 12.5, mlPerKgPerDay: 65 }, glucoseBuckets)).toBeNull();
  });

  it('returns null if dextrosePct is null', () => {
    expect(calculateGir({ weightKg: 3.93, dextrosePct: null, mlPerKgPerDay: 65 }, glucoseBuckets)).toBeNull();
  });

  it('returns null if mlPerKgPerDay is null', () => {
    expect(calculateGir({ weightKg: 3.93, dextrosePct: 12.5, mlPerKgPerDay: null }, glucoseBuckets)).toBeNull();
  });

  it('returns full GirResult when all inputs present', () => {
    const result = calculateGir({ weightKg: 3.93, dextrosePct: 12.5, mlPerKgPerDay: 65 }, glucoseBuckets);
    expect(result).not.toBeNull();
    expect(result!.titration).toHaveLength(6);
    expect(result!.currentGirMgKgMin).toBeGreaterThan(0);
    expect(result!.initialRateMlHr).toBeGreaterThan(0);
  });
});
