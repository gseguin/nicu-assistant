// src/lib/morphine/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// SessionStorage-backed singleton for morphine wean calculator state persistence across route navigation.
// CRITICAL: No sessionStorage calls outside functions — init/persist/reset only.

import type { MorphineStateData } from './types.js';
import config from './morphine-config.json';

const SESSION_KEY = 'nicu_morphine_state';

function defaultState(): MorphineStateData {
  return {
    weightKg: config.defaults.weightKg,
    maxDoseMgKgDose: config.defaults.maxDoseMgKgDose,
    decreasePct: config.defaults.decreasePct
  };
}

class MorphineState {
  current = $state<MorphineStateData>(defaultState());

  /** Call from onMount only — reads sessionStorage to restore state */
  init(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<MorphineStateData>;
        this.current = { ...defaultState(), ...parsed };
      }
    } catch {
      // Silent: invalid JSON or private browsing mode
    }
  }

  /** Persist current state to sessionStorage */
  persist(): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.current));
    } catch {
      // Silent: private browsing mode or storage quota exceeded
    }
  }

  /** Reset state to defaults and clear sessionStorage */
  reset(): void {
    this.current = defaultState();
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Silent: private browsing mode
    }
  }
}

export const morphineState = new MorphineState();
