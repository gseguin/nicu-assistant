// src/lib/shell/calculator-store.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// Generic, reusable LocalStorage-backed singleton class for per-calculator state.
// CRITICAL: No localStorage calls outside functions — init/persist/reset only.
// SSR safety: every localStorage access is guarded by `typeof localStorage === 'undefined'`.
// Consolidated replacement for the per-slice state singletons under
// src/lib/{pert,feeds,gir,morphine,fortification,uac-uvc}/state.svelte.ts —
// commits 2–5 of this deepening will migrate each slice to instantiate
// CalculatorStore<T> from its own state.svelte.ts.

import { LastEdited } from '$lib/shared/lastEdited.svelte.js';

export interface CalculatorStoreOptions<T> {
  storageKey: string;
  defaults: () => T;
  /** Optional custom merge for nested sub-objects. Default: shallow `{ ...defaults, ...parsed }`. */
  merge?: (defaults: T, parsed: Partial<T>) => T;
}

export class CalculatorStore<T> {
  current: T;
  lastEdited: LastEdited;

  readonly #storageKey: string;
  readonly #defaults: () => T;
  readonly #merge?: (defaults: T, parsed: Partial<T>) => T;

  constructor(options: CalculatorStoreOptions<T>) {
    this.#storageKey = options.storageKey;
    this.#defaults = options.defaults;
    this.#merge = options.merge;
    this.lastEdited = new LastEdited(`${options.storageKey}_ts`);
    this.current = $state<T>(options.defaults());
    // Eager init: child $effects mounted before the route's onMount can fire
    // persist() with default values and clobber the restored state. Running
    // here means .current already reflects localStorage by the time any
    // component reads it. Mirrors src/lib/pert/state.svelte.ts.
    this.init();
  }

  /** Reads localStorage to restore state across sessions. Safe to call repeatedly. */
  init(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(this.#storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<T>;
        if (this.#merge) {
          this.current = this.#merge(this.#defaults(), parsed);
        } else {
          this.current = { ...this.#defaults(), ...(parsed as T) };
        }
      }
    } catch {
      // Silent: invalid JSON, security error, or private browsing mode — fall back to defaults.
    }
  }

  /** Persist current state to localStorage and stamp the edit timestamp. */
  persist(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.#storageKey, JSON.stringify(this.current));
      } catch {
        // Silent: private browsing mode or storage quota exceeded.
      }
    }
    // stamp() runs even if setItem threw — matches the existing PERT pattern
    // where stamp is outside the try/catch.
    this.lastEdited.stamp();
  }

  /** Reset state to defaults, clear localStorage, clear the edit timestamp. */
  reset(): void {
    this.current = this.#defaults();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.#storageKey);
      } catch {
        // Silent: private browsing mode or security error.
      }
    }
    this.lastEdited.clear();
  }
}
