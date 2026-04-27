---
phase: 49
slug: wave-2-visualviewport-drawer-anchoring
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-27
reviewed_at: 2026-04-27
---

# Phase 49 — UI Design Contract

> Structural plumbing phase. **Zero new design decisions.** The locked v1.13 design contract (`DESIGN.md` / `DESIGN.json` at project root) is preserved verbatim. This phase ships visualViewport-aware drawer sizing for iOS standalone PWA mode — no new components, screens, layouts, colors, typography, motion, copy, or design tokens. This UI-SPEC's job is to (a) lock in that fact by citing the source-of-truth for every visual concern, and (b) record the **behavioral / positional contracts** introduced by the new singleton + CSS-variable wiring.

---

## Scope (what this UI-SPEC actually contracts)

A single new `.svelte.ts` singleton (~40 LOC) plus four edits inside the existing `InputDrawer.svelte` — **no new components, screens, layouts, colors, typography, motion, or copy**:

1. **NEW `src/lib/shared/visualViewport.svelte.ts`** — module-scope `$state` singleton exposing `{ offsetTop, height, keyboardOpen }` runes; idempotent `init()`; `browser`-guarded for SSG safety. Mirrors the established class-based singleton pattern (`theme.svelte.ts` / `favorites.svelte.ts` / `disclaimer.svelte.ts` / `pwa.svelte.ts` / `lastEdited.svelte.ts`).
2. **`+layout.svelte` `onMount`** — one new line: `vv.init();` after the existing `favorites.init();` call (line 55).
3. **`InputDrawer.svelte` `<script>`** — singleton import + `$derived ivvStyle` computation + inline `style={ivvStyle}` binding on the existing `.input-drawer-sheet` `<div>` at lines 91–94.
4. **`InputDrawer.svelte` `<style>`** — two CSS rule changes inside the existing `.input-drawer-sheet` block (lines 155–164):
   - Line 158 `max-height: 80dvh;` → `max-height: calc(var(--ivv-max-height, 80dvh));`
   - Line 161 `padding-bottom: env(safe-area-inset-bottom, 0px);` → `padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px));`

The visible runtime change is purely **behavioral**, gated on `vv.keyboardOpen`:

- **Keyboard down (Android, desktop, iOS without OSK, all chromium e2e):** identical to today. CSS variables are unset → `var(..., 80dvh)` and `var(..., 0px)` fallbacks apply → existing `80dvh` / `safe-area-inset-bottom` contract preserved verbatim.
- **Keyboard up (iOS standalone PWA only — `window.innerHeight − vv.height > 100`):** sheet shrinks to fit `visualViewport.height − 16 px` and `padding-bottom` rises to clear the keyboard top with ≥ 8 px clearance. Eyebrow + first input remain visible.

CI cannot prove the keyboard-up branch visually (Playwright WebKit on Linux does not emulate the iOS soft keyboard). The CI surface is synthetic-dispatch + computed-style assertions; **real-iPhone visual verification is Phase 50's obligation** (SMOKE-04..07).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (custom — see DESIGN.md / DESIGN.json) |
| Preset | not applicable |
| Component library | none (`$lib` shared components inside this app) |
| Icon library | `@lucide/svelte` |
| Font | Plus Jakarta Sans |

**Source of truth:** `/DESIGN.md` (project root) + `/DESIGN.json` (project root) — locked v1.13 contract. Phase 49 does NOT modify either file. Phase 48's `bg-[var(--color-surface)]`, identity hue tokens, OKLCH-Only, Identity-Inside, Amber-as-Semantic, Red-Means-Wrong, Five-Roles-Only, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor, Tonal-Depth, and Flat-Card-Default rules are all preserved unchanged.

---

## Spacing Scale

**No change.** See `DESIGN.json:spacing` and `DESIGN.md §1` (named spacing scale: `hairline 4`, `tight 8`, `snug 12`, `base 16`, `comfy 20`, `loose 24`, `hero 32`, `bottom-nav-clearance 80`). All Phase 49 edits reuse existing tokens.

**Phase 49 spacing usage:**

- **`16 px` keyboard-up clearance reserve** in the `--ivv-max-height` computation (`vv.height − 16`). This is the existing `base` spacing token (1rem = 16 px) — same value already used 30+ times in the project. Reserves vertical room above the keyboard top for the visual "breathing room" between the sheet's bottom edge and the OSK top edge so the eyebrow + first input remain clearly above the keyboard, not flush against it. Per CONTEXT.md D-09 and DRAWER-06.
- **`≥ 8 px` minimum clearance contract** between the sheet's bottom edge and the keyboard top edge (DRAWER-07 + REQUIREMENTS.md). The 16 px reserve above guarantees this floor in portrait at all iPhone keyboard heights.
- **No new spacing tokens** introduced. The `16 px` and `8 px` values are platform-side numerical constants for the CSS-variable computation, not new design tokens — they consume the existing `base` token.

Exceptions: none.

---

## Typography

**No change.** See `DESIGN.json:typography` and `DESIGN.md §3` (locked five-roles-only contract: `display`, `title`, `body`, `ui`, `label`). Phase 49 does not introduce, alter, or replace any typography role. The drawer's existing close button label, eyebrow, and input labels are all unchanged.

| Role | Source |
|------|--------|
| Display / Title / Body / UI / Label | Locked — see DESIGN.json:typography |

---

## Color

**No change.** See `DESIGN.json:colors` and `DESIGN.md §2` (locked OKLCH palette + Identity-Inside Rule + Amber-as-Semantic Rule + Red-Means-Wrong Rule + clinical-safety STOP-red carve-out for severe-neuro GIR). Phase 49 does not introduce, alter, or replace any color token.

**`<dialog>::backdrop` scrim preserved.** Existing `background: var(--color-scrim)` (line 166) is unchanged. The visualViewport-aware sheet sits in front of the scrim; the scrim itself fills the entire layout viewport (no scrim-sizing change).

**Identity hue ring on close button preserved.** Existing `focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]` (InputDrawer line 113) is unchanged. Phase 48's close-button `autofocus` (line 112) means the identity-hue focus ring is the first thing a clinician sees on drawer open — the keyboard-up branch does not alter this.

**16/16 axe sweeps preserved (DRAWER-TEST-04).** No new color tokens, no new ARIA, no new DOM landmarks — just CSS variable consumption on an existing element. Existing 16 axe sweeps (light + dark across all 6 calculators + drawer + dialog states) re-run as a regression-only gate. Per CONTEXT.md D-20.

| Role | Source |
|------|--------|
| Dominant / Secondary / Accent / Identity / Error / Scrim | Locked — see DESIGN.json:colors |

Accent reserved for: unchanged from v1.13 — see `DESIGN.md §2 Identity-Inside Rule`.

---

## Layout (NEW behavioral / positional contract)

The only section of this UI-SPEC with new prescriptive content. Five contracts (LC-01 through LC-05):

### LC-01 — `<dialog>` outer container is NEVER transformed

**File:** `src/lib/shared/components/InputDrawer.svelte` lines 83–89, lines 137–148.

**Existing rules (preserved verbatim):**
- Outer `<dialog class="input-drawer-dialog">` stays at `width: 100vw` / `max-width: 100vw` / `height: 100dvh` / `max-height: 100dvh` (lines 142–147).
- `[open]` state: `display: flex; flex-direction: column; justify-content: flex-end;` (lines 150–154) — the invisible flex container that anchors the sheet at the bottom edge of the layout viewport.
- `<dialog>.showModal()` puts the dialog in the **top layer** by spec — renders above `position: fixed` content including the `NavShell` bottom nav (`NavShell.svelte:148–174`). No bottom-nav translation needed.

**Phase 49 contract:**

- **NO inline `style` binding on the `<dialog>` element.** The `style={ivvStyle}` binding goes ONLY on the inner `.input-drawer-sheet` `<div>` (lines 91–94, currently `bind:this={sheet}`). Per CONTEXT.md D-11 + DRAWER-08 + PITFALLS.md P-15. Reviewers + plan-checker MUST grep for `style` on `<dialog` in the diff and reject if found.
- **No new CSS rule on `.input-drawer-dialog`.** Lines 137–148 are unchanged. The two CSS rule changes both live inside the `.input-drawer-sheet` selector at lines 155–164.
- **`<dialog>` `showModal()` + Esc-to-close + focus-trap + focus-restore semantics preserved verbatim** (DRAWER-12 + CONTEXT.md D-26). No replacement with `position: fixed` or other anti-pattern. The `dialog.showModal()` call in the existing `$effect` (line 47) is unchanged. The `dialog.close()` branch (line 62) is unchanged.
- **Phase 48's close-button `autofocus` preserved verbatim** (CONTEXT.md D-26). The `closeBtn?.focus()` call at line 59 and the `autofocus` attribute at line 112 both remain. Phase 49 makes no focus-management change.
- **SelectPicker dialog-inside-drawer pattern preserved.** When a calculator's `<children>` snippet contains a `<SelectPicker>`, that picker opens its own native `<dialog>` in its own top-layer slot — independent of the outer drawer's CSS variables (PITFALLS.md P-15). Because Phase 49 transforms only the inner sheet (not the outer dialog), the inner picker's positioning is unaffected.

### LC-02 — Inner `.input-drawer-sheet` reads two CSS variables with fallbacks

**File:** `src/lib/shared/components/InputDrawer.svelte` lines 155–164.

**Existing rules (line 155 onward) — modified at exactly two points:**

```css
/* BEFORE (Phase 48 verbatim) */
.input-drawer-sheet {
	width: 100%;
	max-height: 80vh;            /* line 157 — older-browser fallback, unchanged */
	max-height: 80dvh;           /* line 158 — CHANGE */
	overflow: hidden;
	/* Clear the iOS home indicator when overlaying the nav. */
	padding-bottom: env(safe-area-inset-bottom, 0px);  /* line 161 — CHANGE */
	border-top-left-radius: 1rem;
	border-top-right-radius: 1rem;
}

/* AFTER (Phase 49) */
.input-drawer-sheet {
	width: 100%;
	max-height: 80vh;                               /* line 157 — older-browser fallback, unchanged */
	max-height: calc(var(--ivv-max-height, 80dvh));  /* line 158 — Phase 49 */
	overflow: hidden;
	/* Clear the iOS home indicator when overlaying the nav. */
	padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px));  /* line 161 — Phase 49 */
	border-top-left-radius: 1rem;
	border-top-right-radius: 1rem;
}
```

**Rules:**

- **Fallback values are bit-for-bit identical to the current rules.** `var(--ivv-max-height, 80dvh)` falls back to `80dvh`; `var(--ivv-bottom, 0px)` falls back to `0px` (which composes with `env(safe-area-inset-bottom, 0px)` via `max()` to yield exactly `env(safe-area-inset-bottom, 0px)` when the variable is unset). When the singleton has not yet initialized, when `keyboardOpen` is false, when running in jsdom, when prerendered, when the variables are simply absent — behavior is verbatim Phase-48 behavior. Per CONTEXT.md D-09 + D-10 and PITFALLS.md P-22.
- **Older-browser `max-height: 80vh` fallback (line 157) is unchanged.** It still ships first as the cascade-defeated fallback for browsers that do not support `dvh`. Browsers that DO support `dvh` resolve line 158's `calc(var(--ivv-max-height, 80dvh))`.
- **`max()` two-arg composition is non-negotiable** for `padding-bottom`. Per PITFALLS.md P-07 (the "double-offset trap"). With the keyboard down, `var(--ivv-bottom, 0px)` resolves to `0px` and `max(env(safe-area-inset-bottom, 0px), 0px)` = `env(safe-area-inset-bottom, 0px)` — exact preservation of today's home-indicator clearance. With the keyboard up, `var(--ivv-bottom, 0px)` resolves to the keyboard-top offset (always > 0) and `env(safe-area-inset-bottom, 0px)` = `0px` (iOS reports zero safe-area-inset-bottom when the keyboard covers it) so `max(0, ivvBottom)` = `ivvBottom`. Single rule handles both cases without branching.
- **No `transition: max-height` or `transition: padding-bottom`.** Per CONTEXT.md D-27 and DRAWER-10. Adding a transition would re-introduce the very scroll-driven coupling DRAWER-02 / PITFALLS.md P-08 forbids. CSS-variable changes propagate via the browser's normal recomputation pipeline; the sheet snaps to its new size when the keyboard appears (which is itself an iOS-controlled animation we cannot synchronize with).
- **No `transform` on the sheet either.** The visualViewport-aware sizing happens via `max-height` shrink + `padding-bottom` grow — not via `translateY()`. Avoids inheriting transforms into the SelectPicker's nested top-layer dialog (PITFALLS.md P-15).

### LC-03 — `$derived ivvStyle` short-circuits to empty string when keyboard is down

**File:** `src/lib/shared/components/InputDrawer.svelte` `<script>`.

**Required computation (CONTEXT.md D-09):**

```ts
const ivvStyle = $derived(
	vv.keyboardOpen
		? `--ivv-bottom: ${window.innerHeight - vv.offsetTop - vv.height}px; --ivv-max-height: ${vv.height - 16}px;`
		: ''
);
```

**Inline binding:**

```svelte
<div
	bind:this={sheet}
	class="input-drawer-sheet flex flex-col bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
	style={ivvStyle}
>
```

**Rules:**

- **Empty-string short-circuit is non-negotiable** when `keyboardOpen === false`. Per the upstream "Specific Ideas" guidance: returning a fully-computed style string with `--ivv-bottom: 0px` would override the safe-area-inset-bottom fallback in subtle defense-in-depth ways. Empty string lets the CSS `var(..., default)` fallbacks apply cleanly.
- **No `transform` in `ivvStyle`.** The string contains only the two custom-property declarations. Per LC-01, the sheet does not translate.
- **No rAF coalescing in v1.** Per CONTEXT.md "Specific Ideas" + PITFALLS.md P-08. `visualViewport.resize` fires at most a few times per keyboard appearance/dismissal — well below the 60 fps frame budget. rAF coalescing matters for `vv.scroll` (which DRAWER-02 forbids) but not for `vv.resize`.
- **Sheet div is the binding site, not the outer dialog.** Per LC-01 and DRAWER-08. The `style={ivvStyle}` attribute lives on the `<div class="input-drawer-sheet">` (lines 91–94), NOT on the `<dialog class="input-drawer-dialog">` (line 83).

### LC-04 — Hardware-keyboard guard via `keyboardOpen` heuristic

**File:** `src/lib/shared/visualViewport.svelte.ts` (NEW).

**Required heuristic (CONTEXT.md D-07 + DRAWER-09):**

```ts
this.keyboardOpen = window.innerHeight - vv.height > 100;
```

**Rules:**

- **Threshold = 100 px** (DRAWER-09 verbatim). Filters URL-bar collapse (~50–80 px on Safari) and admits only the OSK (~290 px portrait, ~190 px landscape). Hardware Bluetooth keyboards leave `vv.height ≈ window.innerHeight` so `window.innerHeight − vv.height ≈ 0` → `keyboardOpen` stays `false` → no false positive (PITFALLS.md P-05).
- **Threshold tuning is Phase 50's responsibility.** Per CONTEXT.md D-07 + DRAWER-09 + Phase 50 SMOKE-07. If real-iPhone smoke shows the threshold is wrong, it's a 1-line change in `update()`. Do NOT bikeshed before real-device data.
- **No false-positive on URL-bar collapse.** A user scrolling the page with the drawer closed must not flip `keyboardOpen` to `true`. The 100 px threshold is the engineered margin between URL-bar collapse (~50–80 px) and OSK appearance (~290 px portrait).
- **No false-negative on Bluetooth/Smart-Keyboard pairing.** Per PITFALLS.md P-05 — hardware keyboards leave `visualViewport.height` unchanged. Heuristic correctly stays `false`.

### LC-05 — Tablet/desktop preservation (`md:hidden`)

**File:** all 6 calculator routes (`pert/+page.svelte`, `morphine-wean/+page.svelte`, `formula/+page.svelte`, `gir/+page.svelte`, `feeds/+page.svelte`, `uac-uvc/+page.svelte`) where `<InputDrawer>` is rendered with the `md:hidden` wrapper class.

**Rules:**

- **Existing `md:hidden` rule is preserved verbatim** (DRAWER-11). Drawer never appears at tablet/desktop breakpoints. iPad split-keyboard / floating-keyboard cases (PITFALLS.md P-06) are out of scope by architectural design.
- **Phase 49 makes NO per-calculator edit.** Single source of truth in `InputDrawer.svelte` (DRAWER-05). The `--ivv-bottom` / `--ivv-max-height` variables are consumed inside the component; no consumer of `<InputDrawer>` plumbs a prop through.
- **Cross-calculator divergence is structurally impossible.** All 6 calculators inherit the new behavior verbatim. DRAWER-TEST-03 verifies on a single route (Morphine — first in registry) because divergence cannot occur (CONTEXT.md D-19).

---

## Reduced-Motion Contract

**File:** `src/lib/shared/components/InputDrawer.svelte` lines 168–175.

**Existing rule (preserved verbatim):**

```css
@media (prefers-reduced-motion: no-preference) {
	.input-drawer-dialog[open] .input-drawer-sheet {
		animation: slide-up 200ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.input-drawer-dialog[open]::backdrop {
		animation: fade-in 200ms ease;
	}
}
```

**Phase 49 contract (DRAWER-10 + CONTEXT.md D-12 + D-27):**

- **No new transitions, no new animations, no new motion durations.** The existing `@media (prefers-reduced-motion: no-preference)` rule already gates the slide-up + fade-in on user preference. Phase 49 adds nothing to it.
- **CSS-variable changes propagate without animation.** When the keyboard appears/disappears, the sheet's `max-height` and `padding-bottom` snap to their new values (or stay at the fallbacks) via the browser's normal CSS recomputation pipeline. There is no `transition: max-height` or `transition: padding-bottom` declared.
- **`prefers-reduced-motion: reduce` users see the same snap behavior.** Because no Phase-49 transition exists in either branch, the contract is identical for reduced-motion and no-preference: visible CSS-variable change → instant snap to new size. This is the **correct** behavior per DRAWER-10 — the iOS keyboard appearance is itself a system-controlled animation we cannot synchronize with, so introducing our own transition would only fight it (PITFALLS.md P-08, P-21).
- **Slide-up + fade-in animations stay gated on no-preference.** Drawer-open animation contract is unchanged. Reduced-motion users still see the existing instant slide-in (no-preference users see the 200ms slide-up).
- **Source-grep regression sentinel.** The plan-checker MUST verify (via DRAWER-TEST-02 or a sibling source-grep) that the always-on `.input-drawer-sheet` rule (lines 155–164) declares no `transition` property after Phase 49.

---

## Bfcache + visibility-change Contract

**File:** `src/lib/shared/visualViewport.svelte.ts` (NEW).

**Listener registration (CONTEXT.md D-04):**

- `vv.addEventListener('resize', update, { passive: true })` — primary keyboard-appearance/dismissal signal.
- `window.addEventListener('pageshow', onPageshow, { passive: true })` — bfcache restore (with `event.persisted === true` branch).
- `document.addEventListener('visibilitychange', onVisibilityChange, { passive: true })` — foreground-return when bfcache did not fire (`document.visibilityState === 'visible'`).

**Behavioral contract (DRAWER-03 + PITFALLS.md P-04):**

- **On bfcache restore (call yourself, return to app):** `pageshow.persisted === true` branch fires → `update()` synchronously re-reads `vv.offsetTop` / `vv.height` / computes `keyboardOpen` → CSS variables update → drawer renders flush above the bottom nav (or above the keyboard) without requiring a user gesture.
- **On foreground return without bfcache (visibility flip):** `visibilitychange` fires → `update()` re-reads → same recovery path.
- **No caching of prior values.** `update()` always re-reads `vv.offsetTop` / `vv.height` from the live API. Per DRAWER-02 + PITFALLS.md "iOS 26 visualViewport.height post-dismiss regression" (Apple Developer Forums #800125). Caching would re-introduce the very stale-value bug the milestone is fixing.
- **CI cannot verify this branch.** Per CONTEXT.md D-24 + PITFALLS.md P-04. DRAWER-TEST-01 (vitest) covers it via `simulateBfcacheRestore()` mock; SMOKE-06 (Phase 50, real iPhone) is the visual gate.

---

## Listener-Strategy Contract

**File:** `src/lib/shared/visualViewport.svelte.ts` (NEW).

**Phase 49 contract (DRAWER-02 + CONTEXT.md D-04 + PITFALLS.md P-08):**

- **`visualViewport.resize` ONLY.** NEVER `visualViewport.scroll`. Phase 42.1 D-16 explicitly removed scroll-driven transforms; reintroducing them via the visualViewport API will look like dock magnification on review and may cause the same iOS scroll-jank that motivated the original removal.
- **Source-grep regression sentinel** (DRAWER-TEST-01 final assertion + CONTEXT.md D-17 step 6):
  ```ts
  const source = readFileSync('src/lib/shared/visualViewport.svelte.ts', 'utf8');
  expect(source).not.toMatch(/visualViewport\.addEventListener\(['"]scroll/);
  ```
- **`{ passive: true }` on every listener.** Per CONTEXT.md D-04. Avoids scroll-jank coupling. Even though no listener is bound to a scroll-emitting target, passive is defense-in-depth and free.
- **Idempotent `init()`.** `if (this.#initialized) return;` guards against double-registration (CONTEXT.md D-03). Same pattern as `theme.svelte.ts` line 16, `favorites.svelte.ts`.
- **`browser` guard from `$app/environment` aborts before touching `window`** so SvelteKit's adapter-static prerender pass doesn't crash. SSG-safe by construction (CONTEXT.md D-03 + D-15).
- **No teardown / `destroy()` API in v1.** Singleton lives for the document lifetime — same as the four existing singletons. HMR replaces the module wholesale during dev. If a future phase needs lifecycle teardown, add it then (CONTEXT.md D-06).

---

## Copywriting Contract

**No change.** Phase 49 alters no user-facing string.

| Element | Source |
|---------|--------|
| Drawer close button `aria-label` | Existing: `Close {title.toLowerCase()}` (e.g. "Close inputs"). Phase 48's VoiceOver announcement contract preserved. |
| Drawer Clear button `aria-label` | Existing: `Clear {title.toLowerCase()}` (calculators with reset only). |
| Drawer title | Existing: per-calculator `title` prop (e.g. "Inputs"). Unchanged. |
| Hamburger / theme / app name strings | Unchanged from v1.13. |

No empty states added (no new screens). No error states added (no new inputs). No destructive confirmations added (no new destructive actions). No new ARIA labels, no new strings, no new keyboard shortcuts.

---

## Cross-Calculator Consistency Contract

The 6 calculator routes (`/morphine-wean`, `/formula`, `/gir`, `/feeds`, `/uac-uvc`, `/pert`) are **NOT individually edited**. The drawer is a single source of truth in `InputDrawer.svelte` (DRAWER-05); the singleton is a single source of truth in `visualViewport.svelte.ts` (DRAWER-01). DRAWER-05 (single-source-of-truth, no per-calculator divergence) is satisfied by construction.

**Verified by:** DRAWER-TEST-03 Playwright spec at `e2e/drawer-visual-viewport.spec.ts` (CONTEXT.md D-19). Runs on Morphine route (first in registry) under both `chromium` and `webkit-iphone` projects. Single calculator suffices because cross-calculator divergence is structurally impossible — the CSS variables live on a single component instance shared across all calculators.

**Inheritance from Phase 48 preserved:**

- Close-button `autofocus` (Phase 48 D-09) → drawer-open lands focus on close button on every calculator.
- Cross-calculator focus-order Playwright spec (`e2e/drawer-no-autofocus.spec.ts`) → 6 routes × 2 projects = 12 tests still green.
- `queueMicrotask(() => firstInput?.focus())` deletion (Phase 48 D-08) → no auto-focus on any calculator.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | none | not applicable |

Phase 49 introduces no new registry, no new third-party blocks, no new dependencies. The new code is one module-scope `.svelte.ts` singleton (~40 LOC) using only `$app/environment` (SvelteKit built-in) + the spec-baseline `window.visualViewport` API + the spec-baseline `pageshow` / `visibilitychange` events. All four edits to `InputDrawer.svelte` are pure HTML attribute / inline-style / CSS-rule changes against the existing component.

---

## Verification Surfaces (CI vs real-iPhone)

Phase 49 success criteria are deliberately CI-verifiable in the abstract (vitest passes, Playwright `chromium` + `webkit-iphone` both pass, axe sweeps remain 16/16) but the **actual** drawer-above-keyboard behavior CANNOT be visually proved in CI — Playwright WebKit on Linux does NOT emulate the iOS soft keyboard (`visualViewport.resize` events do NOT fire automatically; we synthesize them in DRAWER-TEST-03). PITFALLS.md P-19 + P-20 document this gap explicitly. **Phase 50 SMOKE-04..07 close the visual gap on a real iPhone 14 Pro+** (CONTEXT.md D-24).

| Surface | What it proves |
|---------|----------------|
| Vitest singleton unit test (`src/lib/shared/visualViewport.test.ts` NEW) | Idempotent `init()`; `$state` runes update on synthetic `resize`; bfcache rebind on `pageshow.persisted === true`; hardware-keyboard guard (`innerHeight - vv.height < 100` keeps `keyboardOpen=false`); NO `vv.scroll` listener (source-grep). DRAWER-TEST-01. |
| Vitest component test (`src/lib/shared/components/InputDrawer.test.ts` extended) | After `simulateKeyboardOpen()`, `.input-drawer-sheet` `style` attribute contains `--ivv-bottom:` and `--ivv-max-height:` substrings; after `simulateKeyboardDown()`, style attribute is empty (`ivvStyle === ''`). DRAWER-TEST-02. |
| Vitest source-grep on InputDrawer | Always-on `.input-drawer-sheet` `<style>` rule (lines 155–164) declares no `transition` property after Phase 49 (preserves the reduced-motion contract). CONTEXT.md D-12 verification. |
| Playwright spec (`e2e/drawer-visual-viewport.spec.ts` NEW, both `chromium` + `webkit-iphone`) | Synthetic `Object.defineProperty(window.visualViewport, 'height', { value: 400 })` + `dispatchEvent(new Event('resize'))` → asserts computed `max-height` of `.input-drawer-sheet` is approximately `(400 − 16)px`. DRAWER-TEST-03. |
| Existing 99-passing chromium Playwright suite | No regression from singleton + CSS-variable wiring. Per CONTEXT.md D-25, the chromium e2e suite reports `vv.height === window.innerHeight` (no soft keyboard simulated) so `keyboardOpen` stays `false` → inline style stays empty → keyboard-down code path verbatim. |
| Existing 12-test cross-calculator focus spec from Phase 48 (`e2e/drawer-no-autofocus.spec.ts`) | Phase 48's close-button-focus contract preserved. Per CONTEXT.md D-26. |
| Existing 16/16 axe sweeps (light + dark across 6 calculators) | No contrast or landmark regressions from the visualViewport-aware sheet. **Re-run only — no new sweeps.** Per CONTEXT.md D-20. DRAWER-TEST-04. |
| Phase 50 real-iPhone smoke (`.planning/v1.15.1-IPHONE-SMOKE.md`) | SMOKE-04: tap weight field → keyboard appears AND drawer is anchored above keyboard top with ≥ 8 px clearance. SMOKE-05: dismissing keyboard → drawer drops back smoothly. SMOKE-06: bfcache restore → drawer renders flush. SMOKE-07: hardware-keyboard-paired iPhone → drawer does NOT lift. **Phase 49 ships only the CI-verifiable surface; visual gate is Phase 50.** |

---

## Inheritance Summary

This phase **preserves verbatim**:

- **Phase 48 NOTCH-01..04 + NOTCH-TEST-01:** `NavShell` `<header>` `pt-[env(safe-area-inset-top,0px)]` + `px-[max(env(safe-area-inset-left,0px),1rem)]`. Phase 49 makes no `NavShell` edit.
- **Phase 48 FOCUS-01:** `queueMicrotask(() => firstInput?.focus())` block deleted (already absent post-Phase-48). Phase 49 does NOT reintroduce it.
- **Phase 48 FOCUS-02:** Close-button `autofocus` (line 112) + explicit `closeBtn?.focus()` fallback at line 59 (the comment block at lines 48–58 documents why both exist). Phase 49 does NOT alter focus behavior.
- **Phase 48 FOCUS-03:** Single source of truth in `InputDrawer.svelte`, no per-calculator divergence. Phase 49 inherits this contract — singleton + CSS variables = zero per-calculator change.
- **Phase 47 TEST-01..03:** visualViewport polyfill in `src/test-setup.ts` + mock helpers in `src/lib/test/visual-viewport-mock.ts` + `webkit-iphone` Playwright project. Phase 49 CONSUMES these scaffolds; no test-setup changes needed.
- **v1.13 DESIGN.md / DESIGN.json contract:** Identity-Inside, Amber-as-Semantic, OKLCH-Only, Red-Means-Wrong, Five-Roles-Only, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor, Tonal-Depth, Flat-Card-Default. All ten named rules preserved.
- **v1.13 STOP-red clinical-safety carve-out** on severe-neuro GIR. Unaffected — Phase 49 is structural plumbing, not a color or token change.
- **v1.13 `<HeroResult>` above-the-fold contract.** Unaffected — Phase 49 alters only the drawer, not any hero card.
- **Existing `slide-up` 200 ms cubic-bezier(0.22, 1, 0.36, 1) animation + `fade-in` 200 ms ease ::backdrop animation** (lines 168–175). Both gated on `prefers-reduced-motion: no-preference`. Unchanged.

---

## Plan Boundaries

Per CONTEXT.md D-21..D-23, this phase ships in three sequential plans on a single Phase 49 branch:

| Plan | Scope | Requirements | UI-SPEC sections that apply |
|------|-------|--------------|------------------------------|
| `49-01-PLAN.md` | visualViewport singleton + layout init + singleton unit test | DRAWER-01..04 + DRAWER-09 + DRAWER-TEST-01 | LC-04, Listener-Strategy Contract, Bfcache + visibility-change Contract |
| `49-02-PLAN.md` | InputDrawer wiring (CSS variables + inline style) + component test | DRAWER-05..08 + DRAWER-10..12 + DRAWER-TEST-02 | LC-01, LC-02, LC-03, LC-05, Reduced-Motion Contract |
| `49-03-PLAN.md` | Playwright spec + axe regression gate | DRAWER-TEST-03 + DRAWER-TEST-04 | Verification Surfaces |

The planner may collapse 49-02 + 49-03 into a single plan if that better matches the project's atomic-commit cadence; the UI-SPEC contracts in each section remain independently verifiable. Recommended order is **49-01 → 49-02 → 49-03 sequential** (CONTEXT.md D-23) — they are not parallel-safe (49-02 imports the singleton; 49-03 observes the drawer).

---

## Anti-Features (NOT shipping in Phase 49)

Per CONTEXT.md "Out of scope" + REQUIREMENTS.md "Out of Scope" + PITFALLS.md anti-pattern list:

- **NO `transform: translateY(...)` on the sheet.** Sizing happens via `max-height` shrink + `padding-bottom` grow, not via translate. Avoids inheriting transforms into nested SelectPicker dialog (PITFALLS.md P-15).
- **NO `transform` or `style` on the outer `<dialog>`.** Per LC-01.
- **NO `visualViewport.scroll` listener.** Per LC-Listener-Strategy.
- **NO `body { overflow: hidden }` scroll-lock** — breaks iOS scroll-into-view (REQUIREMENTS.md anti-feature).
- **NO `position: fixed` on `<html>` or `<body>`** — documented gap-at-bottom bug under `<dialog>` + `black-translucent` (REQUIREMENTS.md anti-feature).
- **NO `window.innerHeight`-based sizing** — equals layout viewport, includes keyboard region (this is the bug being fixed).
- **NO `interactive-widget=resizes-content` viewport meta** — Chrome/Android-only, iOS ignores it.
- **NO `keyboard-inset-height` CSS var as primary mechanism** — VirtualKeyboard API not implemented in iOS Safari.
- **NO `inputmode="none"` to suppress keyboard** — breaks paste flows (especially v1.8 GIR EPIC paste).
- **NO bottom-nav translation when drawer is open + keyboard is up.** `<dialog>.showModal()` puts the drawer in top-layer above the bottom nav — translating the nav would be wasted work (CONTEXT.md "Out of scope").
- **NO per-calculator prop plumbing.** Singleton + CSS variable = zero per-calculator change across the six call sites (DRAWER-05).
- **NO new transitions on `max-height` or `padding-bottom`.** Per Reduced-Motion Contract.
- **NO `requestAnimationFrame` coalescing** in v1. YAGNI for resize-only listener (CONTEXT.md "Specific Ideas").
- **NO `width` or `scale` runes** on the singleton in v1. YAGNI; minimum API surface (CONTEXT.md "Claude's Discretion").
- **NO `destroy()` / lifecycle teardown.** No consumer needs it (CONTEXT.md D-06).
- **NO DESIGN.md / DESIGN.json contract changes.** visualViewport sizing is structural, not visual.
- **NO new color tokens, no new ARIA, no new DOM landmarks, no new typography roles, no new spacing tokens.**
- **NO iPad split-keyboard handling.** `md:hidden` preserved (LC-05 + DRAWER-11).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (no copy changes — locked v1.13 strings preserved)
- [ ] Dimension 2 Visuals: PASS (no visual changes — locked DESIGN.md / DESIGN.json contract preserved; sheet sizing/clearance is behavioral, not visual)
- [ ] Dimension 3 Color: PASS (no color changes — locked DESIGN.json:colors preserved; existing `bg-[var(--color-surface-card)]` and `var(--color-scrim)` unchanged)
- [ ] Dimension 4 Typography: PASS (no typography changes — locked DESIGN.json:typography five-roles preserved)
- [ ] Dimension 5 Spacing: PASS (no new tokens — `16 px` reserve and `≥ 8 px` clearance reuse the existing `base` token; CSS-variable values are computed at runtime, not declared as tokens)
- [ ] Dimension 6 Registry Safety: PASS (no registry, no third-party blocks, no new dependencies — only `$app/environment` + spec-baseline `visualViewport`/`pageshow`/`visibilitychange` web platform APIs)

**Approval:** pending
