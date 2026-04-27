# Requirements: NICU Assistant — Milestone v1.15.1

**Defined:** 2026-04-27
**Core Value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context, using the same trusted interfaces they already know.

**Milestone scope:** iOS-only shell-polish hotfix. Three bedside-iPhone regressions (drawer auto-focus, drawer mispositioning under iOS soft keyboard, NavShell title bar under camera notch / Dynamic Island), plus the test scaffolding and real-iPhone smoke gate that prove the fixes are durable. No new clinical features; no new calculators; no DESIGN contract drift.

## v1.15.1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Test Scaffolding (Wave-0)

- [ ] **TEST-01**: `window.visualViewport` polyfill added to `src/test-setup.ts` mirroring the existing `ResizeObserver` / `matchMedia` / `HTMLDialogElement` polyfills (with the same self-test pattern at lines 122–149) so jsdom-based vitest does not throw `TypeError: Cannot read properties of undefined` when components or modules read `window.visualViewport`
- [ ] **TEST-02**: Reusable test helper `dispatchVisualViewportResize(height, offsetTop)` exported from `src/lib/test/visual-viewport-mock.ts` (or equivalent location) so component and unit tests can synthesize keyboard-up / keyboard-down state deterministically
- [ ] **TEST-03**: New `webkit-iphone` Playwright project added to `playwright.config.ts` (using `devices['iPhone 14 Pro']` or equivalent) so e2e specs can execute under WebKit + iPhone viewport. Existing `chromium` project preserved unchanged. CI pipeline runs both projects.

### Notch-Safe Title Bar (Wave-1, Fix C)

- [ ] **NOTCH-01**: `NavShell.svelte` `<header>` respects `env(safe-area-inset-top)` via `pt-[env(safe-area-inset-top,0px)]` so on iPhone 14 Pro+ in standalone PWA mode the hamburger button, "NICU Assist" wordmark, and theme/info buttons do not sit under the camera notch / Dynamic Island
- [ ] **NOTCH-02**: `NavShell.svelte` `<header>` respects landscape safe-area via `px-[max(env(safe-area-inset-left,0px),1rem)]` (and right counterpart) so in landscape orientation chrome content does not sit under rounded corners or the notch on iPhone 14 Pro+
- [ ] **NOTCH-03**: `<header>` `bg-[var(--color-surface)]` paints into the safe-area-inset-top region so the notch / Dynamic Island sits on an opaque title-bar background (not transparent show-through to scrolled content) in both light and dark themes
- [ ] **NOTCH-04**: Existing sticky-top consumers (e.g. `top-20` asides in calculator routes, if any) audited and updated where they would otherwise sit under the new inset-padded header — `min-h-14` `sticky top-0` `viewport-fit=cover` semantics preserved
- [ ] **NOTCH-TEST-01**: Component test asserts `NavShell.svelte` source contains `pt-[env(safe-area-inset-top` (regression guard against accidental removal); existing 16/16 axe sweeps re-run in light + dark to confirm no contrast regression from the inset-fill behavior

### Auto-Focus Suppression (Wave-1, Fix A)

- [ ] **FOCUS-01**: `InputDrawer.svelte` lines 51–57 `queueMicrotask(() => firstInput?.focus())` block deleted in full (no boolean opt-out, no narrowed selector) so opening the drawer never programmatically focuses an `<input>`, `<select>`, `<textarea>`, or `[role="slider"]` element
- [ ] **FOCUS-02**: Native `<dialog>` autofocus lands on a non-text-summoning control on drawer open via `autofocus` attribute on the existing close button so VoiceOver still announces the drawer ("Close inputs, button") and keyboard users have a deterministic Tab origin, but iOS soft keyboard does not appear
- [ ] **FOCUS-03**: Drawer-open behavior is consistent across all six existing calculators (Morphine, Formula, GIR, Feeds, UAC/UVC, PERT) — single source of truth in `InputDrawer.svelte`, no per-calculator divergence
- [ ] **FOCUS-TEST-01**: Component test asserts that after `<dialog>.showModal()` opens the drawer, `document.activeElement` is NOT an `<input>`, `<select>`, `<textarea>`, or `[role="slider"]` (explicit non-focus assertion — green CI today does not prove the fix)
- [ ] **FOCUS-TEST-02**: Source-grep test asserts `InputDrawer.svelte` source contains neither `queueMicrotask` nor the `[role="slider"]` selector substring (regression guard against the deleted block reappearing)
- [ ] **FOCUS-TEST-03**: Cross-calculator Playwright spec opens the drawer on each of the six calculator routes and asserts the focused element is the close button (or another non-input deterministic target), exercising every `InputDrawer` call site

### iOS-Correct Drawer Anchoring (Wave-2, Fix B)

- [ ] **DRAWER-01**: New module-scope singleton `src/lib/shared/visualViewport.svelte.ts` (~40 lines, mirrors `theme.svelte.ts` / `favorites.svelte.ts` patterns) exposes `$state` runes for `{ offsetTop, height, keyboardOpen }`; idempotent `init()`; `browser`-guarded for SSG safety
- [ ] **DRAWER-02**: Singleton subscribes to `visualViewport.resize` only (NOT `visualViewport.scroll` — Phase 42.1 D-16 explicitly removed scroll-driven transforms; reintroducing risks the same scroll-jank). Re-reads `vv.width/height/offsetTop` on every event (no caching) to survive the iOS 26 `visualViewport.height` post-dismiss regression (Apple Developer Forums #800125)
- [ ] **DRAWER-03**: Singleton binds `pageshow` (with `event.persisted === true` branch) and `visibilitychange` listeners so bfcache-restored sessions synchronously re-read `visualViewport` properties — drawer renders correctly on resume from background without requiring a user gesture
- [ ] **DRAWER-04**: Singleton initialized from `src/routes/+layout.svelte:onMount` alongside the existing `theme.init()` / `disclaimer.init()` / `favorites.init()` / `pwa.init()` calls
- [ ] **DRAWER-05**: `InputDrawer.svelte` `.input-drawer-sheet` exposes `--ivv-bottom` and `--ivv-max-height` CSS custom properties driven by the singleton; no per-calculator prop plumbing across the six call sites
- [ ] **DRAWER-06**: Sheet `max-height` becomes `calc(var(--ivv-max-height, 80dvh))` so when the keyboard is up the sheet shrinks to fit the available `visualViewport.height − 16px` (eyebrow + first input remain visible)
- [ ] **DRAWER-07**: Sheet `padding-bottom` becomes `max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px))` so when the keyboard is up the sheet's bottom edge sits flush above the keyboard top with ≥ 8 px clearance; when the keyboard is down the existing safe-area-inset-bottom clearance is preserved
- [ ] **DRAWER-08**: `transform`/`max-height` modifications apply ONLY to the inner `.input-drawer-sheet`, never to the outer `<dialog>` element, so top-layer positioning rules and `<dialog>` accessibility semantics are preserved (and the existing SelectPicker dialog inside the drawer is unaffected)
- [ ] **DRAWER-09**: Hardware-keyboard-paired iPhones do NOT trigger the keyboard-open branch (singleton's `keyboardOpen` heuristic uses `window.innerHeight − vv.height > 100` to filter URL-bar collapse and admit only the OSK; no false positives for Bluetooth keyboards which leave `vv.height` unchanged)
- [ ] **DRAWER-10**: `prefers-reduced-motion: reduce` honored — when set, sheet sizing/positioning snaps without transition (consistent with v1.6 / Phase 42.1 reduced-motion contract); when unset, transition uses an existing scoped CSS rule (no new global transitions)
- [ ] **DRAWER-11**: Existing `md:hidden` rule on the drawer is preserved (drawer never appears on tablet/desktop breakpoints) so iPad split-keyboard cases are out of scope per architectural design
- [ ] **DRAWER-12**: Existing `<dialog>` `showModal()` + top-layer + Esc-to-close + focus-trap + focus-restore behaviors are preserved verbatim — no replacement with `position: fixed` or other anti-pattern (reference: PITFALLS.md anti-feature list)
- [ ] **DRAWER-TEST-01**: Vitest unit test on the singleton — mock `window.visualViewport` via `dispatchVisualViewportResize(...)` helper, assert `$state` runes update on `resize` events, assert listeners rebind on `pageshow.persisted === true`, assert no `vv.scroll` listener is attached
- [ ] **DRAWER-TEST-02**: Vitest component test on `InputDrawer.svelte` asserts that `style="--ivv-bottom: …px; --ivv-max-height: …px"` is applied to `.input-drawer-sheet` and updates when the mock visualViewport dispatches a resize
- [ ] **DRAWER-TEST-03**: Playwright spec under the new `webkit-iphone` project synthesizes `visualViewport.resize` (via `page.evaluate(() => window.dispatchEvent(...))`) and asserts the computed `padding-bottom` and `max-height` of `.input-drawer-sheet` match the keyboard-up branch
- [ ] **DRAWER-TEST-04**: Existing 16/16 axe sweeps (light + dark across all 6 calculators) re-run with the new drawer behavior — confirm no contrast or landmark regressions from the visualViewport-aware layout

### Real-iPhone Smoke Gate (Wave-3) — closes v1.13 D-12 deferral

- [ ] **SMOKE-01**: `.planning/v1.15.1-IPHONE-SMOKE.md` checklist artifact created and used as a blocking gate before milestone close. Tester signs off on each step on a real iPhone 14 Pro+ (or newer) in standalone PWA mode (not Safari browser tab)
- [ ] **SMOKE-02**: Smoke step verifies hamburger / wordmark / theme button visible below Dynamic Island in portrait (NOTCH-01 closure)
- [ ] **SMOKE-03**: Smoke step verifies drawer opens with no keyboard appearing and focus on close button; VoiceOver announces the drawer (FOCUS-01 / FOCUS-02 closure)
- [ ] **SMOKE-04**: Smoke step verifies tapping a weight field summons keyboard AND drawer is anchored above keyboard top with ≥ 8 px clearance; first input + eyebrow remain visible (DRAWER-06 / DRAWER-07 closure)
- [ ] **SMOKE-05**: Smoke step verifies dismissing keyboard (Done button) returns drawer smoothly to bottom-nav-top with `env(safe-area-inset-bottom)` clearance; no flicker, no stale offset (DRAWER-02 closure for iOS 26 regression)
- [ ] **SMOKE-06**: Smoke step verifies bfcache restore (call yourself, return to app) — drawer renders flush without requiring a user gesture (DRAWER-03 closure)
- [ ] **SMOKE-07**: Smoke step verifies hardware-keyboard-paired iPhone does NOT lift the drawer (DRAWER-09 closure)
- [ ] **SMOKE-08**: Smoke step verifies landscape rotation — `safe-area-inset-left/right` insets respected; portrait re-rotation preserves notch-safe top (NOTCH-02 closure)
- [ ] **SMOKE-09**: Smoke step verifies light-mode `apple-mobile-web-app-status-bar-style: black-translucent` text legibility against `var(--color-surface)` light value (PITFALLS.md gap; if poor, mitigation is light/dark `<meta name="theme-color">` toggled by FOUC script)
- [ ] **SMOKE-10**: All six calculators (Morphine, Formula, GIR, Feeds, UAC/UVC, PERT) smoke-tested for drawer + notch behavior — no per-calculator divergence found (or any divergence captured as a follow-up todo)

### Release v1.15.1

- [ ] **REL-01**: `package.json` version bumped from `1.15.0` to `1.15.1`. AboutSheet reflects v1.15.1 via the `__APP_VERSION__` build-time constant sourced from `package.json` (no manual string edit)
- [ ] **REL-02**: PROJECT.md Validated list updated with v1.15.1 entries at milestone completion; Active section cleared; Last updated footer bumped
- [ ] **REL-03**: REQUIREMENTS.md traceability table all v1.15.1 IDs flipped to ✓ Validated; ROADMAP.md Progress row marked Complete; v1.15.1 archived to `.planning/milestones/v1.15.1-{REQUIREMENTS,ROADMAP,phases}/` per existing pattern
- [ ] **REL-04**: Final clinical gate passes — svelte-check 0/0, vitest fully green (existing 439+ + new TEST/FOCUS/DRAWER tests), `pnpm build` ✓, Playwright `chromium` + `webkit-iphone` projects + extended axe suite (16/16 minimum) green in both themes; SMOKE-01..10 all signed off

## Future Requirements

(deferred from v1.15.1 — none currently)

## Out of Scope

Explicit exclusions for v1.15.1:

- **New clinical features or calculators** — milestone is shell-polish only; six existing calculators are unchanged behaviorally
- **DESIGN.md / DESIGN.json contract changes** — no new tokens, no rule additions, no Identity-Inside / Amber-as-Semantic / OKLCH-Only / Red-Means-Wrong / Tabular-Numbers / Eyebrow-Above-Numeral changes
- **`HeroResult` redesign** — the v1.13 above-the-fold pattern is preserved verbatim
- **Bottom-nav layout changes** — favorites-driven 4-tab pattern preserved verbatim; bottom nav is left untouched (the top-layer `<dialog>` covers it when the drawer is open)
- **Calculator state migrations** — no sessionStorage / localStorage schema changes; no migrations needed
- **Drawer libraries** (`svelte-bottom-sheet`, `svelte-drawer`, `vaul`) — would re-introduce the auto-focus we're deleting and add ~10 KB for behavior we already have everywhere except iOS keyboard overlap
- **`body { overflow: hidden }` scroll-lock** — breaks iOS scroll-into-view; preserve current behavior
- **`position: fixed` on `<html>` or `<body>`** — documented gap-at-bottom bug under `<dialog>` + `black-translucent`
- **`window.innerHeight`-based sizing** — equals layout viewport, includes keyboard region (this is the current bug being fixed)
- **`interactive-widget=resizes-content` viewport meta** — Chrome/Android-only, iOS ignores it
- **VirtualKeyboard API / `keyboard-inset-height` as primary mechanism** — not implemented in iOS Safari; visualViewport API is the authoritative source for v1.15.1 (acceptable as progressive enhancement only in a future milestone)
- **`inputmode="none"`** — breaks paste flows (especially v1.8 GIR EPIC paste)
- **iPad split-keyboard handling** — drawer is already `md:hidden`, so iPad does not invoke the affected code path
- **Boolean `autoFocus={false}` opt-out prop** — full deletion is the fix; no per-call-site toggle
- **Non-iOS regressions** — Android Chrome, desktop Chrome, desktop Safari, desktop Firefox already work correctly; v1.15.1 must not regress them but does not add new affordances for them
- **Native app builds** — PWA only (project-level constraint)

## Traceability

| Requirement ID | Phase | Status |
|---|---|---|
| TEST-01 | Phase 47 | Pending |
| TEST-02 | Phase 47 | Pending |
| TEST-03 | Phase 47 | Pending |
| NOTCH-01 | Phase 48 | Pending |
| NOTCH-02 | Phase 48 | Pending |
| NOTCH-03 | Phase 48 | Pending |
| NOTCH-04 | Phase 48 | Pending |
| NOTCH-TEST-01 | Phase 48 | Pending |
| FOCUS-01 | Phase 48 | Pending |
| FOCUS-02 | Phase 48 | Pending |
| FOCUS-03 | Phase 48 | Pending |
| FOCUS-TEST-01 | Phase 48 | Pending |
| FOCUS-TEST-02 | Phase 48 | Pending |
| FOCUS-TEST-03 | Phase 48 | Pending |
| DRAWER-01 | Phase 49 | Pending |
| DRAWER-02 | Phase 49 | Pending |
| DRAWER-03 | Phase 49 | Pending |
| DRAWER-04 | Phase 49 | Pending |
| DRAWER-05 | Phase 49 | Pending |
| DRAWER-06 | Phase 49 | Pending |
| DRAWER-07 | Phase 49 | Pending |
| DRAWER-08 | Phase 49 | Pending |
| DRAWER-09 | Phase 49 | Pending |
| DRAWER-10 | Phase 49 | Pending |
| DRAWER-11 | Phase 49 | Pending |
| DRAWER-12 | Phase 49 | Pending |
| DRAWER-TEST-01 | Phase 49 | Pending |
| DRAWER-TEST-02 | Phase 49 | Pending |
| DRAWER-TEST-03 | Phase 49 | Pending |
| DRAWER-TEST-04 | Phase 49 | Pending |
| SMOKE-01 | Phase 50 | Pending |
| SMOKE-02 | Phase 50 | Pending |
| SMOKE-03 | Phase 50 | Pending |
| SMOKE-04 | Phase 50 | Pending |
| SMOKE-05 | Phase 50 | Pending |
| SMOKE-06 | Phase 50 | Pending |
| SMOKE-07 | Phase 50 | Pending |
| SMOKE-08 | Phase 50 | Pending |
| SMOKE-09 | Phase 50 | Pending |
| SMOKE-10 | Phase 50 | Pending |
| REL-01 | Phase 51 | Pending |
| REL-02 | Phase 51 | Pending |
| REL-03 | Phase 51 | Pending |
| REL-04 | Phase 51 | Pending |

**Coverage:**
- v1.15.1 requirements: 44 total
- Mapped to phases: 44 (100%)
  - Phase 47 (Wave-0 Test Scaffolding): 3 (TEST-01..03)
  - Phase 48 (Wave-1 NOTCH + FOCUS): 11 (NOTCH-01..04 + NOTCH-TEST-01 + FOCUS-01..03 + FOCUS-TEST-01..03)
  - Phase 49 (Wave-2 visualViewport Drawer): 16 (DRAWER-01..12 + DRAWER-TEST-01..04)
  - Phase 50 (Wave-3 Real-iPhone Smoke): 10 (SMOKE-01..10)
  - Phase 51 (Release v1.15.1): 4 (REL-01..04)

---
*Requirements defined: 2026-04-27*
*Phase mappings added: 2026-04-27 by /gsd-roadmapper*
