# Project Research Summary

**Project:** NICU Assistant
**Domain:** iOS PWA shell-polish hotfix (sticky bottom-sheet drawer + notch-safe top chrome, WebKit standalone mode)
**Milestone:** v1.15.1 — iOS Polish & Drawer Hardening
**Researched:** 2026-04-27
**Confidence:** HIGH

## Executive Summary

v1.15.1 is a **shell-polish hotfix milestone**, not a feature delivery. Three iOS-only regressions degrade the bedside iPhone experience in standalone PWA mode while Android, desktop Chrome, and desktop Safari are unaffected: (A) drawer auto-focuses an `<input>` on open, summoning the soft keyboard before the clinician chooses a field; (B) drawer is anchored to the layout viewport (`100dvh` + `flex-end`), so the iOS soft keyboard occludes the bottom 30–40% of the sheet — including whichever input the clinician just tapped; (C) the sticky `NavShell` `<header>` has no `padding-top: env(safe-area-inset-top)`, so the hamburger / "NICU Assist" wordmark / theme toggle sit *under* the Dynamic Island on iPhone 14 Pro+ standalone. All three are corollaries of one iOS-WebKit reality: **the layout viewport is fixed, the on-screen keyboard does not resize it, only `window.visualViewport` reports the actually-visible region, and `viewport-fit=cover` (already declared) requires explicit `safe-area-inset-*` opt-in on every top-pinned element.**

The recommended approach is **zero new dependencies, ~50 lines of net runtime code**. Fix A is a deletion (`InputDrawer.svelte` lines 51–57 — the `queueMicrotask(() => firstInput?.focus())` block — replaced by `autofocus` on the existing close button). Fix C is one Tailwind utility on the `<header>` (`pt-[env(safe-area-inset-top,0px)]`, mirroring the existing `pb-[env(safe-area-inset-bottom,0px)]` on the bottom nav). Fix B is the only fix that adds runtime: a new module-scope singleton `src/lib/shared/visualViewport.svelte.ts` (~40 lines mirroring `theme.svelte.ts`) that subscribes to `visualViewport.resize`/`scroll`, exposes `{ offsetTop, height, keyboardOpen }` as `$state` runes, drives CSS custom properties on the `.input-drawer-sheet` (no per-calculator prop plumbing across the six call sites), initialized from `+layout.svelte:onMount`. The `<dialog>` top-layer is preserved (only mechanism on iOS that survives keyboard appearance reliably); transforms apply to the inner sheet, never the dialog. Bottom nav is left untouched — when the drawer is open the top-layer `<dialog>` covers it.

The dominant risk is **CI cannot prove the fix works**. Playwright WebKit emulates viewport size, user agent, and touch — but NOT the iOS soft keyboard (no `visualViewport.resize` on focus), NOT safe-area inset injection (Dynamic Island is not painted), and NOT bfcache app-suspension. The iOS 26 `visualViewport.height` post-dismiss regression (Apple Developer Forums #800125, Sep 2025) further means a stale-cached value will mis-position the sheet — mitigated by always re-reading on every `resize`/`scroll` event and binding a `pageshow`/`visibilitychange` rebind for bfcache restore. Real-iPhone smoke is therefore the **primary verification surface**, and this milestone explicitly closes the v1.13 D-12 deferral by making `.planning/v1.15.1-IPHONE-SMOKE.md` a blocking phase gate before milestone close.

## Key Findings

### Recommended Stack

**Zero new runtime dependencies. Zero new devDependencies.** All three fixes are plain web-platform plumbing on top of the frozen base stack (SvelteKit 2.57 / Svelte 5.55 / Tailwind 4 / Vite 8 / TS 6). `visualViewport` has been in `lib.dom.d.ts` since TS 4.4; `env(safe-area-inset-*)` is a CSS function with no JS surface; `<dialog>.showModal()` already provides focus-trap, focus-restore, top-layer rendering, and `oncancel`. The `package.json` only sees a `version: 1.15.0 → 1.15.1` bump at release. No drawer libraries (`svelte-bottom-sheet`, `svelte-drawer`, `vaul`) — they would re-introduce the auto-focus we are deleting and add ~10 KB for behavior we already have everywhere except iOS keyboard overlap. v1.9 zero-runtime-deps posture (DEBT-03) preserved.

**Core capabilities used:**
- `window.visualViewport` — anchor sheet to keyboard top — already typed by `typescript@^6.0.3`, baseline since 2021
- `env(safe-area-inset-top, 0px)` — notch-safe header — Tailwind 4 arbitrary-value notation, no plugin needed
- Native `<dialog>` + `showModal()` — focus-trap + top-layer + Esc-to-close — already in place, just stop fighting it
- `$state`/`$effect` runes + module-scope singleton pattern — mirrors `theme.svelte.ts` / `favorites.svelte.ts` / `disclaimer.svelte.ts` / `pwa.svelte.ts`

See `.planning/research/STACK.md` for full detail.

### Expected Features

**Must have (table stakes — all three ship together):**
- **Fix A — Auto-focus suppression**: Drawer opens with NO input focused; iOS keyboard does not appear until the clinician taps a field. Native `<dialog>` autofocus on the close button is the desired behavior (non-text control, no OSK summon).
- **Fix B — visualViewport drawer anchoring**: When the keyboard is up, the sheet's bottom edge sits flush with the keyboard top (not under it). When the keyboard is down, sheet returns to bottom-nav-top with `env(safe-area-inset-bottom)` clearance. Reduced-motion path snaps without transition.
- **Fix C — Notch-safe title bar**: `<header>` paints `bg-[var(--color-surface)]` into the safe-area-inset-top region (notch / Dynamic Island stays opaque) while interactive content (hamburger, wordmark, theme toggle) shifts down by the inset amount. Landscape adds `safe-area-inset-left/right` via `max(env(...), 1rem)`.

**Should have (clinical-trust polish, low/trivial complexity):**
- VoiceOver announcement on drawer open via `autofocus` on the close button (announces "Close inputs, button" — calmer than focusing an input)
- Sheet height never exceeds `min(80dvh, visualViewport.height − 16px)` so eyebrow + first input remain visible at minimum keyboard-up height
- `theme-color` meta and `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` already harmonious — preserve
- Real-iPhone smoke checklist as a blocking deliverable (`.planning/v1.15.1-IPHONE-SMOKE.md`) — closes v1.13 D-12

**Anti-features (explicitly do NOT ship):**
- `body { overflow: hidden }` for scroll-lock — breaks iOS scroll-into-view
- `position: fixed` on `<html>` or `<body>` — documented gap-at-bottom bug under `<dialog>` + `black-translucent`
- `window.innerHeight`-based sizing — equals layout viewport, *includes* keyboard region (this is the current bug)
- `interactive-widget=resizes-content` viewport meta — Chrome/Android-only, iOS ignores it
- `keyboard-inset-height` CSS var as primary mechanism — VirtualKeyboard API not implemented in iOS Safari (acceptable as progressive enhancement only)
- `inputmode="none"` to suppress keyboard — breaks paste flows (especially v1.8 GIR EPIC paste)
- Switching `apple-mobile-web-app-status-bar-style` to `default` or `black` — un-fills the inset
- Hardcoded notch heights (`padding-top: 44px`) — devices vary
- Translating the `<dialog>` element — top-layer positioning rules conflict; transform only the inner sheet
- Replacing `<dialog>` with `position: fixed` div — top-layer is the only mechanism that survives iOS keyboard
- A boolean `autoFocus={false}` opt-out — nobody wants the current behavior, full deletion is the fix

See `.planning/research/FEATURES.md` for full table-stakes / differentiator / anti-feature breakdown.

### Architecture Approach

Three fixes touch only **two existing files** (`src/lib/shared/components/InputDrawer.svelte`, `src/lib/shell/NavShell.svelte`) plus **one new module-scope singleton** (`src/lib/shared/visualViewport.svelte.ts`) wired in `src/routes/+layout.svelte:onMount`. No per-calculator changes across the six `InputDrawer` call sites; no `DESIGN.md` / `DESIGN.json` contract drift; no PWA manifest change. CSS-variable wiring on the sheet (`--ivv-bottom`, `--ivv-max-height`) keeps the layout language in CSS and avoids prop plumbing through six calculators. The `<dialog>` outer container stays at `100dvh` (it's the invisible flex container); only the inner `.input-drawer-sheet` translates. Bottom nav is left alone — when the drawer is open the top-layer `<dialog>` covers it; when closed, no keyboard can be up (Fix A guarantees this).

**New / modified surface:**
1. **NEW `src/lib/shared/visualViewport.svelte.ts`** (~40 lines) — singleton `$state` runes for `{ offsetTop, height, keyboardOpen }` driven by `vv.resize`/`vv.scroll`/`pageshow`/`visibilitychange`; idempotent `init()`; `browser`-guarded for SSG safety.
2. **MODIFIED `src/lib/shared/components/InputDrawer.svelte`** — delete lines 51–57 auto-focus block; add `autofocus` to close button; bind `style="--ivv-bottom: …; --ivv-max-height: …"` on `.input-drawer-sheet`; replace `max-height: 80dvh` and `padding-bottom: env(safe-area-inset-bottom)` with the keyboard-aware variants.
3. **MODIFIED `src/lib/shell/NavShell.svelte`** — add `pt-[env(safe-area-inset-top,0px)]` and `px-[max(env(safe-area-inset-left,0px),1rem)]` (and right counterpart) to the `<header>`; preserve `min-h-14`, `sticky top-0`, `bg-[var(--color-surface)]`, `viewport-fit=cover`.
4. **MODIFIED `src/routes/+layout.svelte`** — add `vv.init()` call alongside existing `theme.init()` / `disclaimer.init()` / `favorites.init()` / `pwa.init()`.
5. **MODIFIED `src/test-setup.ts`** — add `window.visualViewport` polyfill mirroring existing `ResizeObserver` / `matchMedia` / `HTMLDialogElement` polyfills, with self-test pattern.
6. **MODIFIED `playwright.config.ts`** — add `webkit-iphone` project (`{ name: 'webkit-iphone', use: { ...devices['iPhone 14 Pro'] } }`) for visualViewport API surface coverage.
7. **NEW `.planning/v1.15.1-IPHONE-SMOKE.md`** — blocking real-iPhone smoke checklist; closes v1.13 D-12.

See `.planning/research/ARCHITECTURE.md` for line-by-line integration matrix.

### Critical Pitfalls

PITFALLS.md catalogues 22 pitfalls (5 Blocker / 9 High / 7 Medium / 1 Low). Top blockers:

1. **P-18 Blocker — jsdom does not implement `window.visualViewport`.** Without a polyfill in `src/test-setup.ts` (mirroring the existing `ResizeObserver` / `matchMedia` / `HTMLDialogElement` polyfills with self-test pattern at lines 122–149), every component test that mounts `InputDrawer` throws `TypeError: Cannot read properties of undefined`. **Worse**, if only the new util throws, the existing 340/340 vitest gate stays green by accident and the new feature is untested. Mitigation: add the polyfill in Wave-0 *before* any feature code, with a `dispatchVisualViewportResize(height, offsetTop)` test helper.
2. **P-19 Blocker — Playwright is chromium-only.** `playwright.config.ts:16-19` defines exactly one project; no WebKit, no notch render at any viewport, no soft-keyboard emulation. Mitigation: add a `webkit-iphone` project in Wave-0 (covers visualViewport API + computed-style assertions) AND make real-iPhone smoke a blocking phase gate (`.planning/v1.15.1-IPHONE-SMOKE.md`), explicitly closing the v1.13 D-12 deferral.
3. **P-04 Blocker — bfcache restore does not re-emit `visualViewport.resize`.** Bedside iPhones repeatedly switch between NICU Assist standalone and other apps; on Safari bfcache restore, listeners are still attached but properties may report stale pre-suspension values. Drawer renders mispositioned with no keyboard up until the next user gesture. Mitigation: bind `pageshow` (with `event.persisted === true` branch) and `visibilitychange` listeners in the singleton, synchronously re-reading `vv.width/height/offsetTop`. Real-iPhone smoke step required (CI cannot trigger bfcache).
4. **P-03 Blocker — `100dvh` does not adjust for the iOS soft keyboard in standalone PWA mode.** Only `visualViewport.height` does. The current sheet's `flex-end` anchor sits at the bottom of layout viewport, *under* the keyboard. The milestone goal "above the OSK" is impossible with `100dvh` alone — must replace with `--vv-height` driven by JS listener.
5. **P-09 Blocker — `apple-mobile-web-app-status-bar-style: black-translucent` is already declared in `app.html:49`, which means the bug is silently active TODAY for every standalone install.** No top-pinned element currently respects `safe-area-inset-top`. Hamburger button is intercepted by Dynamic Island gestures on iPhone 14 Pro+. Fix is the single Tailwind utility on `<header>`; verify all sticky-top consumers (e.g. sticky asides at `top-20` in calculator routes).

**Selected High-severity:**
- **P-01 Removing auto-focus drops VoiceOver announcement** unless an explicit non-text-field focus target replaces it. Use `autofocus` on the close button across all 6 calculators (single source of truth, no per-calculator divergence — also fixes P-14).
- **P-02 Existing e2e tests assume the drawer-open state focuses an input.** They pass today because Playwright's `.fill()` synthesizes focus regardless. Green CI does not mean the bug is fixed — add an explicit "first input does NOT have focus on drawer open" assertion across all six calculators.
- **P-08 Do NOT listen to `visualViewport.scroll`** (only `resize`). Phase 42.1 D-16 explicitly removed scroll-driven transforms from `MorphineWeanCalculator` and `GlucoseTitrationGrid`; reintroducing the pattern via visualViewport will look like dock magnification on review and may cause the same iOS scroll-jank.
- **P-13 Auto-focus selector includes `[role="slider"]`**, which biases UAC/UVC and Feeds. The fix is *full deletion*, not a "narrowed selector" — narrowing leaves a latent bug for the next slider-first calculator.

See `.planning/research/PITFALLS.md` for the full 22-pitfall table with file/line precision and per-pitfall catch-in tests.

## Implications for Roadmap

**Synthesis note on build order.** The three researchers proposed slightly different sequences: ARCHITECTURE.md says Fix 1 (auto-focus) → Fix 3 (notch) → Fix 2 (visualViewport); FEATURES.md says C → A → B; PITFALLS.md says Wave-0 (test scaffolding) → A → B → C → smoke gate. **All three agree on two invariants**: (a) visualViewport is highest-risk and lands last, (b) test scaffolding is a prerequisite. Within Wave-1, Fix A and Fix C are independent (different files, no shared state) so their order is interchangeable. The cleanest synthesis is the one below: Wave-0 unlocks both, Wave-1 ships the two trivial fixes in parallel (or in either order), Wave-2 ships the singleton + sheet anchoring with the most testing time, Wave-3 is the real-iPhone gate.

### Phase 1 (Wave-0) — Test Scaffolding

**Rationale:** Both blockers P-18 (no jsdom visualViewport) and P-19 (no WebKit Playwright project) must land *before* any feature code, otherwise CI gives green-by-accident and visualViewport-aware tests fail at import time. This is non-negotiable and explicitly the recommendation of PITFALLS.md and STACK.md §4.
**Delivers:** `window.visualViewport` polyfill + self-test in `src/test-setup.ts`; `dispatchVisualViewportResize(height, offsetTop)` helper at `src/lib/test/visual-viewport-mock.ts`; new `webkit-iphone` Playwright project in `playwright.config.ts`; CI verifies new project runs.
**Avoids:** P-18 (jsdom throws), P-19 (CI has no iOS surface), P-20 (no layout-correctness assertion possible).

### Phase 2 (Wave-1, in parallel) — Trivial Fixes

#### Phase 2a — Fix C: Notch-safe NavShell header
**Rationale:** Pure CSS, zero runtime risk, isolated to one file. Lowest blast radius; easiest to verify; lands first or in parallel with Fix A. Closes the milestone-named hamburger-under-Dynamic-Island bug independently.
**Delivers:** `pt-[env(safe-area-inset-top,0px)]` + `px-[max(env(safe-area-inset-left,0px),1rem)]` on `<header>`; verify all sticky-top consumers (`top-20` asides in calculator routes); component test that source contains the env() class.
**Avoids:** P-09, P-10 (no `max()` floor — bare `0px` fallback so browser-tab mode still works), P-11 (landscape inset on left/right), P-12 (verify status-bar text contrast).

#### Phase 2b — Fix A: Auto-focus removal
**Rationale:** Pure deletion of `InputDrawer.svelte` lines 51–57 + `autofocus` on the close button. Single component change; ~5 lines of net diff. Removing auto-focus also makes Fix B's verification cleaner (clinician's *deliberate* tap-to-focus is now distinguishable from the previous spurious auto-focus). Independent of Fix C; can land in either order within Wave-1.
**Delivers:** Deleted `queueMicrotask` block; `autofocus` on close button; `T-07` regression test (`document.activeElement` after open is not an input); `T-08` source-grep test (no `queueMicrotask` or `[role="slider"]` in source); cross-calculator focus-order Playwright spec.
**Avoids:** P-01 (VoiceOver silence — explicit `autofocus` on close button), P-02 (false-confidence — explicit no-input-focused assertion), P-13 (latent slider-first bug — full deletion not narrowing), P-14 (cross-calculator divergence — `autofocus` is single source of truth), P-17 (focus order audit per calculator).

### Phase 3 (Wave-2) — Fix B: visualViewport drawer anchoring

**Rationale:** Largest surface, biggest risk, most testing time needed. Depends on Phase 1's polyfill + Playwright WebKit project. Benefits from Phase 2b landing first (clinician-controlled keyboard scenario is observable instead of automatic). If this phase has to slip to v1.15.2, Phases 2a+2b can ship independently and still close two of the three bedside complaints.
**Delivers:** New singleton `src/lib/shared/visualViewport.svelte.ts` with `$state` runes, `pageshow`/`visibilitychange`/`vv.resize` listeners (no `vv.scroll` per P-08); `vv.init()` in `+layout.svelte:onMount`; `--ivv-bottom` and `--ivv-max-height` CSS variables on `.input-drawer-sheet`; replace `max-height: 80dvh` with `calc(var(--ivv-max-height, 80dvh))`; replace `padding-bottom: env(safe-area-inset-bottom)` with `max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px))`; vitest unit test on the singleton (mock vv → assert runes + listeners); Playwright synthetic-dispatch spec asserting computed style on `.input-drawer-sheet`.
**Avoids:** P-03 (no more `100dvh`-only sizing), P-04 (bfcache rebind), P-05 (hardware keyboard guard via `Math.max(0, …)`), P-06 (`md:hidden` preserved), P-07 (with-OSK `padding-bottom: 0`), P-08 (no `vv.scroll`), P-15 (transform applied to inner sheet not outer dialog → SelectPicker unaffected), P-16 (clamp `Math.max(0, …)`), P-22 (`max-height` from `--vv-height` not `80dvh`).

### Phase 4 (Wave-3) — Real-iPhone Smoke Gate

**Rationale:** CI cannot prove the fix works (notch not painted, keyboard not emulated, bfcache not triggered). This phase explicitly closes the v1.13 D-12 deferral by elevating real-iPhone testing to **primary verification surface**, blocking milestone close. Without this gate the milestone goal is technically met (code shipped, axe green, vitest green) but the bedside experience is unverified.
**Delivers:** `.planning/v1.15.1-IPHONE-SMOKE.md` checklist artifact covering: standalone install on iPhone 14 Pro+ → hamburger fully visible below Dynamic Island; drawer open without typing → no keyboard, focus on close button, VoiceOver announces drawer; tap weight field → keyboard appears AND drawer is above it (≥ 8 px clearance); Done dismisses keyboard → drawer drops back to nav smoothly; bfcache restore (call yourself, return) → drawer remains flush; hardware keyboard paired → drawer does NOT lift; landscape rotation → inset respected on left/right; theme toggle mid-keyboard-up → no flicker; light mode + Dynamic Island → status-bar text legible.
**Avoids:** P-04, P-05, P-08, P-09, P-12, P-16, P-21 (the entire CI-cannot-catch cluster).

### Phase Ordering Rationale

- **Wave-0 first** because P-18 + P-19 are blockers that prevent any visualViewport-aware test from running. Skipping this gives green-by-accident CI for Phase 3.
- **Wave-1 (Fix C and Fix A) before Wave-2 (Fix B)** because both are isolated, low-risk, deliver independent user-visible wins, and Fix A removes a confound for Fix B's manual testing on real iPhone (the previous auto-focus made every drawer open summon the keyboard, so "drawer position when keyboard is up" was indistinguishable from "drawer position on open").
- **Within Wave-1, Fix C and Fix A are interchangeable** — they touch different files (`NavShell.svelte` vs `InputDrawer.svelte`) and have no shared state. Either order works; recommend parallel branches that merge in either order.
- **Wave-2 last** because it is the largest surface, has the most subtle failure modes (keyboard heuristic threshold, bfcache rebind, iOS 26 `offsetTop` regression), and benefits from the most testing time. Slip-friendly: if v1.15.1 must ship before Wave-2 is verified, Wave-2 becomes v1.15.2 and Wave-1 still closes 2/3 of the bedside complaints.
- **Wave-3 is a phase gate, not a code phase** — it blocks milestone close until real-iPhone smoke is signed off. The v1.13 D-12 deferral is explicitly closed here.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Wave-2):** The iOS 26 `visualViewport.height` post-dismiss regression (Apple Developer Forums #800125) is recent and may evolve. The implementation must re-read on every `resize`/`scroll` (no caching) and rebind on `pageshow`/`visibilitychange`. Verify on the latest iOS version available for smoke testing. Also: the keyboard-open heuristic threshold (`window.innerHeight - vv.height > 100`) needs real-device tuning to filter URL-bar collapse (~50–80 px) without missing split-keyboard cases (~190 px landscape). MEDIUM confidence; gather one more real-device data point during planning.
- **Phase 4 (Wave-3):** Smoke checklist itself benefits from a structured walkthrough on the actual deployment target (clinician-owned iPhone, NICU Wi-Fi, standalone install). Some smoke steps (bfcache, hardware keyboard) require iOS-Simulator-or-better fidelity that ad-hoc testing tends to skip.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Wave-0):** jsdom polyfill pattern is well-established in the repo (`test-setup.ts:5-149`) — mirror it. Playwright project addition is a config-file edit. No research needed.
- **Phase 2a (Fix C):** Single-utility CSS change. Pattern is identical to the existing `pb-[env(safe-area-inset-bottom,0px)]` at `NavShell.svelte:150`. No research needed.
- **Phase 2b (Fix A):** Pure deletion + one `autofocus` attribute. WHATWG `<dialog>` spec is authoritative; no research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new deps; all APIs (`visualViewport`, `env()`, `<dialog>`) are spec-baseline-stable since 2021–22 and already typed by `lib.dom.d.ts`. The frozen base stack remains untouched. |
| Features | HIGH | All three features have multiple authoritative sources (QuirksMode, MDN, Smashing Magazine, Adrian Roselli, web.dev) and a documented bug-pattern match (shuvcode #264 for the notch bug). Anti-features grounded in production-pattern reports (HeadlessUI #1900, Ben Frain). |
| Architecture | HIGH (Fix 1 + Fix 3), MEDIUM (Fix 2 jsdom edge) | File/line precision is grounded in repo grep. Singleton pattern is exact mirror of four existing singletons. The MEDIUM is the jsdom visualViewport mock — well-documented but the existing `HTMLDialogElement` self-test pattern is the safety net. |
| Pitfalls | HIGH | 22 pitfalls catalogued with file/line precision and per-pitfall catch-in tests. 5 Blockers all have explicit Wave-0/Wave-3 phase gates. |

**Overall confidence:** HIGH

### Gaps to Address

- **iOS 26 `visualViewport.height` post-dismiss reset behavior** (Apple Developer Forums #800125, Sep 2025): single Apple Forums thread, MEDIUM confidence. Mitigation pattern (re-read on every event, never cache) is industry-standard and survives the regression by construction. Verify behavior on latest available iOS during Wave-3 smoke; document any new iOS version regressions inline in `.planning/v1.15.1-IPHONE-SMOKE.md`.
- **`black-translucent` status-bar text contrast in light mode** (Otterlord, MEDIUM): white iOS status-bar glyphs over near-white surface. iOS adds a subtle dark gradient under glyphs but legibility on iPhone 14 Pro+ depends on system render layer Playwright cannot capture. Smoke step required; if poor, mitigation is a `<meta name="theme-color">` light/dark pair toggled by the FOUC script.
- **Keyboard-open detection threshold** (`window.innerHeight - vv.height > 100`): the 100 px filters URL-bar collapse (~50–80 px) and admits keyboards (~290 px portrait, ~190 px landscape, ~? split). Verify the split-keyboard case on iPad if any clinician uses iPad; otherwise the `md:hidden` rule keeps the drawer out of the iPad surface entirely (per P-06).
- **Cross-calculator focus-order assertion**: each of the six calculator `Inputs` snippets (`MorphineWeanInputs`, `FortificationInputs`, `GirInputs`, `FeedAdvanceInputs`, `UacUvcInputs`, `PertInputs`) needs to start with a focusable control or tabindex-0 group label so Tab from the close button lands sensibly (P-17). Mostly already true via `RangedNumericInput`; spot-check during Phase 2b.
- **PWA `theme_color` vs `apple-mobile-web-app-status-bar-style: black-translucent` interaction** (P-12): manifest theme-color is ignored by iOS in `black-translucent` mode but matters for Android Chrome and the iOS install splash. Decision: leave as-is; document in smoke checklist.

## Sources

### Primary (HIGH confidence)
- MDN — `VisualViewport` API: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
- MDN — `env()` CSS function: https://developer.mozilla.org/en-US/docs/Web/CSS/env
- MDN — `<dialog>` element: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
- WHATWG HTML spec — `<dialog>` `showModal()`: https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element
- Playwright Emulation docs: https://playwright.dev/docs/emulation
- QuirksMode — Toolbars, keyboards, and the viewports: https://www.quirksmode.org/blog/archives/2017/06/toolbars_keyboa.html
- Adrian Roselli — Dialog Focus in Screen Readers: https://adrianroselli.com/2020/10/dialog-focus-in-screen-readers.html
- Scott O'Hara — Having an open dialog: https://www.scottohara.me/blog/2019/03/05/open-dialog.html

### Secondary (MEDIUM confidence)
- Apple Developer Forums #800125 (iOS 26 visualViewport regression): https://developer.apple.com/forums/thread/800125
- tkte.ch — Safari 13 Mobile Keyboards & VisualViewport: https://tkte.ch/articles/2019/09/23/safari-13-mobile-keyboards-and-the-visualviewport-api.html
- Smashing Magazine — New CSS Viewport Units: https://www.smashingmagazine.com/2023/12/new-css-viewport-units-not-solve-classic-scrollbar-problem/
- Bram.us — VirtualKeyboard API explainer: https://www.bram.us/2021/09/13/prevent-items-from-being-hidden-underneath-the-virtual-keyboard-by-means-of-the-virtualkeyboard-api/
- saricden — Fixed elements + iOS keyboard: https://saricden.com/how-to-make-fixed-elements-respect-the-virtual-keyboard-on-ios
- HeadlessUI #1900 (anti-pattern: position:fixed on html): https://github.com/tailwindlabs/headlessui/issues/1900
- Ben Frain — Preventing body scroll for modals in iOS: https://benfrain.com/preventing-body-scroll-for-modals-in-ios/
- shuvcode #264 (Dynamic Island bug match): https://github.com/Latitudes-Dev/shuvcode/issues/264
- Karma Sakshi — PWAs Handsome on iOS: https://dev.to/karmasakshi/make-your-pwas-look-handsome-on-ios-1o08
- firt.dev — PWAs Power Tips: https://firt.dev/pwa-design-tips/
- Otterlord — Custom iOS Status Bar for PWAs: https://medium.com/@otterlord/custom-ios-status-bar-for-pwas-e62b9c473ae9
- Tommy Brunn — Fixing autofocus in iOS Safari: https://medium.com/@brunn/autofocus-in-ios-safari-458215514a5f
- Manuel Matuzović — O dialog focus, where art thou: https://www.matuzo.at/blog/2023/focus-dialog/
- WICG visual-viewport #79: https://github.com/WICG/visual-viewport/issues/79
- Ryan Davis — Visual Viewport: https://rdavis.io/articles/dealing-with-the-visual-viewport
- emilkowalski/vaul #13 (jsdom + visualViewport polyfill): https://github.com/emilkowalski/vaul/issues/13
- Bramus — viewport-resize-behavior explainer: https://github.com/bramus/viewport-resize-behavior/blob/main/explainer.md

---
*Research completed: 2026-04-27*
*Ready for roadmap: yes*
