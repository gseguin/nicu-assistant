# Domain Pitfalls

**Domain:** Multi-tool clinical PWA — SvelteKit 2 + Svelte 5 + Tailwind CSS 4
**Researched:** 2026-03-31
**Scope:** Merging two standalone SvelteKit apps (pert-calculator, formula-calculator) into one unified PWA

---

## Critical Pitfalls

Mistakes that force rewrites, break clinical behavior, or ship broken updates to users.

---

### Pitfall 1: Merging Two Incompatible `SelectPicker` Implementations

**What goes wrong:** Both apps have a `SelectPicker` component but they are architecturally different. The PERT version uses a native `<dialog>` + `showModal()` with keyboard navigation built around a `listboxEl` ref. The formula version uses a `fixed inset-0` div overlay with `svelte/transition` animations (fade/slide), `document.body.style.overflow` mutation, and `lucide-svelte` icons. They have different prop shapes too: PERT uses `{ value, options: {value, label}[], label, class }` while formula uses `{ value, options: {id, label, group?}[], placeholder, label, error }`. If you pick one arbitrarily or try to make one a drop-in replacement, the other calculator's selection behavior will silently break — especially the grouped options (BMF/formula brands) which only exist in the formula version.

**Why it happens:** The two apps evolved independently and made different architectural choices (native dialog vs. overlay div, value/id key naming, group support).

**Consequences:** Calculator renders correctly but `value` is always undefined because the field key changed from `id` to `value`; grouped formula brands no longer render; keyboard navigation regresses on PERT; or body scroll lock from formula component persists after navigating to the PERT tab.

**Prevention:**
- Audit both implementations before writing a single line of the unified component. Use the PERT architecture (native `<dialog>` + `showModal()`) as the base since it properly handles focus management, Escape key, and backdrop click without viewport tricks.
- Extend it to support optional `group` and `placeholder` props so formula's grouped brand display works.
- Use a single option shape `{ value: string; label: string; group?: string }` — migrate the formula data from `id` to `value` in `formula-config.ts`, not in the component.
- Remove the `document.body.style.overflow` manipulation (formula version) — native `<dialog showModal()>` blocks scroll automatically.
- Write tests verifying grouped rendering and keyboard nav before replacing either app's usage.

**Detection:** Two `SelectPicker.svelte` files with different props when you start the merge. Run a diff: `diff pert-calculator/src/lib/components/SelectPicker.svelte formula-calculator/src/lib/components/SelectPicker.svelte`.

**Phase:** Shell + shared component library (Phase 1 / foundation phase).

---

### Pitfall 2: `DisclaimerModal` Merger Creates a Silent Regression

**What goes wrong:** The two `DisclaimerModal` components use opposite architectural approaches. PERT uses a native `<dialog>` with `onMount → showModal()` and prevents dismissal by capturing both `cancel` and `close` events. Formula uses a plain `<div>` overlay with Svelte transitions, a manual focus trap action, and `role="alertdialog"`. PERT reads from `CLINICAL_CONFIG`; formula reads from `FORMULA_CONFIG`. The localStorage keys are different: PERT stores `disclaimer_acknowledged`, formula stores `formula_calculator_disclaimer_accepted_v1`. If you merge naively and the new shared key doesn't match either old key, every existing user who already acknowledged the disclaimer in either standalone app will see it again — including on devices where the app is already installed.

**Why it happens:** Independent development with different config namespaces and storage key choices.

**Consequences:** Existing PERT users who installed the PWA see a blocking disclaimer on first launch of the unified app, which is a clinical trust/UX regression. Formula users lose their accepted state too.

**Prevention:**
- Use the PERT approach (native `<dialog>`) for the unified component.
- Choose a new storage key `nicu_assistant_disclaimer_v1` — do not try to reuse either old key since neither app's users had the unified app.
- The disclaimer text must be reviewed by a clinical stakeholder to cover both PERT (weight-based dosing) and formula (recipe volumes) in a single statement.
- The unified layout (root `+layout.svelte`) must call `dialog.showModal()` only after checking the single unified key.

**Detection:** Two different `localStorage.getItem` keys in the two layout files. PERT: `disclaimer_acknowledged`. Formula: `formula_calculator_disclaimer_accepted_v1`. Any key merge will either always show or never show the disclaimer for migrating users.

**Phase:** Shell + shared component library (Phase 1 / foundation phase).

---

### Pitfall 3: PWA Service Worker Serves Stale Clinical Data After Deployment

**What goes wrong:** Once users have installed the PWA, the service worker aggressively caches all assets. When you deploy a correction to a medication dose or formula concentration, users running the installed PWA may continue to see the old (potentially incorrect) cached version for days or until they close every tab and reopen the app. In a clinical environment, a clinician using the app from the home screen icon will never see a browser address bar, never get a tab reload, and may not realize the app is stale.

**Why it happens:** The default `@vite-pwa/sveltekit` precache strategy installs all assets at build time into a versioned cache. The new service worker is installed in the background but only activates (takes control) when all tabs using the old version are closed. In a clinical environment on a shared iPad, this might never happen during a shift.

**Consequences:** A dietitian calculates a formula recipe using cached data that has since been corrected — the calculation is wrong and the displayed results look correct.

**Prevention:**
- Use `@vite-pwa/sveltekit` with `registerType: 'prompt'` (not `'autoUpdate'`), and implement a visible in-app update banner: "A clinical data update is available. Tap to refresh." Surface this on every calculator page header, not just a toast that can be missed.
- Alternatively, use `skipWaiting: true` + `clientsClaim: true` in the service worker for immediate takeover on activation, combined with a `location.reload()` after claiming. This is more aggressive but appropriate for a clinical tool where data correctness outweighs continuity.
- Embed a build timestamp or data hash in the web app manifest `description` field so clinical staff can cross-check the version shown in the About sheet with what IT deployed.
- Never cache clinical JSON data files (`clinical-config.json`, `formula-config.json`) with a long-lived strategy; they must be re-fetched on every service worker update. Since these are embedded in the JS bundle, every change increments the asset hash automatically — confirm this in the vite-pwa precache manifest.

**Detection:** Deploy a change and check the app on a device that had it installed previously. If the old data is still shown after 10 minutes without closing the app, the update strategy needs strengthening.

**Phase:** PWA infrastructure phase. Must be verified with an end-to-end stale update test before clinical deployment.

---

### Pitfall 4: Service Worker Precache Manifest Missing Routes Due to `client/` Prefix Requirement

**What goes wrong:** The `@vite-pwa/sveltekit` plugin's `globPatterns` configuration requires a `client/` prefix when specifying additional asset globs. Without it, server-side output files get included in the service worker precache manifest, causing the service worker registration to fail entirely — the app goes offline-incapable rather than just having partial offline support.

**Why it happens:** SvelteKit outputs build artifacts to `.svelte-kit/output/` which has both `client/` and `server/` subdirectories. The vite-pwa plugin's glob operates from the output root and will include server assets if you omit the `client/` prefix.

**Consequences:** Service worker fails to register with a `DOMException: The script has an error` or the precache silently includes files that 404 from the client origin, breaking offline mode completely.

**Prevention:**
- In `vite.config.ts`, ensure every extra `globPatterns` entry uses the `client/` prefix: `client/**/*.{js,css,ico,png,svg,webmanifest}`.
- For the unified app with multiple calculator routes (`/pert`, `/formula`), verify that all prerendered HTML files appear in the precache manifest after build: inspect `.svelte-kit/output/client/` and cross-reference with the generated `sw.js` precache list.
- Run `pnpm build && pnpm preview` and test offline mode in DevTools Network tab (Offline checkbox) for every route before shipping.

**Detection:** After `pnpm build`, inspect the generated service worker file for all routes. If `/pert/index.html` or `/formula/index.html` are absent from the precache list, those routes will 404 when offline.

**Phase:** PWA infrastructure phase.

---

### Pitfall 5: Theme System Divergence — Formula's Hardcoded Colors vs. PERT's Token System

**What goes wrong:** The PERT app uses a well-structured CSS custom property token system (`--color-surface`, `--color-accent`, etc.) with both `prefers-color-scheme` and `[data-theme]` overrides, which already supports dark/light toggling. The formula app hardcodes OKLCH color literals directly in component class strings (`bg-clinical-600`, `bg-slate-50`, `oklch(97.5% 0.006 225)`) and is light-only. When you port formula components into the unified app, every hardcoded color will ignore the dark theme — `bg-white` in the formula `DisclaimerModal` stays white even in dark mode.

**Why it happens:** Formula was built as a light-only app. PERT was built dark-mode-first with tokens. They never needed to share a theme.

**Consequences:** After porting, the PERT tab responds to dark/light toggle correctly but the formula tab stays light regardless of theme setting. The visual breakage is immediate and obvious.

**Prevention:**
- Adopt PERT's token approach as the unified design system. Map formula's palette onto the token set: `bg-clinical-600` → `bg-accent`, `bg-white`/`bg-slate-50` → `bg-surface-card`, `text-slate-900` → `text-primary`, etc.
- Do not preserve formula's `@theme` OKLCH literal palette in the unified `app.css`. The unified `--color-accent` value in light mode should resolve to the clinical blue that formula currently hardcodes.
- In Tailwind CSS 4, the `dark` variant defaults to `prefers-color-scheme`. Since the unified app needs user-toggled dark mode, add `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))` in `app.css` and set `data-theme` on `<html>` from a localStorage-backed theme store — exactly as PERT's existing `app.css` already does with its `[data-theme]` selectors.
- The formula app's `BMF Amber` palette (`--color-bmf-*`) needs to be present in the unified theme as a named color scale since BMF mode uses amber-tinted UI elements. Add it to the shared `@theme` block without conflict.

**Detection:** After porting any formula component, toggle the unified app to dark mode. If the formula tab has a white/light background, the token migration is incomplete.

**Phase:** Design system unification phase (should precede calculator porting).

---

### Pitfall 6: Flash of Unstyled/Wrong Theme on App Load (FOUC)

**What goes wrong:** The theme preference is stored in `localStorage`. On page load, the SvelteKit layout runs on the server (even with `adapter-static`, HTML is prerendered), which has no access to `localStorage`. The HTML is delivered with no `data-theme` attribute, the browser renders in light mode (system default), then JS runs and sets `data-theme="dark"` if the user prefers dark — causing a visible flash from light to dark on every page load for dark-mode users.

**Why it happens:** This is the standard FOUC problem with localStorage-based theme toggling in SSR/static prerendering contexts. PERT's existing app.css already has both `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)` blocks, which means it currently handles the flash gracefully for system-preference users but would flash on manual overrides.

**Consequences:** On a dark ward at night, a clinician opens the NICU assistant PWA and gets a blinding white flash before dark mode activates. Disorienting and unprofessional for a clinical tool.

**Prevention:**
- Inject a blocking inline `<script>` in `app.html` (before any CSS renders) that reads `localStorage` and sets `document.documentElement.dataset.theme` synchronously, before the first paint:
  ```html
  <script>
    (function() {
      var t = localStorage.getItem('theme');
      if (t) document.documentElement.dataset.theme = t;
    })();
  </script>
  ```
- This script must be in `app.html`, not in any Svelte component — Svelte components run after first paint.
- The PERT app's existing `[data-theme]` CSS selectors are already correct for this approach. The formula app has no such system and must be migrated.

**Detection:** Hard reload the app in a browser with `localStorage.theme = 'dark'` set, DevTools open to Rendering tab with "Flash of unstyled content" highlighting enabled. Any light flash before dark theme settles is the FOUC.

**Phase:** Design system unification phase, specifically the theme toggle implementation step.

---

## Moderate Pitfalls

---

### Pitfall 7: Responsive Navigation State Not Persisted Across Hard Reload

**What goes wrong:** The bottom tab bar on mobile / top nav on desktop needs to know which tab is "active." In SvelteKit, the active route is available from `$page.url.pathname`. However, if a clinician bookmarks or installs the app with the PERT calculator open (`/pert`), a hard reload should restore that view — not redirect to a home page. If the nav state is stored in a Svelte `$state` variable rather than derived from the URL, a reload loses the active tab.

**Prevention:**
- Derive active tab entirely from `$page.url.pathname`. Never store "current calculator" in a Svelte state variable.
- Each calculator gets its own SvelteKit route (`/pert`, `/formula`). The URL is the source of truth.
- The PWA manifest `start_url` should be `/` (the shell redirects to the last used calculator or defaults to the primary one), not a specific calculator route, so install behavior is predictable.

**Detection:** Navigate to `/formula`, bookmark it, hard reload. If the app shows the PERT tab as active while showing formula content, the nav derives state from a variable rather than the URL.

**Phase:** Routing and navigation phase.

---

### Pitfall 8: iOS Safari Bottom Navigation Bar Obscuring Tab Bar

**What goes wrong:** iOS Safari in non-PWA mode has a browser chrome bar at the bottom. Using `height: 100dvh` for the app shell can clip the bottom tab bar behind the browser UI. Conversely, using `100svh` or `100vh` may over-extend the shell beyond the visible area. In standalone PWA mode (installed to home screen), the issue changes: `safe-area-inset-bottom` must be applied, but `env(safe-area-inset-bottom)` does not dynamically update when Safari's tab bar expands in tabbed browsing mode.

**Prevention:**
- Use `min-height: 100dvh` for the shell container (dynamic viewport height updates with browser chrome visibility).
- Apply `padding-bottom: env(safe-area-inset-bottom, 0px)` to the bottom tab bar container. Include `viewport-fit=cover` in the viewport meta tag in `app.html`.
- PERT's `app.css` already has `min-height: 100dvh; min-height: 100svh` fallbacks — adopt this pattern in the unified app shell.
- Test the nav bar specifically in: Safari iOS (browser mode), Safari iOS (standalone PWA mode), Chrome Android (browser mode), Chrome Android (installed TWA). These four contexts behave differently.

**Detection:** Install the app to iOS home screen. The bottom of the tab bar should be visible above the home indicator. If content is clipped or the tab bar overlaps the home indicator, safe-area insets are missing.

**Phase:** Navigation / shell layout phase.

---

### Pitfall 9: Shared `localStorage` Keys Across Calculators Collide

**What goes wrong:** Both apps currently use `localStorage` for disclaimer acknowledgment, and the formula app uses it with a versioned key (`formula_calculator_disclaimer_accepted_v1`). If the unified app adds per-calculator state (e.g., last-used mode: "meal" vs. "tube-feed" for PERT, last tab for formula), using flat unnamespaced keys will collide if a future calculator uses the same key name.

**Prevention:**
- Adopt a namespaced key convention from the start: `nicu_assistant:{calculator}:{key}`, e.g., `nicu_assistant:disclaimer:v1`, `nicu_assistant:pert:last_mode`, `nicu_assistant:theme`.
- Centralize all localStorage access through a typed utility module (`src/lib/storage.ts`) rather than inline `localStorage.getItem` calls in components.

**Detection:** `grep -r 'localStorage' src/` after porting — any bare string keys not using the namespace prefix should be flagged.

**Phase:** Shell foundation phase.

---

### Pitfall 10: Calculator Business Logic Broken During Port by Implicit Import Aliases

**What goes wrong:** Both apps use SvelteKit's `$lib` import alias. In the standalone apps, `import { resolveDose } from '$lib/dosing'` works because `$lib` resolves to that app's own `src/lib/`. In the unified app, both `dosing.ts` (PERT) and `formula.ts` (formula) must coexist under the shared `$lib`. The risk is a filename collision or an accidental import of the wrong module. Less obviously, PERT's `SelectPicker` imports `resolveOptionLabel` from `'$lib/dosing'` — this tight coupling between the UI component and a business logic function will break the moment `SelectPicker` becomes a shared component under the new structure.

**Prevention:**
- PERT business logic lives at `$lib/calculators/pert/` — `dosing.ts`, `medications.ts`, `clinical-config.json`, `clinical-config.ts`.
- Formula business logic lives at `$lib/calculators/formula/` — `formula.ts`, `formula-config.ts`, `formula-config.json`.
- Shared UI components live at `$lib/components/` and must import zero calculator-specific logic. Break the `SelectPicker` → `dosing.ts` dependency: `resolveOptionLabel` is a pure function with no PERT-specific logic; move it to `$lib/utils/options.ts` or inline it in the component.
- Run the existing test suites (`dosing.test.ts`, `formula.test.ts`) after every path restructuring to confirm business logic is intact.

**Detection:** After restructuring, run `pnpm test`. Any import resolution failure in tests is a canary for broken paths. Also: `grep -r "from '\$lib/dosing'" src/lib/components/` should return zero results.

**Phase:** Calculator porting phase (after directory structure is established in shell phase).

---

### Pitfall 11: Formula App's `document.body.style.overflow` Mutation Leaks Across Routes

**What goes wrong:** The formula `SelectPicker` (the overlay-based version) sets `document.body.style.overflow = 'hidden'` via a `$effect` when the picker is open, and clears it when closed. In the unified app with SvelteKit routing, if a user opens the picker and then navigates to another route before closing it (e.g., via keyboard shortcut or deep link), the `$effect` cleanup may not run in time, leaving `overflow: hidden` on the body. All scrollable content in the new route becomes locked.

**Prevention:**
- This issue is eliminated entirely if you adopt PERT's native `<dialog>` approach for the unified `SelectPicker` (see Pitfall 1). Native `<dialog showModal()>` handles scroll locking at the browser level and cleans up correctly.
- If for any reason a non-native overlay approach is kept, the cleanup must happen in both `$effect` cleanup AND an `onDestroy` lifecycle hook.

**Detection:** On the formula calculator, open a SelectPicker, then quickly tap the PERT tab in the nav bar. Scroll the PERT page — if it does not scroll, body overflow is locked.

**Phase:** Shared component library phase.

---

## Minor Pitfalls

---

### Pitfall 12: Plus Jakarta Sans Font Loading Flicker

**What goes wrong:** The unified app adopts Plus Jakarta Sans (currently only in the formula app). PERT users will see a font swap from system-ui to Plus Jakarta Sans on first load if the font is loaded asynchronously via Google Fonts `<link>`. The formula app does this via a stylesheet in `app.html` (presumed) or a `<svelte:head>` import. This is a minor aesthetic issue but notable for a clinical tool where visual consistency builds trust.

**Prevention:**
- Self-host Plus Jakarta Sans using `@fontsource/plus-jakarta-sans` (npm package). Bundle the font files with the app so they are precached by the service worker and available offline.
- Use `font-display: optional` or `font-display: swap` — `optional` prevents layout shift entirely but may show system font on first load for uncached visits; `swap` shows system font briefly then swaps. For a clinical app, `optional` is preferable to prevent jarring shifts during a calculation.

**Detection:** Load the app on a throttled connection (DevTools: Slow 3G). If the font changes visibly mid-render, use `font-display: optional` or self-host.

**Phase:** Design system phase.

---

### Pitfall 13: The `NumericInput` Component Only Exists in Formula — PERT Uses Native `<input>`

**What goes wrong:** The formula app has a `NumericInput.svelte` component with validation, error display, and proper `inputmode="decimal"` for mobile numeric keyboard. PERT uses raw `<input type="number">` directly in `DosingCalculator.svelte` with no abstraction. When porting both calculators to the unified app, PERT's inline inputs will not match the shared component library pattern and will look visually different, especially in terms of error states and touch target sizing.

**Prevention:**
- Promote `NumericInput` to the shared component library during the shell phase.
- PERT's inputs should be migrated to use `NumericInput` when porting `DosingCalculator` — this is an enhancement to the port, not a rewrite of logic.

**Detection:** Visual comparison of PERT and formula calculator input fields side by side after porting. If they look materially different, inputs were not unified.

**Phase:** Calculator porting phase.

---

### Pitfall 14: Clinical Safety — Input Validation Gaps Create Silent Wrong Results

**What goes wrong:** Research on clinical calculator apps (specifically insulin dosing apps — the closest analog to PERT dosing) found that 91% lacked numeric input validation and 59% allowed calculations when values were missing. For PERT dosing, if a weight field is empty or zero and the app proceeds to calculate, the displayed dose may be `NaN`, `Infinity`, or a very large number that looks like a valid dose. A busy clinician may not notice and act on the incorrect result.

**Why this is a port risk:** The porting process may inadvertently remove validation that existed in the standalone apps if the business logic and UI are restructured without careful testing.

**Prevention:**
- Port all existing validation logic from `dosing.ts` and `formula.ts` unchanged. Run both test suites against the ported modules before any UI integration.
- Never display a result when required inputs are absent or fail validation. The `ResultsDisplay` component should require valid input state before rendering any values.
- Add explicit test cases for edge inputs: `0`, negative numbers, non-numeric input, empty string, extremely large values.
- The unified `NumericInput` component should surface errors visually (red border + message) and communicate validation state to parent via an `invalid` derived state, not just an empty value.

**Detection:** Systematic input test: enter `0` as infant weight in PERT, clear the weight field in formula, enter `-1`. If any calculation result is displayed (rather than a validation error), the guard is missing.

**Phase:** Calculator porting phase; also verify during QA before any clinical deployment.

---

### Pitfall 15: PWA Manifest `display: standalone` Hides the Browser's Back Button — No Escape from Broken State

**What goes wrong:** In standalone PWA mode, the browser's navigation UI (including the back button) is hidden. If the unified app's in-app navigation gets into an unexpected state (e.g., a route that 404s, or a dialog that cannot be dismissed), the user has no browser back button to recover. On iOS, there is a gesture-based back navigation, but it depends on the browser history stack, which SvelteKit navigation may not always maintain predictably for modal-style sheet components.

**Prevention:**
- Every modal/sheet component must be closeable via: (1) a visible close button, (2) Escape key, (3) backdrop tap/click, and (4) browser back navigation (use SvelteKit's `pushState` / shallow routing for sheets if needed so pressing back closes them instead of exiting the app).
- Add a global error boundary in the root `+layout.svelte` that shows a "reload app" button if an unhandled error occurs.
- The `DisclaimerModal` in PERT explicitly prevents the `cancel` event (Escape dismissal) which is correct for a required disclaimer — but this same pattern must not be applied to any non-required UI element.

**Detection:** Open the app in standalone mode on iOS, navigate to a deep state (e.g., formula open + SelectPicker open), then swipe back. Each back swipe should close one layer of UI, not exit the app.

**Phase:** Shell navigation phase; validate during PWA testing phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Shared `SelectPicker` | Incompatible prop shapes silently break formula brand selection | Audit both impls before writing unified version; use PERT's `<dialog>` base |
| `DisclaimerModal` unification | Wrong localStorage key logic causes disclaimer to re-show for all users | New unified key `nicu_assistant:disclaimer:v1`; native `<dialog>` approach |
| Design token migration | Formula's hardcoded OKLCH colors ignore dark theme | Port all formula components through the token system before any display testing |
| Theme toggle | FOUC on load in dark mode | Blocking inline script in `app.html` sets `data-theme` before first paint |
| PWA service worker | Stale clinical data served from cache after update | `registerType: 'prompt'` + visible update banner, or `skipWaiting: true` |
| Service worker build | Missing `client/` prefix breaks precache manifest | Verify all glob patterns; test every route in offline mode after `pnpm build` |
| Bottom tab navigation | iOS Safari clips nav bar behind browser chrome | `100dvh` + `env(safe-area-inset-bottom)` + `viewport-fit=cover` |
| Calculator porting | PERT's `SelectPicker` imports from `$lib/dosing` | Break coupling before merging into shared components |
| Input routing | `overflow: hidden` body lock leaks between routes | Eliminated by using native `<dialog>` instead of overlay div |
| Clinical safety | Calculations proceed on invalid/empty inputs | Port validation logic and test edge inputs before any deployment |

---

## Sources

- [Vite PWA SvelteKit Framework Docs](https://vite-pwa-org.netlify.app/frameworks/sveltekit) — precache manifest `client/` prefix requirement, SPA mode fallback revision
- [SvelteKit Service Workers Docs](https://svelte.dev/docs/kit/service-workers) — `$service-worker` module, versioned cache names
- [SvelteKit State Management Docs](https://svelte.dev/docs/kit/state-management) — module-level state contamination in SSR, context API
- [Tailwind CSS v4 Dark Mode Docs](https://tailwindcss.com/docs/dark-mode) — `@custom-variant` required for class/data-attribute toggling
- [Tailwind CSS v4 Dark Mode Upgrade Issues](https://github.com/tailwindlabs/tailwindcss/discussions/16517) — breaking dark mode changes from v3 to v4
- [Tailwind CSS v4 CSS Variables Dark Mode Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/15083) — `@layer theme` vs `@layer base` for dark/light
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide) — rune-based props, bindable, migration pitfalls
- [iOS 100vh Bottom Navigation Overlap](https://dev-tips.com/css/overlapping-bottom-navigation-bar-despite-100vh-in-ios-safari) — `100dvh` + safe area insets
- [PWA Safe Area iOS (WeWeb Community)](https://community.weweb.io/t/pwa-safe-area-using-env-safe-area-inset-bottom/17206) — `viewport-fit: cover` requirement
- [Smartphone Apps for Calculating Insulin Dose (BMC Medicine, 2015)](https://link.springer.com/article/10.1186/s12916-015-0314-7) — 91% lack input validation; 59% allow calculation with missing values
- [Mobile App for Medication Dosage in Neonatal Settings (PMC, 2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12246550/) — clinical calculator accuracy and error reduction
- [Vite PWA Prompt for Update Guide](https://vite-pwa-org.netlify.app/guide/prompt-for-update) — `registerType: 'prompt'` vs autoUpdate
- [Joy of Code: Avoid Sharing Server and Client State in SvelteKit](https://joyofcode.xyz/avoid-sharing-server-and-client-state-in-sveltekit) — module-level state in static apps
