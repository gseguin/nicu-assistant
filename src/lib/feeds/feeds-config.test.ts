import { describe, it, expect } from 'vitest';
import {
  defaults,
  inputs,
  frequencyOptions,
  cadenceOptions,
  advisories,
  getFrequencyById,
  getCadenceById,
  resolveAdvanceEventsPerDay
} from './feeds-config.js';

describe('feeds-config shape', () => {
  it('defaults have valid values', () => {
    expect(defaults.weightKg).toBe(3.0);
    expect(defaults.trophicMlKgDay).toBe(20);
    expect(defaults.advanceMlKgDay).toBe(30);
    expect(defaults.goalMlKgDay).toBe(160);
  });

  it('all input ranges have min < max and step > 0', () => {
    for (const [key, range] of Object.entries(inputs)) {
      expect(range.min, `${key}.min < max`).toBeLessThan(range.max);
      expect(range.step, `${key}.step > 0`).toBeGreaterThan(0);
    }
  });

  it('frequency options have valid feedsPerDay', () => {
    for (const opt of frequencyOptions) {
      expect(opt.feedsPerDay).toBeGreaterThan(0);
      expect(opt.id).toBeTruthy();
      expect(opt.label).toBeTruthy();
    }
    expect(frequencyOptions.map((f) => f.id)).toContain('q3h');
    expect(frequencyOptions.map((f) => f.id)).toContain('q4h');
  });

  it('cadence options have valid structure', () => {
    for (const opt of cadenceOptions) {
      expect(opt.id).toBeTruthy();
      expect(opt.label).toBeTruthy();
      expect(['relative', 'absolute']).toContain(opt.type);
      expect(opt.value).toBeGreaterThan(0);
    }
    expect(cadenceOptions.map((c) => c.id)).toEqual([
      'every',
      'every-other',
      'every-3rd',
      'bid',
      'qd'
    ]);
  });

  it('all advisory entries have required fields', () => {
    for (const adv of advisories) {
      expect(adv.id).toBeTruthy();
      expect(adv.field).toBeTruthy();
      expect(['gt', 'lt', 'range']).toContain(adv.comparator);
      expect(adv.message).toBeTruthy();
      expect(['bedside', 'full-nutrition', 'both']).toContain(adv.mode);
    }
  });

  it('getFrequencyById resolves by id', () => {
    expect(getFrequencyById('q3h')?.feedsPerDay).toBe(8);
    expect(getFrequencyById('q4h')?.feedsPerDay).toBe(6);
    expect(getFrequencyById('nope')).toBeUndefined();
  });

  it('getCadenceById resolves by id', () => {
    expect(getCadenceById('bid')?.value).toBe(2);
    expect(getCadenceById('nope')).toBeUndefined();
  });

  it('resolveAdvanceEventsPerDay works for relative and absolute', () => {
    const bid = getCadenceById('bid')!;
    expect(resolveAdvanceEventsPerDay(bid, 8)).toBe(2); // absolute, ignores feedsPerDay

    const every = getCadenceById('every')!;
    expect(resolveAdvanceEventsPerDay(every, 8)).toBe(8); // relative: 8/1

    const everyOther = getCadenceById('every-other')!;
    expect(resolveAdvanceEventsPerDay(everyOther, 8)).toBe(4); // relative: 8/2
  });
});
