# Technology Stack — v1.15.1 iOS Polish & Drawer Hardening

**Project:** NICU Assistant
**Milestone:** v1.15.1 (iOS-only polish; three iPhone bedside regressions)
**Researched:** 2026-04-27
**Scope:** Additions only. Base stack (SvelteKit 2.57 / Svelte 5.55 / Tailwind 4 / Vite 8 / TS 6 / pnpm 10.33 / @vite-pwa/sveltekit / adapter-static / Vitest 4 / Playwright 1.59 / @axe-core/playwright / @lucide/svelte 1.8 / bits-ui 2.18) is frozen and NOT re-evaluated.

## 1. Summary

**Zero new runtime dependencies. Zero new devDependencies.** All three iOS fixes are plain web-platform plumbing. The `visualViewport` API is part of `lib.dom.d.ts`, baseline-available since 2021, and already typed by the in-repo `typescript@^6.0.3`. `env(safe-area-inset-top)` is a CSS function with no JS surface — it just needs to be added to `NavShell.svelte`'s sticky `<header>` padding. Suppressing dialog auto-focus is a one-line edit (delete the `queueMicrotask(() => firstInput?.focus())` block in `InputDrawer.svelte`); the native `<dialog>` itself with no `autofocus` attribute does the right thing on its own. The v1.9 zero-runtime-deps posture (DEBT-03) is preserved.

The non-trivial concern is **iOS 26 Safari's `visualViewport` regression** ([Apple Developer Forum thread 800125](https://developer.apple.com/forums/thread/800125), September 2025): `visualViewport.height` does not fully reset after the keyboard dismisses, leaving fixed elements offset by ~24 px. We mitigate by reading `visualViewport.height` only on `resize`/`scroll` events while the drawer is open AND a focused input is present, and by always pinning the sheet to the bottom of `visualViewport.height + visualViewport.offsetTop` rather than `bottom: 0` on the layout viewport. No library handles this for us; the fix is small enough (≤ 30 lines) that pulling in a drawer library would be a net cost.

## 2. New Dependencies Needed

**None.**

| Runtime | Dev | Total |
|---|---|---|
| 0 | 0 | 0 |

The `package.json` will only see a `version` bump from 1.15.0 → 1.15.1 at release, identical in shape to the v1.10/v1.11/v1.12/v1.13 hotfix-style milestones.

## 3. Existing Capabilities Cover Each Requirement

### Requirement A — Don't auto-focus first input on drawer expand

**Existing capability:** Native `HTMLDialogElement.showModal()` + the absence of an `autofocus` attribute. Per [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog), without `autofocus` showModal() lands focus on the first focusable element by sequential keyboard order — in our drawer that is the "Clear" button (or the close-toggle button when `onClear` is omitted), neither of which triggers the iOS soft keyboard. The current bug is a deliberate `queueMicrotask` block in `InputDrawer.svelte` lines 51–57 that overrides this default and re-focuses the first `input/select/textarea/[role="slider"]`.

**Fix:** Delete the `queueMicrotask` block. Native dialog behavior (focus on first button) is exactly what the milestone goal asks for. The header buttons are visually de-emphasized text/icon, so focus-on-Clear is not a UX regression — it just means iOS doesn't summon the keyboard automatically.

**Confidence:** HIGH. MDN authoritative; behavior consistent across Safari/Chromium/Firefox per [web.dev dialog learn](https://web.dev/learn/html/dialog).

### Requirement B — Anchor drawer to visualViewport above iOS soft keyboard

**Existing capability:** `window.visualViewport` (instance of `VisualViewport`, in `lib.dom.d.ts` since TS 4.4 — present in our `typescript@^6.0.3`). Properties `.height`, `.offsetTop`, `.offsetLeft` and events `resize` / `scroll` are all we need.

**Implementation sketch (no library):**
```ts
// In InputDrawer.svelte, alongside existing $state/$effect blocks
let viewportHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 0);
let viewportOffsetTop = $state(0);

$effect(() => {
  if (!expanded) return;
  const vv = window.visualViewport;
  if (!vv) return; // Safari < 13 / non-PWA fallback: no-op, falls back to 100dvh
  const update = () => {
    viewportHeight = vv.height;
    viewportOffsetTop = vv.offsetTop;
  };
  update();
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  return () => {
    vv.removeEventListener('resize', update);
    vv.removeEventListener('scroll', update);
  };
});
```
Drive the `<dialog>` height via inline style: `style="height: {viewportHeight}px; top: {viewportOffsetTop}px;"` and keep the inner `.input-drawer-sheet` at `flex-end`. This sidesteps the iOS 26 height-reset bug because we recompute on every visualViewport event — no stale "post-dismiss" state.

**Why no library:** The two main candidates ([svelte-bottom-sheet](https://github.com/AuxiDev/svelte-bottom-sheet), [svelte-drawer](https://github.com/AbhiVarde/svelte-drawer)) are gesture-driven Vaul-style drawers with their own focus-trap, scrim, drag-to-dismiss, and animation pipelines. Adopting one would (a) re-introduce auto-focus we are explicitly removing, (b) replace our existing v1.13 Phase 42.1 sticky-drawer pattern that downstream calculators depend on, and (c) add ~10 KB of runtime for code we already have working everywhere except iOS keyboard overlap. Net negative.

**Confidence:** HIGH for the API itself; MEDIUM for the iOS 26 `visualViewport.height` post-dismiss bug — workaround is to re-read on every event rather than cache, which is the standard mitigation pattern.

### Requirement C — Notch-safe title bar (`env(safe-area-inset-top)`)

**Existing capability:** Pure CSS. The app already declares `<meta name="viewport" content="..., viewport-fit=cover">` (required by the existing `pb-[env(safe-area-inset-bottom,0px)]` mobile bottom nav at `NavShell.svelte:150`). The bottom-inset path proves the meta tag and stack are wired correctly; the missing piece is the symmetric top-inset on the sticky `<header>`.

**Fix:** In `NavShell.svelte` line 76–80, change the header's `px-4` to add `pt-[env(safe-area-inset-top,0px)]` and either bump `min-h-14` to a content-height-only constraint (so total height = inset + 56 px) or split into two stacked elements (a transparent inset spacer + the existing 56 px row). Tailwind 4 arbitrary-value notation matches the bottom-nav pattern verbatim. No JS, no plugin, no `tailwind.config` change.

**Caveat — Tailwind class form:** Use `pt-[env(safe-area-inset-top,0px)]` (with the `0px` fallback) to mirror the bottom-nav line 150 contract. Without the fallback, browsers that don't recognize `env()` produce no padding (acceptable but inconsistent with our existing pattern).

**Confidence:** HIGH. Identical idiom to existing line 150; documented at [MDN env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env) and the [Karma "Make Your PWAs Look Handsome on iOS"](https://itnext.io/make-your-pwas-look-handsome-on-ios-fd8fdfcd5777) reference cited in our existing CLAUDE.md sources.

### TypeScript typing — gap analysis

| Surface | Typing source | Gap? |
|---|---|---|
| `window.visualViewport` | `lib.dom.d.ts` → `Window.visualViewport: VisualViewport \| null` | None |
| `VisualViewport` events | `lib.dom.d.ts` → `onresize`/`onscroll`/`onscrollend` | None |
| `env(safe-area-inset-top)` | CSS — no TS surface | N/A |
| `HTMLDialogElement.showModal()` | `lib.dom.d.ts` | None |

No `@types/*` updates needed. The existing `@types/node@^25.6.0` covers Node-side Vite/Vitest plumbing only and is unrelated.

## 4. Test Stack Adequacy

| Surface | Playwright WebKit (CI) | Real iPhone (manual smoke) |
|---|---|---|
| Drawer no-auto-focus assertion (focus stays on Clear button) | ✓ Sufficient — `expect(page.locator('button:has-text("Clear")')).toBeFocused()` works headless | Confirms iOS keyboard does not appear |
| `visualViewport` JS API exists & resize handler attaches | ✓ Sufficient — can assert `window.visualViewport !== null` and dispatch synthetic events | — |
| **iOS soft keyboard actually shrinks visualViewport** | ✗ **NOT emulated** by Playwright WebKit per [Playwright Emulation docs](https://playwright.dev/docs/emulation) and the unresolved [microsoft/playwright#21420](https://github.com/microsoft/playwright/issues/21420) discussion. Emulation covers viewport size, user agent, touch, and screen — NOT software keyboard, NOT IME, NOT visualViewport resize on focus | ✓ **Required.** The drawer-above-keyboard behavior cannot be regression-tested in CI |
| `env(safe-area-inset-top)` resolves to non-zero on devices with notch | ✗ Not emulated — Playwright's iPhone descriptors set viewport size but do NOT inject safe-area insets | ✓ **Required.** Visual regression on real iPhone 13/14/15/Pro/Plus |
| Standalone PWA `display-mode: standalone` (where iOS top-inset actually applies) | Partial — can `page.emulateMedia({ media: 'screen', displayMode: 'standalone' })` per Playwright docs but this only flips the CSS media query, doesn't reproduce the WebKit standalone-mode layout chrome | ✓ **Required.** "Add to Home Screen" launch confirms inset is non-zero |

**Recommended action:**
1. Add Playwright project for `webkit` + `devices['iPhone 14']` (or iPhone 15 if 1.59 ships it) to `playwright.config.ts` projects array. Cost: ~zero (browser already installed for axe sweeps that import it transitively isn't true — confirm `pnpm exec playwright install webkit` ran or add to CI). Useful for: layout regressions (no inset injected, but viewport math still verifiable), focus-restoration assertions, dialog open/close.
2. Codify a real-iPhone smoke checklist in the milestone verification doc covering: drawer opens → keyboard does NOT appear, tap input → keyboard appears AND drawer is above it, dismiss keyboard → drawer drops back to nav, install to home → launch standalone → notch does not eclipse hamburger. This closes the v1.13 D-12 deferral.

**Bottom line:** Playwright WebKit project adds value for the focus-management and CSS layout assertions but **cannot exercise the keyboard-overlay or notch-inset behavior**. Real-iPhone smoke remains mandatory and is the primary validation surface for this milestone.

## 5. Sources

- [MDN — VisualViewport API](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) — Baseline since Aug 2021; `lib.dom.d.ts` typing confirmed. HIGH.
- [MDN — env() CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/env) — `safe-area-inset-top/right/bottom/left` definitions, fallback syntax. HIGH.
- [MDN — `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — `showModal()` initial focus rules and `autofocus` interaction. HIGH.
- [Apple Developer Forum 800125 — iOS 26 Safari & WebView: VisualViewport.offsetTop not resetting](https://developer.apple.com/forums/thread/800125) (Sep 2025) — known regression; mitigation is to re-read on every visualViewport event rather than cache. MEDIUM (Apple-engineering-aware, no shipped fix yet).
- [Playwright — Emulation docs](https://playwright.dev/docs/emulation) — confirms WebKit emulation covers viewport/UA/touch but NOT software keyboard or visualViewport keyboard-resize. HIGH.
- [Karma Sakshi — Make Your PWAs Look Handsome on iOS](https://itnext.io/make-your-pwas-look-handsome-on-ios-fd8fdfcd5777) — already cited in CLAUDE.md; viewport-fit=cover + safe-area-inset idioms, confirms the symmetric top-inset pattern matches the existing bottom-nav implementation. MEDIUM.
