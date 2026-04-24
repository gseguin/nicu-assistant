import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fortificationState } from './state.svelte.js';

const STORAGE_KEY = 'nicu_fortification_state';

describe('fortificationState', () => {
  beforeEach(() => {
    localStorage.clear();
    fortificationState.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('init() with empty localStorage leaves defaults intact', () => {
    fortificationState.init();
    expect(fortificationState.current).toEqual({
      base: 'breast-milk',
      volumeMl: 180,
      formulaId: 'neocate-infant',
      targetKcalOz: 24,
      unit: 'teaspoons'
    });
  });

  it('init() with valid stored JSON merges into current state', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        base: 'water',
        volumeMl: 240,
        formulaId: 'similac-hmf',
        targetKcalOz: 22,
        unit: 'packets'
      })
    );
    fortificationState.init();
    expect(fortificationState.current.base).toBe('water');
    expect(fortificationState.current.volumeMl).toBe(240);
    expect(fortificationState.current.formulaId).toBe('similac-hmf');
    expect(fortificationState.current.targetKcalOz).toBe(22);
    expect(fortificationState.current.unit).toBe('packets');
  });

  it('init() with corrupt JSON silently keeps defaults', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(() => fortificationState.init()).not.toThrow();
    expect(fortificationState.current.base).toBe('breast-milk');
    expect(fortificationState.current.volumeMl).toBe(180);
  });

  it('persist() writes JSON.stringify(current) to localStorage under the key', () => {
    fortificationState.current.volumeMl = 300;
    fortificationState.persist();
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.volumeMl).toBe(300);
    expect(parsed.formulaId).toBe('neocate-infant');
  });

  it('reset() returns state to defaults and removes the key from localStorage', () => {
    fortificationState.current.volumeMl = 500;
    fortificationState.current.unit = 'grams';
    fortificationState.persist();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    fortificationState.reset();

    expect(fortificationState.current.volumeMl).toBe(180);
    expect(fortificationState.current.unit).toBe('teaspoons');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('persist() and init() are no-throw when localStorage throws', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => fortificationState.persist()).not.toThrow();
    expect(() => fortificationState.init()).not.toThrow();

    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });
});
