// src/lib/feeds/state.svelte.ts
// Svelte 5 rune syntax -- .svelte.ts extension required for $state to compile.
// SessionStorage-backed singleton for Feed Advance Calculator state persistence
// across route navigation. Mirrors src/lib/gir/state.svelte.ts pattern exactly.
// CRITICAL: No sessionStorage calls outside functions -- init/persist/reset only.

import type { FeedsStateData } from './types.js';
import { defaults } from './feeds-config.js';

const SESSION_KEY = 'nicu_feeds_state';

function defaultState(): FeedsStateData {
  return {
    mode: 'bedside',
    weightKg: null,
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
    enteralKcalPerOz: defaults.enteralKcalPerOz,
  };
}

let _state = $state<FeedsStateData>(defaultState());

export const feedsState = {
  get current(): FeedsStateData {
    return _state;
  },

  /** Call from onMount only -- reads sessionStorage to restore state */
  init(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FeedsStateData>;
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
