# Feature Landscape — v1.15.1 iOS PWA Polish

**Domain:** iOS PWA (standalone, bedside iPhone, WebKit) — sticky bottom-sheet drawer + notch-safe top chrome
**Researched:** 2026-04-27
**Scope:** Three iOS-only regressions in the v1.13/v1.15 shell — (1) auto-focus suppression on drawer open, (2) `visualViewport`-correct drawer anchoring under the software keyboard, (3) `safe-area-inset-top` notch / Dynamic Island avoidance on the title bar.
**Overall confidence:** HIGH (multiple authoritative sources for each pattern; existing code paths already in repo)

---

## 1. Summary

This is a **shell-polish hotfix milestone**, not a feature delivery. The three target features are not "new things to build" — they are **iOS-correctness fixes** to existing infrastructure that already works on Android, desktop Chrome, and desktop Safari, but degrades on iPhone in standalone PWA mode (the primary deployment target per `MEMORY.md / user_mobile_first` and project users).

Across all three, a **single iOS-WebKit reality** drives every decision:

> On iOS Safari, the **layout viewport is fixed**. The on-screen keyboard does **not** resize the layout viewport — it slides up as a separate layer that obscures `position: fixed; bottom: 0` content. Only the **`visualViewport`** API reports the actually-visible region. CSS `100dvh` updates on URL-bar collapse but does **not** update for the keyboard. ([QuirksMode][1], [tkte.ch][2], [Smashing Magazine][3])

Everything below is a corollary of that.

The good news is the existing code is *close*: `InputDrawer.svelte` already uses `<dialog>.showModal()` (which puts the sheet in the top layer, the only `position:fixed`-equivalent that survives keyboard appearance reliably), already uses `100dvh` with a `100vh` fallback, already pads `env(safe-area-inset-bottom)`, and the title bar already uses `min-h-14 sticky top-0`. The fixes are **additive** to those existing patterns:

| Target feature | Existing | Missing |
|---|---|---|
| Auto-focus suppression | `<dialog>` + `showModal()` | The `queueMicrotask` block at lines 51–57 explicitly *re-introduces* auto-focus after Svelte tries to suppress it |
| visualViewport anchoring | `100dvh` + `padding-bottom: env(safe-area-inset-bottom)` | No `visualViewport.resize` listener; sheet `max-height: 80dvh` ignores keyboard |
| Notch-safe title bar | `sticky top-0`, `min-h-14`, `bg-[var(--color-surface)]` | No `padding-top: env(safe-area-inset-top)` — under `apple-mobile-web-app-status-bar-style: black-translucent` the header content slides under the Dynamic Island |

---

## 2. Per-Feature Breakdown

---

### Feature A — Auto-focus suppression on drawer open

**Diagnosis of current bug:** `InputDrawer.svelte` lines 43–62 contains an *opt-in* re-focus that runs on every drawer open. The comment claims the goal is "move focus from the close button to the first input." On iOS Safari this is doubly wrong:

1. The HTML spec says `<dialog>.showModal()` already auto-focuses the first focusable element. The repo's hand-rolled `queueMicrotask(() => firstInput?.focus())` overrides that with a *more invasive* selector — searching past the close/Clear buttons specifically for `input, select, textarea, [role="slider"]`.
2. Even though iOS *normally* refuses to raise the keyboard for non-user-initiated focus calls, this rule has carve-outs when the focus call is made *during the same task as a user gesture* — and `showModal()` followed immediately by `queueMicrotask` can fall inside that window in WebKit. ([Tommy Brunn / Medium][4]) The result: keyboard pops up the moment the drawer animates in, before the clinician has even decided which field to tap.

#### Table stakes (must have)

| ID | Item | Complexity |
|---|---|---|
| TS-A1 | **Drawer opens with NO focus on any input.** Match macOS/iOS native bottom-sheet UX: the sheet appears, the user reads the fields, the user taps the field they want. Achieved by *removing* the manual `queueMicrotask` focus block AND giving the dialog itself an explicit focus target that is not an input — the close-affordance/header. | Low |
| TS-A2 | **The first interactive element to receive focus must NOT be a text input** — neither directly nor as a fallback. Use the existing close button (`button` with `aria-label="Close inputs"`) or, better, the dialog/sheet container itself with `tabindex="-1"`. ([Adrian Roselli][5], [Manuel Matuzović][6]) | Low |
| TS-A3 | **Tap-on-field still works.** A direct user tap on any input/select/slider must still raise the keyboard normally. This is the iOS default — DO NOT add code to fight it. | Trivial |
| TS-A4 | **Focus-trap inside dialog is preserved.** `<dialog>.showModal()` auto-traps Tab/Shift-Tab inside the modal. Do not break this by setting `tabindex="-1"` on focusable children — only on the dialog wrapper. | Low |
| TS-A5 | **Escape still closes the drawer.** The `oncancel` / `onclose` handler is already wired (line 86) — preserve it. iOS hardware-keyboard users (rare but real) and Bluetooth-keyboard users must keep it. | Trivial |

#### Differentiators (clinical-trust polish)

| ID | Item | Complexity |
|---|---|---|
| DIFF-A1 | **Initial focus on the dialog container itself** (with `tabindex="-1"`), not on a button. This is the [Adrian Roselli][5]-recommended pattern for screen-reader announcement of the dialog title before any control. The clinician hears "Inputs, dialog" before being presented with a focused control — calmer interaction, matches the Design Principle "Earn trust through restraint." | Low |
| DIFF-A2 | **First-interactive-element vs first-input distinction:** the existing drawer header has a Clear button (left) + Close button (right). When `<dialog>.showModal()` runs *without* the queueMicrotask override, focus naturally lands on the Clear button (or Close, if no `onClear` is provided). That's actually fine — *both* are non-input controls and neither raises the keyboard. The fix can therefore be as small as **deleting** the `queueMicrotask` block. | Trivial |
| DIFF-A3 | **Tablist / SegmentedToggle inside drawer:** when the drawer expands and contains a `SegmentedToggle` (Morphine, Feeds), the tablist's roving-tabindex active item is a `button[role="tab"]` — focusing it does NOT raise the keyboard. So if a future drawer's first focusable child is a SegmentedToggle, default `<dialog>` autofocus is still safe. **Only inputs raise the keyboard.** Encode this as: "first focusable must not be `input`/`textarea`/`select`/`[contenteditable]`." | Low |

#### Anti-features

| ID | Item |
|---|---|
| ANTI-A1 | **DO NOT use `inputmode="none"` to suppress the keyboard.** It breaks paste flows (especially the v1.8 GIR EPIC paste flow) and assistive-tech voice input. |
| ANTI-A2 | **DO NOT use the `readOnly`-blur-focus-removeReadOnly hack** ([Tommy Brunn][4]) on the drawer's inputs. It is a hack for autofocus on landing pages, not for modal dialogs. It will fight the SegmentedToggle's roving tabindex and confuse screen readers. |
| ANTI-A3 | **DO NOT use `tabindex="-1"` on real input elements** to prevent focus. They become unreachable by keyboard navigation — WCAG 2.1 AA failure. |
| ANTI-A4 | **DO NOT call `.blur()` on `document.activeElement` on drawer open.** Race condition with `<dialog>.showModal()` focus management; can leave focus on `<body>` and break the focus trap. |
| ANTI-A5 | **DO NOT use `onOpenAutoFocus={(e) => e.preventDefault()}`-style escape hatches** if migrating to bits-ui or similar. Using `autoFocus={false}` on a modal degrades a11y for screen-reader users. ([Radix discussion][7]) The goal is "focus the dialog, not an input" — not "no focus at all." |

#### Complexity

**Low.** Effective fix is **deleting** lines 51–57 of `InputDrawer.svelte` and adding `tabindex="-1"` + `bind:this={sheet}` swap so the sheet itself is initially focused. ~5 lines of net diff. Existing test (`InputDrawer.test.ts`) needs one updated assertion: "first input is not focused on open."

#### Dependencies

- Existing `<dialog>` + `showModal()` infrastructure (already in place, line 81)
- Existing `prefers-reduced-motion` slide-up animation (preserve)
- Existing `<HeroResult>` + `<InputsRecap>` tap-to-open contract (preserve)
- No new dependencies, no new components

---

### Feature B — iOS visualViewport drawer anchoring

**Diagnosis of current bug:** The drawer's outer `<dialog>` uses `height: 100dvh; max-height: 100dvh` and the inner `.input-drawer-sheet` uses `max-height: 80dvh`. On iOS, when the keyboard slides up:

- `100dvh` does **not** shrink to the visible area above the keyboard — it represents the small/large layout viewport, not the *visual* viewport. ([Smashing Magazine][3], [Medium / Tharunbalaji][8])
- The dialog's flex-end positioning (`justify-content: flex-end`) places the sheet at the bottom of `100dvh`, which is *under the keyboard*, not above it.
- The result on iPhone: the bottom 30–40% of the drawer (including any input the clinician just tapped to summon the keyboard) is occluded by the keyboard. The clinician cannot see what they are typing.

This is a textbook iOS-WebKit `position: fixed; bottom: 0` failure described by [QuirksMode][1], [tkte.ch][2], [Bram.us / VirtualKeyboard][9], and the [WICG visual-viewport][10] spec.

#### Table stakes

| ID | Item | Complexity |
|---|---|---|
| TS-B1 | **Use `window.visualViewport` to drive a CSS custom property** (e.g. `--visual-viewport-height`) updated via `resize` and `scroll` listeners, throttled with `requestAnimationFrame`. Anchor the sheet's max-height to this value: `max-height: calc(var(--visual-viewport-height) - <topReserve>)`. ([tkte.ch][2], [Ryan Davis][11], [saricden][12]) | Med |
| TS-B2 | **Sheet anchors to keyboard top, not viewport bottom.** When the keyboard is visible, the sheet's bottom edge must sit at `visualViewport.height + visualViewport.offsetTop` from the top of the layout viewport — i.e. **just above the keyboard**, not under it. Achieve this by translating the sheet via CSS variable, or anchoring the dialog to the visual viewport using `top: var(--vv-offset-top); height: var(--vv-height)`. ([saricden][12]) | Med |
| TS-B3 | **No keyboard → no transform.** When `visualViewport.height` ≈ `window.innerHeight` (within a tolerance, ~50px to account for browser chrome), treat as "no keyboard" and revert to existing behavior: sheet anchored above bottom nav, `padding-bottom: env(safe-area-inset-bottom)`. | Low |
| TS-B4 | **Keyboard dismiss → smooth re-anchor.** When `visualViewport.resize` fires with restored height (keyboard dismissed by Done, by tapping outside the sheet, by tapping another field that auto-dismisses), the sheet re-anchors to bottom-nav-top. Use CSS `transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1)` matching the existing slide-up animation curve, gated on `prefers-reduced-motion: no-preference`. | Low |
| TS-B5 | **Sheet content scrolls within the available height.** The inner `<div class="overflow-y-auto">` (line 121) already has this — preserve it. As the available height shrinks (keyboard up), the inner div's scrollable region shrinks correspondingly so the focused input stays visible. | Trivial — already done |
| TS-B6 | **`visualViewport.offsetTop` accounted for.** When iOS scrolls the layout viewport to bring the focused input into view, `offsetTop` becomes nonzero. The sheet must follow. (See [Apple Developer Forums #800125][13] — `offsetTop` reporting changed in iOS 26; verify against current iOS behavior on real device.) | Med |
| TS-B7 | **Listeners attached only while drawer is open** (`expanded === true`); detached on close to avoid memory leak / wasted rAF cycles. | Low |

#### Differentiators

| ID | Item | Complexity |
|---|---|---|
| DIFF-B1 | **Sheet height never exceeds `min(80dvh, visualViewport.height - 16px)`.** Even when the keyboard is up and `visualViewport.height` is small (e.g. 280px on landscape iPhone with keyboard), the 16px breathing room prevents the title row from kissing the keyboard top. Matches the Design Principle "Earn trust through restraint." | Low |
| DIFF-B2 | **Eyebrow + first input remain visible at minimum keyboard-up height.** Reserve enough space (~120px) for the drawer header (56px min) + first input (48px touch target) + 16px gap. If `visualViewport.height < 160px` (extreme landscape with split keyboard), the inner scroll area still works — but the header must always be visible. | Med |
| DIFF-B3 | **Reduced-motion path:** when `prefers-reduced-motion: reduce`, snap the sheet to the new position with no transition. Already mirrored elsewhere in the project (e.g. NavShell tablist auto-scroll); apply same gate here. | Trivial |
| DIFF-B4 | **Tabular-numeric input drawer values stay readable.** Per DESIGN.md "Tabular-Numbers" rule, decimal-keyboard inputs use `font-variant-numeric: tabular-nums`. As the sheet repositions, this stays in effect — no special handling needed; just don't accidentally change `font-feature-settings` during the transition. | Trivial |

#### Anti-features

| ID | Item |
|---|---|
| ANTI-B1 | **DO NOT lock body scroll (`document.body.style.overflow = 'hidden'`) to "prevent rubber-banding."** It locks the layout viewport, preventing iOS from auto-scrolling the visual viewport to reveal the focused input — the drawer ends up *worse* off than without the lock. ([HeadlessUI #1900][14], [Ben Frain][15]) The native `<dialog>.showModal()` already prevents background scroll via the top-layer mechanism; let it do its job. |
| ANTI-B2 | **DO NOT use `position: fixed` on `html` or `body`** to lock the viewport. Triggers a documented gap-at-bottom bug under `<dialog>` + `apple-mobile-web-app-status-bar-style: black-translucent` ([HeadlessUI #1900][14]); also breaks the in-place focus restore when the dialog closes. |
| ANTI-B3 | **DO NOT use `window.innerHeight` to size the drawer.** On iOS Safari, `window.innerHeight` includes the keyboard region (it equals the layout viewport, not the visual viewport). Using it produces the *exact* current bug. ([QuirksMode][1]) |
| ANTI-B4 | **DO NOT add `interactive-widget=resizes-content` to the viewport meta** as a substitute for visualViewport listening. It is a Chrome/Android-only hint as of late 2025; iOS Safari ignores it. ([Bram.us / VirtualKeyboard API][9]) |
| ANTI-B5 | **DO NOT rely on the `keyboard-inset-height` CSS env var** as the primary mechanism. It is part of the VirtualKeyboard API which iOS Safari does NOT implement. It can ship as a *progressive enhancement* (zero on iOS, real on Chrome Android) but cannot replace visualViewport. ([Bram.us][9]) |
| ANTI-B6 | **DO NOT throttle the resize listener with `setTimeout` or `debounce`.** The keyboard slide is animated by iOS at 60fps; a debounce delays the sheet, producing visible drift. Use `requestAnimationFrame` only. |
| ANTI-B7 | **DO NOT translate the entire `<dialog>` element.** `<dialog>` in the top layer has special positioning rules; transforming it can fight the backdrop and break the slide-up animation. Translate only the inner `.input-drawer-sheet`. |
| ANTI-B8 | **DO NOT replace `<dialog>` with a `position: fixed` div.** The top-layer is the *only* mechanism on iOS that survives keyboard appearance without z-index gymnastics; existing comment at line 132 already calls this out. Preserve `<dialog>`. |

#### Complexity

**Medium.** New `.svelte.ts` module (`src/lib/shared/visualViewport.svelte.ts` or similar) exposing a reactive `$state` rune for `{ height, offsetTop }`, attached on drawer-open and detached on drawer-close via an `$effect`. CSS variable wiring on the sheet. ~50–70 lines of code + tests. Test against the iOS-26 `offsetTop` gotcha ([Apple Forums #800125][13]) using a mocked `visualViewport` in vitest, and verify on real iPhone (closes v1.13 D-12).

#### Dependencies

- Existing `<dialog>` + `100dvh` foundation — preserve verbatim
- Existing `prefers-reduced-motion` infrastructure
- New: `window.visualViewport` API (Safari 13+, all current iOS — no polyfill needed; feature-detect with `if ('visualViewport' in window)` and noop on absence)
- No new packages

---

### Feature C — Notch / Dynamic Island avoidance on title bar

**Diagnosis of current bug:** The app already declares `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` (line 49 of `app.html`) and `viewport-fit=cover` (line 45). Together these tell iOS: "draw web content edge-to-edge, including under the status bar." But `NavShell.svelte` lines 76–80 only declares:

```
sticky top-0 right-0 left-0 z-10 ... min-h-14 ... bg-[var(--color-surface)] px-4
```

There is no `padding-top: env(safe-area-inset-top)`. In standalone PWA mode on iPhone X+ devices, the result is:
- `bg-[var(--color-surface)]` *does* paint under the status bar (because `viewport-fit=cover`) — good.
- But the hamburger button, "NICU Assist" title text, and theme toggle sit at `top: 0` of the layout viewport — i.e. directly under the camera notch / Dynamic Island. The button's hit area is correctly 48px tall, but its visible icon is hidden beneath the notch.

This matches the documented bug pattern in [shuvcode #264][16] and is the canonical iOS-PWA gotcha called out by [firt.dev / PWAs Power Tips][17] and [Karma / DEV.to][18].

#### Table stakes

| ID | Item | Complexity |
|---|---|---|
| TS-C1 | **Add `padding-top: env(safe-area-inset-top, 0px)` to the `<header>` element in NavShell.** The fallback `0px` keeps non-iOS / non-notch devices unaffected. | Trivial |
| TS-C2 | **Background color extends into the inset.** Because the `<header>` already has `bg-[var(--color-surface)]` and `viewport-fit=cover`, adding the padding makes the surface color fill the notch region as well — a clean opaque title bar with the hamburger/title/icons sitting *below* the notch. This is the canonical "solid background fills the inset, content shifts down" pattern. ([Karma / DEV.to][18]) | Trivial |
| TS-C3 | **`min-h-14` becomes effective height + safe-area** so the *interactive* portion of the title bar remains 56px tall (current value) regardless of inset size. Using `padding-top` (not `margin-top`) means `min-height` applies to content only — correct behavior. | Trivial |
| TS-C4 | **Sticky positioning preserved.** `sticky top-0` continues to work because sticky positioning is calculated from the layout viewport, which already accounts for safe areas under `viewport-fit=cover`. | Trivial — no change |
| TS-C5 | **Hamburger button hit area not eaten by inset.** Because the inset is *padding* on the parent header, not the button, the button keeps its 48×48 minimum touch target below the notch. (Today the button is `min-h-[48px] min-w-[48px]`; under the inset it shifts down by ~44px on iPhone 14 Pro.) | Trivial |
| TS-C6 | **Landscape orientation correctness.** In landscape, `safe-area-inset-top` is small (~0px on most iPhones) but `safe-area-inset-left` and `safe-area-inset-right` become nonzero (~44px each on iPhone 14 Pro) due to the rounded corners and notch on the long edge. The header's existing `px-4` (16px) is insufficient. **Add `padding-left: max(env(safe-area-inset-left, 0px), 1rem)` and same for right.** ([MDN env()][19]) | Low |
| TS-C7 | **Bottom nav — already correct, do not regress.** Lines 148–152 already use `pb-[env(safe-area-inset-bottom,0px)]`. Verify no inadvertent change. | Trivial — verify |

#### Differentiators

| ID | Item | Complexity |
|---|---|---|
| DIFF-C1 | **Status-bar-style stays `black-translucent`.** Do NOT change to `default` or `black`. `black-translucent` is the only option that lets web content fill the entire screen (including under the status bar) — switching modes would *un-fill* the inset and produce a visible color seam between status bar and title bar. ([Otterlord / Medium][20], [Appscope][21]) | Trivial — preserve current |
| DIFF-C2 | **Status bar text remains white in both themes.** This is `black-translucent`'s only quirk: status bar text is *always* white, even on light theme. Because the title bar background is `var(--color-surface)` — which is light-grey-near-white in light theme — the white iOS status-bar glyphs become low-contrast in light mode. **Mitigation:** the inset region (top ~44px on iPhone 14 Pro) is filled by the surface color, which in dark mode is dark and contrasts fine with white glyphs. In light mode, the white glyphs sit over a near-white surface — still legible because iOS adds a subtle dark gradient under them — but verify on real device. ([Otterlord][20]) | Low |
| DIFF-C3 | **Hamburger button remains leftmost-flush** under the inset. Current `-ml-2` on line 85 puts the icon at the visual edge of the safe area, not the screen edge. With `safe-area-inset-left` padding added in landscape (TS-C6), this remains correct because `-ml-2` is relative to the now-padded parent. | Trivial |
| DIFF-C4 | **Eyebrow alignment with safe area.** The "NICU Assist" wordmark currently sits at `text-base font-semibold tracking-tight` aligned-baseline with the icon buttons. Inset padding does not change this — the entire row shifts together. Eyebrow-Above-Numeral rule (from DESIGN.md) is unaffected because eyebrow lives inside individual calculator hero results, not in the title bar. | Trivial |
| DIFF-C5 | **Body content does NOT need a top offset.** Because the header is `sticky top-0` with content below it, and the header itself owns the inset padding, body content automatically starts below the inset. No `padding-top` on `<body>` or `<main>` needed. (Contrast with non-sticky-header apps where `<body>` needs `padding-top: env(safe-area-inset-top)`.) | Trivial — already correct |

#### Anti-features

| ID | Item |
|---|---|
| ANTI-C1 | **DO NOT switch `apple-mobile-web-app-status-bar-style` to `default`.** It causes web content to render *below* the status bar — i.e. iOS reserves the inset region for the system, and the app loses ~44px of vertical space at the top. Inconsistent with the existing `viewport-fit=cover` model and would force a layout rebuild. ([Otterlord][20]) |
| ANTI-C2 | **DO NOT pad `<html>` or `<body>` with `safe-area-inset-top`.** Pads the entire app and double-counts the inset on the sticky header. Pad the header only. ([firt.dev][17], [Karma][18]) |
| ANTI-C3 | **DO NOT use `margin-top` instead of `padding-top` for the inset.** `margin-top` separates the header from the layout viewport top, leaving the inset region transparent — the body content shows through under the notch, often with weird animations during scroll. |
| ANTI-C4 | **DO NOT hardcode notch heights** (e.g. `padding-top: 44px` for iPhone 14 Pro). Different devices have different inset heights (iPhone SE: 0, iPhone 14: 47, iPhone 14 Pro: 59, future devices: ?). Always use `env(safe-area-inset-top)`. ([MDN][19]) |
| ANTI-C5 | **DO NOT use `constant(safe-area-inset-top)`** as a fallback. That was the iOS 11.0–11.2 syntax; replaced by `env()` in iOS 11.2+ (Dec 2017). All currently-deployed iPhones support `env()` natively. |
| ANTI-C6 | **DO NOT remove `viewport-fit=cover` from the viewport meta.** Without it, `env(safe-area-inset-*)` returns `0` on every device — the inset is opt-in, not automatic. Already correct in `app.html` line 45. |
| ANTI-C7 | **DO NOT add a `theme-color` meta tag in PWA manifest** that conflicts with the title bar surface color. Under `black-translucent`, `theme-color` is ignored on iOS, so this is mostly moot — but on Android Chrome, mismatched `theme-color` and header background produces a visible seam. Keep them harmonious if both ship. |

#### Complexity

**Trivial.** Two CSS additions to one element in `NavShell.svelte` — `padding-top: env(safe-area-inset-top, 0px)` and `padding-left/right: max(env(safe-area-inset-*, 0px), 1rem)`. ~3 lines. New Playwright test: emulate `--device="iPhone 14 Pro"` and assert hamburger button is fully visible (geometry above the device's known notch box).

#### Dependencies

- Existing `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` (preserve)
- Existing `viewport-fit=cover` (preserve)
- Existing `sticky top-0` + `bg-[var(--color-surface)]` (preserve)
- No new dependencies

---

## 3. UX Flow Diagrams

### Flow 1 — Normal drawer open (no keyboard)

```
[State: route loaded, hero visible above the fold, InputsRecap strip below]
         |
         | Clinician taps InputsRecap (or presses Enter while focused)
         v
[Drawer state: expanded = true]
         |
         | <dialog>.showModal() -> sheet animates from translateY(100%) to 0
         | (200ms cubic-bezier(0.22, 1, 0.36, 1), gated by prefers-reduced-motion)
         v
[Sheet visible, max-height: 80dvh, anchored to bottom of dialog]
         |
         | Focus moves to the sheet container (tabindex="-1")
         | NO input is focused. NO keyboard appears.
         v
[Clinician reads the fields, decides which to edit]
         |
         | Tap on weight input
         v
[Input focused via user gesture]
         |
         | iOS raises keyboard -- see Flow 2
         v
[See Flow 2]
```

### Flow 2 — Drawer open + keyboard up (the iOS visualViewport flow)

```
[State: drawer expanded, focus just moved to a text input by user tap]
         |
         | iOS slides keyboard up, occupying ~290px (portrait) or ~190px (landscape)
         | window.visualViewport fires `resize` event:
         |   visualViewport.height drops from ~852 to ~562
         |   visualViewport.offsetTop may shift upward as iOS scrolls layout viewport
         v
[visualViewport listener fires, requestAnimationFrame scheduled]
         |
         | rAF callback updates CSS custom property:
         |   --vv-height: 562px
         |   --vv-offset-top: 0px (or N if scrolled)
         v
[Sheet's max-height re-evaluates]
         | max-height: min(80dvh, calc(var(--vv-height) - 16px))
         | = min(682px, 546px)
         | = 546px
         v
[Sheet anchors to keyboard-top, not viewport-bottom]
         | translate: Y(-(innerHeight - vv.height - vv.offsetTop))
         | = -(852 - 562 - 0)
         | = -290px
         v
[Sheet sits visually above the keyboard. Header (56px) + scrollable inputs.
 Focused input is in view inside the scroll region.]
         |
         | Clinician types value, taps "Done" on keyboard / taps another field /
         | scrolls and taps backdrop above sheet
         v
[Three sub-flows:]
   A) Done pressed -> input blurs -> keyboard slides down
       -> visualViewport.height returns to 852
       -> translate returns to 0 (transitioned over 200ms)
       -> sheet re-anchors to bottom-nav-top
   B) Tap another field inside drawer -> keyboard stays up, input changes
       -> visualViewport unchanged -> no sheet movement
   C) Tap backdrop above sheet -> drawer's onclick handler closes drawer
       -> <dialog>.close() -> sheet animates out via slide-down
       -> keyboard auto-dismisses on close (focus leaves input)
```

### Flow 3 — Title bar render under notch (standalone PWA, iPhone 14 Pro portrait)

```
[Layout viewport: 393x852 logical px, viewport-fit=cover]
[Status bar: top 59px region, controlled by iOS, contains Dynamic Island + battery + clock]
[Render flow:]
         |
         | <html> renders edge-to-edge (because viewport-fit=cover)
         | <header> sticky top-0
         | header.padding-top = env(safe-area-inset-top) = 59px
         | header.background = var(--color-surface)
         v
[Visual result:]
   +------------------------------------+ <- y=0
   |  [Dynamic Island shown here]       |
   |  background: var(--color-surface)  | <- inset region (59px), opaque, surface color
   |                                    |
   +------------------------------------+ <- y=59 (end of inset)
   | [hamburger]  NICU Assist   [theme] | <- min-h-14 (56px) interactive row
   |                                    |
   +------------------------------------+ <- y=115 (header bottom)
   |                                    |
   |  Calculator content                |
   |  ...                               |
```

### Flow 4 — Title bar landscape (notch on left)

```
[Layout viewport: 852x393 logical px]
[Notch: left edge, width ~44px]
[Render flow:]
         |
         | header.padding-top = env(safe-area-inset-top) ~= 0px (no notch on top in landscape)
         | header.padding-left = max(env(safe-area-inset-left), 1rem) = max(44px, 16px) = 44px
         | header.padding-right = max(env(safe-area-inset-right), 1rem) = max(44px, 16px) = 44px
         v
[Visual result:]
   +--+------------------------------+--+ <- y=0
   |  | [hamburger] NICU Assist [th] |  |
   |No|                              |  | <- header continues full-width visually,
   |t |                              |  |    interactive content inset 44px each side
   |c |                              |  |
   |h |                              |  |
   +--+------------------------------+--+
   |  | Calculator content           |  |
```

---

## 4. MVP Recommendation

**All three features ship together.** They are interrelated:
- Fix C without A: hamburger reachable, but tapping into the drawer still raises keyboard before user wanted.
- Fix A without B: keyboard never spuriously raises, but the moment user taps a field, the sheet is occluded.
- Fix B without C: drawer perfect on iPhone, but title bar still sits under Dynamic Island.

Order of implementation (lowest risk first):
1. **Feature C** (notch-safe title bar) — trivial CSS, isolated to one file, easy to verify
2. **Feature A** (auto-focus suppression) — small code deletion + test update, isolated to one component
3. **Feature B** (visualViewport anchoring) — new reactive module, larger surface, real-iPhone validation required (closes v1.13 D-12)

Defer: Nothing within scope. Out of scope per milestone guardrails: any change to bottom nav (already safe-area correct), any change to per-calculator inputs, any rebuild of the dialog primitive (e.g. switching to `bits-ui` Sheet).

---

## 5. Sources

### Visual Viewport API + iOS keyboard (HIGH confidence — multiple authoritative sources)
- [QuirksMode — Toolbars, keyboards, and the viewports][1] — definitive explanation of layout vs visual viewport divergence on iOS
- [tkte.ch — Safari 13, Mobile Keyboards, And The VisualViewport API][2] — canonical pattern for translating fixed elements via visualViewport
- [WICG visual-viewport spec issue #79][10] — current spec status & known gaps
- [Bram.us — Prevent content from being hidden underneath the Virtual Keyboard][9] — VirtualKeyboard API vs visualViewport, why iOS still needs visualViewport
- [saricden — How to make fixed elements respect the virtual keyboard on iOS][12] — production pattern with code
- [Ryan Davis — Dealing with the Visual Viewport][11]
- [Smashing Magazine — New CSS Viewport Units Do Not Solve The Classic Scrollbar Problem][3] — why `100dvh` is insufficient for keyboard
- [Medium — Understanding Mobile Viewport Units (dvh, lvh, svh)][8]
- [Apple Developer Forums #800125 — VisualViewport.offsetTop iOS 26][13] — recent iOS 26 behavior shift
- [HeadlessUI #1900][14] — iOS 16+ scroll-locking gotcha under `<dialog>`

### `<dialog>` autofocus + iOS keyboard (HIGH confidence)
- [MDN — `<dialog>` element][22] — spec reference for showModal() autofocus behavior
- [Adrian Roselli — Dialog Focus in Screen Readers][5] — recommended initial-focus targets
- [Manuel Matuzović — O dialog focus, where art thou?][6] — browser implementation differences
- [Tommy Brunn / Medium — (Sort of) Fixing autofocus in iOS Safari][4] — iOS keyboard policy (no programmatic keyboard raise except in user-gesture handler)
- [Ariakit Discussion #985 — Disable autofocus when opened][23]
- [Radix UI Discussion #935 — Prevent focus on dialog][7]

### Safe-area-inset + iOS PWA (HIGH confidence)
- [MDN — env() CSS function][19] — `safe-area-inset-*` reference
- [DEV.to / Karma — Make Your PWAs Look Handsome on iOS][18] — canonical PWA pattern
- [firt.dev — PWAs Power Tips][17]
- [Otterlord / Medium — Custom iOS Status Bar for PWAs][20] — `apple-mobile-web-app-status-bar-style` differences with layout impact
- [Appscope / Medium — Changing The iOS Status Bar Of Your Progressive Web App][21]
- [shuvcode #264 — Menu button hidden behind Dynamic Island][16] — bug pattern matches current NICU Assistant
- [Apple Safari HTML Reference — Supported Meta Tags][24]

### Anti-pattern references
- [HeadlessUI #1900 — scroll-locking causes unexplainable gap][14] — why `position: fixed` on `<html>` is wrong
- [Ben Frain — Preventing body scroll for modals in iOS][15] — why `overflow: hidden` on body breaks iOS keyboard scroll-into-view

[1]: https://www.quirksmode.org/blog/archives/2017/06/toolbars_keyboa.html
[2]: https://tkte.ch/articles/2019/09/23/safari-13-mobile-keyboards-and-the-visualviewport-api.html
[3]: https://www.smashingmagazine.com/2023/12/new-css-viewport-units-not-solve-classic-scrollbar-problem/
[4]: https://medium.com/@brunn/autofocus-in-ios-safari-458215514a5f
[5]: https://adrianroselli.com/2020/10/dialog-focus-in-screen-readers.html
[6]: https://www.matuzo.at/blog/2023/focus-dialog/
[7]: https://github.com/radix-ui/primitives/discussions/935
[8]: https://medium.com/@tharunbalaji110/understanding-mobile-viewport-units-a-complete-guide-to-svh-lvh-and-dvh-0c905d96e21a
[9]: https://www.bram.us/2021/09/13/prevent-items-from-being-hidden-underneath-the-virtual-keyboard-by-means-of-the-virtualkeyboard-api/
[10]: https://github.com/WICG/visual-viewport/issues/79
[11]: https://rdavis.io/articles/dealing-with-the-visual-viewport
[12]: https://saricden.com/how-to-make-fixed-elements-respect-the-virtual-keyboard-on-ios
[13]: https://developer.apple.com/forums/thread/800125
[14]: https://github.com/tailwindlabs/headlessui/issues/1900
[15]: https://benfrain.com/preventing-body-scroll-for-modals-in-ios/
[16]: https://github.com/Latitudes-Dev/shuvcode/issues/264
[17]: https://firt.dev/pwa-design-tips/
[18]: https://dev.to/karmasakshi/make-your-pwas-look-handsome-on-ios-1o08
[19]: https://developer.mozilla.org/en-US/docs/Web/CSS/env
[20]: https://medium.com/@otterlord/custom-ios-status-bar-for-pwas-e62b9c473ae9
[21]: https://medium.com/appscope/changing-the-ios-status-bar-of-your-progressive-web-app-9fc8fbe8e6ab
[22]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
[23]: https://github.com/ariakit/ariakit/discussions/985
[24]: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html

### Confidence by area

| Area | Level | Reason |
|------|-------|--------|
| Auto-focus suppression (Feature A) | HIGH | MDN spec + 4 independent sources confirm `<dialog>` autofocus, current code obviously fights it |
| visualViewport anchoring (Feature B) | HIGH | QuirksMode + WICG spec + 5 production-pattern articles converge on identical implementation |
| Notch safe-area (Feature C) | HIGH | MDN env() reference + 3 PWA-specific guides + matching bug-report in shuvcode #264 |
| iOS 26 visualViewport.offsetTop edge case | MEDIUM | Single Apple Forums thread reports change; verify on real iPhone post-implementation |
| black-translucent status bar text contrast in light mode | MEDIUM | Documented by Otterlord but visual outcome on iPhone 14 Pro+ depends on system gradient — verify on device |
