# Phase 1: Foundation - Research

**Researched:** 2026-03-31
**Domain:** SvelteKit scaffold + unified design system tokens + dark/light theme (FOUC-free) + responsive nav shell
**Confidence:** HIGH — based on direct inspection of both existing codebases, locked decisions from CONTEXT.md, and project-level research in STACK.md / ARCHITECTURE.md / PITFALLS.md

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use OKLCH color system for all design tokens. Convert PERT's hex values (#2563eb, #0f172a, etc.) to OKLCH equivalents.
- **D-02:** Delegate dark mode palette creation to the Impeccable skill. It should design dark mode variants for Clinical Blue, BMF Amber, and all neutrals.
- **D-03:** Per-calculator accent colors: PERT routes use Clinical Blue, Formula routes use Clinical Blue + BMF Amber based on mode. The nav shell uses a neutral shared accent (not tied to either calculator).
- **D-04:** Default theme follows system preference (`prefers-color-scheme`). User can override with a toggle.
- **D-05:** Theme toggle placement delegated to Impeccable skill during UI design.
- **D-06:** Inline `<script>` in `app.html` for FOUC prevention — reads localStorage before first paint.
- **D-07:** Tab icons delegated to Impeccable skill — it will select appropriate Lucide icons for PERT and Formula calculators.
- **D-08:** Placeholder routes (before calculators are ported in Phase 3) show skeleton cards mimicking the eventual calculator layout.
- **D-09:** Responsive nav: single component, bottom on mobile (<768px), top on desktop (>=768px), toggled via Tailwind responsive classes. Always-visible icon + text labels.
- **D-10:** Fresh SvelteKit scaffold via create-svelte. Do not clone either existing app. Add dependencies manually.
- **D-11:** Use Vite 8 (matches formula-calculator, latest features).
- **D-12:** pnpm as package manager (matches both existing apps, pnpm@10.33.0).

### Claude's Discretion

- localStorage key name for theme preference
- Exact breakpoint value for nav switch (768px default, can adjust)
- Placeholder skeleton card layout details
- Tailwind @custom-variant syntax for dark mode toggle mechanism
- Plus Jakarta Sans loading strategy (Google Fonts link vs self-hosted)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DS-01 | Unified color tokens (Clinical Blue, BMF Amber, slate neutrals) defined as CSS custom properties in app.css | formula-calculator/src/app.css provides the complete OKLCH Clinical Blue and BMF Amber scales; PERT app.css provides the CSS custom property token structure with light/dark variants |
| DS-02 | Dark/light theme toggle using Tailwind CSS 4 `@custom-variant` with class-based switching | STACK.md documents the `@custom-variant dark (&:where(.dark, .dark *))` pattern; PERT app.css demonstrates the `[data-theme]` selector approach that bridges to it |
| DS-03 | FOUC prevention via inline `<script>` in app.html that reads persisted theme preference | PITFALLS.md Pitfall 6 documents the exact inline script pattern; PERT app.html confirms `viewport-fit=cover` meta placement |
| DS-04 | Plus Jakarta Sans loaded from Google Fonts with tabular numerics for clinical output | formula-calculator/src/app.html shows the Google Fonts preload pattern; formula-calculator/src/app.css shows `--font-sans` and `.num` tabular-nums class |
| DS-05 | Touch targets minimum 48px, WCAG 2.1 AA contrast ratios in both themes | formula-calculator/src/app.css shows `button, select, input { @apply min-h-[48px] }` pattern; OKLCH color system enables perceptual contrast verification |
| NAV-01 | Bottom tab bar on mobile (<768px) with icon + always-visible text label per calculator | ARCHITECTURE.md Pattern 4 provides the exact CSS pattern; STACK.md documents the single-component responsive approach |
| NAV-02 | Top horizontal nav bar on desktop (>=768px) with same items | Same CSS pattern as NAV-01 — `md:hidden` / `hidden md:flex` responsive classes |
| NAV-03 | Static calculator registry (TypeScript manifest) enabling new calculator addition with one entry + one route | ARCHITECTURE.md documents the full `CalculatorEntry` interface and `CALCULATOR_REGISTRY` constant pattern |
| NAV-04 | iOS safe-area-inset handling for bottom nav in standalone PWA mode | PITFALLS.md Pitfall 8 and STACK.md document `pb-[env(safe-area-inset-bottom,0px)]` + `viewport-fit=cover`; PERT app.css has `.calc-safe-padding` pattern |
| NAV-05 | Active tab state visually indicated with accessible aria-selected | Active tab derived from `$page.url.pathname`; `aria-selected` on `<a>` elements in the nav loop |
</phase_requirements>

---

## Summary

Phase 1 creates the SvelteKit scaffold and three interdependent foundation layers: the unified design token system, the theme architecture, and the responsive nav shell. All three must exist before any calculator UI can be built.

The project has no SvelteKit scaffold yet — only a bare `package.json` with `packageManager: pnpm@10.33.0`. The first task is running `pnpm create svelte@latest` to produce the SvelteKit skeleton, then manually wiring in the exact dependency set from both existing apps. Both existing apps (pert-calculator, formula-calculator) are mature references: their `app.css` files, `app.html` templates, `svelte.config.js`, and `vite.config.ts` are the authoritative sources for this phase and MUST be read before each implementation task.

The FOUC prevention pattern, `@custom-variant` dark mode configuration, OKLCH token unification, safe-area inset handling, and the `CALCULATOR_REGISTRY` pattern are all thoroughly documented in the project-level research files and should be copied with precision rather than reinvented.

**Primary recommendation:** Scaffold first, then layer: (1) design tokens in `app.css`, (2) FOUC-prevention inline script + theme state module, (3) registry + NavShell, (4) root layout wiring, (5) placeholder routes. Each layer must be complete and working before the next begins.

---

## Standard Stack

### Core (locked — matches both existing apps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | ^2.55.0 | App framework, routing, adapter | Locked by both existing apps |
| Svelte (runes) | ^5.55.1 | Component model (`$state`, `$derived`, `$props`) | Locked by both existing apps |
| TypeScript | ^5.9.3 | Type safety | Locked by both existing apps |
| Vite | ^8.0.3 | Build tool | D-11: matches formula-calculator |
| Tailwind CSS | ^4.2.2 | Styling via `@tailwindcss/vite` | Locked by both existing apps |
| @tailwindcss/vite | ^4.2.2 | Tailwind CSS 4 Vite plugin | Locked pattern (no tailwind.config.js) |
| @sveltejs/adapter-static | ^3.0.10 | SPA output with `index.html` fallback | Locked by both existing apps |
| pnpm | 10.33.0 | Package manager | D-12 |

### New Dependencies for This Phase

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @lucide/svelte | ^1.7.0 | Nav tab icons | Official Svelte 5-native Lucide package (not `lucide-svelte` which targets Svelte 3/4) |

### Dev Dependencies

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| svelte-check | ^4.4.6 | Svelte type checking | Both existing apps use this |
| vitest | ^4.1.2 | Unit testing | Both existing apps use this |

### NOT Added in This Phase

| Library | Reason |
|---------|--------|
| @vite-pwa/sveltekit | Phase 4 (PWA infrastructure). Adding PWA in Phase 1 before routes are final creates config drift. |
| svelte-themes | Explicitly rejected — 20 lines of inline script replaces it entirely for adapter-static SPA |
| flowbite/shadcn/daisyUI | Explicitly rejected — clinical UI requires full contrast control |

**Installation (after scaffold):**
```bash
pnpm add @lucide/svelte
pnpm add -D @tailwindcss/vite tailwindcss svelte-check vitest jsdom
```

**Version verification (confirmed 2026-03-31):**
```
@lucide/svelte:          1.7.0  (npm view @lucide/svelte version)
@sveltejs/kit:           2.55.0
svelte:                  5.55.1
tailwindcss:             4.2.2
@sveltejs/adapter-static: 3.0.10
vite:                    8.0.3
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app.css                     # @import tailwindcss + @custom-variant + @theme tokens
├── app.html                    # FOUC-prevention inline script, Google Fonts, viewport-fit=cover
├── app.d.ts                    # Ambient type declarations
├── routes/
│   ├── +layout.svelte          # Root shell: theme init, NavShell, slot
│   ├── +layout.ts              # prerender=true, ssr=false
│   ├── +page.svelte            # Redirect to /pert (default calculator)
│   ├── pert/
│   │   └── +page.svelte        # Placeholder skeleton for PERT calculator
│   └── formula/
│       └── +page.svelte        # Placeholder skeleton for Formula calculator
└── lib/
    ├── shell/
    │   ├── NavShell.svelte     # Responsive nav (bottom mobile / top desktop)
    │   └── registry.ts         # CALCULATOR_REGISTRY constant
    └── shared/
        └── theme.svelte.ts     # $state singleton for theme (read/write localStorage)
```

> Phase 1 does NOT create `$lib/shared/components/`, `$lib/calculators/`, or PWA config. Those are Phases 2–4.

### Pattern 1: Scaffold Command

```bash
# D-10: Fresh scaffold, do not clone either existing app
pnpm create svelte@latest nicu-assistant
# Select: SvelteKit app (not demo), TypeScript, ESLint, Prettier, Vitest, Playwright
# Then: delete example routes, wire in correct dependencies manually
```

**After scaffold, copy these config files from formula-calculator (Vite 8 reference):**
- `svelte.config.js` — adapter-static with `fallback: 'index.html'`
- `vite.config.ts` — Vite 8 + `@tailwindcss/vite` + `sveltekit()` (WITHOUT SvelteKitPWA in Phase 1)
- `tsconfig.json` — TypeScript strict mode config

### Pattern 2: Tailwind CSS 4 Dark Mode + OKLCH Tokens (`app.css`)

**Source:** formula-calculator/src/app.css (OKLCH scale) + pert-calculator/src/app.css (token structure)

The unified `app.css` merges formula's OKLCH color scales into PERT's CSS custom property token structure. The result:

```css
@import "tailwindcss";

/* D-09 / DS-02: Class-based dark variant (not media-query based) */
/* Tailwind CSS 4 removes darkMode config; use @custom-variant instead */
@custom-variant dark (&:where(.dark, .dark *));

/* Or, matching PERT's data-theme approach (both work; data-theme is more explicit): */
/* @custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *)); */

@theme {
  /* DS-01: Clinical Blue — full scale from formula-calculator/src/app.css */
  --color-clinical-50:  oklch(97.5% 0.018 230);
  --color-clinical-100: oklch(93% 0.04 225);
  --color-clinical-200: oklch(86% 0.08 220);
  --color-clinical-300: oklch(77% 0.13 215);
  --color-clinical-400: oklch(67% 0.17 210);
  --color-clinical-500: oklch(59% 0.19 210);
  --color-clinical-600: oklch(49% 0.17 220);
  --color-clinical-700: oklch(40% 0.14 225);
  --color-clinical-800: oklch(30% 0.11 230);
  --color-clinical-900: oklch(22% 0.08 235);

  /* DS-01: BMF Amber — from formula-calculator/src/app.css */
  --color-bmf-50:  oklch(97% 0.02 80);
  --color-bmf-400: oklch(72% 0.18 65);
  --color-bmf-600: oklch(62% 0.16 60);
  /* ... full scale */

  /* Semantic surface tokens — values overridden per theme in @layer base */
  --color-surface:      var(--color-surface);
  --color-surface-alt:  var(--color-surface-alt);
  --color-surface-card: var(--color-surface-card);
  --color-border:       var(--color-border);
  --color-accent:       var(--color-accent);
  --color-accent-light: var(--color-accent-light);
  --color-on-surface:   var(--color-text-primary);
  --color-on-surface-secondary: var(--color-text-secondary);
  --color-error:        var(--color-error);

  /* DS-04: Typography */
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --text-2xs:     0.6875rem;   /* 11px — labels */
  --text-ui:      0.8125rem;   /* 13px — nav labels, field labels */
  --text-title:   1.375rem;    /* 22px — page h1 */
  --text-display: 2.75rem;     /* 44px — clinical result values */
}

@layer base {
  /* Light mode (default) — adapting pert-calculator's hex values → OKLCH */
  :root {
    --color-surface:      oklch(97.5% 0.006 225);
    --color-surface-alt:  oklch(90% 0.008 220);
    --color-surface-card: oklch(100% 0 0);
    --color-border:       oklch(80% 0.01 220);
    --color-text-primary:    oklch(18% 0.012 230);
    --color-text-secondary:  oklch(35% 0.01 225);
    --color-text-tertiary:   oklch(50% 0.008 225);
    --color-accent:       oklch(49% 0.17 220);    /* clinical-600 */
    --color-accent-light: oklch(86% 0.08 220);    /* clinical-200 */
    --color-error:        oklch(50% 0.20 25);
    --color-error-light:  oklch(90% 0.06 25);
  }

  /* Dark mode tokens — Impeccable skill will finalize values (D-02) */
  /* Placeholder values adapted from pert-calculator [data-theme="dark"] */
  [data-theme="dark"], .dark {
    --color-surface:      oklch(15% 0.01 243);
    --color-surface-alt:  oklch(20% 0.01 243);
    --color-surface-card: oklch(22% 0.012 243);
    --color-border:       oklch(30% 0.01 243);
    --color-text-primary:    oklch(92% 0.006 225);
    --color-text-secondary:  oklch(72% 0.008 225);
    --color-text-tertiary:   oklch(58% 0.006 225);
    --color-accent:       oklch(68% 0.16 243);
    --color-accent-light: oklch(25% 0.10 243);
    --color-error:        oklch(70% 0.18 25);
    --color-error-light:  oklch(25% 0.10 25);
  }

  /* DS-05: 48px touch targets */
  button, select, input { @apply min-h-[48px]; }

  html, body {
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    min-height: 100dvh;
    min-height: 100svh;  /* fallback for older browsers */
    -webkit-text-size-adjust: 100%;
  }
}

@layer components {
  /* From formula-calculator — keep in unified design system */
  .card {
    @apply bg-[var(--color-surface-card)] p-4 rounded-xl shadow-sm border border-[var(--color-border)];
  }
  .num {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
  }
  /* From pert-calculator — icon button pattern */
  .icon-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0.25rem;
    border-radius: 9999px;
    cursor: pointer;
    color: var(--color-text-tertiary);
  }
}
```

**Key decision on `@custom-variant` selector:** Use `.dark` class (not `data-theme`) as the Tailwind variant trigger, and also define `[data-theme="dark"]` as a CSS selector alias. This makes the inline FOUC script set `.dark` on `<html>` (which Tailwind recognizes) while also keeping `[data-theme]` for explicit CSS overrides. Both selectors point to the same token block.

### Pattern 3: FOUC Prevention Inline Script (`app.html`)

**Source:** Decision D-06; PITFALLS.md Pitfall 6

The inline script must be the very first thing in `<head>`, before any stylesheets. It reads localStorage and applies the `dark` class synchronously before first paint.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <!-- FOUC prevention: must be FIRST in head, before any CSS -->
    <script>
      (function () {
        var stored = localStorage.getItem('nicu_assistant_theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = stored ? stored === 'dark' : prefersDark;
        if (isDark) document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      })();
    </script>
    <!-- DS-04: Plus Jakarta Sans (Google Fonts) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <!-- NAV-04: viewport-fit=cover for iOS safe area insets -->
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <link rel="manifest" href="/manifest.webmanifest" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

**localStorage key (Claude's Discretion):** Use `nicu_assistant_theme` — consistent with the namespacing convention from PITFALLS.md Pitfall 9.

### Pattern 4: Theme State Module (`theme.svelte.ts`)

**Source:** ARCHITECTURE.md Pattern 1 (getter/setter wrapper for exported `$state`)

The `.svelte.ts` extension is required — rune syntax only compiles in `.svelte` and `.svelte.ts` files.

```typescript
// src/lib/shared/theme.svelte.ts
let _theme = $state<'light' | 'dark'>('light');

export const theme = {
  get current() { return _theme; },

  set(value: 'light' | 'dark') {
    _theme = value;
    try {
      localStorage.setItem('nicu_assistant_theme', value);
    } catch { /* storage quota or private mode — silent */ }
    document.documentElement.classList.toggle('dark', value === 'dark');
    document.documentElement.setAttribute('data-theme', value);
  },

  init() {
    const stored = localStorage.getItem('nicu_assistant_theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme.set(stored ?? (prefersDark ? 'dark' : 'light'));
  },

  toggle() {
    theme.set(_theme === 'dark' ? 'light' : 'dark');
  }
};
```

This is called in `+layout.svelte`'s `onMount` after DOM is available. The inline FOUC script handles first paint; this module handles subsequent reactive updates.

### Pattern 5: Calculator Registry (`registry.ts`)

**Source:** ARCHITECTURE.md Plugin-Like Calculator Registration System

```typescript
// src/lib/shell/registry.ts
import type { Component } from 'svelte';

export interface CalculatorEntry {
  id: string;         // route segment: /pert, /formula
  label: string;      // nav tab label (always visible — NAV-01/NAV-02)
  href: string;       // SvelteKit href
  icon: Component;    // Lucide icon component (D-07: Impeccable selects icons)
  description: string; // screen reader hint
}

// D-07: Icons to be confirmed by Impeccable skill
// Placeholders: FlaskConical for PERT, Milk or Baby for Formula
import { FlaskConical, Milk } from '@lucide/svelte';

export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  {
    id: 'pert',
    label: 'PERT',
    href: '/pert',
    icon: FlaskConical,
    description: 'PERT enzyme dosing calculator',
  },
  {
    id: 'formula',
    label: 'Formula',
    href: '/formula',
    icon: Milk,
    description: 'Infant formula recipe calculator',
  },
] as const;
```

### Pattern 6: NavShell Component (`NavShell.svelte`)

**Source:** ARCHITECTURE.md Pattern 4; STACK.md Responsive Navigation

Single component, two visual states via Tailwind responsive classes. Active state from `$page.url.pathname`.

```svelte
<!-- src/lib/shell/NavShell.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { CALCULATOR_REGISTRY } from './registry.js';
</script>

<!-- Mobile: fixed bottom bar (hidden on md+) -->
<nav
  class="fixed bottom-0 left-0 right-0 flex md:hidden
         border-t border-[var(--color-border)] bg-[var(--color-surface)]
         pb-[env(safe-area-inset-bottom,0px)]"
  aria-label="Calculator navigation"
>
  {#each CALCULATOR_REGISTRY as calc}
    {@const isActive = $page.url.pathname.startsWith(calc.href)}
    <a
      href={calc.href}
      class="flex flex-col items-center justify-center flex-1 gap-1
             min-h-[48px] py-2 text-ui font-medium
             {isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}"
      aria-label={calc.description}
      aria-selected={isActive}
      role="tab"
    >
      <calc.icon size={22} aria-hidden="true" />
      <span>{calc.label}</span>
    </a>
  {/each}
</nav>

<!-- Desktop: sticky top bar (hidden on mobile, visible on md+) -->
<nav
  class="hidden md:flex sticky top-0 left-0 right-0
         border-b border-[var(--color-border)] bg-[var(--color-surface)]
         px-4 gap-2 z-10"
  aria-label="Calculator navigation"
>
  {#each CALCULATOR_REGISTRY as calc}
    {@const isActive = $page.url.pathname.startsWith(calc.href)}
    <a
      href={calc.href}
      class="flex items-center gap-2 px-4 py-3 text-ui font-medium
             min-h-[48px] border-b-2 transition-colors
             {isActive
               ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
               : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-on-surface)]'}"
      aria-label={calc.description}
      aria-selected={isActive}
      role="tab"
    >
      <calc.icon size={18} aria-hidden="true" />
      <span>{calc.label}</span>
    </a>
  {/each}
</nav>
```

### Pattern 7: Root Layout (`+layout.svelte`)

**Source:** pert-calculator/src/routes/+layout.svelte (adapted — no DisclaimerModal or AboutSheet yet; those are Phase 2)

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import NavShell from '$lib/shell/NavShell.svelte';
  import { theme } from '$lib/shared/theme.svelte.js';

  let { children } = $props();
  let mounted = $state(false);

  onMount(() => {
    theme.init();
    mounted = true;
  });
</script>

<div class="min-h-screen flex flex-col">
  <NavShell />
  <!-- Content area: adds bottom padding on mobile to clear the fixed bottom nav -->
  <main class="flex-1 pb-20 md:pb-0 pt-0 md:pt-0">
    {@render children()}
  </main>
</div>
```

### Pattern 8: Placeholder Skeleton Routes

**D-08:** Placeholder routes mimic eventual calculator layout without any business logic.

```svelte
<!-- src/routes/pert/+page.svelte -->
<script lang="ts">
  import { FlaskConical } from '@lucide/svelte';
</script>

<svelte:head>
  <title>PERT Dosing | NICU Assistant</title>
</svelte:head>

<div class="max-w-md mx-auto px-4 py-6 space-y-4">
  <header class="flex items-center gap-3">
    <FlaskConical size={28} class="text-[var(--color-accent)]" aria-hidden="true" />
    <h1 class="text-title font-bold text-[var(--color-on-surface)]">PERT Dosing</h1>
  </header>

  <!-- Skeleton cards mimicking the eventual calculator layout -->
  <div class="card space-y-3" aria-hidden="true">
    <div class="h-4 bg-[var(--color-surface-alt)] rounded w-1/3 animate-pulse"></div>
    <div class="h-12 bg-[var(--color-surface-alt)] rounded animate-pulse"></div>
  </div>
  <div class="card space-y-3" aria-hidden="true">
    <div class="h-4 bg-[var(--color-surface-alt)] rounded w-1/2 animate-pulse"></div>
    <div class="h-12 bg-[var(--color-surface-alt)] rounded animate-pulse"></div>
  </div>
  <div class="card p-6 text-center">
    <p class="text-[var(--color-text-secondary)] text-sm">Calculator coming in Phase 3</p>
  </div>
</div>
```

### Pattern 9: `+layout.ts` (Static Prerender Config)

**Source:** Both existing apps — identical pattern.

```typescript
// src/routes/+layout.ts
export const prerender = true;
export const ssr = false;
```

### Pattern 10: `svelte.config.js`

**Source:** formula-calculator/svelte.config.js (adapter-static with `index.html` fallback)

```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html',
      pages: 'build',
      assets: 'build',
      precompress: false,
      strict: true
    }),
  }
};

export default config;
```

### Pattern 11: `vite.config.ts` (Phase 1 — no PWA yet)

**Source:** formula-calculator/vite.config.ts (adapted — SvelteKitPWA added in Phase 4)

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    // SvelteKitPWA added in Phase 4
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
```

### Anti-Patterns to Avoid

- **Cloning an existing app:** D-10 requires a fresh scaffold. Cloning brings stale dependencies and app-specific routing structures.
- **Using `.dark` class without the FOUC inline script:** The class must be applied synchronously before first paint; `onMount` in Svelte runs after paint.
- **Using `prefers-color-scheme` media query in CSS as the dark mode trigger:** The app needs user-overridable dark mode. Class-based `@custom-variant` is the correct Tailwind CSS 4 approach.
- **Mounting two nav components (mobile + desktop) and JS-toggling visibility:** Single component with CSS responsive classes only — avoids hydration layout shift.
- **Storing active tab in `$state`:** Active tab is always derived from `$page.url.pathname`. URL is the source of truth.
- **Skipping `viewport-fit=cover` in viewport meta:** Required for iOS safe-area-inset support (NAV-04).
- **Adding `@vite-pwa/sveltekit` in Phase 1:** The PWA plugin's `globPatterns` require finalized route structure. Adding it now with placeholder routes will generate an incorrect precache manifest.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Nav tab icons | Custom SVG sprites | `@lucide/svelte` v1.7.0 | Official Svelte 5-native package; consistent with formula-calculator which already uses `lucide-svelte` (same icons, different package name) |
| Color perceptual consistency | Manual hex contrast calculations | OKLCH color values | OKLCH guarantees perceptual uniformity; hex values do not (PERT currently uses hex for dark tokens — a known regression) |
| FOUC prevention | Complex SSR cookie approach | 4-line inline `<script>` in `app.html` | adapter-static has no server; inline script is the only viable approach |
| Theme state management | Third-party `svelte-themes` | `theme.svelte.ts` (20 lines) | `svelte-themes` adds a dependency for trivially implementable logic; inline approach is more auditable for clinical tool |

**Key insight:** The hardest part of this phase is not writing new code — it is correctly unifying two divergent token systems (PERT's hex-based `[data-theme]` vars vs. formula's OKLCH `@theme` scale) into a single coherent `app.css`. The OKLCH values from `formula-calculator/src/app.css` are the canonical source; PERT's hex values must be converted.

---

## Common Pitfalls

### Pitfall 1: FOUC in Dark Mode (Critical)

**What goes wrong:** Theme preference is stored in localStorage. SvelteKit renders HTML before JS runs. The HTML has no `dark` class; browser paints in light mode; then `onMount` sets `dark` — causing a white flash for dark-mode users.

**Why it happens:** `onMount` runs after the browser's first paint. Any theme application in Svelte components is too late.

**How to avoid:** The inline `<script>` in `app.html` (Pattern 3 above) must be the first child of `<head>`. It runs synchronously before any CSS is parsed or pixels are painted.

**Warning signs:** Hard-reload with `localStorage.setItem('nicu_assistant_theme', 'dark')` and watch the initial render. Any white frame = FOUC.

### Pitfall 2: Wrong Tailwind CSS 4 Dark Mode Config

**What goes wrong:** Tailwind CSS 4 removed `darkMode: 'class'` from the config file. The equivalent is `@custom-variant dark (...)` in `app.css`. Using the v3 approach (a `tailwind.config.js` file with `darkMode: 'class'`) silently does nothing — the `dark:` utilities are generated but never activate.

**Why it happens:** Breaking change from Tailwind CSS 3 to 4; the v3 config file is not an error but is ignored.

**How to avoid:** The `@custom-variant dark (&:where(.dark, .dark *))` declaration must be in `app.css`, not in any config file. Tailwind CSS 4 is fully CSS-first.

**Warning signs:** `dark:bg-slate-900` in component never takes effect when `.dark` class is on `<html>`.

### Pitfall 3: Missing `viewport-fit=cover` Breaks iOS Safe Area

**What goes wrong:** Without `viewport-fit=cover` in the viewport meta tag, `env(safe-area-inset-bottom)` resolves to `0` on iOS. The bottom nav floats above the home indicator but users cannot tap the bottom-most part (home indicator area obscures it).

**How to avoid:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />` in `app.html`. This is already in pert-calculator's `app.html`.

**Warning signs:** Bottom nav tabs partially obscured on iPhone X+ in standalone PWA mode.

### Pitfall 4: `@lucide/svelte` vs. `lucide-svelte` Package Name Confusion

**What goes wrong:** npm has both `lucide-svelte` (Svelte 3/4 era, still maintained) and `@lucide/svelte` (Svelte 5 native, current). formula-calculator uses `lucide-svelte` at ^1.0.1 — this works for Svelte 5 with a compatibility shim. For a new Svelte 5 project, use `@lucide/svelte` directly.

**How to avoid:** `pnpm add @lucide/svelte` (not `lucide-svelte`). Import as `import { FlaskConical } from '@lucide/svelte'`.

**Warning signs:** TypeScript errors about `$props()` not being recognized in icon components; slot-based icon API instead of props-based.

### Pitfall 5: Hex Tokens in `[data-theme="dark"]` Lose OKLCH Benefits

**What goes wrong:** PERT's existing dark mode tokens are hex values (`#0f172a`, `#60a5fa`). If these are copied as-is into the unified app, the dark mode palette is not OKLCH-consistent with the light mode tokens. The visual result is often fine but perceptual contrast ratios are not mathematically guaranteed.

**How to avoid:** D-01 mandates OKLCH for all tokens. Convert PERT's hex values to OKLCH (use a tool like `oklch.com` or CSS Color Level 4 spec). The dark mode palette values should be finalized by the Impeccable skill (D-02) — leave placeholder OKLCH values that are semantically correct in direction even if not final.

**Warning signs:** Dark mode accent color feels too bright or too dull compared to light mode.

### Pitfall 6: Plus Jakarta Sans Not Available Offline (Minor)

**What goes wrong:** The Google Fonts `<link>` in `app.html` requires a network request. Without PWA service worker (added in Phase 4), the font will not load offline. This is acceptable for Phase 1 but must be tracked.

**How to avoid:** Acceptable for Phase 1. Phase 4 (PWA) will either (a) precache the Google Fonts response via Workbox or (b) switch to self-hosted `@fontsource/plus-jakarta-sans`. Document this as a known Phase 4 dependency.

**Warning signs:** Font renders as system-ui on offline test.

### Pitfall 7: `body > div` Flex Layout from PERT App (Minor)

**What goes wrong:** PERT's `app.css` has `body > div { display: flex !important; flex-direction: column; min-height: 100dvh }`. The SvelteKit scaffold wraps `%sveltekit.body%` in `<div style="display: contents">`. These two rules interact: `display: contents` removes the box but the flex applies to the element — this can break layout if the wrapper is removed or changed.

**How to avoid:** Use `display: contents` on the SvelteKit body wrapper (which is the default from both existing apps) and drive layout from the root `+layout.svelte` div, not from CSS targeting `body > div`. The root layout component is the correct place to establish the full-height flex container.

---

## Code Examples

### Verified Pattern: OKLCH Color Scale (from formula-calculator/src/app.css)

```css
/* Source: /mnt/data/src/formula-calculator/src/app.css — verified 2026-03-31 */
--color-clinical-50: oklch(97.5% 0.018 230);
--color-clinical-600: oklch(49% 0.17 220);
--color-clinical-900: oklch(22% 0.08 235);
--color-bmf-400: oklch(72% 0.18 65);
--color-bmf-600: oklch(62% 0.16 60);
```

### Verified Pattern: PERT Dark Mode Token Structure (from pert-calculator/src/app.css)

```css
/* Source: /mnt/data/src/pert-calculator/src/app.css — verified 2026-03-31 */
/* Pattern: CSS custom properties redefined per [data-theme] — ADOPT THIS STRUCTURE */
[data-theme="dark"] {
  --color-surface: #0f172a;      /* → convert to oklch(15% 0.01 243) */
  --color-accent: #60a5fa;       /* → convert to oklch(68% 0.16 243) */
}
[data-theme="light"] {
  --color-surface: #f8fafc;      /* → convert to oklch(97.5% 0.006 225) */
  --color-accent: #2563eb;       /* → convert to oklch(49% 0.17 220) */
}
```

### Verified Pattern: PERT Layout Structure (from pert-calculator/src/routes/+layout.svelte)

```typescript
// Source: /mnt/data/src/pert-calculator/src/routes/+layout.svelte — verified 2026-03-31
// Phase 1 uses this onMount pattern but without DisclaimerModal/AboutSheet (Phase 2)
onMount(() => {
  async function init() {
    // Step 1: Check localStorage (disclaimer in PERT; theme in unified app)
    // Step 2: Load polyfills conditionally
    // Step 3: Register PWA SW (deferred to Phase 4 in unified app)
  }
  void init();
});
```

### Verified Pattern: formula-calculator Vite + PWA Config (vite.config.ts)

```typescript
// Source: /mnt/data/src/formula-calculator/vite.config.ts — verified 2026-03-31
// Phase 1 uses this WITHOUT SvelteKitPWA (added in Phase 4)
plugins: [
  tailwindcss(),
  sveltekit(),
  // SvelteKitPWA omitted until Phase 4 — route structure must be final first
]
```

### Verified Pattern: About-Sheet Event Bus (from pert-calculator/src/lib/about-sheet.ts)

```typescript
// Source: /mnt/data/src/pert-calculator/src/lib/about-sheet.ts — verified 2026-03-31
// Copy verbatim to src/lib/shared/about-sheet.ts in Phase 2
let openAboutHandler: (() => void) | null = null;
export function registerOpenAboutHandler(handler: (() => void) | null) {
  openAboutHandler = handler;
}
export function requestOpenAbout() { openAboutHandler?.(); }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `darkMode: 'class'` in `tailwind.config.js` | `@custom-variant dark (...)` in `app.css` | Tailwind CSS 4.0 (early 2025) | No config file needed; CSS-first |
| `lucide-svelte` for Svelte 5 | `@lucide/svelte` for Svelte 5 | Lucide 0.400+ (2024) | Different package name, same icon set |
| `svelte-themes` for dark mode | Inline `<script>` + `.svelte.ts` module | Architecture decision for this project | No external dependency; more auditable |
| Hex color values in dark tokens | OKLCH throughout | Project decision D-01 | Perceptual consistency across themes |

**Deprecated/outdated:**
- `darkMode: 'class'` in `tailwind.config.js`: Not valid in Tailwind CSS 4 — silently ignored
- `lucide-svelte` for new Svelte 5 projects: Superseded by `@lucide/svelte`

---

## Open Questions

1. **Dark mode OKLCH palette (D-02 — Impeccable skill)**
   - What we know: Placeholder values exist from PERT's hex tokens converted to approximate OKLCH equivalents
   - What's unclear: Final dark mode shades for Clinical Blue, BMF Amber, and all slate neutrals — requires Impeccable skill to make perceptual design decisions
   - Recommendation: Implement placeholder OKLCH dark values first; mark with a `/* TODO: Impeccable */` comment so the planner can create a dedicated design task

2. **Icon selection for PERT and Formula nav tabs (D-07 — Impeccable skill)**
   - What we know: `FlaskConical` and `Milk` are functional placeholders from `@lucide/svelte`
   - What's unclear: Impeccable may select different icons that better convey "enzyme dosing" and "infant formula" in a clinical context
   - Recommendation: Use placeholder icons in Phase 1; document that icon names in `registry.ts` are to be confirmed by Impeccable before Phase 1 is marked complete

3. **Theme toggle placement (D-05 — Impeccable skill)**
   - What we know: The toggle button must exist somewhere in the NavShell or a header area
   - What's unclear: Whether it goes in the top desktop nav, as a standalone header button, or as a settings-page item
   - Recommendation: Wire `theme.toggle()` to a basic button in the NavShell top bar for now; Impeccable will determine final placement

4. **Plus Jakarta Sans loading strategy (Claude's Discretion)**
   - What we know: Google Fonts works for Phase 1 (pre-PWA); offline font serving is deferred to Phase 4
   - What's unclear: Whether Phase 4 will use Workbox Google Fonts caching or switch to self-hosted `@fontsource/plus-jakarta-sans`
   - Recommendation: Use Google Fonts `<link>` in Phase 1. Add a `/* TODO Phase 4: Consider @fontsource/plus-jakarta-sans for offline */` comment.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| pnpm | Package manager (D-12) | Yes | 10.33.0 | — |
| Node.js | SvelteKit build | Yes | 24.14.1 | — |
| create-svelte | Scaffold (D-10) | Yes | 7.0.1 (npm) | `pnpm dlx sv create` |

**No blocking dependencies missing.**

---

## Sources

### Primary (HIGH confidence)
- `/mnt/data/src/formula-calculator/src/app.css` — OKLCH Clinical Blue + BMF Amber scales (verified 2026-03-31)
- `/mnt/data/src/pert-calculator/src/app.css` — CSS custom property token structure with `[data-theme]` selectors (verified 2026-03-31)
- `/mnt/data/src/pert-calculator/src/routes/+layout.svelte` — Root layout onMount pattern (verified 2026-03-31)
- `/mnt/data/src/formula-calculator/vite.config.ts` — Vite 8 + @tailwindcss/vite config (verified 2026-03-31)
- `/mnt/data/src/formula-calculator/svelte.config.js` — adapter-static with index.html fallback (verified 2026-03-31)
- `/mnt/data/src/pert-calculator/src/app.html` — `viewport-fit=cover` meta pattern (verified 2026-03-31)
- `/mnt/data/src/formula-calculator/src/app.html` — Google Fonts preload pattern (verified 2026-03-31)
- `.planning/research/STACK.md` — @lucide/svelte rationale, @custom-variant pattern, responsive nav pattern
- `.planning/research/ARCHITECTURE.md` — Directory structure, registry pattern, theme flow, build order
- `.planning/research/PITFALLS.md` — FOUC prevention, Tailwind 4 dark mode gotchas, iOS safe area, OKLCH migration
- `.planning/phases/01-foundation/01-CONTEXT.md` — Locked decisions D-01 through D-12

### Secondary (MEDIUM confidence)
- https://tailwindcss.com/docs/dark-mode — `@custom-variant` required for Tailwind CSS 4 class-based dark mode
- https://lucide.dev/guide/packages/lucide-svelte — `@lucide/svelte` as official Svelte 5 package
- https://svelte.dev/docs/svelte/typescript — Svelte 5 `Component` type for registry pattern

### Tertiary (LOW confidence)
- None — all findings verified against primary sources above

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified npm registry versions match both existing apps' locked dependencies
- Architecture: HIGH — patterns lifted directly from existing production codebases
- Design tokens: HIGH — OKLCH values copied from formula-calculator/src/app.css (source of truth)
- FOUC prevention: HIGH — inline script pattern verified against PERT's app.html and Tailwind v4 docs
- Dark mode Tailwind config: HIGH — `@custom-variant` verified against official Tailwind CSS 4 docs
- Nav shell pattern: HIGH — CSS-only responsive approach documented in ARCHITECTURE.md with verified code
- Placeholder dark values: MEDIUM — approximate OKLCH conversions of PERT's hex tokens; Impeccable will finalize

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable ecosystem — SvelteKit, Tailwind, Lucide are not fast-moving)
