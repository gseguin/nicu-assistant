import { describe, it, expect } from 'vitest';
import { normalizeNumericInput } from './normalize.js';

describe('normalizeNumericInput', () => {
  it('passes through a plain decimal', () => {
    expect(normalizeNumericInput('12.5')).toBe('12.5');
  });

  it('trims leading and trailing spaces', () => {
    expect(normalizeNumericInput(' 12.5 ')).toBe('12.5');
  });

  it('replaces locale comma with decimal point', () => {
    expect(normalizeNumericInput('12,5')).toBe('12.5');
  });

  it('strips trailing newline (EPIC paste)', () => {
    expect(normalizeNumericInput('12.5\n')).toBe('12.5');
  });

  it('handles tab + comma + CRLF combo', () => {
    expect(normalizeNumericInput('\t 3,93 \r\n')).toBe('3.93');
  });

  it('strips non-breaking space from rich-text paste', () => {
    expect(normalizeNumericInput('12.5\u00A0')).toBe('12.5');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeNumericInput('')).toBe('');
  });

  it('is idempotent', () => {
    const once = normalizeNumericInput(' 3,93\n');
    expect(normalizeNumericInput(once)).toBe(once);
  });

  it('passes through non-numeric content (caller validates)', () => {
    expect(normalizeNumericInput('abc')).toBe('abc');
  });
});
