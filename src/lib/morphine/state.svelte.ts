// src/lib/morphine/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// LocalStorage-backed singleton for morphine wean calculator state persistence
// across sessions (clinician's last entries survive browser close / PWA reopen).
// CRITICAL: No localStorage calls outside functions — init/persist/reset only.

import type { MorphineStateData } from './types.js';
import config from './morphine-config.json';
import { LastEdited } from '$lib/shared/lastEdited.svelte.js';

const STORAGE_KEY = 'nicu_morphine_state';
const TS_KEY = 'nicu_morphine_state_ts';

function defaultState(): MorphineStateData {
  return {
    weightKg: config.defaults.weightKg,
    maxDoseMgKgDose: config.defaults.maxDoseMgKgDose,
    decreasePct: config.defaults.decreasePct
  };
}

class MorphineState {
  current = $state<MorphineStateData>(defaultState());
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
        const parsed = JSON.parse(stored) as Partial<MorphineStateData>;
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

export const morphineState = new MorphineState();
