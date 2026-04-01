// src/lib/pert/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// SessionStorage-backed singleton for PERT calculator state persistence across route navigation.
// CRITICAL: No sessionStorage calls outside functions — init/persist/reset only.

const SESSION_KEY = 'nicu_pert_state';

export interface PertMealState {
  fatGramsRaw: string;
  lipaseRateStr: string;
  selectedBrand: string;
  selectedStrengthStr: string;
}

export interface PertTubeFeedState {
  fatGramsRaw: string;
  lipaseRateStr: string;
  selectedBrand: string;
  selectedStrengthStr: string;
}

export interface PertStateData {
  activeMode: 'meal' | 'tube-feed';
  meal: PertMealState;
  tubeFeed: PertTubeFeedState;
}

function defaultState(): PertStateData {
  return {
    activeMode: 'meal',
    meal: {
      fatGramsRaw: '',
      lipaseRateStr: '',
      selectedBrand: '',
      selectedStrengthStr: ''
    },
    tubeFeed: {
      fatGramsRaw: '',
      lipaseRateStr: '',
      selectedBrand: '',
      selectedStrengthStr: ''
    }
  };
}

let _state = $state<PertStateData>(defaultState());

export const pertState = {
  get current(): PertStateData {
    return _state;
  },

  /** Call from onMount only — reads sessionStorage to restore state */
  init(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PertStateData>;
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
