// src/lib/fortification/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// SessionStorage-backed singleton for fortification calculator state persistence across route navigation.
// Mirrors the morphine state pattern.

import type { BaseType, TargetKcalOz } from './types.js';

const SESSION_KEY = 'nicu_fortification_state';

export interface FortificationStateData {
  base: BaseType;
  volumeMl: number | null;
  formulaId: string;
  targetKcalOz: TargetKcalOz;
}

function defaultState(): FortificationStateData {
  return {
    base: 'breast-milk',
    volumeMl: 180,
    formulaId: 'neocate-infant',
    targetKcalOz: 24,
  };
}

let _state = $state<FortificationStateData>(defaultState());

export const fortificationState = {
  get current(): FortificationStateData {
    return _state;
  },

  /** Call from onMount only — reads sessionStorage to restore state */
  init(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FortificationStateData>;
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
