// src/lib/formula/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// SessionStorage-backed singleton for Formula calculator state persistence across route navigation.
// CRITICAL: No sessionStorage calls outside functions — init/persist/reset only.

const SESSION_KEY = 'nicu_formula_state';

export interface FormulaModifiedState {
  selectedBrandId: string;
  targetKcalOzRaw: string;
  volumeMlRaw: string;
}

export interface FormulaBMFState {
  selectedBrandId: string;
  targetKcalOzRaw: string;
  volumeMlRaw: string;
  baselineKcalOzRaw: string;
}

export interface FormulaStateData {
  activeMode: 'modified' | 'bmf';
  modified: FormulaModifiedState;
  bmf: FormulaBMFState;
}

function defaultState(): FormulaStateData {
  return {
    activeMode: 'modified',
    modified: {
      selectedBrandId: '',
      targetKcalOzRaw: '',
      volumeMlRaw: ''
    },
    bmf: {
      selectedBrandId: '',
      targetKcalOzRaw: '',
      volumeMlRaw: '',
      baselineKcalOzRaw: '20'
    }
  };
}

let _state = $state<FormulaStateData>(defaultState());

export const formulaState = {
  get current(): FormulaStateData {
    return _state;
  },

  /** Call from onMount only — reads sessionStorage to restore state */
  init(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FormulaStateData>;
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
  }
};
