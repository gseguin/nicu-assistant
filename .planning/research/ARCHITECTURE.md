# Architecture Patterns — v1.15.1 iOS Polish & Drawer Hardening

**Domain:** SvelteKit 2 + Svelte 5 (runes) + Tailwind CSS 4 + adapter-static SPA, deployed as a PWA. Three iOS-specific defects in the shared shell (`InputDrawer`, `NavShell`).
**Researched:** 2026-04-26
**Confidence:** HIGH on Fix 1 and Fix 3 (pure code-reading + CSS), MEDIUM on Fix 2 (visualViewport ergonomics on iOS Safari are well documented but jsdom mocking has edge cases).

---

## 1. Summary

All three fixes touch only `src/lib/shared/components/InputDrawer.svelte` and `src/lib/shell/NavShell.svelte` plus a single new module-scope rune singleton (`src/lib/shared/visualViewport.svelte.ts`) — no per-calculator changes, no new dependencies, no DESIGN.md / DESIGN.json contract drift. Fix 1 (auto-focus) is a pure deletion of lines 51–57 in `InputDrawer.svelte` plus an a11y compensation: keep `showModal()` so `<dialog>` still focus-traps, just stop programmatically focusing the first `<input>`. Fix 3 (notch-safe title bar) is one Tailwind utility on the `<header>` in `NavShell.svelte` (`pt-[env(safe-area-inset-top,0px)]`) plus possibly a `min-h` adjustment; pure CSS, no JS. Fix 2 (visualViewport drawer anchoring) is the only fix that adds runtime code: a singleton that subscribes to `window.visualViewport` `resize`/`scroll` events and exposes `offsetTop`, `height`, and `keyboardOpen` as `$state` runes; consumed by `InputDrawer.svelte` via inline-style CSS variables (`--ivv-bottom`, `--ivv-max-height`) so the `.input-drawer-sheet` re-anchors above the iOS keyboard. Bottom nav is left alone — it already uses `env(safe-area-inset-bottom,0px)` and is irrelevant when the drawer dialog is open (top-layer `<dialog>` covers it). Build order: Fix 1 first (smallest blast radius, removes a confound for Fixes 2 + 3 testing), then Fix 3 (pure CSS), then Fix 2 (the real work).

---

## 2. Per-Fix Integration Matrix

### Fix 1 — Auto-focus suppression

| File | Lines | Change | Why |
|------|-------|--------|-----|
| `src/lib/shared/components/InputDrawer.svelte` | 51–57 | **Delete** the `queueMicrotask(() => { … firstInput?.focus(); })` block inside the `$effect` that opens the dialog | This is the *only* programmatic focus on a drawer-contained input in the entire codebase (verified: `grep -rn "\.focus()" src/lib/shared/components/ src/lib/shell/ src/routes/` returns 7 hits; only line 56 of `InputDrawer.svelte` targets a drawer input — the others are `SegmentedToggle` roving tabindex, `SelectPicker` search field, and `HamburgerMenu` focus-restore). Removing it stops iOS from popping the keyboard on drawer open. |
| `src/lib/shared/components/InputDrawer.svelte` | 43–62 | **Keep** the `dialog.showModal()` call (and the `dialog.close()` branch) | `showModal()` is what gives us the focus-trap and Esc-to-close. Native `<dialog>` will still move focus to the dialog's first focusable child on `showModal()` — by default the **header close button** at lines 107–119 (since `Clear` only renders when `onClear` is provided, the close button is the reliable first tab stop). That is the desired behavior: keyboard users land on a clearly-labelled affordance, not on a numeric input that summons the keyboard. |
| `src/lib/shared/components/InputDrawer.test.ts` | T-04 | **No change required** — the test already targets the close button by name, not by focus order | Test green stays green. |
| `src/lib/shared/components/InputDrawer.test.ts` | new | **Add** T-07: regression — assert no `<input>` inside the sheet has document focus after `showModal()` resolves | Lock in the fix with a test that would have caught the original bug. |

**Strategy: full removal, not boolean opt-out.** No calculator currently passes a "should I auto-focus?" prop, and the bug applies on *every* open. A boolean adds API surface for a behavior nobody wants. If a future calculator ever needs auto-focus on a specific input, it can call `.focus()` from its own component after the drawer opens — far more discoverable than a drawer prop.

**A11y implications:**
- **Keyboard users opening the drawer:** Previously: drawer opens → first input focused → tab to other inputs. Now: drawer opens → close button focused (native `<dialog>` autofocus) → tab into inputs. This adds **one tab** for keyboard users to reach the first input. WCAG 2.1 AA does not require auto-focus into a dialog's content; it requires focus to *enter* the dialog (still satisfied via `showModal()`) and to be *trappable* within it (still satisfied — `<dialog>` traps natively).
- **Focus trap when fully expanded:** Native `<dialog>` `showModal()` provides a focus trap automatically — no additional code needed. Verified by line 45: `dialog.showModal()`.
- **Focus restore on close:** Native `<dialog>` returns focus to the trigger element automatically when `.close()` is called (per WHATWG HTML spec). Verified by absence of any `.focus()` call in the close path (`handleClose`, `handleClear`). `HamburgerMenu.svelte:41` only needs explicit `triggerEl?.focus()` because it implements its own custom-managed dialog trigger pattern; `InputDrawer` does not.
- **Screen reader announcement:** `<dialog aria-label={title}>` already announces "Inputs dialog" on open. Unaffected by the change.

---

### Fix 2 — visualViewport drawer anchoring

| File | Change | Why |
|------|--------|-----|
| **NEW** `src/lib/shared/visualViewport.svelte.ts` | New module-scope singleton (~40 lines) using `$state` runes. Exposes `{ offsetTop, height, keyboardOpen, init() }`. `init()` is idempotent and registered from `+layout.svelte:onMount` next to the existing `theme.init()` / `disclaimer.init()` / `favorites.init()` calls. | Mirrors the established singleton pattern (`theme.svelte.ts`, `disclaimer.svelte.ts`, `favorites.svelte.ts`, `pwa.svelte.ts`). One module = one shared subscription = no duplicate listeners. SSG-safe via `$app/environment` `browser` guard inside `init()`. |
| `src/routes/+layout.svelte` | Add `import { vv } from '$lib/shared/visualViewport.svelte.js'` and `vv.init()` inside the existing `onMount` block (after `favorites.init()` at line 55) | Keeps singleton lifecycle co-located with the other four. No SSG hazard because `onMount` only runs in the browser. |
| `src/lib/shared/components/InputDrawer.svelte` | Import the singleton; bind a `$derived` `style` string on the `.input-drawer-sheet` element setting `--ivv-bottom: {window.innerHeight - vv.offsetTop - vv.height}px` and `--ivv-max-height: {vv.height * 0.8}px` (computed only when `vv.keyboardOpen` is true; falls back to the existing `max-height: 80dvh` otherwise) | The `<dialog>` itself stays at `100dvh` (line 142) — that's the invisible flex container. The visible sheet at lines 151–160 moves up via the CSS variable. `dvh` does not adjust for the on-screen keyboard on iOS Safari (verified: `dvh` accounts for browser chrome, not the soft keyboard); only `visualViewport` does. |
| `src/lib/shared/components/InputDrawer.svelte` | `.input-drawer-sheet` CSS at line 157: change `padding-bottom: env(safe-area-inset-bottom, 0px);` to `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px));` and gate `max-height: 80dvh` behind `var(--ivv-max-height, 80dvh)` | Single rule handles both cases: keyboard closed (var unset → 0px → falls through to safe-area-inset-bottom), keyboard open (var = visualViewport gap → drawer rides above keyboard). |

**New module/composable:** Yes, exactly one — `src/lib/shared/visualViewport.svelte.ts`. Sketch:

```ts
// src/lib/shared/visualViewport.svelte.ts
import { browser } from '$app/environment';

class VisualViewportStore {
  offsetTop = $state(0);
  height = $state(0);
  keyboardOpen = $state(false);
  #initialized = false;

  init() {
    if (!browser || this.#initialized) return;
    this.#initialized = true;
    const vv = window.visualViewport;
    if (!vv) return; // Older browsers — fall back to dvh; sheet still works.

    const update = () => {
      this.offsetTop = vv.offsetTop;
      this.height = vv.height;
      // Heuristic: keyboard is open when visualViewport.height is meaningfully
      // less than window.innerHeight. 100px threshold filters out URL bar
      // collapse on Safari (which is ~50–80px).
      this.keyboardOpen = window.innerHeight - vv.height > 100;
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
  }
}

export const vv = new VisualViewportStore();
```

**Wiring strategy: CSS variable, not prop.** Reasons:
1. The drawer's `.input-drawer-sheet` already has its size/position expressed in CSS (lines 151–160). Driving CSS from CSS variables keeps the layout language consistent.
2. A prop would require every consumer of `<InputDrawer>` to plumb the value through — `MorphineWeanCalculator.svelte`, `FortificationCalculator.svelte`, `GirCalculator.svelte`, `FeedAdvanceCalculator.svelte`, `UacUvcCalculator.svelte`, `PertCalculator.svelte` (six call sites per `grep`). Singleton + CSS var = zero per-calculator change.
3. Inline `style` on the sheet inside the component is the cleanest binding (`style="--ivv-bottom: {…}px; --ivv-max-height: {…}px"`). No `:global` rules on `body`, no global side effects.

**Does the bottom-nav also need to translate?** **No.** When `<InputDrawer>` is `expanded`, `dialog.showModal()` (line 45) puts the dialog in the **top layer** — by spec it is rendered above `position: fixed` content including the bottom nav (`NavShell.svelte:148–174`). The bottom nav is visually obscured by the drawer's backdrop scrim. Translating the nav would be wasted work and could cause layout thrash. Verified architecturally: the comment at `InputDrawer.svelte:1–16` and at `NavShell.svelte:147` both call this out (`<dialog>` showModal covers the nav).

When the drawer is **collapsed**, the keyboard cannot be open (no input has focus — that's the whole point of Fix 1) so visualViewport offset is 0 and the bottom nav stays put on `env(safe-area-inset-bottom,0px)`. No change needed to `NavShell.svelte:148–174`.

**Interaction with favorites bottom-nav safe-area-inset padding?** None. The bottom nav's `pb-[env(safe-area-inset-bottom,0px)]` is independent of and orthogonal to the drawer's keyboard handling. The two coexist: when drawer closed, nav uses safe-area; when drawer open, nav is covered by the top-layer dialog and irrelevant to the user.

---

### Fix 3 — Notch-safe title bar

| File | Lines | Change | Why |
|------|-------|--------|-----|
| `src/lib/shell/NavShell.svelte` | 76–80 | Add `pt-[env(safe-area-inset-top,0px)]` to the `<header>` Tailwind class list (after `min-h-14`). Optionally promote `min-h-14` to `min-h-[calc(theme(spacing.14)+env(safe-area-inset-top,0px))]` if visual testing shows the inner row crowded against the notch. | `viewport-fit=cover` is already set in `app.html:45`, so `env(safe-area-inset-top)` reports the notch height. The title bar needs explicit top padding because none of the three Tailwind utility groups currently on the header (`sticky top-0 right-0 left-0`, `min-h-14 items-center gap-2`, `border-b border-... bg-... px-4`) account for it. Confirmed by `grep "safe-area-inset" src/`: zero top references, only bottom (8 sites: `app.html`, `InputDrawer`, `AboutSheet`, `UpdateBanner`, `NavShell:150`, `HamburgerMenu`, `SelectPicker`, `+layout.svelte`). |
| `src/app.html` | 49 | **No change.** Keep `apple-mobile-web-app-status-bar-style` = `black-translucent` | `black-translucent` is the value that *causes* the page to extend behind the notch in the first place — i.e. it's a precondition for our Fix 3 padding to be visible/meaningful. Switching to `default` would push content below the status bar and erase the bug *and* the visual polish goal. |
| `vite.config.ts` | 27 | **No change required.** | `theme_color: '#0d1117'` at line 27 sets the iOS standalone-mode status-bar tint when `apple-mobile-web-app-status-bar-style` is `default` — but with `black-translucent` the status bar is *transparent* and shows the page background under it. So the notch-area background = `bg-[var(--color-surface)]` from `NavShell.svelte:80` extending up into the `pt-[env(safe-area-inset-top,0px)]` zone. This is exactly what we want; no manifest change needed. |

**Pure CSS — no JS measurement.** The W3C `env()` function with `safe-area-inset-top` is supported on iOS Safari ≥ 11.2 and is the canonical solution. There is no scenario in this milestone that requires measuring the notch height in JS. The `viewport-fit=cover` viewport meta on `app.html:45` is already in place to make `env()` non-zero in standalone PWA mode.

**Tailwind utility impact:** Tailwind 4 supports arbitrary `env()` values inside square brackets (verified by the existing `pb-[env(safe-area-inset-bottom,0px)]` usage at `NavShell.svelte:150` and seven other sites). No plugin needed, no `@theme` token needed.

**Theme-color manifest implication:** None. Because `apple-mobile-web-app-status-bar-style` is `black-translucent`, the iOS status bar shows page content under it (the page background "bleeds up" into the inset). Light mode shows light surface under the notch; dark mode shows dark. This already matches the theme. No `theme-color` meta tag dance needed.

---

## 3. New Modules / Composables

| Module | Path | Lines | Purpose |
|--------|------|-------|---------|
| `visualViewport.svelte.ts` | `src/lib/shared/visualViewport.svelte.ts` | ~40 | Singleton subscribing to `window.visualViewport.{resize,scroll}`; exposes `offsetTop`, `height`, `keyboardOpen` as `$state` runes. Mirrors `theme.svelte.ts` / `favorites.svelte.ts` patterns. |

**No new module required for Fix 1 (pure deletion) or Fix 3 (pure CSS).** Total new code surface: one `.svelte.ts` singleton + one `.init()` call in `+layout.svelte` + ~6 lines of inline-style binding on `InputDrawer.svelte`'s sheet element. Everything else is deletion or CSS utility addition.

---

## 4. Suggested Build Order

### Order: Fix 1 → Fix 3 → Fix 2

| Phase | Fix | Rationale |
|-------|-----|-----------|
| **First** | **Fix 1 — auto-focus removal** | Smallest blast radius (one `$effect` body shrinks). Removing the auto-focus also **removes a confound** when manually testing Fix 2 on a real iPhone: with auto-focus active, the keyboard pops on every drawer open and you can't isolate "drawer position when user *chooses* to focus an input" from "drawer position on open." Land Fix 1 first to make Fix 2's behavior observable. Vitest green is the gate (the existing T-01..T-06 should all stay green; add T-07 regression). |
| **Second** | **Fix 3 — notch-safe title bar** | Pure CSS, zero runtime risk. Independent of the drawer entirely. Land it as soon as Fix 1 is merged so the visual regression is gone for the v1.15.1 ship. Verification is a real-iPhone screenshot in standalone mode at the home indicator + notch — Playwright cannot emulate the iOS notch (Chromium's `iPhone X`/`iPhone 14 Pro` device descriptors set viewport, not safe-area insets — see Test Surface). |
| **Third** | **Fix 2 — visualViewport drawer anchoring** | The biggest fix; requires the new singleton + a real-iPhone verification surface. Lands last because (a) it depends on Fix 1 to make the keyboard-open scenario *user-controlled* rather than automatic, (b) it's the only fix that can fail in subtle ways (keyboard heuristic threshold, browser support fallback) and benefits from the most testing time, (c) if Fix 2 has to slip to v1.15.2, Fix 1 + Fix 3 can ship independently and still close two of the three bedside complaints. |

**Cross-fix dependency:** Fix 1 is a strict precondition for *clean verification* of Fix 2 (not a code dependency — Fix 2 would technically work without Fix 1 — but a testing-experience dependency). Fix 3 is independent of both; it could land first if scheduling demands.

**Single-PR vs. three-PR strategy:** Recommend three commits inside one branch (`v1.15.1-ios-polish`), squashed-or-merged depending on the project's git convention. Three commits = clean revert path if any one fix regresses on real iPhone. Single PR = one CI run, one axe sweep gate.

---

## 5. Test Surface

### Unit (Vitest + jsdom)

| Test | File | What it covers |
|------|------|----------------|
| T-07 (new) | `src/lib/shared/components/InputDrawer.test.ts` | Regression — after `initialExpanded: true` + `tick()`, no element matching `'input,select,textarea,[role="slider"]'` inside the dialog has `document.activeElement` |
| T-08 (new) | `src/lib/shared/components/InputDrawer.test.ts` | Style binding — when a stubbed `vv` reports `keyboardOpen: true, offsetTop: 200, height: 400`, the rendered sheet's `style` attribute contains `--ivv-bottom` and `--ivv-max-height` non-default values |
| visualViewport unit test | `src/lib/shared/visualViewport.svelte.test.ts` (new) | Mock `window.visualViewport` in `beforeEach` via `Object.defineProperty(window, 'visualViewport', { value: { offsetTop, height, addEventListener, removeEventListener, dispatchEvent }})`; assert that `vv.init()` is idempotent, registers listeners, and that dispatching synthetic `resize` events updates the runes |

**jsdom shim status for visualViewport:** jsdom (current project on `^29` per `test-setup.ts:99`) does **not** implement `window.visualViewport` natively. **Add a stub to `src/test-setup.ts`** following the same pattern as the existing `ResizeObserver` (lines 5–11), `Element.scrollIntoView` (lines 16–18), `matchMedia` (lines 22–36), `Element.animate` (lines 39–71), and `HTMLDialogElement` (lines 78–149) shims. The shim should:
- Default `visualViewport.height` to `window.innerHeight` (so `keyboardOpen` is `false` by default)
- Default `offsetTop` to `0`
- Implement `addEventListener` / `removeEventListener` as map-backed stubs that allow tests to dispatch synthetic `resize` events
- Implement a self-test like the existing dialog polyfill self-test (lines 122–149) so suite startup catches regressions

### Component (Vitest + @testing-library/svelte)

| Test | What it covers |
|------|----------------|
| `InputDrawer` close-button-receives-focus | Assert that after `showModal()` resolves, `document.activeElement` is the close button (or null in jsdom — accept both, document the limitation) |
| `NavShell` notch-pad-class-present | Assert that the rendered `<header>` `className` substring contains `pt-[env(safe-area-inset-top,0px)]`. (Style-block / runtime CSS not testable in jsdom — assert the *class* application, not the computed pixel value) |

### Playwright E2E

The existing `playwright.config.ts:16-19` defines exactly one project: `chromium` on Desktop Chrome. **Add a second project** for mobile WebKit emulation:

```ts
{
  name: 'webkit-iphone',
  use: { ...devices['iPhone 14 Pro'] }
}
```

| Test | What it covers |
|------|----------------|
| `e2e/ios-drawer.spec.ts` (new) — "drawer open does not focus an input" | Open `/morphine-wean`, click `InputsRecap` to open drawer, assert `await page.locator('input').first().evaluate(el => el === document.activeElement) === false`. Runs on both `chromium` and `webkit-iphone`. |
| `e2e/ios-drawer.spec.ts` — "drawer respects visualViewport when keyboard simulated" | Tap a numeric input inside the drawer; the (emulated) keyboard would normally fire `visualViewport.resize`. **Caveat:** Playwright WebKit on Linux does NOT emulate the iOS soft keyboard — `visualViewport.resize` events don't fire automatically. This test should `page.evaluate(() => { Object.defineProperty(window.visualViewport, 'height', { value: 400, configurable: true }); window.visualViewport.dispatchEvent(new Event('resize')); })` and assert the resulting `style` attribute on `.input-drawer-sheet` contains `--ivv-bottom`. Document this synthetic-dispatch limitation in the test file header. |
| `e2e/ios-notch.spec.ts` (new) — "title bar has top safe-area padding class" | DOM-level assertion that the `<header>` `class` attribute contains `pt-[env(safe-area-inset-top,0px)]`. Real-pixel measurement requires real iPhone (Playwright cannot synthesize a notch — `devices['iPhone 14 Pro']` sets viewport to `393 × 852` but does NOT inject `safe-area-inset-top`). |

### axe-core a11y

The existing 16/16 axe sweep matrix (light/dark across all 6 calculators + drawer + dialog states) **does not need new sweeps** — none of the three fixes introduce new color tokens, new ARIA, or new DOM landmarks. Re-run the existing sweeps to confirm:
- Fix 1 doesn't break `dialog` focus-management rules
- Fix 3 doesn't break header landmark color contrast (the inset area is a continuation of `bg-[var(--color-surface)]` so the contrast is the same as the rest of the bar)
- Fix 2 doesn't break drawer-content visibility / contrast at any keyboard-open offset

### Real-iPhone smoke test (the actual primary verification)

The PROJECT.md milestone goal explicitly closes the v1.13 D-12 deferral by elevating real-iPhone testing to **primary verification surface**. Required scenarios:

| Scenario | How to verify |
|----------|---------------|
| Standalone PWA mode, iPhone with notch (X+) | Add to home screen → launch → confirm hamburger / app name / theme button all sit *below* the camera island / Dynamic Island |
| Drawer open on landing page, no keyboard | Tap `InputsRecap` → drawer slides up → no soft keyboard appears, focus visibly on the close button |
| Drawer open + tap a numeric input | Keyboard pops → drawer's bottom edge sits flush with keyboard top, content scrollable, no overlap |
| Drawer dismissed via Esc-equivalent (tap on backdrop above sheet) | Focus returns to the `InputsRecap` button (native `<dialog>` close-restore) |
| Dark mode + landscape orientation | Inset still respected on both edges, drawer still fits within visible viewport |
| Severe-neuro GIR card (STOP-red) still readable when drawer covers/uncovers it | Color contrast unaffected (neither fix touches identity tokens or Red-as-Error carve-out) |

---

## 6. Sources

### Codebase line refs (primary)

| Claim | File:Line |
|-------|-----------|
| Drawer auto-focus block to delete | `src/lib/shared/components/InputDrawer.svelte:51–57` |
| `dialog.showModal()` provides focus trap | `src/lib/shared/components/InputDrawer.svelte:45` |
| Sheet CSS using `dvh` and `safe-area-inset-bottom` | `src/lib/shared/components/InputDrawer.svelte:151–160` (`padding-bottom` at line 157) |
| Title bar markup that needs top inset | `src/lib/shell/NavShell.svelte:76–80` |
| Bottom nav already uses `safe-area-inset-bottom` | `src/lib/shell/NavShell.svelte:150` |
| `viewport-fit=cover` already set | `src/app.html:45` |
| `apple-mobile-web-app-status-bar-style: black-translucent` | `src/app.html:49` |
| Singleton pattern precedent (theme/favorites/disclaimer/pwa) | `src/routes/+layout.svelte:52–71` |
| jsdom shim pattern precedent | `src/test-setup.ts:5–11, 16–18, 22–36, 39–71, 78–149` |
| Bottom nav clearance computation in main padding | `src/routes/+layout.svelte:85–88` |
| All 6 InputDrawer call sites (per-calculator, would need plumbing if Fix 2 used a prop) | `src/lib/{morphine,fortification,gir,feeds,uac-uvc,pert}/*Calculator.svelte` (verified by `grep -rn "InputDrawer" src/`) |
| Playwright config has only one chromium project | `playwright.config.ts:15–20` |
| PWA manifest `theme_color` and apple-mobile-web-app-status-bar-style | `vite.config.ts:27`, `src/app.html:49` |
| Six calculator registry (none change in this milestone) | `src/lib/shell/registry.ts:20–69` |
| Existing safe-area-inset-bottom usages (8 sites, none top) | `app.html`, `InputDrawer.svelte:157`, `AboutSheet.svelte:60`, `UpdateBanner.svelte:11`, `NavShell.svelte:150`, `HamburgerMenu.svelte:69`, `SelectPicker.svelte:190`, `+layout.svelte:88` |
| Only programmatic focus on a drawer-contained input is line 56 | `grep -rn "\.focus()" src/lib/shared/components/ src/lib/shell/ src/routes/` (7 hits, only `InputDrawer.svelte:56` targets a drawer input) |

### External (secondary, training data — verify on first use)

- MDN: `Window.visualViewport` API and `VisualViewport.resize` event — https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport (confidence: HIGH; mature spec, supported on iOS Safari ≥ 13)
- MDN: `env(safe-area-inset-top)` — https://developer.mozilla.org/en-US/docs/Web/CSS/env (confidence: HIGH)
- WHATWG HTML spec: `<dialog>` `showModal()` focus trap and focus-return-on-close — https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element (confidence: HIGH; spec-defined)
- iOS PWA safe-area-inset best practice (referenced in CLAUDE.md sources): https://dev.to/karmasakshi/make-your-pwas-look-handsome-on-ios-1o08 (confidence: MEDIUM)
- Playwright `devices['iPhone 14 Pro']` does not inject safe-area-inset values — https://playwright.dev/docs/emulation#devices (confidence: MEDIUM; verifiable by inspecting `node_modules/@playwright/test/lib/server/deviceDescriptorsSource.json` during execution)
