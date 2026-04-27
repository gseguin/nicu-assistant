# Phase 49: Wave-2 — visualViewport Drawer Anchoring - Research

**Researched:** 2026-04-27
**Domain:** iOS Safari visualViewport-aware modal sheet sizing (SvelteKit 2 + Svelte 5 runes + adapter-static SPA, jsdom-tested + Playwright dual-project verified)
**Confidence:** HIGH (all critical claims grounded in milestone-level research, in-repo line-precise verification, and Phase 47/48 inheritance contracts)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Singleton design — `visualViewport.svelte.ts` (D-01..D-07):**

- **D-01:** New file at `src/lib/shared/visualViewport.svelte.ts`. Class-based singleton mirroring `favorites.svelte.ts` / `theme.svelte.ts` patterns. Export single `vv` instance via `export const vv = new VisualViewportStore();`. ~40 LOC target.
- **D-02:** Three `$state` runes: `offsetTop = $state(0)`, `height = $state(0)`, `keyboardOpen = $state(false)`. Plus a private `#initialized` boolean for `init()` idempotency. Initial `0/0/false` so SSG snapshots and the older-iOS-no-visualViewport fallback both render correctly.
- **D-03:** `init()` is the public API. Calling twice is a no-op. `browser`-guard from `$app/environment` aborts before touching `window`. If `window.visualViewport` is `undefined`, `init()` falls through after the guard.
- **D-04:** Listener registration: `vv.addEventListener('resize', update)` ONLY. NO `vv.addEventListener('scroll', update)`. Plus `window.addEventListener('pageshow', onPageshow)` and `document.addEventListener('visibilitychange', onVisibilityChange)`. All listeners pass `{ passive: true }`.
- **D-05:** `update()` is the single shared callback bound to `resize`, `pageshow.persisted`, and `visibilitychange` (when `document.visibilityState === 'visible'`). Re-reads `vv.offsetTop`, `vv.height`, computes `keyboardOpen = window.innerHeight - vv.height > 100`, writes all three runes synchronously. NO caching. `update()` is called once at the end of `init()` to seed initial values.
- **D-06:** No teardown / `destroy()` API in v1. Singleton lives for the document lifetime.
- **D-07:** Keyboard-open threshold = **100 px**. Filters URL-bar collapse (~50–80 px). Phase 50 SMOKE-07 tunes if real-device shows otherwise.

**InputDrawer wiring — CSS variables, not props (D-08..D-12):**

- **D-08:** Import `vv` singleton at the top of `InputDrawer.svelte`. Compute a `$derived` style string and bind it inline on the `.input-drawer-sheet` div. NO per-calculator prop plumbing.
- **D-09:** `$derived` computation:
  ```ts
  const ivvStyle = $derived(
    vv.keyboardOpen
      ? `--ivv-bottom: ${window.innerHeight - vv.offsetTop - vv.height}px; --ivv-max-height: ${vv.height - 16}px;`
      : ''
  );
  ```
- **D-10:** CSS rule changes in the existing `<style>` block of `InputDrawer.svelte`:
  - Line 158 `max-height: 80dvh;` → `max-height: calc(var(--ivv-max-height, 80dvh));`
  - Line 161 `padding-bottom: env(safe-area-inset-bottom, 0px);` → `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px));`
- **D-11:** The `style` binding goes on the `.input-drawer-sheet` `<div>`, NOT on the outer `<dialog>`.
- **D-12:** `prefers-reduced-motion: reduce` honored without a new transition. The existing `@media (prefers-reduced-motion: no-preference)` rule already gates the slide-up animation; CSS variable changes propagate via normal recomputation, no `transition: max-height` or `transition: padding-bottom` declared.

**Layout init (D-13..D-15):**

- **D-13:** Edit `src/routes/+layout.svelte` to add `import { vv } from '$lib/shared/visualViewport.svelte.js';` and call `vv.init();` after `favorites.init();` in the `onMount` block.
- **D-14:** Do NOT call `vv.init()` from `InputDrawer.svelte`'s `$effect`. Layout-level init only.
- **D-15:** No `+layout.ts`/`+layout.server.ts` change. SSG-safe via `browser` guard inside `init()`.

**Tests — colocation + mock helper reuse (D-16..D-20):**

- **D-16:** DRAWER-TEST-01 lives at `src/lib/shared/visualViewport.test.ts`. Imports `dispatchVisualViewportResize` / `simulateKeyboardOpen` / `simulateKeyboardDown` / `simulateBfcacheRestore` / `_resetVisualViewportMock` from `$lib/test/visual-viewport-mock.js` (Phase 47 D-08..D-10).
- **D-17:** DRAWER-TEST-01 assertions cover DRAWER-01..04 + DRAWER-09 — six numbered cases (idempotent `init()`, state updates on resize, keyboard-down re-read, bfcache rebind, hardware-keyboard guard, source-grep no-scroll-listener).
- **D-18:** DRAWER-TEST-02 extends `src/lib/shared/components/InputDrawer.test.ts`. Mounts the drawer, calls `simulateKeyboardOpen()`, asserts `.input-drawer-sheet` has `style` containing `--ivv-bottom:` and `--ivv-max-height:` substrings; then `simulateKeyboardDown()` and asserts the style attribute is empty. T-XX numbering is T-09 / T-10 (Phase 48 left T-08 occupied).
- **D-19:** DRAWER-TEST-03 lives at `e2e/drawer-visual-viewport.spec.ts`. Runs under both `chromium` and `webkit-iphone` projects (Phase 47 D-15 default). Spec opens Morphine route (first in registry), opens drawer via InputsRecap, then `page.evaluate(...)` to override `window.visualViewport.height` / `offsetTop` and dispatch a `resize` event. Asserts computed `max-height` is approximately `(400 - 16)px`. Single calculator suffices because DRAWER-05 single-source-of-truth makes cross-calculator divergence structurally impossible.
- **D-20:** DRAWER-TEST-04 = re-running the EXISTING 16/16 axe sweep matrix. NO new axe sweeps added. Verification = `pnpm exec playwright test` post-change with the existing axe specs.

**Build order (D-21..D-23):**

- **D-21:** Single phase, three sibling plans recommended:
  - `49-01-PLAN.md` — visualViewport singleton (DRAWER-01..04 + DRAWER-09 + DRAWER-TEST-01) + layout init (DRAWER-04).
  - `49-02-PLAN.md` — InputDrawer wiring (DRAWER-05..08 + DRAWER-10..12 + DRAWER-TEST-02).
  - `49-03-PLAN.md` — Playwright spec (DRAWER-TEST-03) + axe re-run gate (DRAWER-TEST-04).
  Planner may collapse 49-02 + 49-03 into a single plan; success criteria remain independent.
- **D-22:** Single git branch — three plans land on the same Phase 49 branch with sequential commits per plan. Each plan = 2-4 atomic commits with co-located tests committed alongside the source change.
- **D-23:** Recommended order: **49-01 → 49-02 → 49-03**, sequential. Not parallel-safe (49-02 imports the singleton; 49-03 observes the drawer).

**Verification (D-24..D-27):**

- **D-24:** Phase 49 success criteria are deliberately CI-verifiable in the abstract; **actual** drawer-above-keyboard behavior CANNOT be visually proved in CI. Phase 50 SMOKE-04..07 close the visual gap on a real iPhone 14 Pro+.
- **D-25:** The 99-passing chromium Playwright suite + the 12-test cross-calculator focus spec from Phase 48 + the new DRAWER-TEST-03 (running on both projects) MUST remain green. No existing spec is modified.
- **D-26:** `<dialog>` `showModal()` + Esc-to-close + focus-trap + focus-restore behaviors preserved verbatim (DRAWER-12). Only changes are: (a) singleton import, (b) inline `style` binding on the `.input-drawer-sheet` div, (c) two `max-height` and `padding-bottom` rules consume CSS variables. None touch `<dialog>` attributes, the `dialog.showModal()` / `dialog.close()` calls, the close-button `autofocus` (Phase 48 D-09), or the SelectPicker-inside-drawer pattern.
- **D-27:** `prefers-reduced-motion`: NO new transitions introduced. Existing `@media (prefers-reduced-motion: no-preference)` rule already gates the slide-up animation; CSS variable changes propagate via normal recomputation.

### Claude's Discretion

- **`--auto` mode:** All decisions above were picked from the recommended defaults in PITFALLS.md HIGH-confidence research, ARCHITECTURE.md singleton sketch, REQUIREMENTS.md verbatim acceptance criteria, and the inherited Phase 47 + Phase 48 conventions.
- **Plan split:** Three sequential plans is the recommended split. Planner may collapse to two plans if that better matches the project's atomic-commit cadence; success criteria remain independent.
- **Test colocation:** All new test files are co-located with their source (per `feedback_test_colocation.md`). Playwright spec lives in `e2e/`. Mock helpers stay in `src/lib/test/` per Phase 47 D-08.
- **Singleton API surface:** Three runes (`offsetTop`, `height`, `keyboardOpen`) is the minimum useful set per DRAWER-01. Could expose `width` and `scale` for future use, but YAGNI.
- **Threshold tuning:** 100 px is the documented heuristic; if Phase 50 SMOKE-07 reveals real-device tuning is needed, adjust there as a 1-line change.

### Deferred Ideas (OUT OF SCOPE)

- `requestAnimationFrame` coalescing for `update()` — YAGNI for resize-only listener.
- `vv.width` and `vv.scale` runes — YAGNI; minimum API surface.
- `destroy()` / lifecycle teardown — no consumer needs it.
- Bottom-nav translation when drawer is open + keyboard is up — top-layer `<dialog>` already covers it.
- Per-calculator focus-on-first-tap ergonomics — Phase 48's contract holds.
- iPad split-keyboard / floating-keyboard handling — `md:hidden` rule on the trigger keeps drawer off iPad.
- FOUC theme-color sync for `black-translucent` — Phase 50 SMOKE-09 surface.
- Tuning the 100 px threshold — Phase 50 SMOKE-07.
- Migrate the existing 6 chromium-only e2e specs to `webkit-iphone` — Phase 47 follow-up todo.
- Performance instrumentation for the singleton — Phase 50 reveals if needed.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **DRAWER-01** | New module-scope singleton at `src/lib/shared/visualViewport.svelte.ts` with `$state` runes for `{ offsetTop, height, keyboardOpen }`; idempotent `init()`; `browser`-guarded for SSG safety | Singleton skeleton in *Code Examples §1*; mirrors `favorites.svelte.ts` line-for-line (verified at `src/lib/shared/favorites.svelte.ts`); `browser` import from `$app/environment` per CONTEXT.md D-03 |
| **DRAWER-02** | Subscribe to `visualViewport.resize` ONLY (NOT `scroll`); re-read on every event (no cache) | *Common Pitfalls §P-08* (anti-scroll-listener); *Common Pitfalls §iOS-26-regression*; source-grep regression sentinel in DRAWER-TEST-01 step 6 |
| **DRAWER-03** | Bind `pageshow.persisted === true` AND `visibilitychange` listeners for bfcache restore | *Common Pitfalls §P-04*; mock helper `simulateBfcacheRestore()` already exists in Phase 47 (`src/lib/test/visual-viewport-mock.ts:85-94`) |
| **DRAWER-04** | `init()` called from `+layout.svelte:onMount` after `pwa.init()` line 55 | *Architecture Patterns §Init-Site*; verified call-site at `src/routes/+layout.svelte:52-71` |
| **DRAWER-05** | `.input-drawer-sheet` exposes `--ivv-bottom` and `--ivv-max-height` CSS custom properties via inline `style` binding driven by the singleton; NO per-calculator prop plumbing | *Code Examples §2 (InputDrawer wiring)*; six call-sites verified at `src/routes/{morphine-wean,formula,gir,feeds,uac-uvc,pert}/+page.svelte` |
| **DRAWER-06** | Sheet `max-height` becomes `calc(var(--ivv-max-height, 80dvh))` | *Code Examples §3 (CSS rule changes)* — exact before/after string at line 158 |
| **DRAWER-07** | Sheet `padding-bottom` becomes `max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px))` | *Code Examples §3* — exact before/after string at line 161; *Common Pitfalls §P-07* (double-offset trap) |
| **DRAWER-08** | Modifications apply ONLY to inner `.input-drawer-sheet`, NEVER to outer `<dialog>` | *Common Pitfalls §P-15* (SelectPicker dialog-in-dialog regression); inline `style` binding site at lines 91-94 of `InputDrawer.svelte` |
| **DRAWER-09** | Hardware-keyboard-paired iPhones do NOT trigger keyboard-open branch; `keyboardOpen = window.innerHeight - vv.height > 100` | *Common Pitfalls §P-05*; threshold rationale in CONTEXT.md D-07 |
| **DRAWER-10** | `prefers-reduced-motion: reduce` honored — no NEW transitions introduced | *Architecture Patterns §Reduced-Motion*; CONTEXT.md D-12 + D-27 |
| **DRAWER-11** | Existing `md:hidden` rule preserved (drawer never appears at tablet/desktop breakpoints) | Verified: `md:hidden` lives on the `InputsRecap` trigger at `src/lib/shared/components/InputsRecap.svelte:162` (the only opener path); drawer's `expanded` prop never flips true at md+ |
| **DRAWER-12** | `<dialog>` `showModal()` + top-layer + Esc-to-close + focus-trap + focus-restore preserved verbatim | Verified: existing `$effect` at `InputDrawer.svelte:44-64` is untouched per CONTEXT.md D-26; `autofocus` on close button at line 112 (Phase 48 D-09) preserved |
| **DRAWER-TEST-01** | Vitest unit test on the singleton; assert runes update on `resize`, listeners rebind on `pageshow.persisted`, NO scroll listener (source-grep) | *Validation Architecture §Phase Requirements → Test Map*; CONTEXT.md D-17 lists six numbered assertions |
| **DRAWER-TEST-02** | Vitest component test on `InputDrawer.svelte` asserts `style` attribute updates on synthetic resize | *Validation Architecture §Phase Requirements → Test Map*; extends existing `InputDrawer.test.ts` |
| **DRAWER-TEST-03** | Playwright spec under `webkit-iphone` synthesizes `visualViewport.resize` and asserts computed `padding-bottom` / `max-height` | *Validation Architecture*; existing `webkit-smoke.spec.ts` is the precedent |
| **DRAWER-TEST-04** | Existing 16/16 axe sweeps re-run with new drawer behavior — no new sweeps added | CONTEXT.md D-20; regression-only check |

</phase_requirements>

## Summary

Phase 49 ships a **single class-based Svelte 5 rune singleton** (`src/lib/shared/visualViewport.svelte.ts`, ~40 LOC) and four pinpoint edits inside `InputDrawer.svelte` to make the existing modal `<dialog>` sheet anchor above the iOS soft keyboard instead of being clipped behind it. All scaffolding (jsdom polyfill, mock helpers, `webkit-iphone` Playwright project) is already in place from Phase 47; the auto-focus removal that makes the keyboard-up branch observable as a deliberate clinician tap is already in place from Phase 48. There are zero new runtime dependencies, zero new devDependencies, zero DESIGN-contract changes, and zero per-calculator edits across the six existing routes.

The runtime mechanism is well understood: `window.visualViewport` is the only API that reports the iOS soft keyboard's effect on the visible region (CSS `dvh` does NOT shrink when the keyboard appears in standalone PWA mode). The singleton subscribes to `vv.resize` only — never `vv.scroll` (Phase 42.1 D-16 dock-magnification regression risk per PITFALLS.md P-08) — re-reads `vv.offsetTop` / `vv.height` on every event (no caching, to survive the iOS 26 `visualViewport.height` post-dismiss regression — Apple Developer Forums #800125), and additionally binds `pageshow.persisted === true` + `visibilitychange` to handle bfcache app-suspension restore (PITFALLS.md P-04). The drawer consumes the rune state via two CSS custom properties (`--ivv-bottom`, `--ivv-max-height`) on the inner `.input-drawer-sheet` `<div>` — never on the outer `<dialog>` (PITFALLS.md P-15 prevents the SelectPicker-inside-drawer regression). When the keyboard is down, the `$derived ivvStyle` short-circuits to an empty string and the existing `var(..., 80dvh)` / `var(..., 0px)` fallbacks preserve current behavior bit-for-bit.

CI proves wiring + math; CI cannot prove visual correctness. Playwright WebKit on Linux does NOT emulate the iOS soft keyboard (the project's existing `webkit-smoke.spec.ts` documents this); DRAWER-TEST-03 synthesizes the keyboard via `Object.defineProperty(window.visualViewport, ...)` + `dispatchEvent(new Event('resize'))`. Phase 50 SMOKE-04..07 close the visual gap on a real iPhone 14 Pro+ in standalone PWA mode — that gate is the authoritative verification surface and is intentionally out of Phase 49 scope.

**Primary recommendation:** Land three sequential plans on a single Phase 49 branch — `49-01` (singleton + layout init + unit test), `49-02` (InputDrawer wiring + component test), `49-03` (Playwright e2e + axe regression re-run). Each plan ends at a test-green boundary; each is independently revertible if a downstream plan reveals a defect. Mirror `favorites.svelte.ts` line-for-line for the singleton skeleton; touch zero per-calculator files; use the empty-string short-circuit in `$derived` so existing CSS fallbacks govern keyboard-down behavior.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| visualViewport state subscription | Browser / Client | — | `window.visualViewport` is a browser-only API; SSG/SSR have no concept of a viewport. `browser`-guard gates the entire `init()` body. |
| Singleton lifetime ownership | Browser / Client | — | Module-scope `$state` runes live for the document lifetime; initialized once from `+layout.svelte:onMount` (which only runs in the browser, post-hydration). |
| Drawer sheet sizing computation | Browser / Client (CSS engine) | — | `calc(var(--ivv-max-height, 80dvh))` and `max(env(...), var(--ivv-bottom, 0px))` are evaluated by the browser's CSS layout engine on every recomputation. JS only writes the variable values; layout math is CSS-native. |
| Dialog focus-trap + Esc-to-close | Browser / Client (HTML platform) | — | Preserved verbatim from existing `<dialog>.showModal()` semantics (Phase 48 D-09 + D-26). Phase 49 makes no JS focus-management edits. |
| Bfcache rebind | Browser / Client | — | `pageshow` fires only in the browser; `event.persisted` is a browser-platform property. |
| Test polyfill | Test environment (jsdom) | — | `src/test-setup.ts` polyfill already in place from Phase 47; Phase 49 consumes it. |
| Playwright WebKit emulation | Test environment (Playwright) | — | `webkit-iphone` project already in place from Phase 47 D-12; DRAWER-TEST-03 inherits both projects by D-15 default. |

**Why this matters for Phase 49:** The capability map confirms there is NO API/Backend, NO Frontend SSR, NO CDN, NO Database surface — every responsibility is in the browser tier. This is the correct shape: the milestone is shell-polish, not feature delivery, and the planner should not propose any task touching `+layout.ts` / `+layout.server.ts` / SSG output / runtime data fetching.

## Project Constraints (from CLAUDE.md)

Verbatim directives extracted from `/mnt/data/src/nicu-assistant/CLAUDE.md`:

- **Tech stack lock:** SvelteKit 2 + Svelte 5 + Tailwind CSS 4 + Vite + pnpm — must match existing apps
- **No native:** PWA only, no Capacitor for v1
- **Offline-first:** All clinical data embedded at build time, service worker for caching
- **Accessibility:** WCAG 2.1 AA minimum, 48px touch targets, always-visible nav labels
- **Code reuse:** Port business logic from existing apps, don't rewrite calculation functions
- **GSD Workflow Enforcement:** Before using Edit/Write tools, work must enter through a GSD command — no direct repo edits outside GSD
- **Design Context:**
  - Brand: precise, calm, trustworthy
  - Color: OKLCH, Clinical Blue (~220), BMF Amber (~60), slate neutrals, Red reserved for errors
  - Typography: Plus Jakarta Sans, large bold numerals for results, tabular numerics for clinical outputs
  - Theme: Both light and dark intentional
  - Restraint: zero decoration without function
  - Source of truth: `/DESIGN.md` + `/DESIGN.json` (project root) — locked v1.13 contract

**Phase 49 compliance check:**
- ✅ All edits inside SvelteKit/Svelte 5 idiom (`$state`, `$derived`, `$effect`, `onMount`)
- ✅ Tailwind 4 syntax preserved on existing classes; no new utilities introduced
- ✅ No native API surface added
- ✅ Service-worker / offline path untouched
- ✅ WCAG 2.1 AA preserved (no new ARIA, no new color tokens — DRAWER-TEST-04 = existing 16/16 axe re-run)
- ✅ Zero new business-logic; no calculation function edited
- ✅ DESIGN.md / DESIGN.json — UI-SPEC.md confirms 6/6 PASS and "Zero new design decisions"

## Standard Stack

### Core (frozen — no version changes)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | ^5.55.4 | Component model + `$state`/`$derived`/`$effect` runes | [VERIFIED: npm registry — current 5.55.5; project pinned 5.55.4] Phase 49 ships pure Svelte 5 rune syntax; class-based singleton with `$state` is the project's established pattern (4 existing singletons in `src/lib/shared/`) |
| @sveltejs/kit | ^2.57.1 | App framework + `$app/environment` `browser` guard | [VERIFIED: npm registry — current 2.58.0; project pinned 2.57.1] Provides the SSG-safe `browser` constant Phase 49 imports inside `init()` per CONTEXT.md D-03 |
| @sveltejs/adapter-static | ^3.0.10 | SPA build (`200.html` fallback) | [VERIFIED: npm registry — current 3.0.10] Confirms `+layout.svelte:onMount` runs at hydration time only, never during prerender — singleton init is browser-safe by construction |
| typescript | ^6.0.3 | Type safety; ships `lib.dom.d.ts` with `Window.visualViewport` | [VERIFIED: npm registry] `VisualViewport` interface, `Window.visualViewport: VisualViewport \| null`, `resize`/`scroll` events are all built-in. No `@types/*` package needed. |
| vite | ^8.0.9 | Build / HMR / vite-plugin-svelte | [VERIFIED: package.json] HMR replaces `.svelte.ts` modules wholesale during dev — relevant to CONTEXT.md D-06 (no destroy needed) |
| tailwindcss | ^4.2.2 | Styling via `@tailwindcss/vite` plugin | [VERIFIED: package.json] Phase 49 adds NO new Tailwind utilities — only edits two existing CSS rules inside the component's scoped `<style>` block |
| vitest | ^4.1.4 | Unit + component testing in jsdom | [VERIFIED: npm registry — current 4.1.5; project pinned 4.1.4] DRAWER-TEST-01 + DRAWER-TEST-02 run here against the Phase 47 polyfill |
| @testing-library/svelte | ^5.3.1 | Component test render helper | [VERIFIED: npm registry — current 5.3.1] Already imported by `InputDrawer.test.ts`; DRAWER-TEST-02 inherits |
| @playwright/test | ^1.59.1 | E2E test runner; provides `devices['iPhone 14 Pro']` | [VERIFIED: package.json] DRAWER-TEST-03 runs here under both `chromium` + `webkit-iphone` projects |

### Supporting (already in repo, consumed only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsdom | ^29.0.2 | Vitest DOM environment | The visualViewport polyfill at `src/test-setup.ts:152-211` is the surface DRAWER-TEST-01 + DRAWER-TEST-02 mock against |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers (`toHaveStyle`, `toHaveAttribute`) | DRAWER-TEST-02 may use `toHaveAttribute('style', ...)` for assertion shape |
| @lucide/svelte | ^1.8.0 | Icon library (`ChevronDown` already used) | Untouched — Phase 49 makes no icon changes |

### Alternatives Considered (and rejected)

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-house ~40-LOC singleton | `vaul` / `svelte-bottom-sheet` / `svelte-drawer` (drawer libraries) | [CITED: STACK.md §3 lines 62-64] Drawer libraries re-introduce auto-focus we just deleted in Phase 48, replace the existing v1.13 sticky-drawer pattern, and add ~10 KB for behavior we already have everywhere except iOS keyboard overlap. Net negative. |
| `pageshow` + `visibilitychange` listeners | Cache `vv.height` and only update on focus events | [CITED: PITFALLS.md P-04] Caching loses bfcache restore. iOS 26 #800125 makes caching actively harmful — re-read on every event is the standard mitigation. |
| Per-component `$effect` subscription | Module-scope singleton | [CITED: ARCHITECTURE.md §3 lines 80-83] Six `<InputDrawer>` call sites would each need to plumb the same value; singleton + CSS variable = zero per-calculator change. Singleton lifetime also survives drawer-collapse / drawer-reopen cycles without listener churn. |
| CSS variable on the dialog | CSS variable on the inner sheet | [CITED: PITFALLS.md P-15 + UI-SPEC.md LC-01] Transforms on the outer dialog inherit into the SelectPicker's nested `<dialog>` and visually drift it. Inner-sheet-only is non-negotiable. |
| Boolean `vv.scroll` listener | `vv.resize`-only | [CITED: PITFALLS.md P-08 + Phase 42.1 D-16] Phase 42.1 explicitly removed scroll-driven transforms (dock-magnification regression). Re-introducing via `vv.scroll` looks like dock magnification on review and may cause the same iOS scroll-jank. Source-grep regression sentinel in DRAWER-TEST-01 enforces this. |
| `requestAnimationFrame` coalescing | Direct synchronous writes inside `update()` | [CITED: CONTEXT.md "Specific Ideas"] `vv.resize` fires at most a few times per keyboard appearance/dismissal — well below the 60 fps frame budget. rAF coalescing matters for `vv.scroll` (forbidden) but not for `vv.resize`. YAGNI. |
| `keyboard-inset-height` (VirtualKeyboard API) | `window.visualViewport` | [CITED: REQUIREMENTS.md §Out of Scope] VirtualKeyboard API not implemented in iOS Safari. visualViewport is the authoritative source for v1.15.1; VirtualKeyboard acceptable as progressive enhancement only in a future milestone. |

**Installation:** None. Phase 49 ships zero new dependencies.

```bash
# No install commands. Confirmed by package.json verification.
# Phase 49 changes package.json's `version` only at REL-04 milestone close (1.15.0 → 1.15.1).
```

## Architecture Patterns

### System Architecture Diagram

```
                                          ┌─────────────────────────────────────┐
                                          │ iOS Safari (standalone PWA)         │
                                          │   - soft keyboard appears/dismisses │
                                          │   - bfcache restore                 │
                                          │   - foreground return               │
                                          └─────────────┬───────────────────────┘
                                                        │ events:
                                                        │   window.visualViewport.resize
                                                        │   window.pageshow (persisted=true)
                                                        │   document.visibilitychange
                                                        ▼
                                  ┌──────────────────────────────────────────────┐
                                  │ visualViewport.svelte.ts (NEW SINGLETON)     │
                                  │   class VisualViewportStore                  │
                                  │     offsetTop = $state(0)   ──┐              │
                                  │     height    = $state(0)     │  $state runes│
                                  │     keyboardOpen = $state(false)─┘            │
                                  │   init() { browser-guard; bind 3 listeners } │
                                  │   update() { read vv → write 3 runes }       │
                                  └──────────────────┬───────────────────────────┘
                                                     │ Svelte 5 reactive read
                                                     │ (no plumbing — module scope)
                                                     ▼
                              ┌──────────────────────────────────────────────────┐
                              │ InputDrawer.svelte (EDITED)                      │
                              │   ivvStyle = $derived(                           │
                              │     vv.keyboardOpen                              │
                              │       ? `--ivv-bottom: …px;                      │
                              │          --ivv-max-height: …px;`                 │
                              │       : ''  // empty string = CSS fallback path  │
                              │   )                                              │
                              │   <div class="input-drawer-sheet"                │
                              │        style={ivvStyle}>  ←── inline binding     │
                              └──────────────────────┬───────────────────────────┘
                                                     │ CSS custom-property cascade
                                                     ▼
                              ┌──────────────────────────────────────────────────┐
                              │ <style>.input-drawer-sheet { ... }</style>       │
                              │   max-height: calc(var(--ivv-max-height, 80dvh));│
                              │   padding-bottom: max(                           │
                              │     env(safe-area-inset-bottom, 0px),            │
                              │     var(--ivv-bottom, 0px)                       │
                              │   );                                             │
                              │                                                  │
                              │   keyboard-down: vars unset → fallbacks apply    │
                              │     → 80dvh / safe-area-inset (verbatim today)   │
                              │   keyboard-up:   vars set    → sheet shrinks +   │
                              │     padding lifts above keyboard top             │
                              └──────────────────────────────────────────────────┘

   ────── Wiring (edited once, in onMount) ────────────────────────────────
   +layout.svelte:onMount
     theme.init();
     disclaimer.init();
     favorites.init();
     vv.init();    ←── NEW; idempotent; browser-guarded; ~no-op in SSG

   ────── Test surface ─────────────────────────────────────────────────────
   src/test-setup.ts (Phase 47 polyfill, present)
     window.visualViewport = new VisualViewportPolyfill()    // EventTarget-backed

   src/lib/test/visual-viewport-mock.ts (Phase 47 helpers, present)
     dispatchVisualViewportResize(height, offsetTop, width)
     simulateKeyboardOpen() / simulateKeyboardDown()
     simulateBfcacheRestore()                                // PageTransitionEvent
     _resetVisualViewportMock()                              // beforeEach reset

                      consumed by ↓
   src/lib/shared/visualViewport.test.ts (NEW — DRAWER-TEST-01)
   src/lib/shared/components/InputDrawer.test.ts (EXTENDED — DRAWER-TEST-02)
   e2e/drawer-visual-viewport.spec.ts (NEW — DRAWER-TEST-03; runs both projects)
```

**Reading the diagram:** Top-to-bottom data flow follows iOS event → singleton state → Svelte reactivity → CSS variable cascade → final layout. The two test paths (jsdom-via-polyfill, Playwright-via-page.evaluate) feed in from the right and exercise the same singleton/CSS contracts.

### Project Structure (post-Phase-49)

```
src/
├── lib/
│   ├── shared/
│   │   ├── theme.svelte.ts          # existing singleton (mirror pattern)
│   │   ├── disclaimer.svelte.ts     # existing singleton (mirror pattern)
│   │   ├── favorites.svelte.ts      # existing class-based singleton (CLOSEST analog)
│   │   ├── pwa.svelte.ts            # existing singleton
│   │   ├── lastEdited.svelte.ts     # existing singleton (alt pattern, not mirrored)
│   │   ├── visualViewport.svelte.ts # ← NEW (Phase 49 D-01) — class-based singleton
│   │   ├── visualViewport.test.ts   # ← NEW (DRAWER-TEST-01)
│   │   └── components/
│   │       ├── InputDrawer.svelte           # ← EDITED (D-08..D-12)
│   │       ├── InputDrawer.test.ts          # ← EXTENDED (DRAWER-TEST-02)
│   │       └── InputDrawerHarness.svelte    # untouched — test harness for InputDrawer
│   ├── test/
│   │   └── visual-viewport-mock.ts  # Phase 47 (consumed; no edits)
│   └── shell/
│       └── NavShell.svelte          # untouched — Phase 48 owned NOTCH edits
├── routes/
│   └── +layout.svelte               # ← EDITED (D-13: 1 import + 1 init() call)
└── test-setup.ts                    # Phase 47 polyfill (consumed; no edits)

e2e/
├── webkit-smoke.spec.ts             # Phase 47 (precedent for synthetic-dispatch pattern)
├── drawer-no-autofocus.spec.ts      # Phase 48 (must remain green per D-25)
└── drawer-visual-viewport.spec.ts   # ← NEW (DRAWER-TEST-03)

playwright.config.ts                 # Phase 47 (consumed; no edits — both projects defined)
package.json                         # version bump only at REL-04
```

### Pattern 1: Class-based `$state` rune singleton (mirror `favorites.svelte.ts`)

**What:** Module-scope class with `$state` runes as instance fields, exported as a single instance, with idempotent `init()` and a `browser` SSG guard.

**When to use:** Cross-component shared reactive state that must survive navigation, has document-lifetime ownership, and must not run during SSG. Project's established pattern (5 existing singletons in `src/lib/shared/`).

**Example (skeleton — copy structure):**
```ts
// Source: src/lib/shared/favorites.svelte.ts (in-repo, verified line-for-line)
//         + ARCHITECTURE.md §3 (the locked Phase 49 sketch)
import { browser } from '$app/environment';

class VisualViewportStore {
  offsetTop = $state(0);
  height = $state(0);
  keyboardOpen = $state(false);
  #initialized = false;

  init(): void {
    if (!browser || this.#initialized) return;
    this.#initialized = true;

    const vv = window.visualViewport;
    if (!vv) return; // Older browsers / no support — fall back to CSS defaults

    const update = () => {
      this.offsetTop = vv.offsetTop;
      this.height = vv.height;
      // 100 px filters URL-bar collapse (~50–80 px Safari) and admits OSK only.
      this.keyboardOpen = window.innerHeight - vv.height > 100;
    };

    update(); // seed initial values

    vv.addEventListener('resize', update, { passive: true });
    // NOTE: NO vv.addEventListener('scroll', ...) — DRAWER-02 / PITFALLS.md P-08

    window.addEventListener(
      'pageshow',
      (e: PageTransitionEvent) => {
        if (e.persisted) update();
      },
      { passive: true }
    );

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'visible') update();
      },
      { passive: true }
    );
  }
}

export const vv = new VisualViewportStore();
```

### Pattern 2: `$derived` empty-string short-circuit for CSS variables

**What:** When the consumer's reactive state is "off," return an empty `style` string so the CSS rule's `var(..., fallback)` path applies cleanly. Avoids subtle defense-in-depth bugs from explicitly setting variables to zero.

**When to use:** Whenever a component's behavior toggles between "off (existing CSS)" and "on (overridden CSS)," and the existing CSS already has graceful fallbacks. Phase 49's keyboard-up/keyboard-down toggle is the canonical case.

**Example (verbatim from CONTEXT.md D-09):**
```svelte
<script lang="ts">
  import { vv } from '$lib/shared/visualViewport.svelte.js';

  const ivvStyle = $derived(
    vv.keyboardOpen
      ? `--ivv-bottom: ${window.innerHeight - vv.offsetTop - vv.height}px; --ivv-max-height: ${vv.height - 16}px;`
      : ''
  );
</script>

<div bind:this={sheet} class="input-drawer-sheet ..." style={ivvStyle}>
  ...
</div>
```

When `keyboardOpen === false`, `ivvStyle` is `''`; the inline `style` attribute is empty; the CSS rules `max-height: calc(var(--ivv-max-height, 80dvh))` and `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px))` resolve to their fallback paths — which are bit-for-bit identical to today's behavior.

### Pattern 3: Two-arg `var()` + `max()` composition for safe-area + keyboard

**What:** Combine `env(safe-area-inset-bottom, 0px)` (home-indicator clearance) and `var(--ivv-bottom, 0px)` (keyboard clearance) via CSS `max()` so a single rule handles both states without a JS branch.

**Why it works:**
- Keyboard down: `var(--ivv-bottom, 0px)` → `0px`; `max(env(...), 0px)` → `env(...)` → existing home-indicator clearance verbatim.
- Keyboard up: iOS reports `safe-area-inset-bottom: 0` (keyboard covers the home indicator); `var(--ivv-bottom, 0px)` → keyboard-top offset (positive). `max(0, ivvBottom)` → `ivvBottom`. Sheet sits flush above keyboard.

**Reference:** PITFALLS.md P-07 + UI-SPEC.md LC-02. The composition is non-negotiable — branching in JS instead would re-introduce timing races on keyboard appearance/dismissal that visualViewport's event-stream model already handles correctly via CSS.

### Pattern 4: Synthetic `visualViewport.resize` for Playwright

**What:** Override `window.visualViewport.height` / `offsetTop` via `Object.defineProperty(..., { configurable: true })` then dispatch `new Event('resize')`. The polyfill / WebKit emulator does NOT fire keyboard-driven resize on its own.

**When to use:** Any Playwright test that needs to observe drawer behavior in the keyboard-up branch. Document the limitation in the spec file header — green CI does NOT prove iPhone correctness.

**Example (DRAWER-TEST-03 sketch — adapted from CONTEXT.md D-19 + e2e/webkit-smoke.spec.ts pattern):**
```ts
// e2e/drawer-visual-viewport.spec.ts
//
// DRAWER-TEST-03: synthetic-dispatch CI proxy. Real-iPhone visual verification
// is Phase 50 SMOKE-04..07. Playwright WebKit on Linux does NOT emulate the
// iOS soft keyboard (visualViewport.resize does not fire automatically; we
// synthesize it here). Documented in PITFALLS.md P-19 + P-20.
import { expect, test } from '@playwright/test';

test('drawer max-height shrinks when synthetic visualViewport.resize fires', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nicu_assistant_disclaimer_v2', 'true');
    localStorage.removeItem('nicu:favorites');
  });
  await page.goto('/morphine-wean');
  await page.getByRole('button', { name: /tap to edit inputs/i }).click();

  await page.evaluate(() => {
    Object.defineProperty(window.visualViewport, 'height', { value: 400, configurable: true });
    Object.defineProperty(window.visualViewport, 'offsetTop', { value: 0, configurable: true });
    window.visualViewport!.dispatchEvent(new Event('resize'));
  });

  const maxHeight = await page
    .locator('.input-drawer-sheet')
    .evaluate((el) => getComputedStyle(el).maxHeight);
  // (400 - 16) = 384px target; allow ±2px for browser rounding
  expect(parseFloat(maxHeight)).toBeGreaterThan(380);
  expect(parseFloat(maxHeight)).toBeLessThan(390);
});
```

Single calculator (Morphine — first in registry) is sufficient because DRAWER-05 single-source-of-truth makes cross-calculator divergence structurally impossible.

### Anti-Patterns to Avoid

- **`style` binding on the outer `<dialog>` element.** Inherits transforms / sizing into the SelectPicker's nested top-layer dialog. Plan-checker MUST grep for `style={` on `<dialog` lines and reject. (PITFALLS.md P-15 + UI-SPEC.md LC-01.)
- **`vv.addEventListener('scroll', ...)`.** Phase 42.1 D-16 dock-magnification regression risk. Source-grep regression sentinel in DRAWER-TEST-01 step 6 enforces. (PITFALLS.md P-08.)
- **Caching `vv.height` between events.** iOS 26 #800125 leaves stale post-dismiss values; cached state mis-positions the sheet until the next resize. Re-read every event. (PITFALLS.md "iOS 26 regression" + CONTEXT.md D-05.)
- **Adding `transition: max-height` or `transition: padding-bottom` to `.input-drawer-sheet`.** Re-introduces scroll-driven coupling DRAWER-02 forbids; iOS keyboard is itself a system-controlled animation we cannot synchronize with — own transition would only fight it. (PITFALLS.md P-08 + P-21 + UI-SPEC.md LC-02.)
- **`requestAnimationFrame` coalescing in `update()`.** YAGNI for resize-only listener; `vv.resize` fires at most a few times per keyboard appearance — well below 60 fps frame budget. (CONTEXT.md "Specific Ideas".)
- **Per-calculator `<InputDrawer>` prop plumbing.** Six calculator routes; CSS-variable + singleton pattern keeps the change to one component. Adding a prop would force six route edits + a typed prop signature for a value the component already has via singleton import. (DRAWER-05.)
- **Calling `vv.init()` from inside `InputDrawer.svelte`'s `$effect`.** Creates a race: drawer mounts → effect runs → singleton initializes → first resize event arrives → drawer is already past first paint. Layout-level init in `+layout.svelte:onMount` is the only correct surface. (CONTEXT.md D-14.)
- **Replacing `<dialog>` with `position: fixed` div.** Top-layer is the only mechanism that survives iOS keyboard. (REQUIREMENTS.md §Out of Scope + DRAWER-12.)
- **`body { overflow: hidden }` scroll-lock.** Breaks iOS scroll-into-view. (REQUIREMENTS.md §Out of Scope.)
- **Hardcoded keyboard-height fallback** (e.g. `padding-bottom: 290px`). Devices vary; hardware-keyboard pairing leaves `vv.height` unchanged so a hardcoded keyboard inset would float the drawer above empty space. (PITFALLS.md P-05 + DRAWER-09.)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Track iOS soft-keyboard visibility | A `focusin` / `focusout` heuristic on inputs to "guess" whether the keyboard is up | `window.visualViewport.resize` + `window.innerHeight - vv.height > 100` heuristic | iOS does not pair OSK appearance with focus events deterministically; bluetooth-paired iPhones never show OSK on focus; URL-bar collapse fires similar geometry without an OSK. visualViewport is the only authoritative signal. (PITFALLS.md P-05.) |
| Detect bfcache restore | Polling `document.hidden` or `setInterval(() => readVV(), 250)` | `pageshow.persisted === true` + `visibilitychange` listeners | The browser fires `pageshow` exactly when bfcache restores the page; `event.persisted` distinguishes bfcache from normal load. Polling burns battery and still misses the synchronous post-restore pre-paint window. (PITFALLS.md P-04 + MDN `pageshow_event`.) |
| Focus-trap inside the drawer | A custom keydown handler that intercepts Tab and cycles focus | Native `<dialog>.showModal()` (already in place) | WHATWG HTML spec defines focus-trap + Esc-to-close + focus-restore-on-close as part of `showModal()`. Custom focus-trap fights the native trap and creates the very accessibility regressions WCAG 2.4.3 forbids. (ARCHITECTURE.md §Fix1 lines 28-32.) |
| Top-layer rendering above bottom nav | `position: fixed; z-index: 9999` on a div + manual scrim + manual transform | Native `<dialog>.showModal()` (already in place) | `<dialog>.showModal()` puts the dialog in the browser's top layer — by spec it renders above all `position: fixed` content including the bottom nav. Manual fixed-position alternatives have known iOS gap-at-bottom bugs under `<dialog>` + `black-translucent`. (REQUIREMENTS.md §Out of Scope; HeadlessUI #1900.) |
| Throttle / debounce visualViewport events | Custom `Date.now()` minus last-event timestamp + setTimeout | Direct synchronous writes inside `update()` | `vv.resize` fires at most a few times per keyboard appearance/dismissal — well below 60 fps. Throttling adds latency to a UX-critical path (drawer-above-keyboard arrival timing) for zero performance gain. (CONTEXT.md "Specific Ideas".) |
| Test-environment visualViewport polyfill | Roll a one-off mock in each test file | Phase 47 polyfill at `src/test-setup.ts:152-211` + helpers at `src/lib/test/visual-viewport-mock.ts` | Already in place; tested via `webkit-smoke.spec.ts` for runtime-WebKit and via `src/test-setup.ts` self-test (lines 178-210) for jsdom. Phase 49 consumes both surfaces. |
| Module reset / lifecycle cleanup for HMR | `destroy()` API + per-effect cleanup hook | None — singletons live for the document lifetime; HMR replaces the module wholesale | Same as theme/disclaimer/favorites/pwa singletons — no destroy contract. CONTEXT.md D-06. |

**Key insight:** Every "hand-rolled" alternative in the table above either (a) re-introduces a known regression that earlier phases or research already eliminated, or (b) replaces a browser-platform primitive with a userland imitation that is provably worse. Phase 49's job is to **consume existing primitives correctly**, not to invent new ones. The 40 LOC budget is realistic *because* the singleton is a thin reactive wrapper around `visualViewport` events — anything beyond that is over-engineering.

## Common Pitfalls

### Pitfall 1: `style` binding on outer `<dialog>` instead of inner sheet (PITFALLS.md P-15)

**What goes wrong:** Transform / sizing applied to the outer `<dialog class="input-drawer-dialog">` propagates into the SelectPicker's nested `<dialog>` (which opens its own top-layer slot when a calculator's `<children>` snippet contains `<SelectPicker>`). The picker visually drifts off-center and may render outside the visible viewport.
**Why it happens:** The sheet div and the dialog are visually similar (the dialog is the invisible flex container with `100dvh` + `flex-end`; the sheet is the visible bottom-anchored div inside). Easy to bind the wrong element if reading the file quickly.
**How to avoid:** Bind `style={ivvStyle}` on the `<div bind:this={sheet} class="input-drawer-sheet">` at lines 91-94. NEVER on the `<dialog bind:this={dialog} class="input-drawer-dialog">` at line 83. Plan-checker MUST grep for `style=` on `<dialog` lines and reject.
**Warning signs:** SelectPicker tests start failing; visual drift in formula calculator's `FormulaPicker`; chromium e2e `e2e/formula.spec.ts` regression.

### Pitfall 2: Listening to `visualViewport.scroll` (PITFALLS.md P-08)

**What goes wrong:** Per-frame scroll events drive a `translate3d` on the sheet; clinician scroll touches turn into dock-magnification-style sheet jumps; iOS scroll-jank returns.
**Why it happens:** Naive "watch all viewport changes" reflex; both `resize` and `scroll` are documented `VisualViewport` events.
**How to avoid:** `vv.addEventListener('resize', update)` ONLY. Source-grep regression sentinel (DRAWER-TEST-01 step 6, CONTEXT.md D-17) reads the singleton source and asserts `not.toMatch(/visualViewport\.addEventListener\(['"]scroll/)`. Phase 42.1 D-16 explicitly removed scroll-driven transforms from `MorphineWeanCalculator` + `GlucoseTitrationGrid` and the comment markers there are still load-bearing for code review.
**Warning signs:** Sheet "jiggles" on scroll; `e2e/drawer-visual-viewport.spec.ts` reports unstable `max-height` reads on chromium under fast scroll synthesis.

### Pitfall 3: Caching `vv.height` between events (iOS 26 #800125)

**What goes wrong:** After the keyboard dismisses on iOS 26 Safari, `visualViewport.height` does not fully reset to its pre-keyboard value — leaves the sheet at the smaller post-keyboard height even though the keyboard is gone, until the next resize.
**Why it happens:** Standard "compute once, cache forever" performance optimization. Apple's regression makes this actively harmful.
**How to avoid:** `update()` re-reads `vv.offsetTop` and `vv.height` from the live API on every event — no class field captures the previous values for delta math. CONTEXT.md D-05 codifies this. (See DRAWER-TEST-01 case 3: simulate keyboard-up, then keyboard-down, assert `vv.height` reads the second value, not the first.)
**Warning signs:** SMOKE-05 fails on a real iPhone running iOS 26; sheet stays at the smaller size after Done-button keyboard dismissal.
**Source:** [Apple Developer Forums #800125](https://developer.apple.com/forums/thread/800125) (Sep 2025, MEDIUM-confidence per CONTEXT.md canonical refs).

### Pitfall 4: bfcache restore leaves listeners attached but state stale (PITFALLS.md P-04)

**What goes wrong:** Clinician switches from NICU Assist (standalone PWA) to Phone app to take a call, then returns. Safari restores the page from bfcache; listeners are still bound, but `vv.resize` does not fire spontaneously and properties report pre-suspension values. Drawer renders mispositioned with no keyboard up.
**Why it happens:** bfcache preserves the JavaScript heap exactly — including stale `$state` values — but re-uses the existing `visualViewport` instance which may report stale geometry until the next user gesture.
**How to avoid:** Bind `pageshow.persisted === true` AND `visibilitychange` listeners (CONTEXT.md D-04). Both call `update()` to synchronously re-read `vv.offsetTop` / `vv.height` and write the runes. Phase 47's `simulateBfcacheRestore()` helper at `src/lib/test/visual-viewport-mock.ts:85-94` synthesizes the event for the unit test.
**Warning signs:** SMOKE-06 fails on a real iPhone (call-yourself-and-return scenario); DRAWER-TEST-01 case 4 (bfcache rebind) regresses.

### Pitfall 5: 100 px keyboard-open threshold mis-tuned for hardware-keyboard iPhones (PITFALLS.md P-05)

**What goes wrong:** On a Bluetooth-keyboard-paired iPhone, no OSK appears; `vv.height` stays equal to `window.innerHeight`; `keyboardOpen` should stay `false`. If the threshold is too low (e.g., < 50 px), URL-bar collapse during scroll (~50–80 px) flips `keyboardOpen` to `true`, lifting the drawer above empty space.
**Why it happens:** Naive "any visualViewport shrink = keyboard" assumption.
**How to avoid:** Threshold = **100 px** (CONTEXT.md D-07 + DRAWER-09). Filters URL-bar collapse and admits only the OSK (~290 px portrait, ~190 px landscape). Bluetooth keyboards leave `vv.height ≈ window.innerHeight` so `window.innerHeight - vv.height ≈ 0` < 100 → `keyboardOpen` stays false. (DRAWER-TEST-01 case 5 verifies.)
**Warning signs:** SMOKE-07 fails on a Bluetooth-keyboard-paired iPhone; drawer floats above empty space; URL-bar collapse triggers spurious drawer-lift on scroll-while-drawer-closed.

### Pitfall 6: Older iOS / no-visualViewport runtime crash (DRAWER-01 + D-03)

**What goes wrong:** A pre-iOS-13 device or a runtime without `window.visualViewport` reaches `init()`; the line `const vv = window.visualViewport;` returns `undefined`; subsequent `vv.addEventListener` throws `TypeError: Cannot read properties of undefined`.
**Why it happens:** `lib.dom.d.ts` types `Window.visualViewport: VisualViewport | null` but in practice ancient runtimes return `undefined`. Aggressive type narrowing can hide the runtime check.
**How to avoid:** After the `browser` guard, do `const vv = window.visualViewport; if (!vv) return;` — early-return leaves the runes at their initial `0/0/false`. The CSS `var(--ivv-max-height, 80dvh)` and `var(--ivv-bottom, 0px)` fallbacks then resolve to the existing keyboard-down behavior verbatim. (ARCHITECTURE.md §3 line 61.)
**Warning signs:** vitest passes (jsdom polyfill always provides `visualViewport`); production reports a runtime exception only on the rare pre-iOS-13 device. Mitigation: the early-return makes this a no-op fall-through, not an exception.

### Pitfall 7: SSG / prerender hits `init()` and throws on `window` (DRAWER-04 + D-03)

**What goes wrong:** SvelteKit's adapter-static prerender pass evaluates `+layout.svelte` at build time; if `vv.init()` is called outside `onMount` (or `onMount`'s `browser`-only guarantee is broken), `window.visualViewport` is undefined → throw.
**Why it happens:** Mistakenly putting `vv.init()` at module top level instead of inside `onMount`, or calling it from `+layout.ts`.
**How to avoid:** `vv.init()` is called ONLY from `+layout.svelte:onMount`. Defense-in-depth: `init()` itself starts with `if (!browser) return;` (CONTEXT.md D-03 + D-15).
**Warning signs:** `pnpm build` fails with "ReferenceError: window is not defined" during prerender; `npm run check` is unaffected.

### Pitfall 8: Empty-string `$derived` overridden by an explicit `--ivv-bottom: 0px`

**What goes wrong:** A "defensive" code path emits `--ivv-bottom: 0px` when `keyboardOpen === false` instead of an empty string. With `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px))`, max(34, 0) = 34 — looks fine. But a typo or sign error turns this into `max(34, -1)` = 34 (still fine) or `max(34, NaN)` (undefined behavior).
**Why it happens:** Premature consistency reflex — "always emit the variable, just zero it when off."
**How to avoid:** Empty string when `keyboardOpen === false` per CONTEXT.md D-09 + UI-SPEC.md LC-03. Lets CSS fallbacks govern the keyboard-down branch verbatim. Defense in depth.
**Warning signs:** DRAWER-TEST-02 keyboard-down assertion (`expect(style).toBe('')`) fails; visual drift on devices that never see the keyboard-up branch.

## Runtime State Inventory

> Phase 49 is a structural-plumbing phase, NOT a rename/refactor/migration. The Runtime State Inventory section is included here for completeness because the phase introduces a new module-scope reactive singleton.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by grep on `localStorage` / `sessionStorage` / `IndexedDB` keys. The new singleton stores nothing; `vv.offsetTop` / `vv.height` / `vv.keyboardOpen` are pure derived state from live `visualViewport` reads. No persistence needed (matches `theme.svelte.ts` pattern: theme persists; viewport state does not). | None |
| Live service config | None — Phase 49 introduces no external service, no n8n workflow, no Datadog tag, no Tailscale ACL. | None |
| OS-registered state | None — no Windows Task Scheduler entry, no launchd plist, no systemd unit, no pm2 process. The PWA service worker is unaffected (Phase 49 makes no edit to `vite.config.ts` SvelteKitPWA block). | None |
| Secrets / env vars | None — no env-var read in singleton or drawer code; no SOPS key. | None |
| Build artifacts | None new — the singleton compiles via the existing `@sveltejs/vite-plugin-svelte` rune compiler; no new entry in `dist/` beyond the singleton's own chunk (which is small enough to inline). HMR replaces `.svelte.ts` modules wholesale during dev (CONTEXT.md D-06 codifies that no destroy contract is needed). | None |

**Module-scope singleton lifecycle note:** The `vv` instance lives for the document lifetime. There is intentionally no `destroy()` API. HMR during dev replaces the entire module (including the instance and its listeners); production has no teardown contract because the listeners survive for the document lifetime. If a future phase introduces an HMR-sensitive listener that leaks during dev, add the teardown contract then (CONTEXT.md "Deferred Ideas").

## Code Examples

Verified patterns from in-repo sources and milestone-level research, with file/line precision.

### §1 visualViewport singleton skeleton (NEW file — DRAWER-01..04, 09)

**File:** `src/lib/shared/visualViewport.svelte.ts` (new — does not exist before Phase 49)
**Source:** `src/lib/shared/favorites.svelte.ts` (in-repo class-based singleton with `$state` runes — closest analog) + ARCHITECTURE.md §3 lines 47-77 (Phase-49-specific sketch).

```ts
// src/lib/shared/visualViewport.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile.
// Source pattern: favorites.svelte.ts (class-based singleton + init() idempotency).
// Phase 49 D-01..D-07. Mirrors the existing four singletons in src/lib/shared/.

import { browser } from '$app/environment';

class VisualViewportStore {
  offsetTop = $state(0);
  height = $state(0);
  keyboardOpen = $state(false);
  #initialized = false;

  /** Idempotent. Browser-guarded for SSG safety. Falls through cleanly if
   *  window.visualViewport is undefined (older iOS, rare runtimes). */
  init(): void {
    if (!browser || this.#initialized) return;
    this.#initialized = true;

    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      this.offsetTop = vv.offsetTop;
      this.height = vv.height;
      // 100 px filters URL-bar collapse (~50–80 px) and admits OSK only.
      // Phase 50 SMOKE-07 tunes if real-device data warrants.
      this.keyboardOpen = window.innerHeight - vv.height > 100;
    };

    update(); // seed initial values

    // resize ONLY — never scroll. PITFALLS.md P-08 + Phase 42.1 D-16.
    // Source-grep regression sentinel in DRAWER-TEST-01 step 6 enforces this.
    vv.addEventListener('resize', update, { passive: true });

    // bfcache restore: pageshow with persisted=true means the page was
    // restored from bfcache; visualViewport may report stale values until
    // we re-read. PITFALLS.md P-04.
    window.addEventListener(
      'pageshow',
      (e: PageTransitionEvent) => {
        if (e.persisted) update();
      },
      { passive: true }
    );

    // Foreground return without bfcache: visibilitychange covers the case
    // where the tab was hidden but bfcache did not fire.
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'visible') update();
      },
      { passive: true }
    );
  }
}

export const vv = new VisualViewportStore();
```

**Notes:**
- Class fields (`offsetTop`, `height`, `keyboardOpen`) are initialized with `$state(...)` so they are reactive. The TypeScript class-field initializer is the rune call site; Svelte 5's compiler transforms these inside `.svelte.ts` files.
- `#initialized` is a private class field (TC39 stage 4, supported by TypeScript ^6 and Vite). Same idiom as `theme.svelte.ts` and `favorites.svelte.ts`.
- Imported by `+layout.svelte` and by `InputDrawer.svelte`; consumers read `vv.offsetTop` / `vv.height` / `vv.keyboardOpen` directly (rune subscription is automatic via Svelte 5's reactive compilation).
- Target ~40 LOC. Rejecting `vv.scroll` listener, `destroy()` API, rAF coalescing, `width`/`scale` runes keeps the budget realistic.

### §2 Layout init wiring — exact edit sites (DRAWER-04, D-13)

**File:** `src/routes/+layout.svelte` (existing — verified at the path)

**Import line — add after line 14 (`import { pwa } from '$lib/shared/pwa.svelte.js';`):**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import '../app.css';
  import NavShell from '$lib/shell/NavShell.svelte';
  import UpdateBanner from '$lib/shell/UpdateBanner.svelte';
  import DisclaimerBanner from '$lib/shared/components/DisclaimerBanner.svelte';
  import AboutSheet from '$lib/shared/components/AboutSheet.svelte';
  import { CALCULATOR_REGISTRY } from '$lib/shell/registry.js';
  import type { CalculatorId } from '$lib/shared/types.js';
  import { theme } from '$lib/shared/theme.svelte.js';
  import { disclaimer } from '$lib/shared/disclaimer.svelte.js';
  import { favorites } from '$lib/shared/favorites.svelte.js';
  import { pwa } from '$lib/shared/pwa.svelte.js';
  import { vv } from '$lib/shared/visualViewport.svelte.js';   // ← ADD (after line 14)
  import { morphineState } from '$lib/morphine/state.svelte.js';
  ...
```

**`init()` call — add inside the existing `onMount` block (currently at lines 52-71). Place after `favorites.init();` on line 55:**

```svelte
  onMount(() => {
    theme.init();
    disclaimer.init();
    favorites.init();
    vv.init();                                                  // ← ADD (after line 55)

    // SW registration — dynamic import avoids SSG/SSR issues with virtual modules
    if (pwaInfo) {
      import('virtual:pwa-register').then(({ registerSW }) => {
        const updateSW = registerSW({
          immediate: true,
          onNeedRefresh() {
            pwa.setUpdateAvailable(updateSW);
          },
          onOfflineReady() {
            // App is ready to work offline — no UI needed, precache complete
          }
        });
      });
    }
  });
```

**Note on CONTEXT.md D-04 wording:** The CONTEXT.md says `vv.init()` goes "after `pwa.init()` line 55" but the actual `+layout.svelte` shows `pwa.init()` is NOT explicitly called in `onMount` — `pwa` only has `setUpdateAvailable()` invoked from the SW registration callback. The order that matches CONTEXT.md D-13's intent (and that PWA.svelte.ts confirms) is: place `vv.init()` immediately after `favorites.init()` (line 55) and before the SW registration block. The plan should clarify this exact placement and reject any plan that places `vv.init()` outside `onMount`.

### §3 InputDrawer wiring — script imports + `$derived` + inline style (DRAWER-05..09)

**File:** `src/lib/shared/components/InputDrawer.svelte` (existing — verified post-Phase-48)

**Edit site A — add singleton import inside `<script>` block (currently lines 17-19):**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ChevronDown } from '@lucide/svelte';
  import { vv } from '$lib/shared/visualViewport.svelte.js';      // ← ADD

  let {
    title = 'Inputs',
    expanded = $bindable(false),
    onClear,
    children
  }: {
    ...
  } = $props();

  // ... existing logic at lines 36-80 untouched ...
```

**Edit site B — add `$derived ivvStyle` computation inside `<script>` block (after the existing `let sheet = $state<HTMLDivElement | null>(null);` at line 66 — keeps the reactive declarations grouped):**

```svelte
  let sheet = $state<HTMLDivElement | null>(null);

  // Phase 49 D-09 — visualViewport-aware sheet sizing.
  // When the iOS soft keyboard is up (vv.keyboardOpen), set CSS variables
  // that drive max-height shrink + padding-bottom lift. When down, return
  // empty string so the existing CSS fallbacks (80dvh, safe-area-inset-bottom)
  // apply verbatim — keyboard-down behavior is bit-for-bit Phase-48 behavior.
  const ivvStyle = $derived(                                       // ← ADD
    vv.keyboardOpen
      ? `--ivv-bottom: ${window.innerHeight - vv.offsetTop - vv.height}px; --ivv-max-height: ${vv.height - 16}px;`
      : ''
  );
```

**Edit site C — bind `style={ivvStyle}` on the inner `.input-drawer-sheet` div (currently lines 91-94):**

```svelte
{#if expanded}
  <div
    bind:this={sheet}
    class="input-drawer-sheet flex flex-col bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
    style={ivvStyle}                                                {/* ← ADD */}
  >
    <!-- header + children unchanged -->
```

**CRITICAL:** The `style={ivvStyle}` binding goes on the **inner sheet `<div>`** at lines 91-94. NEVER on the outer `<dialog>` at line 83. Per UI-SPEC.md LC-01 + PITFALLS.md P-15. Plan-checker MUST grep for `style=` on `<dialog` lines and reject.

### §4 InputDrawer CSS rule changes — `<style>` block (DRAWER-06, 07, 10)

**File:** `src/lib/shared/components/InputDrawer.svelte` lines 155-164 (existing `.input-drawer-sheet` block).

**Before (Phase 48 verbatim — confirmed via in-repo line-grep):**

```css
.input-drawer-sheet {
  width: 100%;
  max-height: 80vh;                         /* line 157 — older-browser fallback */
  max-height: 80dvh;                        /* line 158 — CHANGE */
  overflow: hidden;
  /* Clear the iOS home indicator when overlaying the nav. */
  padding-bottom: env(safe-area-inset-bottom, 0px);  /* line 161 — CHANGE */
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}
```

**After (Phase 49):**

```css
.input-drawer-sheet {
  width: 100%;
  max-height: 80vh;                                      /* line 157 — UNCHANGED */
  max-height: calc(var(--ivv-max-height, 80dvh));        /* line 158 — Phase 49 */
  overflow: hidden;
  /* Clear the iOS home indicator when overlaying the nav. Phase 49: also
     clear the iOS soft keyboard when --ivv-bottom is set. */
  padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px));  /* line 161 — Phase 49 */
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
}
```

**Rules:**
- Line 157 `max-height: 80vh;` (older-browser fallback) is **unchanged**. Browsers that DO support `dvh` resolve line 158's `calc(var(--ivv-max-height, 80dvh))`.
- Line 158 fallback value is `80dvh` — bit-for-bit identical to today's value when `--ivv-max-height` is unset.
- Line 161 `max()` two-arg composition is non-negotiable per UI-SPEC.md LC-02 + PITFALLS.md P-07. With keyboard down, `var(--ivv-bottom, 0px)` resolves to `0px` and `max(env(...), 0px)` = `env(...)` — exact preservation of today's home-indicator clearance.
- **NO `transition: max-height` or `transition: padding-bottom` declared.** Per CONTEXT.md D-12 + D-27 + UI-SPEC.md "Reduced-Motion Contract." Adding a transition would re-introduce the very scroll-driven coupling DRAWER-02 / PITFALLS.md P-08 forbids.
- The existing `@media (prefers-reduced-motion: no-preference)` rule at lines 168-175 is **unchanged**. It guards the slide-up animation; CSS-variable changes propagate via the browser's normal recomputation pipeline regardless of reduced-motion preference.
- The outer `.input-drawer-dialog` rules at lines 137-148 are **unchanged**. DRAWER-08 + UI-SPEC.md LC-01.

### §5 Test patterns

**DRAWER-TEST-01 (Vitest, NEW file — `src/lib/shared/visualViewport.test.ts`):**

```ts
// src/lib/shared/visualViewport.test.ts
// Phase 49 / DRAWER-TEST-01: covers DRAWER-01..04 + DRAWER-09.
// Source pattern: src/lib/shared/favorites.test.ts (co-located singleton test
// with vi.resetModules() between cases).
//
// Consumes Phase 47 polyfill at src/test-setup.ts:152-211 + helpers at
// src/lib/test/visual-viewport-mock.ts.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  dispatchVisualViewportResize,
  simulateKeyboardOpen,
  simulateKeyboardDown,
  simulateBfcacheRestore,
  _resetVisualViewportMock
} from '$lib/test/visual-viewport-mock.js';

describe('visualViewport singleton', () => {
  beforeEach(() => {
    _resetVisualViewportMock();
    vi.resetModules(); // fresh singleton per test
  });

  it('T-01 init() is idempotent', async () => {
    const { vv } = await import('./visualViewport.svelte.js');
    expect(() => {
      vv.init();
      vv.init();
    }).not.toThrow();
  });

  it('T-02 state updates on resize (keyboard-up)', async () => {
    const { vv } = await import('./visualViewport.svelte.js');
    vv.init();
    simulateKeyboardOpen(); // height = innerHeight - 290
    expect(vv.keyboardOpen).toBe(true);
    expect(vv.height).toBeLessThan(window.innerHeight);
  });

  it('T-03 state updates on resize (keyboard-down — re-read, no cache)', async () => {
    const { vv } = await import('./visualViewport.svelte.js');
    vv.init();
    simulateKeyboardOpen();
    simulateKeyboardDown();
    expect(vv.keyboardOpen).toBe(false);
    expect(vv.height).toBe(window.innerHeight);
  });

  it('T-04 bfcache rebind via pageshow.persisted=true', async () => {
    const { vv } = await import('./visualViewport.svelte.js');
    vv.init();
    simulateKeyboardOpen();
    // The polyfill keeps height at the keyboard-up value; bfcache restore
    // should re-trigger update() and re-read live properties.
    simulateBfcacheRestore();
    // After restore, state reflects the live (still-resized) vv.
    expect(vv.height).toBeLessThan(window.innerHeight);
  });

  it('T-05 hardware-keyboard guard: vv.height === innerHeight → keyboardOpen=false', async () => {
    const { vv } = await import('./visualViewport.svelte.js');
    vv.init();
    dispatchVisualViewportResize(window.innerHeight, 0); // no OSK shrink
    expect(vv.keyboardOpen).toBe(false);
  });

  it('T-06 source-grep: no scroll listener (DRAWER-02 / PITFALLS.md P-08)', () => {
    const source = readFileSync(
      resolve(__dirname, 'visualViewport.svelte.ts'),
      'utf8'
    );
    expect(source).not.toMatch(/visualViewport\.addEventListener\(['"]scroll/);
  });
});
```

**DRAWER-TEST-02 (Vitest extension — append to `src/lib/shared/components/InputDrawer.test.ts`):**

The existing file already has T-01..T-08 (Phase 48). Phase 49 appends T-09 (style-applied-when-keyboard-up) and T-10 (style-cleared-when-keyboard-down):

```ts
import {
  simulateKeyboardOpen,
  simulateKeyboardDown,
  _resetVisualViewportMock
} from '$lib/test/visual-viewport-mock.js';

// Append inside the existing describe('InputDrawer', () => { ... }) block:

it('T-09 DRAWER-TEST-02a: style attribute carries --ivv-bottom + --ivv-max-height when keyboard up', async () => {
  _resetVisualViewportMock();
  // The singleton is module-scope; importing it here ensures init() has run via
  // Harness mount. Because Harness imports InputDrawer which imports vv, the
  // singleton's listeners are already bound at this point — but vv.init() is
  // only called from +layout.svelte:onMount, which is not running in this test
  // environment. The plan must ensure DRAWER-TEST-02 either (a) imports and
  // calls vv.init() explicitly in a beforeEach, OR (b) uses a test-only seam.
  // Recommended: the test calls vv.init() before mounting the harness so the
  // resize listeners are bound when simulateKeyboardOpen() fires.
  const { vv } = await import('$lib/shared/visualViewport.svelte.js');
  vv.init();

  const { container } = render(InputDrawerHarness, { props: { initialExpanded: true } });
  await tick();

  simulateKeyboardOpen();
  await tick();

  const sheet = container.querySelector('.input-drawer-sheet') as HTMLElement;
  expect(sheet).toBeTruthy();
  const style = sheet.getAttribute('style') ?? '';
  expect(style).toContain('--ivv-bottom:');
  expect(style).toContain('--ivv-max-height:');
});

it('T-10 DRAWER-TEST-02b: style attribute is empty / falsy when keyboard down', async () => {
  _resetVisualViewportMock();
  const { vv } = await import('$lib/shared/visualViewport.svelte.js');
  vv.init();

  const { container } = render(InputDrawerHarness, { props: { initialExpanded: true } });
  await tick();
  simulateKeyboardDown();
  await tick();

  const sheet = container.querySelector('.input-drawer-sheet') as HTMLElement;
  const style = sheet.getAttribute('style') ?? '';
  // Empty-string short-circuit per CONTEXT.md D-09 + UI-SPEC.md LC-03.
  // Svelte 5 may render an empty `style=""` attribute or omit the attribute
  // entirely; both are acceptable as long as the CSS variables are NOT set.
  expect(style).not.toContain('--ivv-bottom:');
  expect(style).not.toContain('--ivv-max-height:');
});
```

**Note for the planner on `vv.init()` in test:** Because `vv.init()` is normally called from `+layout.svelte:onMount` (not from `InputDrawer.svelte`), the component test must explicitly call `vv.init()` before relying on rune updates (the singleton's resize listener is what writes the runes; without `init()`, the listener is not bound). The DRAWER-TEST-01 unit test handles this naturally; DRAWER-TEST-02 needs an explicit setup line. See *Open Questions §1*.

**DRAWER-TEST-03 (Playwright, NEW file — `e2e/drawer-visual-viewport.spec.ts`):**

See §4 Pattern 4 (Synthetic visualViewport.resize for Playwright) earlier in this document for the full spec. Runs under both `chromium` and `webkit-iphone` projects per Phase 47 D-15 default. Single calculator (Morphine) suffices because DRAWER-05 single-source-of-truth makes cross-calculator divergence structurally impossible (CONTEXT.md D-19).

**DRAWER-TEST-04 (axe regression):** No new spec file. The existing 16/16 axe sweep matrix (existing specs `e2e/{morphine-wean,formula,gir,feeds,uac-uvc,pert}-a11y.spec.ts` etc., light + dark, drawer + dialog states) is re-run via `pnpm exec playwright test`. Verification = no new violations introduced. Documented in plan as a regression-only check, not a new artifact (CONTEXT.md D-20).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<dialog>` `100dvh` + `flex-end` only | `<dialog>` + visualViewport-aware inner sheet sizing via CSS variables | Phase 49 (this phase) | iOS standalone PWA: drawer no longer occluded by soft keyboard. Other surfaces unchanged (CSS fallbacks). |
| `vv.scroll` for "follow keyboard" | `vv.resize` only + bfcache rebind | Phase 42.1 D-16 (scroll-listener removed) → Phase 49 (resize-only re-introduced for sizing) | No scroll-jank; no dock-magnification regression; iOS 26 #800125 mitigated by re-read-every-event. |
| Keyboard-detection via `focusin`/`focusout` | `window.innerHeight - vv.height > 100` heuristic | Phase 49 | Hardware-keyboard-paired iPhones correctly stay in keyboard-down mode (no false positives). |
| Bottom-nav translation when drawer open | No bottom-nav translation; `<dialog>.showModal()` top-layer covers it | Established pattern (Phase 42.1+) | Zero work needed in `NavShell.svelte`; the dialog top-layer is the only mechanism that survives iOS keyboard. |
| Per-component visualViewport subscription | Module-scope singleton + CSS variable cascade | Phase 49 | Six `<InputDrawer>` call sites unchanged; one shared subscription; HMR-safe; SSG-safe. |

**Deprecated / outdated approaches (do NOT introduce):**

- **`window.innerHeight`-based sizing:** Equals layout viewport, includes keyboard region. This is the bug Phase 49 fixes. (REQUIREMENTS.md §Out of Scope.)
- **`interactive-widget=resizes-content` viewport meta:** Chrome / Android-only; iOS ignores it. (REQUIREMENTS.md §Out of Scope.)
- **VirtualKeyboard API / `keyboard-inset-height`:** Not implemented in iOS Safari. Acceptable as progressive enhancement only in a future milestone. (REQUIREMENTS.md §Out of Scope.)
- **`inputmode="none"`:** Suppresses keyboard but breaks paste flows (especially v1.8 GIR EPIC paste). (REQUIREMENTS.md §Out of Scope.)
- **`body { overflow: hidden }` scroll-lock:** Breaks iOS scroll-into-view. (REQUIREMENTS.md §Out of Scope.)
- **`position: fixed` on `<html>` or `<body>`:** Documented gap-at-bottom bug under `<dialog>` + `black-translucent`. (REQUIREMENTS.md §Out of Scope.)
- **Drawer libraries** (`vaul`, `svelte-bottom-sheet`, `svelte-drawer`): re-introduce auto-focus we deleted in Phase 48; replace v1.13 sticky-drawer pattern; add ~10 KB. (STACK.md §3.)

## Assumptions Log

> Phase 49 derives almost entirely from CONTEXT.md (locked decisions), UI-SPEC.md (approved), and milestone-level research (HIGH-confidence). The remaining `[ASSUMED]` claims are documented below for the planner's awareness.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vitest 4.1.4 + jsdom 29 fully evaluate Svelte 5 `$derived` reactivity inside `@testing-library/svelte` `render()` such that `$derived` recomputes after `simulateKeyboardOpen()` + `await tick()` and the rendered DOM reflects the new `style` attribute. | DRAWER-TEST-02 (Code Examples §5) | If `$derived` does not re-run inside the test environment, T-09 / T-10 fail not because the implementation is wrong but because the test scaffolding can't observe reactive updates. Mitigation: the planner can convert the test to a `screen.getByRole(...)` + manual style read after a delay, or use `flushSync` from `svelte`. The Phase 47 polyfill self-test (`src/test-setup.ts:178-210`) confirms `dispatchEvent` fires registered listeners synchronously, so the `update()` body runs; the question is purely whether Svelte 5's compiler wires the rune subscription correctly through the test harness. The existing `InputDrawer.test.ts` T-04 already exercises bind:value reactivity through the harness, suggesting reactive updates DO propagate — but `$derived`-via-singleton-rune is a slightly different path. |
| A2 | The 100 px keyboard-open threshold (CONTEXT.md D-07 + DRAWER-09) admits the iOS portrait OSK (~290 px) and rejects URL-bar collapse (~50–80 px) on every iPhone model the project targets. | Common Pitfalls §Pitfall 5 | If a particular iPhone model collapses the URL bar by > 100 px (e.g., a future iPhone with very tall navigation chrome), the threshold will spuriously flip `keyboardOpen` to `true` during a closed-drawer scroll. Mitigation: Phase 50 SMOKE-07 tunes; if needed, the threshold becomes a 1-line change. CONTEXT.md "Specific Ideas" already accepts this as a deferred-to-real-device tuning concern. |
| A3 | iOS 26 `visualViewport.height` post-dismiss regression (Apple Developer Forums #800125, Sep 2025) is fully mitigated by the "re-read on every event" pattern in `update()` — i.e., Apple's behavior is "stale value reported until next `resize`" rather than "stale value reported and no further `resize` ever fires for that dismissal." | Common Pitfalls §Pitfall 3 | The single-thread Apple Developer Forum thread is the only public source. If the regression is actually "no `resize` fires until the next user gesture," the bfcache + `visibilitychange` rebind path (DRAWER-03) is the second line of defense — but Phase 50 SMOKE-05 (dismiss keyboard, observe drawer drops back) is the authoritative gate. If SMOKE-05 fails on iOS 26, the v1.15.2 hotfix can introduce a "force re-read after a 100 ms timeout post-dismiss" path. |
| A4 | The CONTEXT.md D-04 phrase "after `pwa.init()` line 55" is a context-document inaccuracy: the actual `+layout.svelte` does NOT call `pwa.init()` in `onMount` (the `pwa` singleton has no `init()` method — only `setUpdateAvailable` / `applyUpdate` / `dismiss`). The intended placement is "after `favorites.init()` line 55." | Code Examples §2 + Architecture Patterns §Init-Site | If the planner takes CONTEXT.md D-04 literally and tries to place `vv.init()` after a non-existent `pwa.init()` line, the plan is malformed. The plan must either (a) add `vv.init()` immediately after `favorites.init()`, OR (b) clarify with the user that `pwa.init()` doesn't exist as called out. Defense: `+layout.svelte` source confirms only `theme.init()` / `disclaimer.init()` / `favorites.init()` are the existing `init()` calls in `onMount`. This research recommends approach (a). |
| A5 | The `[passive: true]` option on `vv.addEventListener('resize', ...)` is silently ignored on `VisualViewport` instances (the spec defines `passive` as having effect only on scroll-emitting targets), so its inclusion is purely defense-in-depth — no behavioral change vs. omission. | Code Examples §1 | If a future browser implementation makes `passive: true` meaningful on visualViewport for an unrelated reason, the option is correct by construction. Risk if wrong: zero (option is a no-op in current implementations; CONTEXT.md D-04 explicitly requires `passive: true`). |
| A6 | Simulating `pageshow` with `event.persisted === true` via `simulateBfcacheRestore()` (Phase 47) reaches a `window.addEventListener('pageshow', ...)` listener registered by `vv.init()`. The polyfill helper dispatches on `window`; the singleton listens on `window`. | DRAWER-TEST-01 case 4 | If `simulateBfcacheRestore()` dispatches on `document` instead, the listener never fires. Mitigation: verified inline at `src/lib/test/visual-viewport-mock.ts:93` — `window.dispatchEvent(ev)`. Match. |

**If this table seems large for a "structural plumbing phase":** It isn't. A1, A4, A5 are pure scaffolding-environment assumptions; A2, A3 are real-device-tuning concerns explicitly punted to Phase 50; A6 is a sanity-check verified by inline code grep. None of these block the planner's work; all are documented for the discuss-phase / plan-checker to confirm if the auto-mode contract changes.

## Open Questions

1. **DRAWER-TEST-02 needs explicit `vv.init()` in the test (or a test-only init seam).**
   - **What we know:** The singleton's resize listener is what writes the runes. Without `vv.init()`, the listener is not bound and `simulateKeyboardOpen()` won't update `vv.height` / `vv.keyboardOpen`. In production, `vv.init()` is called from `+layout.svelte:onMount`, but the component test mounts `InputDrawer` (via `InputDrawerHarness`) without a layout wrapper.
   - **What's unclear:** Whether the planner should (a) call `vv.init()` explicitly in `beforeEach` for the new T-09/T-10 cases (recommended; works because `init()` is idempotent), (b) introduce a `_resetSingleton()` test-only seam in `visualViewport.svelte.ts` (rejected — pollutes production API), or (c) wrap the test mount in a `+layout.svelte`-shaped component (over-engineering).
   - **Recommendation:** Approach (a). Add `await import('$lib/shared/visualViewport.svelte.js').then(({ vv }) => vv.init());` (or a synchronous static import + `vv.init()` call) inside `beforeEach` of DRAWER-TEST-02's new T-09/T-10 cases. CONTEXT.md D-03 idempotency makes this safe even if the test runs after another test that already called `init()`. Document this caveat in the plan so the executor doesn't second-guess it.

2. **`pwa.init()` does not exist — CONTEXT.md D-04 / D-13 wording is inaccurate.**
   - **What we know:** CONTEXT.md says `vv.init()` should be called "after `pwa.init()` line 55" but the `pwa` singleton has no `init()` method. The actual `+layout.svelte` calls `theme.init()` / `disclaimer.init()` / `favorites.init()` — `favorites.init()` is on line 55.
   - **What's unclear:** Whether the CONTEXT.md author meant "after `favorites.init()` (which is on line 55)" or "after a hypothetical `pwa.init()` that doesn't exist."
   - **Recommendation:** Place `vv.init()` immediately after `favorites.init()` on line 55. This matches the actual code state and the spirit of CONTEXT.md D-13 ("alongside the existing four singletons"). Plan should note this in a comment so reviewers don't think the line is mis-placed.

3. **DRAWER-TEST-03 spec runs on both `chromium` and `webkit-iphone` — no `test.skip` needed?**
   - **What we know:** Phase 47 D-15 sets the default that both projects run all e2e specs. The synthetic-dispatch pattern (`Object.defineProperty` + `dispatchEvent`) works on both browsers (chromium does NOT auto-emit visualViewport.resize on focus; neither does WebKit-on-Linux). On chromium, the math is the same as on webkit — synthetic dispatch is browser-agnostic for this assertion shape.
   - **What's unclear:** Whether running on chromium provides any incremental signal vs. running on webkit-iphone. Both prove the wiring works under synthetic dispatch.
   - **Recommendation:** Run on both per Phase 47 D-15 default — costs nothing, catches an unexpected chromium regression for free. CONTEXT.md D-19 explicitly says "Single calculator is sufficient" but does NOT say single project. Run on both projects.

4. **`md:hidden` on the drawer is actually on the `InputsRecap` trigger, not on `<InputDrawer>` itself.**
   - **What we know:** `src/lib/shared/components/InputsRecap.svelte:162` has `md:hidden` in its class string. The drawer `<InputDrawer>` JSX usage in the six route files at `/morphine-wean/+page.svelte:87` etc. has no `md:hidden` wrapper. The drawer never `expanded={true}` on desktop because the only opener is the mobile-only `InputsRecap`.
   - **What's unclear:** Whether DRAWER-11 ("Existing `md:hidden` rule on the drawer is preserved") is satisfied as long as the trigger keeps `md:hidden`, or whether the planner should add an explicit `md:hidden` wrapper on the drawer too.
   - **Recommendation:** Phase 49 does NOT add a `md:hidden` wrapper on `<InputDrawer>`. The mobile-only path is structurally enforced by the `InputsRecap` trigger; adding a redundant `md:hidden` wrapper on the drawer would be defense-in-depth but introduces a per-calculator edit that DRAWER-05 / CONTEXT.md "Out of scope" forbids. Document this finding in the plan so DRAWER-11 verification reads "the only drawer-opening path (`InputsRecap`) has `md:hidden`; drawer never receives `expanded=true` on tablet/desktop breakpoints."

5. **iOS 26 #800125 confidence is MEDIUM, not HIGH.**
   - **What we know:** Single Apple Developer Forums thread, post-cutoff (Sep 2025). The mitigation pattern (re-read on every event) is industry-standard regardless of whether this specific bug ships in the version of iOS the smoke iPhone is running.
   - **What's unclear:** Whether iOS 26 is the production version on the clinician's iPhone at smoke time; whether the regression is fully fixed in a later iOS 26.x patch.
   - **Recommendation:** Treat as a defense-in-depth hardening rather than a "needs verification on iOS 26 specifically" gate. SMOKE-05 covers the symptom regardless of root cause.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | Test runner / build | ✓ (project-pinned via `packageManager` field) | 10.33.0 | — |
| Node | Vite / Vitest / Playwright runtime | ✓ (assumed; no project pin via `engines`) | (system) | — |
| `pnpm exec playwright test` | DRAWER-TEST-03 + axe regression (DRAWER-TEST-04) | ✓ (existing dev script via `@playwright/test`) | 1.59.1 | — |
| `pnpm test` (vitest) | DRAWER-TEST-01 + DRAWER-TEST-02 | ✓ (existing script in `package.json:scripts.test`) | vitest 4.1.4 | — |
| Webkit browser binary for Playwright | DRAWER-TEST-03 under `webkit-iphone` project | ✓ (Phase 47 D-12 confirms project; `webkit-smoke.spec.ts` exists and presumably passes) | (Playwright-managed) | If absent, run `pnpm exec playwright install webkit` |
| iOS 14 Pro+ device for SMOKE-04..07 | Phase 50 (NOT Phase 49) | OUT OF SCOPE | — | Phase 50's obligation |
| jsdom 29 visualViewport polyfill | Vitest tests | ✓ (Phase 47 — `src/test-setup.ts:152-211`) | jsdom 29.0.2 | — |

**Missing dependencies with no fallback:** None — every Phase 49 prerequisite is already in the repo.

**Missing dependencies with fallback:** None — the only conditional binary (`webkit` for Playwright) installs deterministically via `pnpm exec playwright install webkit`. Phase 47's `webkit-smoke.spec.ts` would have failed if the binary weren't already present in the dev environment.

**Phase 49 has no external service / external API / database / third-party-system dependencies. Pure code + test edits within the existing repo.**

## Validation Architecture

> `.planning/config.json` shows `workflow.nyquist_validation: false` — so the Validation Architecture section is **out of scope per agent instructions**.

**Skipping per config:** `workflow.nyquist_validation = false` (verified in `.planning/config.json:19`).

The planner uses the standard project test commands:
- **Per task commit (vitest):** `pnpm test:run` (one-shot vitest)
- **Per wave merge (Playwright):** `pnpm exec playwright test`
- **Phase gate (full suite):** Both green, with axe regressions clean across all six calculators in both themes.

## Security Domain

> `.planning/config.json` does not have an explicit `security_enforcement` key. Treating as enabled per agent instructions.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface in scope; the milestone is shell-polish, no user data |
| V3 Session Management | no | No session in scope |
| V4 Access Control | no | No access control in scope |
| V5 Input Validation | no | The phase makes no input-handling change. Existing input validation in calculators (numeric inputs, ranges) is untouched |
| V6 Cryptography | no | No crypto in scope |
| V7 Error Handling | partial | Singleton uses `try { ... } catch { /* silent */ }` only inside callers (e.g., `theme.svelte.ts` localStorage access). Phase 49's singleton has no I/O surface — no try/catch needed |
| V8 Data Protection | no | No data persisted by the singleton (CONTEXT.md "Runtime State Inventory") |
| V9 Communication Security | no | No network surface added |
| V10 Malicious Code | no | No third-party code added (zero new dependencies) |
| V11 Business Logic | no | No business logic added |
| V12 Files and Resources | no | No file handling added |
| V13 API | no | No public API surface beyond a single Svelte 5 rune class instance |
| V14 Configuration | no | No new env vars, secrets, or config keys |

### Known Threat Patterns for SvelteKit + Svelte 5 PWA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via inline `style` attribute | Tampering | The `$derived ivvStyle` template-strings only NUMBERS (`window.innerHeight - vv.offsetTop - vv.height`, etc.) — no user input is interpolated. Svelte 5's `style={...}` binding does NOT do innerHTML — it's an attribute set, safe by construction |
| Information disclosure via `visualViewport` reads | Information Disclosure | None applicable — `visualViewport` exposes geometry only, no PII / session data |
| Event listener leak via missing teardown | DoS / resource exhaustion | Singleton lives for document lifetime by design; no leak. HMR replaces module wholesale (CONTEXT.md D-06) |
| `pageshow.persisted` deserialization attack | Tampering | `event.persisted` is a browser-controlled boolean; no user-controlled deserialization path |

**Phase 49 has no security-relevant attack surface beyond what the existing `<dialog>` + Svelte 5 reactivity already exposes.** No security review checkpoint required.

## Sources

### Primary (HIGH confidence — verified via in-repo grep or canonical specs)

- **In-repo (line-precise):**
  - `src/lib/shared/components/InputDrawer.svelte` lines 17-130 (script + JSX), 132-192 (style block) — current Phase-48 state, verified via Read tool
  - `src/lib/shared/favorites.svelte.ts` (entire file) — closest analog for class-based singleton pattern, verified via Read tool
  - `src/lib/shared/theme.svelte.ts` (entire file) — alternate object-literal singleton pattern (rejected for Phase 49)
  - `src/lib/shared/disclaimer.svelte.ts` + `pwa.svelte.ts` + `lastEdited.svelte.ts` — additional singleton patterns surveyed
  - `src/routes/+layout.svelte` lines 1-92 — current onMount wiring, verified via Read tool
  - `src/test-setup.ts` lines 152-211 — visualViewport polyfill (Phase 47), verified
  - `src/lib/test/visual-viewport-mock.ts` (entire file) — mock helpers (Phase 47), verified
  - `src/lib/shared/components/InputDrawer.test.ts` (entire file) — existing test scaffolding, verified
  - `src/lib/shared/favorites.test.ts` (entire file) — co-located singleton test pattern
  - `playwright.config.ts` — confirmed `chromium` + `webkit-iphone` projects
  - `e2e/webkit-smoke.spec.ts` — synthetic-dispatch precedent
  - `e2e/drawer-no-autofocus.spec.ts` — Phase 48 cross-calculator focus spec (must remain green per D-25)
  - `package.json` — version manifest, verified
  - `vite.config.ts` — Vitest config + setupFiles, verified
- **Milestone-level research (HIGH-confidence):**
  - `.planning/research/PITFALLS.md` — 22 pitfalls, P-04/05/07/08/15/18/19/22 directly motivate Phase 49 decisions
  - `.planning/research/ARCHITECTURE.md` — §2 Fix-2 integration matrix + §3 singleton sketch (the Phase 49 implementation target)
  - `.planning/research/SUMMARY.md` — synthesis with build-order rationale
  - `.planning/research/STACK.md` — zero-new-deps decision; visualViewport in `lib.dom.d.ts`
  - `.planning/research/FEATURES.md` — drawer feature matrix
- **Phase context (HIGH-confidence):**
  - `.planning/phases/49-wave-2-visualviewport-drawer-anchoring/49-CONTEXT.md` — D-01..D-27 locked decisions
  - `.planning/phases/49-wave-2-visualviewport-drawer-anchoring/49-UI-SPEC.md` — LC-01..LC-05 + behavioral contracts (approved 6/6 PASS)
  - `.planning/phases/47-wave-0-test-scaffolding/47-CONTEXT.md` — Phase 47 inheritance (polyfill + helpers + Playwright project)
  - `.planning/phases/48-wave-1-trivial-fixes-notch-focus/48-CONTEXT.md` — Phase 48 inheritance (auto-focus removal + close-button autofocus)
  - `.planning/REQUIREMENTS.md` lines 37-52 — DRAWER-01..12 + DRAWER-TEST-01..04 verbatim
- **Web platform specs (HIGH-confidence):**
  - [MDN — `Window.visualViewport`](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) — Baseline since 2021; `lib.dom.d.ts` typed
  - [MDN — `VisualViewport.resize`](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport/resize_event) — Event signature + dispatch semantics
  - [MDN — `Window.pageshow` + `event.persisted`](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event) — bfcache rebind pattern
  - [MDN — `Document.visibilitychange`](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event)
  - [MDN — CSS `var()` with fallback](https://developer.mozilla.org/en-US/docs/Web/CSS/var)
  - [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
  - [WHATWG HTML — `<dialog>` `showModal()` and top-layer](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)
- **npm registry version verification (HIGH-confidence):**
  - `npm view svelte version` → `5.55.5` (project pin: `^5.55.4`)
  - `npm view @sveltejs/kit version` → `2.58.0` (project pin: `^2.57.1`)
  - `npm view typescript version` → `6.0.3` (project pin: `^6.0.3`)
  - `npm view vitest version` → `4.1.5` (project pin: `^4.1.4`)
  - `npm view @playwright/test version` → `1.59.1` (project pin: `^1.59.1`)
  - `npm view @testing-library/svelte version` → `5.3.1` (project pin: `^5.3.1`)
  - `npm view @sveltejs/adapter-static version` → `3.0.10` (project pin: `^3.0.10`)

### Secondary (MEDIUM confidence — recent / single-source / industry-pattern)

- [Apple Developer Forums #800125](https://developer.apple.com/forums/thread/800125) (Sep 2025) — iOS 26 visualViewport.height post-dismiss regression; mitigation pattern (re-read every event) is the standard
- [WICG visual-viewport repo Issue #79](https://github.com/WICG/visual-viewport/issues/79) — Safari 15 keyboard not firing resize; corroborates re-read-every-event mitigation
- [Bramus — Prevent content from being hidden underneath the Virtual Keyboard](https://www.bram.us/2021/09/13/prevent-items-from-being-hidden-underneath-the-virtual-keyboard-by-means-of-the-virtualkeyboard-api/) — visualViewport-as-fallback-for-VirtualKeyboard pattern
- [karmasakshi — Make Your PWAs Look Handsome on iOS](https://dev.to/karmasakshi/make-your-pwas-look-handsome-on-ios-1o08) — `viewport-fit=cover` + safe-area-inset PWA standalone-mode idioms

### Tertiary (LOW confidence — for awareness, not decision-driving)

- *(none flagged — all decision-driving claims have HIGH or MEDIUM source backing)*

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — zero new dependencies; all APIs spec-baseline; in-repo verification via line-precise grep on theme/favorites/disclaimer/pwa singletons.
- Architecture: **HIGH** — singleton mirrors `favorites.svelte.ts` line-for-line; all four edit sites in `InputDrawer.svelte` / `+layout.svelte` verified at exact line numbers; CSS-variable cascade verified via existing `pb-[env(...)]` Tailwind precedent at `NavShell.svelte:150`.
- Pitfalls: **HIGH** — milestone-level PITFALLS.md is HIGH-confidence research with 22 cataloged pitfalls and per-pitfall catch-in tests; the 8 pitfalls in this RESEARCH.md are the subset that directly affect Phase 49 with concrete prevention strategies.
- Tests: **HIGH** for DRAWER-TEST-01 / 03 / 04 (clear shapes, established precedents). **MEDIUM** for DRAWER-TEST-02 due to Open Question §1 (component-test `vv.init()` invocation timing — addressed via explicit `beforeEach` recommendation).
- Risk: **MEDIUM** for the keyboard-up branch on iOS 26 specifically (single-source Apple Forums thread; mitigated by re-read-every-event by construction; SMOKE-05 is the gate).

**Research date:** 2026-04-27
**Valid until:** 30 days (stable web platform APIs; no fast-moving dependency in scope). If Phase 49 has not begun execution by 2026-05-27, re-verify the iOS 26 #800125 thread for any Apple-shipped fix or new regression.

---

## Pre-Submission Checklist

- [x] All domains investigated (singleton design, drawer wiring, tests, pitfalls, environment)
- [x] Negative claims verified (no new deps; no `vv.scroll`; no transition; no `<dialog>` style binding) — all sourced to PITFALLS.md / CONTEXT.md / UI-SPEC.md
- [x] Multiple sources cross-referenced for critical claims (singleton skeleton: ARCHITECTURE.md §3 + favorites.svelte.ts in-repo + UI-SPEC.md LC-04 + CONTEXT.md D-01..D-07)
- [x] URLs provided for authoritative sources (MDN, WHATWG, Apple Forums, WICG)
- [x] Publication dates checked (Apple Forums #800125 = Sep 2025; iOS 26-current; Phase 47 + 48 inheritance is current as of 2026-04-26)
- [x] Confidence levels assigned honestly (HIGH for spec-baseline + in-repo; MEDIUM for iOS 26 single-thread; documented in §Assumptions Log)
- [x] "What might I have missed?" review completed — surfaced as Open Questions §1-5
- [x] **Not a rename/refactor phase** — Runtime State Inventory included for completeness, all categories report "None — verified by X"
- [x] Security domain included (no auth/PII/crypto surface — Phase 49 is structural plumbing)
- [x] ASVS categories verified against phase tech stack (no applicable categories)
- [x] CLAUDE.md directives extracted into `## Project Constraints (from CLAUDE.md)` section
