// src/lib/pert/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// LocalStorage-backed singleton for PERT calculator state persistence across route navigation.
// CRITICAL: No localStorage calls outside functions — init/persist/reset only.
// Mirrors src/lib/uac-uvc/state.svelte.ts pattern exactly. CONTEXT D-09..D-13.

import type { PertStateData } from './types.js';
import { defaults as configDefaults } from './config.js';
import { LastEdited } from '$lib/shared/lastEdited.svelte.js';

const STORAGE_KEY = 'nicu_pert_state';
const TS_KEY = 'nicu_pert_state_ts';

function defaultState(): PertStateData {
  // Deep clone so mutating .current doesn't bleed into the imported defaults.
  return {
    mode: configDefaults.mode,
    weightKg: configDefaults.weightKg,
    medicationId: configDefaults.medicationId,
    strengthValue: configDefaults.strengthValue,
    oral: { ...configDefaults.oral },
    tubeFeed: { ...configDefaults.tubeFeed }
  };
}

class PertState {
  current = $state<PertStateData>(defaultState());
  lastEdited = new LastEdited(TS_KEY);

  constructor() {
    // Eager init: child $effects mounted before onMount can fire persist() with
    // default values and clobber the restored state. Running here means .current
    // already reflects localStorage by the time any component reads it.
    this.init();
  }

  /** Reads localStorage to restore state across sessions. Safe to call repeatedly. */
  init(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PertStateData>;
        // Defensive merge: keep mode-specific sub-objects intact even if stored JSON
        // is missing one of them (older schema, partial data).
        this.current = {
          ...defaultState(),
          ...parsed,
          oral: { ...defaultState().oral, ...(parsed.oral ?? {}) },
          tubeFeed: { ...defaultState().tubeFeed, ...(parsed.tubeFeed ?? {}) }
        };
      }
    } catch {
      // Silent: invalid JSON or private browsing mode — fall back to defaults.
    }
  }

  /** Persist current state to localStorage and stamp the edit timestamp. */
  persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.current));
    } catch {
      // Silent: private browsing mode or storage quota exceeded.
    }
    this.lastEdited.stamp();
  }

  /** Reset state to defaults, clear localStorage, clear the edit timestamp. */
  reset(): void {
    this.current = defaultState();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silent: private browsing mode.
    }
    this.lastEdited.clear();
  }
}

export const pertState = new PertState();
