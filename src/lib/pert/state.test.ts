import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

// Spin up a fresh module per test by dynamic-import + cache invalidation, since
// pertState is a module-scope singleton with eager init in constructor.
async function freshModule() {
  vi.resetModules();
  return await import('./state.svelte.js');
}

const STORAGE_KEY = 'nicu_pert_state';
const TS_KEY = 'nicu_pert_state_ts';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('pertState — defaults', () => {
  it('first-run state has mode=oral and weightKg=3.0', async () => {
    const { pertState } = await freshModule();
    expect(pertState.current.mode).toBe('oral');
    expect(pertState.current.weightKg).toBe(3.0);
    expect(pertState.current.medicationId).toBeNull();
    expect(pertState.current.oral.fatGrams).toBeNull();
    expect(pertState.current.tubeFeed.formulaId).toBeNull();
  });
});

describe('pertState — persist + restore', () => {
  it('round-trips weight and mode', async () => {
    const { pertState } = await freshModule();
    pertState.current.weightKg = 7.5;
    pertState.current.mode = 'tube-feed';
    pertState.persist();

    // Re-import to simulate reload.
    const { pertState: restored } = await freshModule();
    expect(restored.current.weightKg).toBe(7.5);
    expect(restored.current.mode).toBe('tube-feed');
  });

  it('mode-specific sub-objects persist independently', async () => {
    const { pertState } = await freshModule();
    pertState.current.oral.fatGrams = 25;
    pertState.current.oral.lipasePerKgPerMeal = 1500;
    pertState.current.tubeFeed.formulaId = 'kate-farms-ped-std-12';
    pertState.current.tubeFeed.volumePerDayMl = 1000;
    pertState.persist();

    const { pertState: restored } = await freshModule();
    expect(restored.current.oral.fatGrams).toBe(25);
    expect(restored.current.oral.lipasePerKgPerMeal).toBe(1500);
    expect(restored.current.tubeFeed.formulaId).toBe('kate-farms-ped-std-12');
    expect(restored.current.tubeFeed.volumePerDayMl).toBe(1000);
  });
});

describe('pertState — defensive merge', () => {
  it('init() handles stored data missing mode-specific sub-objects', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode: 'tube-feed', weightKg: 10.0 })
    );
    const { pertState } = await freshModule();
    expect(pertState.current.mode).toBe('tube-feed');
    expect(pertState.current.weightKg).toBe(10.0);
    // oral + tubeFeed sub-objects fall back to defaults.
    expect(pertState.current.oral).toBeDefined();
    expect(pertState.current.tubeFeed).toBeDefined();
    expect(pertState.current.oral.fatGrams).toBeNull();
  });

  it('init() falls back to defaults on invalid JSON', async () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    const { pertState } = await freshModule();
    expect(pertState.current.mode).toBe('oral');
    expect(pertState.current.weightKg).toBe(3.0);
  });
});

describe('pertState — reset', () => {
  it('clears localStorage + lastEdited stamp', async () => {
    const { pertState } = await freshModule();
    pertState.current.weightKg = 7.5;
    pertState.persist();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    pertState.reset();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(TS_KEY)).toBeNull();
    expect(pertState.current.weightKg).toBe(3.0);
  });
});
