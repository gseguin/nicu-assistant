// src/lib/gir/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// LocalStorage-backed singleton for GIR calculator state persistence across route navigation.
// CRITICAL: No localStorage calls outside functions — init/persist/reset only.
// Mirrors src/lib/morphine/state.svelte.ts pattern exactly.

import type { GirStateData } from './types.js';
import config from './gir-config.json';
import { LastEdited } from '$lib/shared/lastEdited.svelte.js';

const STORAGE_KEY = 'nicu_gir_state';
const TS_KEY = 'nicu_gir_state_ts';

function defaultState(): GirStateData {
  return {
    weightKg: config.defaults.weightKg,
    dextrosePct: config.defaults.dextrosePct,
    mlPerKgPerDay: config.defaults.mlPerKgPerDay,
    selectedBucketId: null
  };
}

class GirState {
  current = $state<GirStateData>(defaultState());
  lastEdited = new LastEdited(TS_KEY);

  constructor() {
    // Eager init: if we wait for the route's onMount, child $effects mounted
    // before it can fire persist() with default values and clobber the
    // restored state. Running here means .current already reflects localStorage
    // by the time any component reads it.
    this.init();
  }

  /** Reads localStorage to restore state across sessions. Safe to call repeatedly. */
  init(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<GirStateData>;
        this.current = { ...defaultState(), ...parsed };
      }
    } catch {
      // Silent: invalid JSON or private browsing mode
    }
  }

  /** Persist current state to localStorage and stamp the edit timestamp. */
  persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.current));
    } catch {
      // Silent: private browsing mode or storage quota exceeded
    }
    this.lastEdited.stamp();
  }

  /** Reset state to defaults, clear localStorage, clear the edit timestamp. */
  reset(): void {
    this.current = defaultState();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silent: private browsing mode
    }
    this.lastEdited.clear();
  }
}

export const girState = new GirState();
