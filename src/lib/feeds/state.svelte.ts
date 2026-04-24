// src/lib/feeds/state.svelte.ts
// Svelte 5 rune syntax -- .svelte.ts extension required for $state to compile.
// LocalStorage-backed singleton for Feed Advance Calculator state persistence
// across route navigation. Mirrors src/lib/gir/state.svelte.ts pattern exactly.
// CRITICAL: No localStorage calls outside functions -- init/persist/reset only.

import type { FeedsStateData } from './types.js';
import { defaults } from './feeds-config.js';
import { LastEdited } from '$lib/shared/lastEdited.svelte.js';

const STORAGE_KEY = 'nicu_feeds_state';
const TS_KEY = 'nicu_feeds_state_ts';

function defaultState(): FeedsStateData {
  return {
    mode: 'bedside',
    weightKg: defaults.weightKg,
    // Bedside defaults from config
    trophicMlKgDay: defaults.trophicMlKgDay,
    advanceMlKgDay: defaults.advanceMlKgDay,
    goalMlKgDay: defaults.goalMlKgDay,
    trophicFrequency: 'q3h',
    advanceCadence: 'bid',
    totalFluidsMlHr: null,
    // Full nutrition defaults from config
    tpnDex1Pct: defaults.tpnDex1Pct,
    tpnMl1Hr: defaults.tpnMl1Hr,
    tpnDex2Pct: defaults.tpnDex2Pct,
    tpnMl2Hr: defaults.tpnMl2Hr,
    smofMl: defaults.smofMl,
    enteralMl: defaults.enteralMl,
    enteralKcalPerOz: defaults.enteralKcalPerOz
  };
}

class FeedsState {
  current = $state<FeedsStateData>(defaultState());
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
        const parsed = JSON.parse(stored) as Partial<FeedsStateData>;
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

export const feedsState = new FeedsState();
