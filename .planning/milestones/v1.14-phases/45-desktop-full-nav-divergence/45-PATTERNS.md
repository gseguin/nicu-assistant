# Phase 45: Desktop Full-Nav Divergence — Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 4 (2 modify, 2 create)
**Analogs found:** 4 / 4 (every file has a strong codebase analog)

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `src/lib/shell/NavShell.svelte` (MODIFY) | Svelte 5 component (shell / responsive nav) | request-response (route → render); event-driven (ResizeObserver / route change) | `src/lib/shell/NavShell.svelte` itself (Phase 41 v1.13) + `src/lib/shell/HamburgerMenu.svelte` (style-block convention) + `src/lib/shared/components/NumericInput.svelte:6-9` (matchMedia reduced-motion read) | **exact for the file's existing surface; new affordances (ResizeObserver / scrollIntoView / mask-image / `$effect`) are NEW patterns for the entire codebase — no precedents exist in `src/`. RESEARCH.md provides the canonical Svelte 5 idiom verbatim.** |
| `src/lib/shell/NavShell.test.ts` (MODIFY) | Vitest spec (component + source-string analysis hybrid) | CRUD-style assertion (render → query → expect) | `src/lib/shell/NavShell.test.ts` itself (existing T-01..T-06) | **exact** |
| `e2e/desktop-full-nav.spec.ts` (CREATE) | Playwright E2E spec (viewport + interaction) | request-response (page.goto → assert DOM) | `e2e/favorites-nav.spec.ts` | **exact pattern source — same nav, same `addInitScript` clear, same `.first()` / `.last()` selector idiom; only the assertion logic flips (desktop is registry-driven, not favorites-driven).** |
| `e2e/desktop-full-nav-a11y.spec.ts` (CREATE) | Playwright + AxeBuilder spec | request-response (page.goto → axe.analyze) | `e2e/fortification-a11y.spec.ts` (specifically the Phase 44 theme-loop block at lines 91-115) | **exact pattern source — same `no-transition` class, same `waitForTimeout(250)` for dark, same `withTags(['wcag2a','wcag2aa'])`, same parameterized loop shape.** |

---

## Pattern Assignments

### `src/lib/shell/NavShell.svelte` (MODIFY)

**Primary analog:** itself (Phase 41 v1.13 — the file is being extended, not replaced). All v1.13 visual contracts are preserved verbatim per CONTEXT.md and UI-SPEC §Visual Inventory.

**Secondary analogs:**
- `src/lib/shell/HamburgerMenu.svelte` (lines 151-198) — **style-block convention** for shell components.
- `src/lib/shared/components/NumericInput.svelte` (lines 6-9) — **matchMedia reduced-motion read pattern**.
- `src/app.css` (lines 147-151) — **global reduced-motion CSS rule** confirming the project pattern (motion gated on user preference).

#### Imports + module-scope const pattern (existing, preserved verbatim)

`NavShell.svelte` lines 1-14:

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { CALCULATOR_REGISTRY } from './registry.js';
	import type { CalculatorEntry } from './registry.js';
	import { theme } from '$lib/shared/theme.svelte.js';
	import { Sun, Moon, Menu } from '@lucide/svelte';
	import HamburgerMenu from './HamburgerMenu.svelte';
	import { favorites } from '$lib/shared/favorites.svelte.js';

	// D-01: Map built once per module load (CALCULATOR_REGISTRY is static)
	// byId typed as Map<string, CalculatorEntry> because CalculatorEntry.id is string, not CalculatorId
	const byId = new Map<string, CalculatorEntry>(
		CALCULATOR_REGISTRY.map((c) => [c.id, c])
	);
```

The new `desktopVisibleCalculators` is a **module-scope const** mirroring the `byId` shape (Phase 45 D-02). Insert immediately after line 14, before the `// 42.1-03 D-15:` comment at line 16 (per RESEARCH.md Edit 2):

```svelte
	// Phase 45 D-02: desktop top toolbar always renders the full registry. Module-scope const
	// (not derived) because CALCULATOR_REGISTRY is `readonly` and never mutates at runtime —
	// matches the byId pattern above. Iteration order = registry declaration order.
	const desktopVisibleCalculators: readonly CalculatorEntry[] = [...CALCULATOR_REGISTRY];
```

#### Reactive derived pattern (existing, only renamed)

`NavShell.svelte` lines 24-27 (existing):

```svelte
	// D-01: render only favorited calculators in registry order
	const visibleCalculators = $derived(
		favorites.current.map((id) => byId.get(id)).filter((c): c is CalculatorEntry => c !== undefined)
	);
```

Replace the variable name and update the comment (per RESEARCH.md Edit 1):

```svelte
	// Phase 45 D-01: mobile bottom bar = favorites-driven, registry-ordered (Phase 41 contract preserved verbatim — only renamed for symmetry with desktopVisibleCalculators)
	const mobileVisibleCalculators = $derived(
		favorites.current.map((id) => byId.get(id)).filter((c): c is CalculatorEntry => c !== undefined)
	);
```

#### Iteration site updates (preserve every surrounding token)

**Desktop nav iteration**, line 57 — replace `visibleCalculators` with `desktopVisibleCalculators`. **Mobile nav iteration**, line 105 — replace `visibleCalculators` with `mobileVisibleCalculators`. The full `<a>` block (NavShell.svelte:59-73 desktop, NavShell.svelte:107-121 mobile) is preserved verbatim — `min-h-[48px]`, `border-b-2`, `text-ui font-medium`, `focus-visible:outline-2 ...`, `identityClass`, `role="tab"`, `aria-selected={isActive}`, `<calc.icon size={18} ... />`. The active-tab computation `{@const isActive = page.url.pathname.startsWith(calc.href)}` is preserved verbatim (lines 58 + 106).

#### Inner `<div role="tablist">` becomes scroll container (NEW pattern; UI-SPEC AUTO-6)

Existing markup, NavShell.svelte:55-56:

```svelte
	<nav class="ml-4 hidden gap-2 md:flex" aria-label="Calculator navigation">
		<div class="flex gap-2" role="tablist">
```

Replace with (per RESEARCH.md Edit 5):

```svelte
	<nav class="ml-4 hidden gap-2 md:flex" aria-label="Calculator navigation">
		<div
			bind:this={tablistEl}
			class="tablist-scroll flex gap-2"
			class:is-overflowing={isOverflowing}
			role="tablist"
		>
```

**Why the inner `<div>`, not the outer `<nav>`:** UI-SPEC AUTO-6 — keeps `aria-label="Calculator navigation"` on the semantic boundary; isolates scroll mechanics. Putting `overflow-x-auto` on the outer flex `<nav>` would clip the inner row's vertical descenders and focus rings.

#### `bind:this` ref + state declaration (NEW pattern in NavShell)

Insert into the `<script lang="ts">` block immediately after NavShell.svelte:22 (`let menuTriggerBtn = $state<HTMLButtonElement | null>(null);`) and before the renamed `mobileVisibleCalculators` (per RESEARCH.md Edit 6):

```svelte
	// Phase 45 D-07/D-08: refs and state for the desktop tablist scroll affordances.
	// tablistEl is the inner scrollable <div role="tablist">; isOverflowing toggles
	// the right-edge mask fade when scrollWidth > clientWidth.
	let tablistEl = $state<HTMLElement | null>(null);
	let isOverflowing = $state(false);
```

#### Auto-scroll active tab effect (NEW pattern; first reactive effect in `src/lib/shell/`)

Insert before `</script>` (per RESEARCH.md Edit 7). Active-tab selector is `querySelector('[aria-selected="true"]')` per UI-SPEC AUTO-5:

```svelte
	// Phase 45 D-07 / UI-SPEC A2: auto-scroll active tab into view on route change and on
	// first mount. inline:'nearest' means in-view tabs do not animate (steady-state no-op).
	// Reduced-motion override per UI-SPEC AUTO-4 (WCAG 2.3.3).
	$effect(() => {
		const _path = page.url.pathname; // dependency for re-run on navigation
		if (!tablistEl) return;
		const active = tablistEl.querySelector<HTMLElement>('[aria-selected="true"]');
		if (!active) return;
		const reduce =
			typeof window !== 'undefined' &&
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		active.scrollIntoView({
			inline: 'nearest',
			block: 'nearest',
			behavior: reduce ? 'auto' : 'smooth'
		});
	});
```

**matchMedia read pattern source** — `src/lib/shared/components/NumericInput.svelte:6-9`:

```svelte
	const PREFERS_REDUCED_MOTION =
		typeof window !== 'undefined' && typeof window.matchMedia === 'function'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;
```

The Phase 45 effect uses the SAME guard shape (`typeof window !== 'undefined' && typeof window.matchMedia === 'function'`) but evaluated **inside the effect body** rather than at module-load. Rationale (per RESEARCH.md EC-3): the user's preference rarely changes mid-session and `scrollIntoView` only fires on route change; querying at firing time is simpler than caching plus listening for changes.

#### ResizeObserver overflow-detection effect (NEW pattern; first ResizeObserver in user code)

Insert immediately after the auto-scroll effect, still before `</script>` (per RESEARCH.md Edit 8):

```svelte
	// Phase 45 D-08 / UI-SPEC A3: detect horizontal overflow on the tablist and toggle the
	// is-overflowing class so the mask fade appears only when content exceeds container.
	// ResizeObserver covers viewport resize, theme toggle reflow, and font-load layout shift.
	$effect(() => {
		if (!tablistEl) return;
		const el = tablistEl;
		const update = () => {
			isOverflowing = el.scrollWidth > el.clientWidth;
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	});
```

**Cleanup convention:** Svelte 5 effects return a teardown function that runs before re-execution and on component destruction. There is no precedent for this pattern in `src/lib/shell/` or `src/lib/shared/components/` (zero hits), so this is a NEW pattern for the file. The shape is canonical per Svelte 5 docs.

**Test environment compatibility:** `src/test-setup.ts:5-11` provides a no-op `ResizeObserver` shim — the synchronous `update()` call still executes correctly in jsdom (it reads `scrollWidth/clientWidth`, both available; both return 0 in jsdom), but the observer callback never fires. This is fine: T-11/T-12 use source-string assertions; runtime fade behavior is covered by E2E.

#### Scoped style block for scroll affordances (NEW CSS in NavShell)

Append at the very end of the file, after the closing `/>` of `<HamburgerMenu .../>` at NavShell.svelte:131 (per RESEARCH.md Edit 9):

```svelte

<style>
	/* Phase 45 A1: horizontal scroll affordance on the desktop tablist.
	   Tabs stay at full padding / full label / 48 px touch target at every viewport. */
	.tablist-scroll {
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
		scroll-behavior: smooth;
	}

	/* Phase 45 A3: 24 px right-edge gradient fade. Class is toggled from JS via the
	   ResizeObserver effect so the fade is invisible when content fits. mask-image
	   preserves tab interactivity beneath the fade — no pointer-events override needed. */
	.tablist-scroll.is-overflowing {
		mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
		-webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
	}
</style>
```

**Style-block convention source** — `src/lib/shell/HamburgerMenu.svelte:151-198`:

```svelte
<style>
	/* Reset default <dialog> centering — we anchor to the left edge as a drawer. */
	.hamburger-dialog {
		margin: 0;
		padding: 0;
		border: 0;
		position: fixed;
		...
	}
	.hamburger-dialog::backdrop {
		background: var(--color-scrim);
	}
	@media (prefers-reduced-motion: no-preference) {
		.hamburger-dialog[open] {
			animation: slide-in 180ms cubic-bezier(0.22, 1, 0.36, 1);
		}
		...
	}
</style>
```

**Conventions confirmed:** scoped (no `:global`); class selectors; `var(--color-*)` tokens for color values; `prefers-reduced-motion` gate at the CSS level when applicable. Phase 45's mask CSS does not need a reduced-motion gate (the class toggle is instantaneous, not animated — see UI-SPEC §A3).

**Collision check:** searching for `mask-image` and `mask:` in `src/` returned 0 hits in source files (confirmed in RESEARCH.md). No global resets, no Tailwind utility, no other component declares `mask-image`. Introduction is collision-free.

---

### `src/lib/shell/NavShell.test.ts` (MODIFY)

**Analog:** itself (the existing T-01..T-06 block at lines 82-156 is the literal pattern source for T-07..T-12). Two parallel patterns are reused unchanged.

#### Source-string analysis pattern (existing)

NavShell.test.ts lines 19-36:

```typescript
// NavShell is difficult to render in jsdom (requires SvelteKit routing context).
// These tests verify the component's structural properties via source analysis.
const navShellSource = readFileSync(
  resolve(process.cwd(), 'src/lib/shell/NavShell.svelte'),
  'utf-8'
);

// Tailwind class ordering is governed by prettier-plugin-tailwindcss and can
// shift on format. These assertions check token presence, not source order.
function classAttrContainsAll(source: string, required: readonly string[]): boolean {
  const attrRegex = /class="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(source)) !== null) {
    const tokens = new Set(match[1].split(/\s+/));
    if (required.every((t) => tokens.has(t))) return true;
  }
  return false;
}
```

**Reused for T-11/T-12** to assert `class="tablist-scroll flex gap-2"` and the `.tablist-scroll { ... overflow-x: auto ... }` rule are present in the source. ResizeObserver is a no-op in jsdom (test-setup.ts:5-11), so dynamic overflow detection cannot be unit-tested — source-string presence is the proxy assertion.

#### Render-based pattern (existing)

NavShell.test.ts lines 8-17 plus 84-93 (T-01 anchor):

```typescript
// Mutable page mock — tests override pathname per-test
const mockPage = { url: { pathname: '/morphine-wean' } };
vi.mock('$app/state', () => ({ get page() { return mockPage; } }));

beforeEach(() => {
  localStorage.clear();
  mockPage.url.pathname = '/morphine-wean';
  favorites.init(); // seeds defaults: ['morphine-wean','formula','gir','feeds']
});

// ...

it('T-01 default favorites (4): bottom nav renders 4 tabs', async () => {
  const { container } = render(NavShell);
  await tick();
  const bottomNav = container.querySelector('nav[aria-label="Calculator navigation"]:last-of-type')!;
  const tabs = bottomNav.querySelectorAll('[role="tab"]');
  expect(tabs).toHaveLength(4);
  expect(tabs[0].textContent).toMatch(/Morphine/i);
  expect(tabs[1].textContent).toMatch(/Formula/i);
  expect(tabs[2].textContent).toMatch(/GIR/i);
  expect(tabs[3].textContent).toMatch(/Feeds/i);
});
```

**Reused for T-07..T-10.** Key adaptation: the **desktop nav is the FIRST** `nav[aria-label="Calculator navigation"]`; the **mobile nav is the LAST** (`:last-of-type` in T-01). For desktop assertions, use either `container.querySelector('nav[aria-label="Calculator navigation"]')` (returns the first) or index `[0]` of `querySelectorAll`. For paired desktop+mobile assertions in the same test, use `container.querySelectorAll('nav[aria-label="Calculator navigation"]')` and index `[0]` (desktop) and `[1]` (mobile).

#### New tests (T-07..T-12)

The verbatim drafts are in RESEARCH.md §2 (lines 252-324). Splice into NavShell.test.ts after the closing `})` of the Phase 41 describe block at line 157:

```typescript
describe('NavShell — desktop full-nav divergence (Phase 45)', () => {

  it('T-07 default favorites (4): desktop nav still renders all 5 calculators', async () => {
    const { container } = render(NavShell);
    await tick();
    const desktopNav = container.querySelector('nav[aria-label="Calculator navigation"]')!;
    const tabs = desktopNav.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(5);
    // ... full label/order assertions per RESEARCH.md
  });

  // T-08, T-09, T-10, T-11, T-12 — see RESEARCH.md §2 for verbatim drafts.
});
```

#### `favorites.init()` plus `localStorage` test seeding pattern (existing)

NavShell.test.ts lines 96-99 (T-02 anchor) — reused unchanged for T-08, T-10:

```typescript
localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula'] }));
favorites.init();
const { container } = render(NavShell);
await tick();
```

T-09 zero-favorites pattern (NavShell.test.ts:108-117) is reused unchanged: `favorites.toggle('morphine-wean')` × 4 yields an empty list.

---

### `e2e/desktop-full-nav.spec.ts` (CREATE)

**Analog:** `e2e/favorites-nav.spec.ts` — full file, every pattern reused. **Do NOT extend** that file (per RESEARCH.md §3): its assertion model is "favorites bar matches favorites set," and Phase 45's desktop assertion is the opposite ("desktop bar IS NOT favorites-driven"). New file is cleaner and reverts cleanly if Phase 45 is ever rolled back.

#### Imports plus viewport-loop pattern

`e2e/favorites-nav.spec.ts` lines 14-23:

```typescript
import { test, expect } from '@playwright/test';

const viewports = [
	{ name: 'mobile', width: 375, height: 667 },
	{ name: 'desktop', width: 1280, height: 800 }
];

for (const vp of viewports) {
	test.describe(`Favorites nav — ${vp.name} (${vp.width}x${vp.height})`, () => {
		test.use({ viewport: { width: vp.width, height: vp.height } });
```

For Phase 45 we don't need a viewport loop on every test (each test has a specific viewport — 1280, 768, or 375), so the recommended file uses inline `await page.setViewportSize(...)` per RESEARCH.md draft. The same `test.use({ viewport: ... })` is used for the axe spec.

#### `addInitScript` localStorage clear pattern

`e2e/favorites-nav.spec.ts` lines 29-42:

```typescript
test.beforeEach(async ({ page }) => {
	// D-11: pre-clear both keys for order-independence.
	// This script runs on EVERY navigation (including reload) for this page.
	await page.addInitScript(() => {
		localStorage.removeItem('nicu:favorites');
		localStorage.removeItem('nicu:disclaimer-accepted');
	});
	await page.goto('/morphine-wean');
	// Dismiss disclaimer if it appears
	await page
		.getByRole('button', { name: /understand/i })
		.click({ timeout: 2000 })
		.catch(() => {});
});
```

**Reused verbatim** in `desktop-full-nav.spec.ts beforeEach`. The `addInitScript` script runs on **every navigation** (including reload), making it the canonical "test isolation" mechanism for localStorage-backed state. The `.catch(() => {})` after `click({ timeout: 2000 })` is the project-wide pattern for "dismiss disclaimer if present, ignore if absent" — required because the disclaimer's appearance depends on `nicu:disclaimer-accepted` which is also cleared.

#### `.first()` / `.last()` nav selector pattern

`e2e/favorites-nav.spec.ts` lines 25-27 (comment) plus 59-61:

```typescript
// On mobile (< 768px), the bottom nav is visible (last nav).
// On desktop (>= 768px), the top nav in the header is used (first nav).
const isDesktop = vp.width >= 768;

// ...

const nav = isDesktop
	? page.locator('nav[aria-label="Calculator navigation"]').first()
	: page.locator('nav[aria-label="Calculator navigation"]').last();
await expect(nav.getByRole('tab')).toHaveCount(3);
```

**Reused verbatim** in Phase 45 — the new test file just hard-codes `desktopNav = page.locator('nav[aria-label="Calculator navigation"]').first()` and `mobileNav = ...last()` since each test sets a known viewport.

#### `addInitScript` SET-after-REMOVE override pattern

`e2e/favorites-nav.spec.ts` lines 71-82 (FAV-TEST-03-2):

```typescript
// Register a SET script that runs on the next navigation (overrides the REMOVE from beforeEach)
await page.addInitScript(() => {
	localStorage.setItem(
		'nicu:favorites',
		JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'gir'] })
	);
});
await page.reload();
await page
	.getByRole('button', { name: /understand/i })
	.click({ timeout: 2000 })
	.catch(() => {});
```

**Reused** in NAV-ALL-TEST-01c (zero favorites) where the beforeEach REMOVE is followed by a SET to `{ v: 1, ids: [] }` before reload.

#### Hamburger toggle interaction pattern

`e2e/favorites-nav.spec.ts` lines 47-56:

```typescript
// Open hamburger
await page.getByRole('button', { name: 'Open calculator menu' }).click();
await page.getByRole('dialog').waitFor({ state: 'visible' });

// Un-favorite Feeds
await page.getByRole('button', { name: /remove feeds from favorites/i }).click();

// Close hamburger (Esc)
await page.keyboard.press('Escape');
await page.getByRole('dialog').waitFor({ state: 'hidden' });
```

**Reused verbatim** for NAV-ALL-TEST-01b (un-favorite Feeds via hamburger, desktop still 5, mobile 3).

#### NAV-ALL-TEST-01 verbatim drafts

See RESEARCH.md §3 (lines 351-451) for all four tests (`01a`, `01b`, `01c`, `01d`). The planner can splice them directly. Notable extension: TEST-01d uses `await expect(activeTab).toBeInViewport()` (Playwright 1.43+, present in this project's `^1.58.2`) to verify A2 auto-scroll behavior at narrow desktop.

---

### `e2e/desktop-full-nav-a11y.spec.ts` (CREATE)

**Analog:** `e2e/fortification-a11y.spec.ts` lines 91-115 — the Phase 44 Kendamil parameterized theme-loop block. This is the canonical project pattern for "axe sweep with parameterized theme."

#### Imports plus describe plus viewport pattern

`e2e/fortification-a11y.spec.ts` lines 1-9:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Fortification Calculator Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/formula');
    // Wait for the page heading to confirm load
    await page.getByRole('heading', { name: 'Formula Recipe' }).waitFor({ state: 'visible' });
    // Dismiss the disclaimer modal if it appears
    await page
      .getByRole('button', { name: /understand|acknowledge/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });
```

**Reused** with substitutions for Phase 45:
- describe name → `'Desktop full-nav accessibility (NAV-ALL-TEST-03)'`
- viewport → `test.use({ viewport: { width: 1280, height: 800 } })` at the describe level
- `page.goto` target → `/uac-uvc` (per RESEARCH.md §4 — exercises the auto-scrolled-into-view active-tab state)
- the `addInitScript` localStorage clear from `favorites-nav.spec.ts` beforeEach is added so default-favorites state is canonical

#### Parameterized theme loop pattern (THE canonical analog for NAV-ALL-TEST-03)

`e2e/fortification-a11y.spec.ts` lines 91-115 (verbatim — the literal pattern source):

```typescript
// KEND-TEST-03: re-run axe with a Kendamil variant selected. The new
// contrast surface is the manufacturer-group label "Kendamil" in the
// SelectPicker dropdown — identical for all three variants, so one
// variant (Organic) covers the new surface in both themes.
for (const theme of ['light', 'dark'] as const) {
  test(`fortification page has no axe violations with Kendamil Organic selected (${theme})`, async ({
    page
  }) => {
    await page.evaluate((t) => {
      document.documentElement.classList.add('no-transition');
      document.documentElement.classList.toggle('dark', t === 'dark');
      document.documentElement.classList.toggle('light', t === 'light');
      document.documentElement.setAttribute('data-theme', t);
    }, theme);
    if (theme === 'dark') await page.waitForTimeout(250);

    // Open the Formula SelectPicker and choose Kendamil Organic.
    await page.getByRole('combobox', { name: /^Formula/ }).click();
    await page.getByRole('option', { name: 'Kendamil Organic' }).click();

    // Confirm the calculator re-rendered with the new selection.
    await expect(page.getByText('Amount to Add')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}
```

**Reused with adaptation** for NAV-ALL-TEST-03:
- The "interaction step" (open SelectPicker + choose option) becomes "verify desktop nav has 5 tabs" (no interaction needed — desktop nav is rendered on page load).
- The theme-loop shape is preserved verbatim.
- The `no-transition` class plus `waitForTimeout(250)` for dark are preserved verbatim.
- `withTags(['wcag2a','wcag2aa'])` is preserved verbatim.

**Plus a second loop at 768 px** (per RESEARCH.md §4) covering the overflow plus fade visible state — the 1280 sweep alone never exercises the `.is-overflowing` mask CSS.

#### NAV-ALL-TEST-03 verbatim draft

See RESEARCH.md §4 (lines 469-541) for both loops (1280 and 768) — splice directly. The planner does not need to re-derive any of the axe boilerplate; it is a 1-to-1 reuse of the Kendamil pattern with the page target and assertions adapted.

---

## Shared Patterns

### Reduced-motion respect (cross-cutting; applies to A2 auto-scroll only)

**Source:** `src/lib/shared/components/NumericInput.svelte:6-9` plus `src/app.css:147-151`.

**Apply to:** the auto-scroll effect in NavShell.svelte (Edit 7).

**matchMedia runtime read:**
```typescript
const reduce =
	typeof window !== 'undefined' &&
	typeof window.matchMedia === 'function' &&
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

**Existing global CSS rule (already in place, no change):**
```css
@media (prefers-reduced-motion: reduce) {
  html * {
    transition: none !important;
  }
}
```

The CSS rule covers all CSS transitions site-wide. The runtime check covers the JS animation (`scrollIntoView`). DESIGN.md project pattern: any new motion is gated on user preference.

### Test isolation via `addInitScript` localStorage clear (cross-cutting; applies to both new E2E specs)

**Source:** `e2e/favorites-nav.spec.ts` lines 29-35.

**Apply to:** `desktop-full-nav.spec.ts` beforeEach AND `desktop-full-nav-a11y.spec.ts` beforeEach.

```typescript
await page.addInitScript(() => {
	localStorage.removeItem('nicu:favorites');
	localStorage.removeItem('nicu:disclaimer-accepted');
});
```

Runs on every navigation (including `page.reload()`), making it the project's canonical mechanism for stateless E2E tests. SET-script overrides for non-default state must be registered AFTER the beforeEach REMOVE (subsequent `addInitScript` calls run in registration order; the SET runs after the REMOVE on the next `goto`/`reload`).

### Disclaimer auto-dismiss (cross-cutting; applies to both new E2E specs)

**Source:** `e2e/favorites-nav.spec.ts` lines 38-41 plus `e2e/fortification-a11y.spec.ts` lines 12-15.

```typescript
await page
	.getByRole('button', { name: /understand/i })
	.click({ timeout: 2000 })
	.catch(() => {});
```

The 2 s timeout plus `.catch(() => {})` is the project-wide pattern for "click if visible, ignore if absent." The disclaimer's appearance depends on `nicu:disclaimer-accepted` in localStorage, which the `addInitScript` clear removes — so the disclaimer WILL appear in every test and the click WILL succeed (but the catch keeps the test resilient if the project later changes disclaimer logic).

### `.first()` / `.last()` nav selector (cross-cutting; both new E2E specs)

**Source:** `e2e/favorites-nav.spec.ts` lines 25-27 (comment) plus 59-61.

**Apply to:** every `nav[aria-label="Calculator navigation"]` query in both new specs.

```typescript
// Desktop = first nav (in header). Mobile = last nav (fixed bottom bar).
const desktopNav = page.locator('nav[aria-label="Calculator navigation"]').first();
const mobileNav = page.locator('nav[aria-label="Calculator navigation"]').last();
```

In Vitest tests (NavShell.test.ts), the equivalent is `container.querySelector('nav[aria-label="Calculator navigation"]')` (first) and `container.querySelector('nav[aria-label="Calculator navigation"]:last-of-type')` (last). T-08, T-09 in PATTERNS use `querySelectorAll` and index `[0]` / `[1]` for paired assertions in the same test.

### Style-block scoping (applies to NavShell.svelte Edit 9)

**Source:** `src/lib/shell/HamburgerMenu.svelte:151-198` plus `src/lib/shared/components/InputDrawer.svelte:128`, `SelectPicker.svelte:284`, `NumericInput.svelte:204`, `InputsRecap.svelte:183`.

**Convention:**
- Every existing style block in this codebase is **scoped** (no `:global`).
- Class selectors (e.g., `.hamburger-dialog`, `.tablist-scroll`) — never element selectors except in nested contexts.
- Color values via CSS custom-property tokens (`var(--color-border)`, `var(--color-scrim)`, etc.).
- Reduced-motion gates at the CSS level when applicable (`@media (prefers-reduced-motion: no-preference)` — opt-in pattern, motion is the additive case).

Phase 45's mask CSS is gate-free because the class toggle is instantaneous (per UI-SPEC §A3); the `transparent` terminal color is theme-agnostic.

---

## Patterns NEW to the Codebase

The following patterns have **no precedent in `src/`** and are introduced by Phase 45. The planner should call them out as new patterns and reference RESEARCH.md verbatim drafts — no analog exists to copy from.

| New Pattern | Where Introduced | Canonical Idiom Source | Verification |
|-------------|-------------------|-----------------------|--------------|
| Reactive effect block in `src/lib/shell/` (or any non-`*.svelte.ts` file) | NavShell.svelte (2 effects: auto-scroll plus ResizeObserver) | Svelte 5 official docs (cited in RESEARCH.md §12) | grep for effect blocks in `src/lib/shell/` and `src/lib/shared/components/` returns 0 hits |
| ResizeObserver in user code | NavShell.svelte (Edit 8) | Svelte 5 effect cleanup pattern (`return () => ro.disconnect();`) | grep for ResizeObserver in `src/` returns only `test-setup.ts` shim |
| Element.scrollIntoView | NavShell.svelte (Edit 7) | Native browser API; UI-SPEC §A2 quotes the exact options object | grep for scrollIntoView in `src/` returns 0 hits |
| mask-image CSS | NavShell.svelte (Edit 9) | UI-SPEC §A3 CSS contract (verbatim) | grep for mask-image in `src/` returns 0 hits — collision-free |
| `prefers-reduced-motion` runtime read inside an effect | NavShell.svelte (Edit 7) | NumericInput.svelte:6-9 reads at module-load; Phase 45 reads inside the effect (justified per RESEARCH.md EC-3) | adapted, not copied |
| `bind:this` to a typed `HTMLElement` ref plus null-narrowing | NavShell.svelte (Edits 5, 6, 7, 8) | NavShell.svelte:38 already does this for `menuTriggerBtn` (HTMLButtonElement) | analog exists, type only differs |

---

## No Analog Found

(none — every Phase 45 file has either an exact analog or a documented "new pattern" with a canonical idiom from upstream docs / RESEARCH.md drafts)

---

## Metadata

**Analog search scope:**
- `src/lib/shell/` (full directory — 4 files inspected: NavShell.svelte, NavShell.test.ts, HamburgerMenu.svelte, registry.ts)
- `src/lib/shared/components/` (style-block plus matchMedia plus reduced-motion conventions)
- `src/lib/shared/` (favorites.svelte.ts, theme.svelte.ts surface only — not modified by Phase 45)
- `src/app.css` (full file — confirmed no `mask-image` conflicts; confirmed reduced-motion global rule at lines 147-151)
- `src/test-setup.ts` (full file — confirmed `ResizeObserver` plus `matchMedia` shims)
- `e2e/` (full directory listing — 16 specs; canonical analogs: `favorites-nav.spec.ts`, `favorites-nav-a11y.spec.ts`, `fortification-a11y.spec.ts`, `navigation.spec.ts`)

**Files scanned:** 12 source files read in part or full; 1 directory listing (`e2e/`).

**Pattern extraction date:** 2026-04-25

**Confidence:** HIGH — every analog file was read and excerpts are quoted with line numbers. Where no analog exists in the codebase (the 6 NEW patterns above), the canonical Svelte 5 / native-browser idiom is documented and the verbatim draft sits in RESEARCH.md ready for the planner to splice.
