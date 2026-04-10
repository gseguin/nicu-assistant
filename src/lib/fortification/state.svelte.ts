// src/lib/fortification/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// SessionStorage-backed singleton for fortification calculator state persistence across route navigation.
// Mirrors the morphine state pattern.

import type { BaseType, UnitType, TargetKcalOz } from './types.js';

const SESSION_KEY = 'nicu_fortification_state';

export interface FortificationStateData {
  base: BaseType;
  volumeMl: number | null;
  formulaId: string;
  targetKcalOz: TargetKcalOz;
  unit: UnitType;
}

function defaultState(): FortificationStateData {
  return {
    base: 'breast-milk',
    volumeMl: 180,
    formulaId: 'neocate-infant',
    targetKcalOz: 24,
    unit: 'teaspoons',
  };
}

class FortificationState {
  current = $state<FortificationStateData>(defaultState());

  /** Call from onMount only — reads sessionStorage to restore state */
  init(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FortificationStateData>;
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

export const fortificationState = new FortificationState();
