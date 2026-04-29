// src/lib/shell/calculator-store.test.ts
// Exhaustive co-located tests for the generic CalculatorStore<T> class.
// Co-located in src/lib/shell/ (NOT under __tests__/) per project convention.
// 10 tests covering: defaults, persist+restore, merge (default + custom),
// error resilience (invalid JSON, getItem throw, setItem throw),
// reset, lastEdited integration, and SSR safety.

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { CalculatorStore } from './calculator-store.svelte.js';

type Shape = { a: number; b: string };
const makeDefaults = (): Shape => ({ a: 1, b: 'x' });
const KEY = 'test_calc_store';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  // Restore stubbed globals BEFORE touching localStorage — the SSR test stubs
  // `localStorage` with `undefined`, so calling `.clear()` first would throw.
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('CalculatorStore — defaults', () => {
  it('first-run state deep-equals the defaults factory output', () => {
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    expect(store.current).toEqual({ a: 1, b: 'x' });
  });
});

describe('CalculatorStore — persist + restore', () => {
  it('round-trips a mutation: new instance with same key reads the persisted value', () => {
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    store.current.a = 42;
    store.persist();

    const restored = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    expect(restored.current.a).toBe(42);
    expect(restored.current.b).toBe('x');
  });

  it('round-trips via vi.resetModules() + dynamic import (mirrors PERT pattern)', async () => {
    vi.resetModules();
    const mod1 = await import('./calculator-store.svelte.js');
    const store = new mod1.CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    store.current.a = 77;
    store.persist();

    vi.resetModules();
    const mod2 = await import('./calculator-store.svelte.js');
    const restored = new mod2.CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    expect(restored.current.a).toBe(77);
  });
});

describe('CalculatorStore — merge', () => {
  it('default shallow merge fills missing keys from defaults', () => {
    localStorage.setItem(KEY, JSON.stringify({ a: 99 }));
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    expect(store.current.a).toBe(99);
    expect(store.current.b).toBe('x');
  });

  it('custom merge is invoked with (defaults, parsed) and its return value is assigned', () => {
    localStorage.setItem(KEY, JSON.stringify({ a: 99 }));
    const sentinel = { a: 99, b: 'merged', __sentinel: true } as Shape & { __sentinel: true };
    const merge = vi.fn(() => sentinel);
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults,
      merge
    });
    expect(merge).toHaveBeenCalledTimes(1);
    expect(merge).toHaveBeenCalledWith({ a: 1, b: 'x' }, { a: 99 });
    // $state(...) wraps assignments in a Proxy, breaking referential identity
    // (toBe). The discriminator field __sentinel proves the value came from
    // the custom merge return rather than the default shallow-merge branch.
    expect(store.current).toEqual(sentinel);
    expect((store.current as Shape & { __sentinel?: true }).__sentinel).toBe(true);
  });
});

describe('CalculatorStore — error resilience', () => {
  it('invalid JSON in storage falls back silently to defaults', () => {
    localStorage.setItem(KEY, '{not json');
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    expect(store.current).toEqual({ a: 1, b: 'x' });
  });

  it('localStorage.getItem throwing during init falls back silently to defaults', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    expect(store.current).toEqual({ a: 1, b: 'x' });
  });

  it('localStorage.setItem throwing during persist() is silent and lastEdited.stamp() still runs', () => {
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    store.current.a = 5;
    expect(() => store.persist()).not.toThrow();
    expect(typeof store.lastEdited.current).toBe('number');
    expect(Number.isFinite(store.lastEdited.current as number)).toBe(true);
  });
});

describe('CalculatorStore — reset', () => {
  it('clears storage entry, ts entry, and resets current + lastEdited', () => {
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    store.current.a = 7;
    store.persist();
    expect(localStorage.getItem(KEY)).not.toBeNull();

    store.reset();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(localStorage.getItem(`${KEY}_ts`)).toBeNull();
    expect(store.current).toEqual({ a: 1, b: 'x' });
    expect(store.lastEdited.current).toBeNull();
  });
});

describe('CalculatorStore — lastEdited integration', () => {
  it('persist() stamps lastEdited with a number close to Date.now()', () => {
    const store = new CalculatorStore<Shape>({
      storageKey: KEY,
      defaults: makeDefaults
    });
    expect(store.lastEdited.current).toBeNull();
    const before = Date.now();
    store.persist();
    const after = Date.now();
    const stamped = store.lastEdited.current;
    expect(typeof stamped).toBe('number');
    expect(stamped as number).toBeGreaterThanOrEqual(before - 5_000);
    expect(stamped as number).toBeLessThanOrEqual(after + 5_000);
  });
});

describe('CalculatorStore — SSR safety', () => {
  it('init() does not throw when localStorage is undefined and current stays at defaults', () => {
    vi.stubGlobal('localStorage', undefined);
    let store: CalculatorStore<Shape> | undefined;
    expect(() => {
      store = new CalculatorStore<Shape>({
        storageKey: KEY,
        defaults: makeDefaults
      });
    }).not.toThrow();
    expect(() => store!.init()).not.toThrow();
    expect(store!.current).toEqual({ a: 1, b: 'x' });
  });
});
