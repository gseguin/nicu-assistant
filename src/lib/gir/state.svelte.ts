// src/lib/gir/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// SessionStorage-backed singleton for GIR calculator state persistence across route navigation.
// CRITICAL: No sessionStorage calls outside functions — init/persist/reset only.
// Mirrors src/lib/morphine/state.svelte.ts pattern exactly.

import type { GirStateData } from './types.js';
import config from './gir-config.json';

const SESSION_KEY = 'nicu_gir_state';

function defaultState(): GirStateData {
  return {
    weightKg: config.defaults.weightKg,
    dextrosePct: config.defaults.dextrosePct,
    mlPerKgPerDay: config.defaults.mlPerKgPerDay,
    selectedBucketId: null,
  };
}

let _state = $state<GirStateData>(defaultState());

export const girState = {
  get current(): GirStateData {
    return _state;
  },

  /** Call from onMount only — reads sessionStorage to restore state */
  init(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<GirStateData>;
        _state = { ...defaultState(), ...parsed };
      }
    } catch {
      // Silent: invalid JSON or private browsing mode
    }
  },

  /** Persist current state to sessionStorage */
  persist(): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(_state));
    } catch {
      // Silent: private browsing mode or storage quota exceeded
    }
  },

  /** Reset state to defaults and clear sessionStorage */
  reset(): void {
    _state = defaultState();
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Silent: private browsing mode
    }
  },
};
