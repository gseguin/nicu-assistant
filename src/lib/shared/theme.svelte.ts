// src/lib/shared/theme.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile

let _theme = $state<'light' | 'dark'>('light');

export const theme = {
  get current(): 'light' | 'dark' {
    return _theme;
  },

  set(value: 'light' | 'dark'): void {
    _theme = value;
    try {
      localStorage.setItem('nicu_assistant_theme', value);
    } catch {
      // Silent: private browsing mode or storage quota exceeded
    }
    // Keep .dark class and data-theme attribute in sync with app.css @custom-variant
    document.documentElement.classList.toggle('dark', value === 'dark');
    document.documentElement.setAttribute('data-theme', value);
  },

  init(): void {
    // Called in +layout.svelte onMount — DOM is available here
    // Reads the same localStorage key as the FOUC inline script in app.html
    const stored = localStorage.getItem('nicu_assistant_theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme.set(stored ?? (prefersDark ? 'dark' : 'light'));
  },

  toggle(): void {
    theme.set(_theme === 'dark' ? 'light' : 'dark');
  }
};
