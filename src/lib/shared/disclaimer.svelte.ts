// src/lib/shared/disclaimer.svelte.ts
// .svelte.ts extension required — $state rune must compile through Svelte preprocessor
const DISCLAIMER_KEY_V1 = 'nicu_assistant_disclaimer_v1';
const DISCLAIMER_KEY_V2 = 'nicu_assistant_disclaimer_v2';

let _acknowledged = $state(false);
let _initialized = $state(false);

export const disclaimer = {
  get acknowledged(): boolean {
    return _acknowledged;
  },
  get initialized(): boolean {
    return _initialized;
  },
  init(): void {
    const v2 = localStorage.getItem(DISCLAIMER_KEY_V2);
    const v1 = localStorage.getItem(DISCLAIMER_KEY_V1);
    _acknowledged = v2 === 'true' || v1 === 'true';
    if (v1 === 'true' && v2 !== 'true') {
      try {
        localStorage.setItem(DISCLAIMER_KEY_V2, 'true');
        // Do not delete v1 — preserves audit trail
      } catch {
        // private mode
      }
    }
    _initialized = true;
  },
  acknowledge(): void {
    _acknowledged = true;
    try {
      localStorage.setItem(DISCLAIMER_KEY_V2, 'true');
    } catch {
      // private browsing — acknowledge in memory only
    }
  }
};
