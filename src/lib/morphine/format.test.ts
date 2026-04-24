import { describe, it, expect } from 'vitest';
import { formatMg, formatPercent } from './format.js';

describe('formatMg', () => {
  it('formatMg(0) returns "0.000"', () => {
    expect(formatMg(0)).toBe('0.000');
  });

  it('formatMg(NaN) returns "0.000" (defensive)', () => {
    expect(formatMg(NaN)).toBe('0.000');
  });

  it('formatMg(Infinity) returns "0.000" (defensive)', () => {
    expect(formatMg(Infinity)).toBe('0.000');
  });

  it('formatMg(-Infinity) returns "0.000" (defensive)', () => {
    expect(formatMg(-Infinity)).toBe('0.000');
  });

  it('formatMg(0.062) returns "0.062" (exact, no extra digit)', () => {
    expect(formatMg(0.062)).toBe('0.062');
  });

  it('formatMg(0.06204) returns "0.062" (truncation via toFixed)', () => {
    expect(formatMg(0.06204)).toBe('0.062');
  });

  it('formatMg(0.0625) returns "0.063" (toFixed rounds half up via IEEE 754 representation)', () => {
    // Note: JavaScript's toFixed uses banker's rounding via the underlying
    // double representation. 0.0625 has an exact IEEE 754 representation,
    // and toFixed(3) returns "0.063" (rounded up half-even falls to even,
    // but the binary representation makes this round to "0.063").
    expect(formatMg(0.0625)).toBe('0.063');
  });

  it('formatMg(1e-10) returns "0.000" (sub-precision rounds to zero)', () => {
    expect(formatMg(1e-10)).toBe('0.000');
  });

  it('formatMg(1000000) returns "1000000.000"', () => {
    expect(formatMg(1000000)).toBe('1000000.000');
  });

  it('formatMg(-0.5) returns "-0.500" (negative formatting; never throws)', () => {
    expect(formatMg(-0.5)).toBe('-0.500');
  });
});

describe('formatPercent', () => {
  it('formatPercent(0) returns "0.00%"', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('formatPercent(50.123) returns "50.12%"', () => {
    expect(formatPercent(50.123)).toBe('50.12%');
  });

  it('formatPercent(NaN) returns "0.00%" (defensive)', () => {
    expect(formatPercent(NaN)).toBe('0.00%');
  });

  it('formatPercent(Infinity) returns "0.00%" (defensive)', () => {
    expect(formatPercent(Infinity)).toBe('0.00%');
  });
});
