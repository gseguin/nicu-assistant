// src/lib/uac-uvc/state.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// SessionStorage-backed singleton for UAC/UVC calculator state persistence across route navigation.
// CRITICAL: No sessionStorage calls outside functions — init/persist/reset only.
// Mirrors src/lib/gir/state.svelte.ts pattern exactly.

import type { UacUvcStateData } from './types.js';
import config from './uac-uvc-config.json';

const SESSION_KEY = 'nicu_uac_uvc_state';

function defaultState(): UacUvcStateData {
  return {
    weightKg: config.defaults.weightKg
  };
}

class UacUvcState {
  current = $state<UacUvcStateData>(defaultState());

  /** Call from onMount only — reads sessionStorage to restore state */
  init(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UacUvcStateData>;
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

export const uacUvcState = new UacUvcState();
