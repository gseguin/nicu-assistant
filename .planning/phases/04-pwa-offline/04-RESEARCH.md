# Phase 4: PWA & Offline - Research

**Researched:** 2026-03-31
**Domain:** @vite-pwa/sveltekit, Workbox, Web App Manifest, Service Worker update lifecycle
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use `registerType: 'prompt'` in @vite-pwa/sveltekit config. This gives the app control over when updates activate.
- **D-02:** Auto-reload when idle (no inputs filled). If user is mid-calculation, show a non-intrusive update banner instead. Never silently reload during active use.
- **D-03:** The update banner should be minimal — "Update available" with a reload button. Not modal, not blocking.
- **D-04:** Delegate PWA icon design (192px, 512px, 180px apple-touch) to the Impeccable skill. Use placeholders during implementation, replace with Impeccable-designed icons.
- **D-05:** Manifest name: "NICU Assistant". Short name: "NICU Assist" (for home screen).
- **D-06:** Theme color and background color follow the design system — use the surface token values. Dark theme meta should match dark mode surface.

### Claude's Discretion
- Exact Workbox caching strategies (precache vs runtime cache split)
- Service worker scope and navigation fallback
- Manifest display, orientation, start_url values
- Update banner component placement and styling
- How to detect "idle" vs "mid-calculation" for auto-reload logic
- Placeholder icon generation approach

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PWA-01 | Service worker with precaching of all app assets via Workbox | SvelteKitPWA plugin with `generateSW` strategy + `globPatterns` covering `client/**` prefix handles this automatically |
| PWA-02 | Web app manifest with icons (192px, 512px, 180px apple-touch), standalone display, portrait orientation | Manifest config in `SvelteKitPWA()` options; `virtual:pwa-info` injects manifest link tag into `<svelte:head>` |
| PWA-03 | Active update prompt when new service worker detected (clinical safety: prevent stale formulas) | `registerType: 'prompt'` + `onNeedRefresh` callback from `virtual:pwa-register` drives the banner; idle detection guards auto-reload |
| PWA-04 | App works fully offline after first load | Precaching all `client/**` assets + Google Fonts runtime CacheFirst strategy covers this; `navigateFallback: 'index.html'` handles SPA routing |
</phase_requirements>

---

## Summary

This phase adds PWA infrastructure to an existing SvelteKit + adapter-static app that deliberately deferred PWA until all calculators were complete. The @vite-pwa/sveltekit plugin (`^1.1.0` — current published version confirmed) handles service worker generation, manifest injection, and Workbox precaching. Three files need to be created or modified: `vite.config.ts` (add SvelteKitPWA plugin), `svelte.config.js` (add `serviceWorker.register: false`), and `src/routes/+layout.svelte` (import `virtual:pwa-info` and register SW with `onNeedRefresh` callback).

The most important decision is already locked: `registerType: 'prompt'`. This means the app receives a callback when a new SW is waiting, and must decide whether to reload immediately (idle) or show a banner (mid-calculation). The idle/busy check should read directly from the existing calculator state singletons (`pertState`, `formulaState`) — these are already in `$lib/shared/` and are accessible from `+layout.svelte`.

The hardest part of this phase is not the PWA wiring (straight from reference apps) — it is the update banner component and the idle detection logic. The banner must be clinically appropriate (calm, non-alarming), must not block or interrupt a calculation, and must satisfy D-02 (auto-reload if idle). Both reference apps use `registerType: 'autoUpdate'` which skips this entirely, so there is no copy-paste reference for the prompt logic — it must be written fresh.

**Primary recommendation:** Follow the pert-calculator config as the base (absolute paths, `start_url: "/"`, `scope: "/"`), change `registerType` to `'prompt'`, add `onNeedRefresh` wiring in `+layout.svelte`, and build a minimal `UpdateBanner.svelte` component that sits at the bottom of the shell above the tab bar.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @vite-pwa/sveltekit | ^1.1.0 | SvelteKit PWA plugin — generates SW, manifest, virtual modules | Already in STACK.md as locked dependency; current npm version confirmed 1.1.0 |
| vite-plugin-pwa | ^1.2.0 | Underlying Vite PWA plugin (peer dep, auto-installed) | Required by @vite-pwa/sveltekit |
| workbox-build | ^7.4.0 | Workbox precaching (bundled with vite-plugin-pwa) | Industry standard for SW precaching; no separate install needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| virtual:pwa-info | (virtual) | Exposes `pwaInfo.webManifest.linkTag` for manifest injection | Always use in `+layout.svelte` svelte:head instead of hardcoding manifest link |
| virtual:pwa-register | (virtual) | Exports `registerSW({ onNeedRefresh, onOfflineReady })` | Use in `+layout.svelte` onMount for SW lifecycle |
| virtual:pwa-register/svelte | (virtual) | Exports `useRegisterSW()` reactive wrapper | Only if a dedicated `.svelte.ts` store is preferred; not required for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| generateSW strategy | injectManifest strategy | injectManifest gives full custom SW file control but requires writing the full SW. generateSW is zero-config and sufficient for this app — all clinical data is embedded in JS bundles, no custom SW logic needed. |
| virtual:pwa-info manifest injection | Hardcoded `<link rel="manifest">` in app.html | Hardcoding works but doesn't get the hash-versioned URL that virtual:pwa-info provides. Use virtual:pwa-info. |

**Installation:**
```bash
pnpm add -D @vite-pwa/sveltekit
```

**Version verification:** `@vite-pwa/sveltekit` confirmed at `1.1.0` on npm registry (2026-03-31). `vite-plugin-pwa` confirmed at `1.2.0` — this is a peer dependency that pnpm resolves automatically.

---

## Architecture Patterns

### Files to Create / Modify

```
vite.config.ts                          # add SvelteKitPWA plugin (3rd plugin after tailwindcss, sveltekit)
svelte.config.js                        # add kit.serviceWorker.register: false
src/routes/+layout.svelte               # import virtual:pwa-info, registerSW with onNeedRefresh
src/lib/shared/pwa.svelte.ts            # (new) reactive SW update state — needsRefresh $state + updateSW ref
src/lib/shell/UpdateBanner.svelte       # (new) minimal update notification component
static/pwa-192x192.png                  # placeholder icon (192x192)
static/pwa-512x512.png                  # placeholder icon (512x512)
static/apple-touch-icon.png             # placeholder icon (180x180)
```

### Pattern 1: SvelteKitPWA Plugin Config (vite.config.ts)

**What:** Add SvelteKitPWA as third plugin with manifest, workbox, and SPA mode config.
**When to use:** Single entry point for all PWA config.

```typescript
// Source: reference from /mnt/data/src/pert-calculator/vite.config.ts + official SvelteKit docs
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

SvelteKitPWA({
  registerType: 'prompt',           // D-01: locked decision
  manifest: {
    name: 'NICU Assistant',         // D-05
    short_name: 'NICU Assist',      // D-05
    description: 'Clinical PERT dosing and infant formula recipe calculator for NICU staff.',
    display: 'standalone',          // PWA-02
    orientation: 'portrait',        // PWA-02
    start_url: '/',
    scope: '/',
    theme_color: '#0a192a',         // D-06: approximate of oklch(15% 0.01 243) dark surface
    background_color: '#0a192a',    // D-06: match dark surface (app launches dark by default)
    lang: 'en',
    icons: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  workbox: {
    // CRITICAL: must use client/ prefix — see Pitfall 4 in PITFALLS.md
    globPatterns: ['client/**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
    cleanupOutdatedCaches: true,
    // NOTE: do NOT add skipWaiting/clientsClaim here — registerType:'prompt' handles activation
    navigateFallback: 'index.html',
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: { cacheName: 'google-fonts-stylesheets' },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
    ],
  },
  // SPA mode: adapter-static outputs to build/ with index.html fallback
  kit: {
    spa: true,
  },
})
```

**theme_color hex values:** `oklch(15% 0.01 243)` dark surface converts to approximately `#0d1117`. `oklch(97.5% 0.006 225)` light surface converts to approximately `#f5f7f8`. Use the dark surface value as default since PERT calculator established dark as primary mode for clinical use.

### Pattern 2: svelte.config.js — Disable Built-in SW Registration

**What:** Prevent SvelteKit's own service worker from conflicting with Workbox-generated SW.
**When to use:** Always required when using @vite-pwa/sveltekit.

```javascript
// Source: https://vite-pwa-org.netlify.app/frameworks/sveltekit.html
const config = {
  kit: {
    adapter: adapter({ ... }),  // existing — unchanged
    serviceWorker: {
      register: false           // ADD THIS — prevents double-registration conflict
    }
  }
};
```

### Pattern 3: +layout.svelte — Manifest Injection + SW Registration

**What:** Inject manifest link tag via `virtual:pwa-info`, register SW with update callback.
**When to use:** Root layout — runs on every page.

```svelte
<!-- Source: https://vite-pwa-org.netlify.app/frameworks/sveltekit.html + onNeedRefresh pattern -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { pwaInfo } from 'virtual:pwa-info';
  import { pwa } from '$lib/shared/pwa.svelte.js';
  // ... existing imports

  onMount(() => {
    theme.init();
    disclaimer.init();

    // SW registration — dynamic import avoids SSG/SSR issues
    if (pwaInfo) {
      import('virtual:pwa-register').then(({ registerSW }) => {
        const updateSW = registerSW({
          onNeedRefresh() {
            pwa.setUpdateAvailable(updateSW);
          },
          onOfflineReady() {
            // optional: could log for debugging
          },
        });
      });
    }
  });

  $: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
  {@html webManifest}
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="NICU Assist" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>
```

### Pattern 4: pwa.svelte.ts — Reactive Update State

**What:** A `$state` singleton (same pattern as `theme.svelte.ts`) that bridges the SW callback to any component.
**When to use:** Shared state for the update banner and idle-detection logic.

```typescript
// src/lib/shared/pwa.svelte.ts
// Follows the established $state singleton pattern from theme.svelte.ts and disclaimer.svelte.ts

let needsRefresh = $state(false);
let _updateSW: (() => Promise<void>) | null = null;

export const pwa = {
  get needsRefresh() { return needsRefresh; },

  setUpdateAvailable(updateFn: () => Promise<void>) {
    _updateSW = updateFn;
    needsRefresh = true;
  },

  async applyUpdate() {
    if (_updateSW) {
      await _updateSW(true);   // true = force reload
    }
  },

  dismiss() {
    needsRefresh = false;
  },
};
```

### Pattern 5: Idle Detection — Reading Existing Calculator State

**What:** Determine if user has active inputs before auto-reloading on update.
**When to use:** In the UpdateBanner component or +layout.svelte when `pwa.needsRefresh` becomes true.

The idle state is already encoded in the calculator state singletons. The app is "idle" when all numeric inputs across both calculators are at their default/empty values.

```typescript
// Import the existing state singletons
import { pertState } from '$lib/pert/state.svelte.js';
import { formulaState } from '$lib/formula/state.svelte.js';

// Derived idle check — true when no meaningful inputs are present
const isIdle = $derived(
  pertState.isDefault() && formulaState.isDefault()
);

// When update is available:
$effect(() => {
  if (pwa.needsRefresh && isIdle) {
    pwa.applyUpdate();  // silent auto-reload — D-02
  }
  // if not idle: UpdateBanner renders and user decides
});
```

**Note:** The exact API (`isDefault()`) depends on what the state singletons expose. If they don't have an `isDefault()` method, the idle check can compare key fields against their initial values. The planner should verify actual state shape in `src/lib/pert/` and `src/lib/formula/`.

### Pattern 6: UpdateBanner.svelte — Minimal Non-Blocking Banner

**What:** A slim sticky bar above the tab bar (mobile) or below the top nav (desktop) that appears only when `pwa.needsRefresh && !isIdle`.
**When to use:** Only when a new SW is waiting AND user has active inputs.

```svelte
<!-- src/lib/shell/UpdateBanner.svelte -->
<!-- D-03: minimal, not modal, not blocking -->
<script lang="ts">
  import { pwa } from '$lib/shared/pwa.svelte.js';
</script>

{#if pwa.needsRefresh}
  <div
    role="status"
    aria-live="polite"
    class="
      fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4rem)] left-0 right-0
      md:bottom-auto md:top-14
      flex items-center justify-between gap-3
      px-4 py-2.5
      bg-surface-card border-t border-border
      text-text-secondary text-sm
      z-40
    "
  >
    <span>A newer version is available.</span>
    <button
      onclick={() => pwa.applyUpdate()}
      class="
        text-accent font-semibold text-sm
        min-h-[36px] px-3
        rounded-lg hover:bg-accent-light
        transition-colors
      "
    >
      Update now
    </button>
  </div>
{/if}
```

**Placement:** The `fixed bottom-[calc(...)]` offset positions the banner just above the mobile tab bar. `md:top-14` positions it just below the desktop top nav. Both positions are non-blocking.

### Pattern 7: Placeholder Icon Generation

**What:** Create simple placeholder PNGs for the three required icon sizes so the manifest is valid before Impeccable designs the final icons.
**When to use:** During implementation, as stand-ins.

**Approach (Claude's discretion):** Use a Node script or canvas API to generate a solid-colored square with "N" text in the brand color. Alternatively, copy a public-domain SVG and rasterize it at build time. The simplest approach is a `scripts/generate-placeholders.js` that uses the `sharp` npm package (devDependency) to create minimal PNGs.

The Impeccable skill will replace these files; the important thing is that valid PNG files exist at the expected paths before `pnpm build`.

### Anti-Patterns to Avoid

- **Adding `skipWaiting: true` + `clientsClaim: true` to workbox config when using `registerType: 'prompt'`:** These two approaches are mutually exclusive. `registerType: 'prompt'` works by keeping the new SW in "waiting" state until the app calls `updateSW(true)`. Adding `skipWaiting` bypasses that wait and causes the SW to activate immediately, making the `onNeedRefresh` callback never fire. The reference apps (pert-calculator, formula-calculator) use `registerType: 'autoUpdate'` with `skipWaiting/clientsClaim` — do NOT copy that workbox block verbatim.
- **Omitting the `client/` prefix from globPatterns:** Without this prefix, server-side build artifacts get pulled into the precache manifest, causing 404s when the SW tries to pre-fetch them (PITFALLS.md Pitfall 4).
- **Hardcoding `<link rel="manifest">` in app.html instead of using virtual:pwa-info:** The hardcoded path won't get the content-hashed URL that the plugin generates. Use `{@html webManifest}` in `<svelte:head>`.
- **Calling `registerSW` outside of `onMount` or without a browser guard:** The virtual modules are only available client-side. Always wrap in `onMount` or a `typeof window !== 'undefined'` check.
- **Using `injectRegister: false` without a manual registration:** The formula-calculator uses `injectRegister: false` but then has no visible client-side registration code (it relies on auto-registration). For this app, use the default (no `injectRegister` override) so the plugin handles registration automatically alongside the `virtual:pwa-register` import.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Asset precaching with cache versioning | Custom service worker with `cache.put()` | Workbox via SvelteKitPWA | Workbox handles cache busting by content hash, cleanup of outdated caches, and retry logic. Hand-rolled SW always misses edge cases (partial cache failure, partial update). |
| Manifest link injection | `<link rel="manifest" href="/manifest.webmanifest">` in app.html | `virtual:pwa-info` + `{@html webManifest}` | The plugin generates a content-hashed manifest URL. Hardcoding the path bypasses cache busting. |
| SW registration with update lifecycle | `navigator.serviceWorker.register()` directly | `registerSW()` from `virtual:pwa-register` | The virtual module handles the `waiting` state detection, `skipWaiting` messaging, and `controllerchange` reload — about 50 lines of reliable code you don't have to maintain. |
| Icon generation for all sizes | Photoshop / Figma export each size | Single source SVG → rasterize in CI or a build script | The Impeccable skill will provide the final artwork. Placeholders just need to be valid PNGs at the right paths. |

**Key insight:** The SvelteKitPWA plugin handles 90% of this phase's complexity. The remaining 10% (idle detection, update banner, placeholder icons) are app-specific and must be written, but they are all straightforward Svelte 5 `$state` patterns already established in this codebase.

---

## Common Pitfalls

### Pitfall 1: Copying workbox config from reference apps breaks prompt strategy
**What goes wrong:** The pert-calculator and formula-calculator both use `registerType: 'autoUpdate'` with `skipWaiting: true` and `clientsClaim: true`. Copying their workbox config into this app makes the SW activate immediately on install, which means `onNeedRefresh` never fires and the update banner never shows. Clinical safety requirement (PWA-03) silently fails.
**Why it happens:** Both reference apps chose a simpler update strategy (auto-update). This app deliberately chose `prompt`. The difference is subtle — one config key.
**How to avoid:** In workbox config, do NOT include `skipWaiting` or `clientsClaim`. The `registerType: 'prompt'` setting in SvelteKitPWA handles the waiting lifecycle.
**Warning signs:** `onNeedRefresh` callback never fires during testing. Deploy a change, hard-reload a second tab — if the banner doesn't appear, skipWaiting is active.

### Pitfall 2: `globPatterns` missing `client/` prefix breaks offline
**What goes wrong:** Without the `client/` prefix, Workbox picks up server-side build artifacts. The generated SW precache list contains paths that 404 in the browser, causing the SW install to fail. The app goes offline-incapable.
**Why it happens:** SvelteKit's build output has both `client/` and `server/` subdirs. The pert-calculator uses `**/*.{js,css,html,...}` without the prefix — this works for that app because it has no server output (adapter-static). The formula-calculator also omits it for the same reason. For this app, being explicit is safer.
**How to avoid:** Use `globPatterns: ['client/**/*.{js,css,html,ico,png,svg,webmanifest,woff2}']`.
**Warning signs:** After `pnpm build`, inspect the generated `build/sw.js` — the precache manifest should list paths like `client/_app/...`. If you see bare `_app/...` paths or server paths, the prefix is wrong.

### Pitfall 3: Missing `serviceWorker.register: false` in svelte.config.js causes double-registration
**What goes wrong:** SvelteKit has its own service worker registration mechanism. If you don't disable it, both SvelteKit's SW and the Workbox-generated SW attempt to register. This causes conflicts in the browser's SW scope and unpredictable cache behavior.
**How to avoid:** Add `kit: { serviceWorker: { register: false } }` to `svelte.config.js`.
**Warning signs:** DevTools Application > Service Workers shows two registered workers.

### Pitfall 4: Theme color in manifest doesn't match OKLCH tokens
**What goes wrong:** The web app manifest requires hex or rgb color values — it does not accept `oklch()`. If the theme_color is set wrong, the browser chrome color on Android won't match the app's actual dark surface color, looking inconsistent.
**How to avoid:** Convert the OKLCH tokens to hex at research/planning time (not at runtime). The dark surface `oklch(15% 0.01 243)` ≈ `#0d1117`. The light surface `oklch(97.5% 0.006 225)` ≈ `#f5f7f8`. Since the PERT app established dark as the primary mode, use dark surface values. Both are close enough that any online OKLCH-to-hex converter will give sufficient accuracy.
**Warning signs:** On Android, the status bar color noticeably mismatches the app background when launched from the home screen.

### Pitfall 5: `virtual:pwa-info` TypeScript types not found
**What goes wrong:** TypeScript reports `Cannot find module 'virtual:pwa-info'` or similar. The types are provided by the plugin but may need explicit reference.
**How to avoid:** After installing `@vite-pwa/sveltekit`, run `pnpm svelte-kit sync` — this regenerates `.svelte-kit/tsconfig.json` which should include the plugin's type declarations. If types are still missing, add `/// <reference types="vite-plugin-pwa/client" />` to `src/app.d.ts`.
**Warning signs:** Red squiggles under `import { pwaInfo } from 'virtual:pwa-info'` in the IDE after installing the package.

---

## Code Examples

### Complete vite.config.ts (Phase 4 final state)

```typescript
// Source: adapted from /mnt/data/src/pert-calculator/vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
  plugins: [
    tailwindcss(),    // Must come before sveltekit()
    sveltekit(),
    SvelteKitPWA({
      registerType: 'prompt',
      manifest: {
        name: 'NICU Assistant',
        short_name: 'NICU Assist',
        description: 'Clinical PERT dosing and infant formula recipe calculator for NICU staff.',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        lang: 'en',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['client/**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      kit: { spa: true },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['src/test-setup.ts'],
  },
  resolve: {
    conditions: ['browser'],
  },
});
```

### registerSW with onNeedRefresh (in +layout.svelte onMount)

```typescript
// Source: https://vite-pwa-org.netlify.app/guide/prompt-for-update.html
// Dynamic import required — virtual modules are client-only
if (pwaInfo) {
  const { registerSW } = await import('virtual:pwa-register');
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      pwa.setUpdateAvailable(updateSW);
    },
    onOfflineReady() {
      // app is ready to work offline — no UI needed
    },
  });
}
```

### app.html additions for PWA

```html
<!-- Add inside <head>, after existing meta tags -->
<!-- These complement the manifest link tag injected by virtual:pwa-info -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="NICU Assist" />
<!-- apple-touch-icon injected via +layout.svelte svelte:head -->
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `registerType: 'autoUpdate'` (both reference apps) | `registerType: 'prompt'` (this app — locked D-01) | Design decision | Requires explicit `onNeedRefresh` handling; SW stays in waiting until app calls `updateSW(true)` |
| Manual `navigator.serviceWorker.register()` | `registerSW()` from `virtual:pwa-register` | @vite-pwa introduced ~2022 | Handles all lifecycle edge cases automatically |
| Static manifest path in `<link>` | `virtual:pwa-info` dynamic injection | @vite-pwa/sveltekit v1.x | Content-hashed manifest URL; cleaner injection via `svelte:head` |
| `injectRegister: false` (formula-calculator pattern) | Default `injectRegister` (auto) | — | Simpler setup; plugin handles registration automatically |

**Deprecated/outdated:**
- `skipWaiting: true` in workbox config when using `registerType: 'prompt'`: these two settings conflict. Do not combine them.
- `injectRegister: false` without corresponding manual registration: the formula-calculator uses this but it only works because it also uses `autoUpdate`. For `prompt` strategy, rely on `virtual:pwa-register`.

---

## Open Questions

1. **Exact idle detection API from state singletons**
   - What we know: State singletons exist in `src/lib/pert/` and `src/lib/formula/`, following the `$state` rune pattern established in Phases 2-3.
   - What's unclear: Whether they expose an `isDefault()` or similar method, or whether the planner/implementer needs to construct the idle check from individual field values.
   - Recommendation: Planner should inspect the actual state singleton files (`pertState`, `formulaState`) and document what constitutes "idle" for each. If no `isDefault()` method exists, the idle check compares the key input fields against their zero/empty initial values.

2. **Placeholder icon generation tooling**
   - What we know: Three PNG files are needed at `static/pwa-192x192.png`, `static/pwa-512x512.png`, `static/apple-touch-icon.png` (180x180). The Impeccable skill will replace them later.
   - What's unclear: Whether to use a Node script, a canvas-based generator, or simply copy existing PNGs from the reference apps as temporary placeholders.
   - Recommendation: Simplest approach — copy `pwa-192x192.png` and `pwa-512x512.png` from `/mnt/data/src/pert-calculator/static/` as placeholders. They're already valid PNG files at the right sizes. Rename apple-touch-icon.png from the same source.

3. **`start_url` vs relative `./` for installability**
   - What we know: pert-calculator uses `start_url: "/"` with absolute scope. formula-calculator uses `start_url: "./"` with relative scope `"./"`. The pert-calculator pattern is the stricter/more standard approach.
   - What's unclear: Whether the adapter-static output path (`build/`) affects how the manifest `start_url` resolves.
   - Recommendation: Use `start_url: "/"` and `scope: "/"` (pert-calculator pattern). The `fallback: 'index.html'` in svelte.config.js handles all SPA routes from root.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @vite-pwa/sveltekit | PWA-01, PWA-02, PWA-03 | ✗ (not yet installed) | — | None — must install |
| Node.js | Build tooling | ✓ | Confirmed (project runs) | — |
| pnpm | Package install | ✓ | 10.33.0 | — |
| static/ icon files | PWA-02 | ✗ (only favicon.png exists) | — | Copy from pert-calculator as placeholders |

**Missing dependencies with no fallback:**
- `@vite-pwa/sveltekit` — must be installed with `pnpm add -D @vite-pwa/sveltekit` before any build. Wave 0 task.

**Missing dependencies with fallback:**
- Icon PNGs — copy from pert-calculator static/ as placeholder files; Impeccable skill replaces later.

---

## Project Constraints (from CLAUDE.md)

These directives apply to all implementation in this phase:

- **Package manager:** pnpm — use `pnpm add`, not `npm install`
- **Tech stack locked:** SvelteKit 2 + Svelte 5 (runes) + Tailwind CSS 4 + Vite — no additions outside @vite-pwa/sveltekit
- **No additional UI component libraries** — UpdateBanner.svelte is a custom component
- **Svelte 5 runes syntax** — use `$state`, `$derived`, `$effect`; not legacy `writable` stores
- **Offline-first** — all clinical data embedded at build time (already true; Workbox precache preserves this)
- **WCAG 2.1 AA** — UpdateBanner must maintain contrast; 48px minimum touch targets on the "Update now" button
- **GSD workflow enforcement** — all file edits via GSD execute-phase only

---

## Sources

### Primary (HIGH confidence)
- `/mnt/data/src/pert-calculator/vite.config.ts` — canonical SvelteKitPWA config in this project's stack
- `/mnt/data/src/formula-calculator/vite.config.ts` — secondary reference, formula-specific patterns
- `/mnt/data/src/nicu-assistant/vite.config.ts` — current state (no PWA yet); confirmed plugin slot position
- `/mnt/data/src/nicu-assistant/svelte.config.js` — confirmed `fallback: 'index.html'` (SPA mode)
- `/mnt/data/src/nicu-assistant/src/app.css` — confirmed OKLCH surface token values for theme_color conversion
- `https://vite-pwa-org.netlify.app/guide/prompt-for-update.html` — `registerSW` API with `onNeedRefresh`
- `https://vite-pwa-org.netlify.app/frameworks/sveltekit.html` — `virtual:pwa-info`, `svelte.config.js` serviceWorker disable, SPA mode config

### Secondary (MEDIUM confidence)
- npm registry: `@vite-pwa/sveltekit` version confirmed 1.1.0 (queried 2026-03-31)
- npm registry: `vite-plugin-pwa` version confirmed 1.2.0 (queried 2026-03-31)
- PITFALLS.md Pitfall 3 + 4 — already-documented `client/` prefix requirement and stale cache clinical concern

### Tertiary (LOW confidence)
- OKLCH-to-hex conversion for `theme_color` values — approximate conversions based on CSS color space knowledge; exact values should be verified with a color tool during implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — @vite-pwa/sveltekit version verified from npm; plugin API verified from official docs
- Architecture patterns: HIGH — derived from two working reference apps + official SvelteKit integration docs
- Idle detection: MEDIUM — pattern is correct but exact state singleton API must be verified against actual code in src/lib/
- Theme color hex values: MEDIUM — OKLCH-to-hex conversion is approximate; close enough for manifest but worth verifying
- Pitfalls: HIGH — all sourced from existing PITFALLS.md (already researched) + direct observation of reference app configs

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable library; @vite-pwa/sveltekit is mature)
