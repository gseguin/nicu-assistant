# Phase 49: Wave-2 — visualViewport Drawer Anchoring - Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 6 (2 NEW + 4 MODIFIED)
**Analogs found:** 6 / 6 (every file has a strong in-repo analog — no "no analog" fallbacks)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/shared/visualViewport.svelte.ts` (NEW) | store / singleton | event-driven (browser-event → reactive `$state`) | `src/lib/shared/favorites.svelte.ts` (class-shaped fields-with-`$state`); `src/lib/shared/pwa.svelte.ts` (no-persistence singleton) | role-match (no existing singleton subscribes to browser events; favorites is the closest skeleton) |
| `src/lib/shared/visualViewport.test.ts` (NEW) | unit test (singleton) | request-response (synchronous helper → assert state) | `src/lib/shared/favorites.test.ts`; `src/lib/test/visual-viewport-mock.test.ts` | exact (favorites.test.ts = co-located singleton test; visual-viewport-mock.test.ts = consumer of the same Phase 47 helpers) |
| `src/lib/shared/components/InputDrawer.svelte` (MODIFIED) | component | request-response (singleton read → `$derived` → inline `style`) | self (existing file) + the `$derived` pattern in `+layout.svelte` lines 26-40 | exact (4 pinpoint edits inside the existing component) |
| `src/lib/shared/components/InputDrawer.test.ts` (MODIFIED) | component test | request-response (mount → mock dispatch → assert DOM attribute) | self (T-01..T-08 in same file) + `visual-viewport-mock.test.ts` for the dispatch shape | exact (extends the existing T-XX numbered file with T-09 / T-10) |
| `src/routes/+layout.svelte` (MODIFIED) | layout / init site | event-driven (`onMount` → singleton `init()` calls) | self lines 11-14 (imports) + lines 52-71 (`onMount` block) | exact (one new import line + one new `init()` call inside an existing pattern) |
| `e2e/drawer-visual-viewport.spec.ts` (NEW) | playwright e2e | request-response (synthesize `visualViewport.resize` → assert computed style) | `e2e/drawer-no-autofocus.spec.ts` (Phase 48 — drawer-open trigger + addInitScript boilerplate); `e2e/webkit-smoke.spec.ts` (Phase 47 — `page.evaluate(...)` against `window.visualViewport`) | role-match (no existing spec synthesizes a visualViewport resize, but the two analogs cover both halves) |

---

## Pattern Assignments

### `src/lib/shared/visualViewport.svelte.ts` (NEW — store / singleton)

**Analog:** `src/lib/shared/favorites.svelte.ts` (class-shape with module-scope `$state`); cross-reference `src/lib/shared/pwa.svelte.ts` (no-persistence singleton).

**Why this analog:** All five existing `.svelte.ts` files use module-scope `$state`. Of the five, `favorites.svelte.ts` is the only one whose surface area (multiple runes, idempotent `init()`, optional initialization side-effect) closely matches Phase 49's three-rune singleton with `init()` idempotency. `pwa.svelte.ts` is the closest "no-localStorage" example — Phase 49 also persists nothing.

> **Important shape note:** None of the existing five singletons use a JS `class` with `#initialized` private fields. They use the pattern `let _x = $state(...)` at module scope with an exported plain object literal carrying methods/getters. The CONTEXT.md / RESEARCH.md sketch picks a `class VisualViewportStore` shape for Phase 49 (CONTEXT.md D-01..D-02; RESEARCH.md §1 lines 578-582). Both shapes compile under Svelte 5 runes; the planner should preserve the locked CONTEXT.md class shape but the **idiomatic patterns to copy** (idempotent init, browser guard, fallback-on-missing-API) are still the favorites/disclaimer pattern.

**Imports / file-header pattern** (`favorites.svelte.ts` lines 1-7; `theme.svelte.ts` lines 1-4):
```ts
// src/lib/shared/favorites.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// Source pattern: theme.svelte.ts, disclaimer.svelte.ts (module-scope $state + get accessor + init())
```
Phase 49 file-header shape MUST match this 2-3 line preamble: filename, "Svelte 5 rune syntax — .svelte.ts extension required for $state to compile", "Source pattern: favorites.svelte.ts" (or similar).

**Browser guard import** (`favorites.svelte.ts` does NOT import `browser` because it gates via `init()` being called from `onMount`; `theme.svelte.ts` likewise; `disclaimer.svelte.ts` likewise. The `pwa.svelte.ts` likewise has no `browser` import). However, RESEARCH.md §1 line 576 and CONTEXT.md D-03 explicitly require:
```ts
import { browser } from '$app/environment';
```
This is a Phase 49 deviation from the in-repo singletons because Phase 49 binds **module-level event listeners on `window` and `document`** — defense-in-depth `browser` guard is required (CONTEXT.md D-03 + Pitfall 7 in RESEARCH.md). Planner should treat this import as **mandatory for Phase 49**, not derived from analog.

**Idempotent `init()` pattern** (`favorites.svelte.ts` lines 111-124):
```ts
	/** Called in +layout.svelte onMount — DOM is available here */
	init(): void {
		let raw: string | null = null;
		try {
			raw = localStorage.getItem(STORAGE_KEY);
		} catch {
			raw = null;
		}
		const recovered = recover(raw);
		_ids = recovered;
		_initialized = true;
		// D-09: first-run seeding — if nothing stored, write defaults immediately
		if (raw === null) persist(recovered);
	}
```
Note: `favorites.svelte.ts` does NOT short-circuit on already-initialized — it re-reads on every call. Phase 49 MUST short-circuit per CONTEXT.md D-03 (`if (!browser || this.#initialized) return;`) because re-binding `addEventListener` would leak listeners.

The closest pure-idempotency pattern is `disclaimer.svelte.ts` lines 16-29:
```ts
	init(): void {
		const v2 = localStorage.getItem(DISCLAIMER_KEY_V2);
		const v1 = localStorage.getItem(DISCLAIMER_KEY_V1);
		_acknowledged = v2 === 'true' || v1 === 'true';
		// ...
		_initialized = true;
	}
```
Same shape — last line writes the `_initialized` flag. Phase 49 inverts this slightly (early-return if already true) because of the listener-binding side effect, per RESEARCH.md §1 lines 587-588.

**`$state` rune declaration pattern** (`favorites.svelte.ts` lines 72-73):
```ts
let _ids = $state<CalculatorId[]>(defaultIds());
let _initialized = $state(false);
```
And `disclaimer.svelte.ts` lines 6-7:
```ts
let _acknowledged = $state(false);
let _initialized = $state(false);
```
Phase 49 uses the **class-field** variant per CONTEXT.md D-02 (instance-field `$state(0)`):
```ts
class VisualViewportStore {
  offsetTop = $state(0);
  height = $state(0);
  keyboardOpen = $state(false);
  #initialized = false;
}
```
This is supported by Svelte 5 (the `.svelte.ts` extension makes the rune compile inside class fields too). The planner should not refactor to module-level `let _x = $state(...)` — CONTEXT.md D-01 locks the class shape.

**Singleton export pattern**:
- `favorites.svelte.ts` line 75: `export const favorites = { ... };`
- `theme.svelte.ts` line 6: `export const theme = { ... };`
- `disclaimer.svelte.ts` line 9: `export const disclaimer = { ... };`
- `pwa.svelte.ts` line 9: `export const pwa = { ... };`

Phase 49 (CONTEXT.md D-01): `export const vv = new VisualViewportStore();` — class-instance instead of object literal, but the **convention** (single lower-camelCase `export const` named after the domain noun) is preserved.

**Defense-in-depth localStorage `try`/`catch` pattern** is NOT applicable to Phase 49 (no localStorage). The applicable defense pattern is `if (!vv) return;` after `const vv = window.visualViewport;` per RESEARCH.md §1 lines 590-591 — this is the older-iOS / no-visualViewport graceful-fall-through (RESEARCH.md Pitfall 6 + CONTEXT.md D-03).

---

### `src/lib/shared/visualViewport.test.ts` (NEW — singleton unit test)

**Analog:** `src/lib/shared/favorites.test.ts` (co-located singleton test, T-XX numbering, vi.resetModules pattern); `src/lib/test/visual-viewport-mock.test.ts` (consumer of the Phase 47 mock helpers — the dispatch shape Phase 49 inherits).

**Imports pattern** (`favorites.test.ts` lines 1-9):
```ts
// src/lib/shared/favorites.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FAVORITES_MAX } from './favorites.svelte.js';
```
And the helper-import shape from `visual-viewport-mock.test.ts` lines 1-11:
```ts
// src/lib/test/visual-viewport-mock.test.ts
// Phase 47 / TEST-02: assert all 5 helpers in visual-viewport-mock.ts behave
// per D-08..D-10 against the live polyfill installed by src/test-setup.ts.
import { describe, it, expect, beforeEach } from 'vitest';
import {
	dispatchVisualViewportResize,
	simulateKeyboardOpen,
	simulateKeyboardDown,
	simulateBfcacheRestore,
	_resetVisualViewportMock
} from './visual-viewport-mock';
```
Phase 49 combines both: import `vv` from the sibling `./visualViewport.svelte.js` AND the five helpers from `$lib/test/visual-viewport-mock.js` per CONTEXT.md D-16.

**Module-reset pattern for fresh `$state`** (`favorites.test.ts` lines 11-26):
```ts
describe('favorites store', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.resetModules(); // fresh module state per test
	});

	// Round-trip happy path
	it('T-01 first-run: init() with empty storage seeds defaults and persists them', async () => {
		// Dynamic import to get fresh module state per test via the Svelte compiler
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		// ...
	});
```
Phase 49 MUST use this `vi.resetModules()` + dynamic-import pattern per test (NOT a top-level static import) so each `it` block gets a fresh `vv` instance with `#initialized === false`. Otherwise `init()` early-returns on the second test.

Combine with `_resetVisualViewportMock()` from the Phase 47 helper (`visual-viewport-mock.test.ts` lines 13-17):
```ts
describe('visual-viewport-mock helpers', () => {
	beforeEach(() => {
		// Restore D-05 baseline so each test starts from a known state.
		_resetVisualViewportMock();
	});
```
Phase 49's `beforeEach` should call BOTH `vi.resetModules()` AND `_resetVisualViewportMock()` to isolate listener bindings AND polyfill state.

**T-XX numbering convention** (`favorites.test.ts`): tests are labeled `T-01` through `T-20` with one `describe` block per concern. `InputDrawer.test.ts` uses `T-01` through `T-08` (Phase 48 last filled T-07/T-08). Phase 49's six DRAWER-TEST-01 cases (CONTEXT.md D-17 lists them) should be numbered T-01..T-06 inside the new file (NEW file = restart from T-01).

**Source-grep regression-sentinel pattern** (`InputDrawer.test.ts` lines 87-94 — T-06 reduced-motion gate, lines 116-122 — T-08 FOCUS-TEST-02):
```ts
const src = readFileSync(
	resolve(__dirname, 'InputDrawer.svelte'),
	'utf8'
);
expect(src).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
expect(src).toMatch(/@keyframes slide-up/);
```
And the `.not.toContain` shape:
```ts
const src = readFileSync(resolve(__dirname, 'InputDrawer.svelte'), 'utf8');
expect(src).not.toContain('queueMicrotask');
expect(src).not.toContain('[role="slider"]');
```
Phase 49 DRAWER-TEST-01 case 6 (CONTEXT.md D-17 step 6) follows the **negative** form for the no-scroll-listener sentinel:
```ts
const source = readFileSync('src/lib/shared/visualViewport.svelte.ts', 'utf8');
expect(source).not.toMatch(/visualViewport\.addEventListener\(['"]scroll/);
```
Use `readFileSync` + `resolve(__dirname, ...)` per the established pattern in `InputDrawer.test.ts` lines 88-91 — the absolute-path string in CONTEXT.md D-17 should be replaced with `resolve(__dirname, 'visualViewport.svelte.ts')` for portability.

**Helper-shape assertion pattern** (`visual-viewport-mock.test.ts` lines 19-40 — T-01):
```ts
it('T-01 dispatchVisualViewportResize mutates height + offsetTop and fires "resize"', () => {
	const vv = window.visualViewport!;
	let count = 0;
	let lastHeight = -1;
	let lastOffsetTop = -1;
	const handler = () => {
		count++;
		lastHeight = vv.height;
		lastOffsetTop = vv.offsetTop;
	};
	vv.addEventListener('resize', handler);
	try {
		dispatchVisualViewportResize(400, 200);
		expect(vv.height).toBe(400);
		expect(vv.offsetTop).toBe(200);
		expect(count).toBe(1);
		// ...
	} finally {
		vv.removeEventListener('resize', handler);
	}
});
```
Phase 49 inherits the `dispatchVisualViewportResize(...)` / `simulateKeyboardOpen()` / `simulateKeyboardDown()` / `simulateBfcacheRestore()` helpers verbatim. The assertion shape is not "did the helper fire?" (Phase 47 already proved that) but "did the singleton's `$state` runes update?" — see CONTEXT.md D-17 for the six numbered cases.

---

### `src/lib/shared/components/InputDrawer.svelte` (MODIFIED — component)

**Analog:** Self (existing file). The four edits are pinpoint inside an already-good component.

**Existing import shape** (`InputDrawer.svelte` lines 17-19):
```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronDown } from '@lucide/svelte';
```
Phase 49 adds (per CONTEXT.md D-08, RESEARCH.md §2):
```ts
import { vv } from '$lib/shared/visualViewport.svelte.js';
```
Insert immediately after the `@lucide/svelte` import. Use the `.svelte.js` runtime extension (matches `+layout.svelte` lines 11-14 convention: `'$lib/shared/theme.svelte.js'`, `'$lib/shared/disclaimer.svelte.js'`, `'$lib/shared/favorites.svelte.js'`, `'$lib/shared/pwa.svelte.js'`).

**`$derived` pattern from `+layout.svelte` lines 26-40** (closest in-repo `$derived` analog — ternary + cross-singleton read):
```svelte
	const activeCalculatorId = $derived<CalculatorId>(
		(CALCULATOR_REGISTRY.find((c) => page.url.pathname.startsWith(c.href))?.id as CalculatorId) ?? 'morphine-wean'
	);

	// Idle = all inputs in both calculators still at defaults (D-02)
	const isIdle = $derived(
		morphineState.current.weightKg === 3.1 &&
			morphineState.current.maxDoseMgKgDose === 0.04 &&
			// ...
	);
```
Phase 49 `$derived` (CONTEXT.md D-09 + RESEARCH.md §2 verbatim):
```ts
const ivvStyle = $derived(
	vv.keyboardOpen
		? `--ivv-bottom: ${window.innerHeight - vv.offsetTop - vv.height}px; --ivv-max-height: ${vv.height - 16}px;`
		: ''
);
```
Place this `$derived` declaration alongside the existing `let dialog = $state(...)` / `let closeBtn = $state(...)` / `let sheet = $state(...)` declarations (lines 41-66) — between `let sheet = ...` (line 66) and `function handleDialogClick(e: MouseEvent) {` (line 68) is the natural insertion point.

**Existing inline binding site** (`InputDrawer.svelte` lines 91-94, the **REQUIRED** binding site per DRAWER-08 + LC-01):
```svelte
{#if expanded}
	<div
		bind:this={sheet}
		class="input-drawer-sheet flex flex-col bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
	>
```
Add `style={ivvStyle}` as a NEW attribute on this `<div>` (after `class=`):
```svelte
{#if expanded}
	<div
		bind:this={sheet}
		class="input-drawer-sheet flex flex-col bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-2xl"
		style={ivvStyle}
	>
```
**HARD RULE (DRAWER-08 + UI-SPEC.md LC-01 + RESEARCH.md Pitfall 1):** the `style={ivvStyle}` attribute MUST go on this `<div>`, NEVER on the outer `<dialog bind:this={dialog} class="input-drawer-dialog" ...>` at lines 83-89. Source-grep regression sentinel:
```ts
expect(src).not.toMatch(/<dialog[^>]*\sstyle=/);
```
Recommended addition to DRAWER-TEST-02 or a sibling source-grep test.

**Existing `<style>` block — two pinpoint edits** (`InputDrawer.svelte` lines 155-164):
```css
	.input-drawer-sheet {
		width: 100%;
		max-height: 80vh;        /* line 157 — older-browser fallback, KEEP unchanged */
		max-height: 80dvh;       /* line 158 — CHANGE per DRAWER-06 / D-10 */
		overflow: hidden;
		/* Clear the iOS home indicator when overlaying the nav. */
		padding-bottom: env(safe-area-inset-bottom, 0px);  /* line 161 — CHANGE per DRAWER-07 / D-10 */
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
	}
```
After Phase 49 (verbatim from CONTEXT.md D-10 / UI-SPEC.md LC-02):
```css
	.input-drawer-sheet {
		width: 100%;
		max-height: 80vh;                                    /* line 157 — UNCHANGED, older-browser cascade fallback */
		max-height: calc(var(--ivv-max-height, 80dvh));      /* line 158 — Phase 49 */
		overflow: hidden;
		/* Clear the iOS home indicator when overlaying the nav. */
		padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--ivv-bottom, 0px));  /* line 161 — Phase 49 */
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
	}
```
**HARD RULES:**
- Line 157 (`max-height: 80vh;`) is the cascade-defeated older-browser fallback. Do NOT touch. Browsers that support `dvh` resolve line 158; browsers that don't fall back to line 157.
- Fallback values inside `var(...)` are bit-for-bit identical to the current rules (`80dvh`, `0px`) so keyboard-down behavior is verbatim today's. Per UI-SPEC.md LC-02 + RESEARCH.md Pitfall 8.
- Do NOT add `transition: max-height` or `transition: padding-bottom` (UI-SPEC.md Reduced-Motion Contract + RESEARCH.md Anti-Patterns). The reduced-motion contract (lines 168-175) already gates the slide-up animation; CSS-variable changes propagate via normal recomputation.
- Do NOT add `transform` to `.input-drawer-sheet` (RESEARCH.md Pitfall 1 + UI-SPEC.md LC-02). Sizing happens via `max-height` shrink + `padding-bottom` grow, not via translate.

**Untouched surfaces** (DRAWER-12 + CONTEXT.md D-26 — preserve verbatim):
- Lines 41-64 (the `$effect` + `dialog.showModal()` + `closeBtn?.focus()` + `dialog.close()` flow).
- Line 112 (the `autofocus` attribute on the close button — Phase 48 D-09).
- Lines 137-148 (the `.input-drawer-dialog` rules — DRAWER-08 forbids any change here).
- Lines 165-167 (the `::backdrop` rule).
- Lines 168-191 (the `prefers-reduced-motion` gate + keyframes).

---

### `src/lib/shared/components/InputDrawer.test.ts` (MODIFIED — component test)

**Analog:** Self (existing T-01..T-08 cases — Phase 48 left T-08 occupied; Phase 49 adds T-09 and T-10 per CONTEXT.md D-18).

**Existing imports** (`InputDrawer.test.ts` lines 1-12):
```ts
// src/lib/shared/components/InputDrawer.test.ts
// Co-located component test per project memory (feedback_test_colocation.md).
// Covers Plan 42.1-05 D-08 InputDrawer: collapsed handle, expanded sheet, close,
// reduced-motion gate (style block presence), bind:value.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import InputDrawer from './InputDrawer.svelte';
import InputDrawerHarness from './InputDrawerHarness.svelte';
```
Phase 49 adds (the helper imports):
```ts
import {
	simulateKeyboardOpen,
	simulateKeyboardDown,
	_resetVisualViewportMock
} from '$lib/test/visual-viewport-mock.js';
```
Insert after the `InputDrawerHarness` import.

**Existing `beforeEach` matchMedia stub** (`InputDrawer.test.ts` lines 14-31):
```ts
beforeEach(() => {
	// Some test environments warn on missing matchMedia; provide a stub.
	if (!('matchMedia' in window)) {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: (query: string) => ({
				// ...
			})
		});
	}
});
```
Phase 49 should add a `_resetVisualViewportMock()` call inside this same `beforeEach` block (per the `visual-viewport-mock.test.ts` pattern lines 14-17) so T-09/T-10 start from a known polyfill baseline.

**T-XX numbering** — Phase 48 occupies T-07 (lines 96-114) + T-08 (lines 116-122). Phase 49 adds:
- **T-09 keyboard-open** — mount drawer with `initialExpanded: true`, await `tick()`, call `simulateKeyboardOpen()`, await `tick()`, query `.input-drawer-sheet`, assert its `style` attribute contains both `--ivv-bottom:` and `--ivv-max-height:` substrings.
- **T-10 keyboard-down** — same setup + `simulateKeyboardOpen()` first to put it into keyboard-up state, then `simulateKeyboardDown()`, await `tick()`, assert the `style` attribute is empty (`expect(sheet.getAttribute('style')).toBe('')` or `.toBe(null)`).

**Test-mount pattern** (`InputDrawer.test.ts` lines 49-57 — T-03):
```ts
it('T-03 expanded renders dialog with title in header and children inside', async () => {
	render(InputDrawerHarness, { props: { initialExpanded: true } });
	await tick();
	// Children inside the dialog are now mounted.
	expect(screen.getByTestId('drawer-input')).toBeTruthy();
	// ...
});
```
Phase 49 T-09 / T-10 follow this exact mount + `await tick()` pattern. Use `container.querySelector('.input-drawer-sheet')` to access the sheet (T-05 line 75 demonstrates `container.querySelector('dialog')` pattern).

**Style-attribute assertion shape** — `@testing-library/jest-dom` provides `toHaveAttribute('style', '...')`. Use `el.getAttribute('style')` for substring matching:
```ts
const sheet = container.querySelector('.input-drawer-sheet') as HTMLDivElement;
expect(sheet.getAttribute('style')).toMatch(/--ivv-bottom:/);
expect(sheet.getAttribute('style')).toMatch(/--ivv-max-height:/);
```
Mirrors the source-grep `toMatch` pattern used in T-06 (line 92).

---

### `src/routes/+layout.svelte` (MODIFIED — layout / init site)

**Analog:** Self (existing imports at lines 11-14, existing `onMount` block at lines 52-71).

**Existing import-block pattern** (lines 11-14):
```svelte
	import { theme } from '$lib/shared/theme.svelte.js';
	import { disclaimer } from '$lib/shared/disclaimer.svelte.js';
	import { favorites } from '$lib/shared/favorites.svelte.js';
	import { pwa } from '$lib/shared/pwa.svelte.js';
```
Phase 49 adds one new import line (per CONTEXT.md D-13). Recommended placement — immediately after `pwa` import (line 14):
```svelte
	import { pwa } from '$lib/shared/pwa.svelte.js';
	import { vv } from '$lib/shared/visualViewport.svelte.js';
```
The `.svelte.js` extension matches the four existing imports verbatim.

**Existing `onMount` `init()` cluster** (lines 52-71):
```svelte
	onMount(() => {
		theme.init();
		disclaimer.init();
		favorites.init();

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
Phase 49 adds one new `init()` call (CONTEXT.md D-13 — note: D-13 also corrects the CONTEXT.md misreading by clarifying that `pwa.init()` does NOT exist on the singleton; the pwa singleton has `setUpdateAvailable()` / `applyUpdate()` / `dismiss()` only — see `pwa.svelte.ts` lines 9-31). Insertion point: line 56, after `favorites.init();`:
```svelte
	onMount(() => {
		theme.init();
		disclaimer.init();
		favorites.init();
		vv.init();

		// SW registration — dynamic import avoids SSG/SSR issues with virtual modules
		if (pwaInfo) {
			// ... unchanged
		}
	});
```
Sequential ordering doesn't matter (the four singletons are independent). Matching the import order keeps the block readable.

**Untouched surfaces:**
- Lines 1-10 (other imports — `onMount`, `page`, `app.css`, `NavShell`, `UpdateBanner`, `DisclaimerBanner`, `AboutSheet`, `CALCULATOR_REGISTRY`, `CalculatorId`).
- Lines 19-50 (`children` prop, `aboutOpen`, `activeCalculatorId`, `isIdle`, `$effect`, `webManifest`).
- Lines 58-70 (the `pwaInfo` SW registration block).
- Lines 74-92 (template — `<svelte:head>` + body).
- No `+layout.ts` / `+layout.server.ts` change (CONTEXT.md D-15).

---

### `e2e/drawer-visual-viewport.spec.ts` (NEW — playwright e2e)

**Analog:** `e2e/drawer-no-autofocus.spec.ts` (Phase 48 — drawer-open trigger + `addInitScript` boilerplate); `e2e/webkit-smoke.spec.ts` (Phase 47 — `page.evaluate(...)` against `window.visualViewport`).

**Why both analogs:** `drawer-no-autofocus.spec.ts` covers the "open the calculator and click the InputsRecap trigger" half (drawer-state setup); `webkit-smoke.spec.ts` covers the "drive `window.visualViewport` from `page.evaluate(...)`" half (synthetic dispatch). Phase 49 combines both halves.

**File-header pattern** (`drawer-no-autofocus.spec.ts` lines 1-12 — preferred over `webkit-smoke.spec.ts` because it's more recent and Phase 49-shaped):
```ts
// e2e/drawer-no-autofocus.spec.ts
// Phase 48 / FOCUS-TEST-03: opening the drawer on each calculator route lands
// focus on the close button (NOT a textbox/select/textarea/slider). Runs under
// both `chromium` and `webkit-iphone` projects (Phase 47 D-15 — both projects
// run all e2e specs by default). 6 routes x 2 projects = 12 cases.
//
// Pattern source: e2e/mobile-nav-clearance.spec.ts (route-loop + addInitScript) +
// e2e/feeds.spec.ts:35 (drawer-open trigger).
//
// IMPORTANT: ROUTES lists ALL SIX calculators (mobile-nav-clearance.spec.ts omits
// /pert; we must NOT inherit that omission, FOCUS-03 requires all six covered).
import { test, expect } from '@playwright/test';
```
Phase 49 file-header MUST mirror this preamble shape, but include the **CI-proxy disclaimer** per CONTEXT.md "Specific Ideas" + UI-SPEC.md "Verification Surfaces":
```ts
// e2e/drawer-visual-viewport.spec.ts
// Phase 49 / DRAWER-TEST-03: synthetic-dispatch CI proxy. Real-iPhone visual
// verification is Phase 50 SMOKE-04..07. Playwright WebKit on Linux does NOT
// emulate the iOS soft keyboard (visualViewport.resize does not fire
// automatically; we synthesize it here). Documented in PITFALLS.md P-19 + P-20.
//
// Runs under both `chromium` and `webkit-iphone` projects (Phase 47 D-15 default).
// Single calculator (Morphine — first in registry) suffices because DRAWER-05
// single-source-of-truth makes cross-calculator divergence structurally impossible.
//
// Pattern source: e2e/drawer-no-autofocus.spec.ts (drawer-open trigger +
// addInitScript boilerplate) + e2e/webkit-smoke.spec.ts (page.evaluate against
// window.visualViewport).
import { test, expect } from '@playwright/test';
```

**`addInitScript` + `page.goto` + drawer-open pattern** (`drawer-no-autofocus.spec.ts` lines 30-37):
```ts
test(`drawer open on ${path}: focus is on close button (not an input)`, async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem('nicu_assistant_disclaimer_v2', 'true');
		localStorage.removeItem('nicu:favorites');
	});
	await page.goto(path);
	await page.getByRole('button', { name: /tap to edit inputs/i }).click();
	const close = page.getByRole('button', { name: /Close /i });
	await expect(close).toBeFocused();
	// ...
});
```
Phase 49 spec inherits this shape verbatim for the setup phase (single route `/morphine-wean`, same `addInitScript`, same `getByRole(... /tap to edit inputs/i ...)`).

**Synthetic visualViewport dispatch pattern** (`webkit-smoke.spec.ts` lines 11-17 — minimal `page.evaluate` against `window.visualViewport`):
```ts
test('visualViewport is defined', async ({ page }) => {
  await page.goto('/');
  const hasVV = await page.evaluate(() => {
    return typeof window.visualViewport === 'object' && window.visualViewport !== null;
  });
  expect(hasVV).toBe(true);
});
```
Phase 49 synthetic-dispatch (verbatim from RESEARCH.md §4 + CONTEXT.md D-19):
```ts
await page.evaluate(() => {
	Object.defineProperty(window.visualViewport!, 'height', { value: 400, configurable: true });
	Object.defineProperty(window.visualViewport!, 'offsetTop', { value: 0, configurable: true });
	window.visualViewport!.dispatchEvent(new Event('resize'));
});
```
Then computed-style assertion (RESEARCH.md §4):
```ts
const maxHeight = await page
	.locator('.input-drawer-sheet')
	.evaluate((el) => getComputedStyle(el).maxHeight);
// (400 - 16) = 384px target; allow ±2px for browser rounding
expect(parseFloat(maxHeight)).toBeGreaterThan(380);
expect(parseFloat(maxHeight)).toBeLessThan(390);
```

**Viewport setup** (`drawer-no-autofocus.spec.ts` line 28):
```ts
// iPhone-SE viewport — narrow enough to put the route below the md: breakpoint
// so InputsRecap renders and the drawer is the active inputs surface.
test.use({ viewport: { width: 375, height: 667 } });
```
Phase 49 should declare the same `test.use({ viewport: ... })` per the same rationale (drawer is mobile-only via the `md:hidden` rule on the trigger). Use 375x667 (iPhone-SE) for parity with `drawer-no-autofocus.spec.ts` and `mobile-nav-clearance.spec.ts:23`.

**Single-calculator + single-test shape** (DRAWER-05 single-source-of-truth — CONTEXT.md D-19): NO `for (const path of ROUTES)` loop. One test on `/morphine-wean` is sufficient because the singleton + CSS-variable wiring lives in the shared `<InputDrawer>` and divergence across calculator routes is structurally impossible.

---

## Shared Patterns

### Authentication / Authorization
**Not applicable.** PWA app, no per-route auth. Drawer is a UI surface that doesn't gate on identity.

### Error Handling
**Source:** `favorites.svelte.ts` lines 38-43 (recovery from JSON.parse) + lines 113-118 (try/catch around localStorage); `pwa.svelte.ts` (no error handling — singleton with no I/O).

**Apply to:** `visualViewport.svelte.ts` — but note the error surface is different:
- No `localStorage` I/O → no try/catch needed.
- The only "error" is `window.visualViewport === undefined` on older iOS — handled via `if (!vv) return;` early-return per RESEARCH.md §1 line 591 + Pitfall 6.
- All `addEventListener` calls are `{ passive: true }` per CONTEXT.md D-04 (defense-in-depth, not error handling).

### Validation
**Not applicable.** Phase 49 introduces no new user-input surface. Existing drawer inputs unchanged.

### Reactivity (`$state` + `$derived`)
**Source:**
- Module-level `$state`: `favorites.svelte.ts` lines 72-73, `disclaimer.svelte.ts` lines 6-7, `theme.svelte.ts` line 4, `pwa.svelte.ts` lines 6-7.
- `$derived` ternary: `+layout.svelte` lines 26-40.
- `$derived` template-literal: NEW — no existing `$derived` returns a CSS-string-typed value. Phase 49 introduces this idiom (verbatim from CONTEXT.md D-09 / UI-SPEC.md LC-03).

**Apply to:** `visualViewport.svelte.ts` (`$state`) + `InputDrawer.svelte` (`$derived ivvStyle`).

### Test Setup / Module Reset
**Source:** `favorites.test.ts` lines 11-15 (`beforeEach { localStorage.clear(); vi.resetModules(); }` + dynamic import).

**Apply to:** `visualViewport.test.ts` — combine with `_resetVisualViewportMock()` from `visual-viewport-mock.test.ts` lines 14-17. Pattern:
```ts
beforeEach(() => {
	vi.resetModules();
	_resetVisualViewportMock();
});

it('T-XX ...', async () => {
	const { vv } = await import('./visualViewport.svelte.js');
	vv.init();
	// ...
});
```

### Source-Grep Regression Sentinels
**Source:** `InputDrawer.test.ts` T-06 (lines 87-94) + T-08 (lines 116-122).

**Apply to:**
- `visualViewport.test.ts` (DRAWER-TEST-01 case 6 — no `vv.scroll` listener): `expect(src).not.toMatch(/visualViewport\.addEventListener\(['"]scroll/);`
- `InputDrawer.test.ts` (recommended additional T-XX — no `style=` on `<dialog>`): `expect(src).not.toMatch(/<dialog[^>]*\sstyle=/);` (DRAWER-08 enforcement).
- `InputDrawer.test.ts` (recommended additional T-XX — no `transition: max-height` / `padding-bottom` on `.input-drawer-sheet`): `expect(src).not.toMatch(/\.input-drawer-sheet\s*{[^}]*transition\s*:/);` (UI-SPEC.md Reduced-Motion Contract enforcement).

Use `readFileSync(resolve(__dirname, '...'), 'utf8')` consistently.

### Co-located Tests
**Source:** Project memory `feedback_test_colocation.md` + verified pattern `favorites.svelte.ts` + `favorites.test.ts` co-located.

**Apply to:** `visualViewport.svelte.ts` + `visualViewport.test.ts` (sibling files in `src/lib/shared/`); `InputDrawer.test.ts` already co-located alongside `InputDrawer.svelte` in `src/lib/shared/components/`. Playwright spec lives in `e2e/` per existing convention (NOT co-located).

---

## No Analog Found

No files in this phase fall through to "no analog" — every Phase 49 file has at least one strong in-repo precedent. The two new files (`visualViewport.svelte.ts`, `e2e/drawer-visual-viewport.spec.ts`) are role-match-quality (singleton + Playwright spec) with concrete in-repo skeletons.

---

## Metadata

**Analog search scope:**
- `src/lib/shared/*.svelte.ts` (5 files — singletons)
- `src/lib/shared/*.test.ts` (1 file — `favorites.test.ts`)
- `src/lib/shared/components/InputDrawer.svelte` + `InputDrawer.test.ts` + `InputDrawerHarness.svelte`
- `src/lib/test/visual-viewport-mock.ts` + `visual-viewport-mock.test.ts`
- `src/routes/+layout.svelte`
- `e2e/*.spec.ts` (22 specs — focused on `drawer-no-autofocus.spec.ts`, `webkit-smoke.spec.ts`, `mobile-nav-clearance.spec.ts`)

**Files scanned (read in full or partial):** 13.

**Pattern extraction date:** 2026-04-27.

**Key cross-cutting patterns identified:**
1. All `.svelte.ts` singletons file-headers carry "Svelte 5 rune syntax — .svelte.ts extension required for $state to compile" — Phase 49 inherits this.
2. All five existing singletons use module-level `let _x = $state(...)` + exported plain-object literal. Phase 49 deviates by spec (CONTEXT.md D-01 class shape) — preserve the locked shape but inherit the **idempotency / browser-guard / fallback-on-missing-API** idioms.
3. Co-located test convention (`feedback_test_colocation.md`) is observed for both new and modified test files.
4. Source-grep regression sentinels (`readFileSync` + `toMatch` / `not.toMatch`) are an established pattern from `InputDrawer.test.ts` T-06/T-08 — Phase 49 extends with three new sentinels (no scroll listener, no style on dialog, no transition on sheet).
5. The `webkit-iphone` Playwright project (Phase 47 D-12..D-15) automatically picks up new `e2e/*.spec.ts` files; no `playwright.config.ts` edit needed for DRAWER-TEST-03.
6. Phase 49 introduces ONE NEW IDIOM with no in-repo precedent: `$derived(condition ? cssCustomPropertyString : '')` returning an empty string to let CSS `var(..., fallback)` paths apply. Document this in the executor's plan as a new pattern (UI-SPEC.md LC-03 + RESEARCH.md Pattern 2).
