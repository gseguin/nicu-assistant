// src/lib/shared/theme.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile

import { createPersistentValue, rawStringCodec } from './persistent-value.js';

// Module-scope seam instance (MIG-01 / D-02): rawStringCodec is non-negotiable so stored
// bytes are 'light'/'dark' unquoted — the app.html FOUC inline script checks
// `stored === 'dark'` and would silently break if we used jsonCodec (which would
// write '"dark"'). (D-03, PITFALL-02)
const pv = createPersistentValue<string>({
  key: 'nicu_assistant_theme',
  defaultValue: 'light',
  codec: rawStringCodec
});

let _theme = $state<'light' | 'dark'>('light');

export const theme = {
  get current(): 'light' | 'dark' {
    return _theme;
  },

  set(value: 'light' | 'dark'): void {
    _theme = value;
    pv.write(value); // replaces: try { localStorage.setItem('nicu_assistant_theme', value) } catch {}
    // Keep .dark class and data-theme attribute in sync with app.css @custom-variant
    document.documentElement.classList.toggle('dark', value === 'dark');
    document.documentElement.setAttribute('data-theme', value);
  },

  init(): void {
    // Called in +layout.svelte onMount — DOM is available here
    // ONE allowed raw null-probe (PITFALL-03 / D-03): pv.read() returns defaultValue='light'
    // for both "nothing stored" and "stored 'light'" — indistinguishable via the seam.
    // The prefers-color-scheme fallback only applies on true first-run (raw === null).
    // pv.write() is still routed through the seam (inside theme.set() below).
    const stored = localStorage.getItem('nicu_assistant_theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme.set(stored ?? (prefersDark ? 'dark' : 'light'));
  },

  toggle(): void {
    theme.set(_theme === 'dark' ? 'light' : 'dark');
  }
};
