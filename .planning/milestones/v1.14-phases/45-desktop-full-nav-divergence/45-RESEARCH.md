# Phase 45: Desktop Full-Nav Divergence — Research

**Researched:** 2026-04-25
**Domain:** SvelteKit 2 + Svelte 5 component refactor — single-file change in `src/lib/shell/NavShell.svelte` plus 1 vitest extension and 2 new Playwright specs
**Confidence:** HIGH (every anchor verified by reading the file in full; every test pattern verified by reading the existing analogs)

## Summary

This is a small, contained phase with no dependency, runtime, or ARIA-contract changes. CONTEXT.md (D-01..D-09) and UI-SPEC.md (A1, A2, A3 + AUTO-1..AUTO-10) are precise — research's job is to map every locked decision to a verbatim line in `NavShell.svelte` and to confirm the test infrastructure already supports the new specs.

**Findings:**
- All 9 NavShell edits map to specific lines (12-14, 25-27, 55-76 desktop block, 98-124 mobile block) — no ambiguity.
- The existing v1.13 visual contract on the desktop tab `<a>` element is preserved verbatim — only the iteration source (`visibleCalculators` → `desktopVisibleCalculators`) and the wrapper `<div role="tablist">` change.
- `src/test-setup.ts` already mocks `ResizeObserver` (no-op) and `matchMedia` (returns `matches: true` for reduced-motion). Vitest tests will not crash on `new ResizeObserver(...)`, but the no-op observer means **dynamic overflow detection cannot be unit-tested in jsdom** — covered via E2E at 768px viewport instead.
- `e2e/favorites-nav.spec.ts` is the canonical pattern for NAV-ALL-TEST-01 (viewport-loop + `addInitScript` localStorage clear + `.first()`/`.last()` nav selector + hamburger toggle). Recommended new file: `e2e/desktop-full-nav.spec.ts`.
- `e2e/favorites-nav-a11y.spec.ts` and `e2e/fortification-a11y.spec.ts` are the canonical patterns for NAV-ALL-TEST-03. Recommended new file: `e2e/desktop-full-nav-a11y.spec.ts`.
- No `mask-image` references anywhere in the codebase; no global resets that would conflict. Safe to introduce.

**Primary recommendation:** Splice the verbatim before/after blocks below into PLAN.md `<action>` blocks. Order tasks: (T1) NavShell rename + new const + iterations + scroll affordance + auto-scroll effect + ResizeObserver effect + style block, (T2) NavShell.test.ts NAV-ALL-TEST-02 extension, (T3) `e2e/desktop-full-nav.spec.ts` NAV-ALL-TEST-01, (T4) `e2e/desktop-full-nav-a11y.spec.ts` NAV-ALL-TEST-03. Tasks T1 + T2 can be merged; T3 + T4 can be a single Playwright wave.

---

## 1. Per-Edit Anchor Table — `src/lib/shell/NavShell.svelte`

The file is 131 lines today. Below is the **exact** before/after for every edit. Line numbers refer to the version read 2026-04-25 (NavShell.svelte head, no pending edits).

### Edit 1 — Rename `visibleCalculators` → `mobileVisibleCalculators` (D-01)

**Lines 24-27 (existing):**
```svelte
	// D-01: render only favorited calculators in registry order
	const visibleCalculators = $derived(
		favorites.current.map((id) => byId.get(id)).filter((c): c is CalculatorEntry => c !== undefined)
	);
```

**Replace with:**
```svelte
	// Phase 45 D-01: mobile bottom bar = favorites-driven, registry-ordered (Phase 41 contract preserved verbatim — only renamed for symmetry with desktopVisibleCalculators)
	const mobileVisibleCalculators = $derived(
		favorites.current.map((id) => byId.get(id)).filter((c): c is CalculatorEntry => c !== undefined)
	);
```

### Edit 2 — Add `desktopVisibleCalculators` module-scope const (D-02)

**Insert immediately after line 14 (closing `);` of the `byId` Map block) and before line 16 (the `// 42.1-03 D-15:` comment):**

**Existing (lines 10-19) — anchor only, do not modify:**
```svelte
	// D-01: Map built once per module load (CALCULATOR_REGISTRY is static)
	// byId typed as Map<string, CalculatorEntry> because CalculatorEntry.id is string, not CalculatorId
	const byId = new Map<string, CalculatorEntry>(
		CALCULATOR_REGISTRY.map((c) => [c.id, c])
	);

	// 42.1-03 D-15: About sheet hoisted to +layout.svelte; aboutOpen now lives at the layout
```

**After line 14 insert:**
```svelte
	// Phase 45 D-02: desktop top toolbar always renders the full registry. Module-scope const
	// (not $derived) because CALCULATOR_REGISTRY is `readonly` and never mutates at runtime —
	// matches the byId pattern above. Iteration order = registry declaration order.
	const desktopVisibleCalculators: readonly CalculatorEntry[] = [...CALCULATOR_REGISTRY];
```

### Edit 3 — Update mobile `<nav>` iteration (D-04, NAV-ALL-02)

**Line 105 (existing):**
```svelte
		{#each visibleCalculators as calc}
```

**Replace with:**
```svelte
		{#each mobileVisibleCalculators as calc}
```

**Note:** This is the only mobile-bar change. The entire surrounding markup (lines 98-124) — including `bg-[var(--color-surface)]/95 backdrop-blur`, `pb-[env(safe-area-inset-bottom,0px)]`, `md:hidden`, `flex-1`, `min-h-14`, identityClass, and the `aria-selected={isActive}` per-tab — is preserved verbatim.

### Edit 4 — Update desktop `<nav>` iteration (D-01, NAV-ALL-01)

**Line 57 (existing):**
```svelte
			{#each visibleCalculators as calc}
```

**Replace with:**
```svelte
			{#each desktopVisibleCalculators as calc}
```

**Note:** The entire `<a>` block (lines 59-73) — `min-h-[48px]`, `border-b-2`, `text-ui font-medium`, `focus-visible:outline-2 ...`, identityClass, `role="tab"`, `aria-selected={isActive}`, `<calc.icon size={18} ...>` — is preserved verbatim per CONTEXT.md "every v1.13 visual contract preserved" and UI-SPEC §Visual Inventory.

### Edit 5 — Make the inner `tablist` the scroll container (D-06, A1, AUTO-6)

**Lines 55-56 (existing):**
```svelte
	<nav class="ml-4 hidden gap-2 md:flex" aria-label="Calculator navigation">
		<div class="flex gap-2" role="tablist">
```

**Replace with:**
```svelte
	<nav class="ml-4 hidden gap-2 md:flex" aria-label="Calculator navigation">
		<div
			bind:this={tablistEl}
			class="tablist-scroll flex gap-2"
			class:is-overflowing={isOverflowing}
			role="tablist"
		>
```

**Rationale (verified against UI-SPEC AUTO-6):** the outer `<nav>` keeps `md:flex` to gate desktop visibility; the **inner** `<div role="tablist">` becomes the scroll container (so `aria-label="Calculator navigation"` stays on the semantic boundary). The `tablist-scroll` class carries the `overflow-x: auto` declaration in the new `<style>` block (Edit 9). The `is-overflowing` class toggles the `mask-image` fade.

**Note:** Closing `</div>` at line 75 is unchanged.

### Edit 6 — Add `bind:this` ref + state for overflow tracking (D-07, D-08, A2, A3)

**Insert into the `<script lang="ts">` block. Best location: immediately after line 22 (`let menuTriggerBtn = $state<HTMLButtonElement | null>(null);`) and before line 24 (the renamed `mobileVisibleCalculators`). Existing line 22-23 anchor:**
```svelte
	let menuOpen = $state(false);
	let menuTriggerBtn = $state<HTMLButtonElement | null>(null);
```

**After line 22 insert:**
```svelte

	// Phase 45 D-07/D-08: refs and state for the desktop tablist scroll affordances.
	// tablistEl is the inner scrollable <div role="tablist">; isOverflowing toggles
	// the right-edge mask fade when scrollWidth > clientWidth.
	let tablistEl = $state<HTMLElement | null>(null);
	let isOverflowing = $state(false);
```

### Edit 7 — Add the auto-scroll-active-tab `$effect` (D-07, A2)

**Insert into the `<script lang="ts">` block after Edit 6's state and after the renamed `mobileVisibleCalculators` `$derived` (i.e., after line 27 of the original file, which now sits at the end of the script block before `</script>` at line 28).**

**Anchor (existing line 27-28):**
```svelte
	);
</script>
```

**Insert before `</script>`:**
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

**Note on the `_path` dependency:** Svelte 5 `$effect` tracks `page.url.pathname` automatically when read inside the effect body. The `const _path = page.url.pathname;` is an explicit read so the dependency is unambiguous to readers; the `_` prefix signals "intentionally unused after assignment."

### Edit 8 — Add the `ResizeObserver` overflow-detection `$effect` (D-08, A3, AUTO-2)

**Insert in the `<script lang="ts">` block, immediately after the auto-scroll `$effect` from Edit 7, before `</script>`:**

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

**Verified against:** Svelte 5 `$effect` cleanup pattern (return function = teardown). `ResizeObserver` is mocked (no-op) in `src/test-setup.ts:5-11`, so the `update()` synchronous call inside the effect still computes correctly in jsdom — but the observer callback never fires in tests. This is fine: the observer-driven case is covered by E2E.

### Edit 9 — Add scoped `<style>` block for scroll affordances (A1 + A3 CSS contract)

**Insert at the **very end** of the file, after line 131 (the closing `/>` of `<HamburgerMenu .../>`):**

**Anchor (existing lines 126-131, do not modify):**
```svelte
<HamburgerMenu
	triggerEl={menuTriggerBtn}
	bind:open={menuOpen}
	onAbout={() => (aboutOpen = true)}
/>
```

**Append:**
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
	   ResizeObserver $effect so the fade is invisible when content fits. mask-image
	   preserves tab interactivity beneath the fade — no pointer-events override needed. */
	.tablist-scroll.is-overflowing {
		mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
		-webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
	}
</style>
```

**Verified clean:** `grep -rn "mask-image\|mask:" src/` returned zero hits (the only `mask` matches are in `test-setup.ts` comments and irrelevant). No global resets, no Tailwind utility, no other component declares `mask-image`. The introduction is collision-free.

**Theme awareness:** Confirmed not needed. The mask terminates in `transparent`, not in a painted token — no per-theme value to swap. The underlying `<header>` background (`bg-[var(--color-surface)]`) shows through unchanged, so the fade visually blends into both light and dark surface tokens automatically.

---

## 2. NavShell.test.ts Extension — NAV-ALL-TEST-02

### Existing patterns (verified by reading lines 1-157)

The file uses two parallel patterns:
1. **Source-string analysis** (lines 21-79): `classAttrContainsAll(navShellSource, ['hidden', 'md:flex'])`. Robust against Tailwind class-order shifts. Used for structural assertions ("desktop nav is hidden on mobile", "bottom nav has flex-1").
2. **Render-based** (lines 82-156): `render(NavShell)` + `container.querySelector('nav[aria-label="Calculator navigation"]:last-of-type')` for the bottom nav, with the **first** matching `nav[aria-label="Calculator navigation"]` (i.e., `:not(:last-of-type)` or implicitly the first) for the desktop nav.

The mock `vi.mock('$app/state', () => ({ get page() { return mockPage; } }))` at line 11 plus `mockPage.url.pathname = '/morphine-wean'` in `beforeEach` is **directly reusable** for the new tests — same pattern, no new mocks required.

### Recommended new tests (verbatim drafts the planner can splice)

Append to NavShell.test.ts at the end of the file (after the closing `})` of the `describe('NavShell — favorites-driven rendering (Phase 41)')` block at line 157):

```typescript
describe('NavShell — desktop full-nav divergence (Phase 45)', () => {

  it('T-07 default favorites (4): desktop nav still renders all 5 calculators', async () => {
    const { container } = render(NavShell);
    await tick();
    // Desktop nav is the FIRST nav[aria-label="Calculator navigation"]
    const desktopNav = container.querySelector('nav[aria-label="Calculator navigation"]')!;
    const tabs = desktopNav.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(5);
    expect(tabs[0].textContent).toMatch(/Morphine/i);
    expect(tabs[1].textContent).toMatch(/Formula/i);
    expect(tabs[2].textContent).toMatch(/GIR/i);
    expect(tabs[3].textContent).toMatch(/Feeds/i);
    expect(tabs[4].textContent).toMatch(/UAC/i);
  });

  it('T-08 reduced favorites (2): desktop nav unchanged, mobile nav reflects favorites', async () => {
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula'] }));
    favorites.init();
    const { container } = render(NavShell);
    await tick();
    const navs = container.querySelectorAll('nav[aria-label="Calculator navigation"]');
    expect(navs).toHaveLength(2);
    const desktopTabs = navs[0].querySelectorAll('[role="tab"]');
    const mobileTabs = navs[1].querySelectorAll('[role="tab"]');
    expect(desktopTabs).toHaveLength(5); // NAV-ALL-01: registry-driven, immune to favorites
    expect(mobileTabs).toHaveLength(2);  // NAV-ALL-02: favorites-driven, Phase 41 contract
  });

  it('T-09 zero favorites: desktop nav still renders all 5; mobile renders none', async () => {
    favorites.toggle('morphine-wean');
    favorites.toggle('formula');
    favorites.toggle('gir');
    favorites.toggle('feeds');
    const { container } = render(NavShell);
    await tick();
    const navs = container.querySelectorAll('nav[aria-label="Calculator navigation"]');
    const desktopTabs = navs[0].querySelectorAll('[role="tab"]');
    const mobileTabs = navs[1].querySelectorAll('[role="tab"]');
    expect(desktopTabs).toHaveLength(5); // edge case: favorites empty, desktop still full
    expect(mobileTabs).toHaveLength(0);
  });

  it('T-10 active route on desktop: tab always lit (D-03)', async () => {
    // Even if the active route is non-favorited on mobile, the desktop tab is always
    // present and aria-selected="true" because all 5 are rendered.
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'gir'] }));
    favorites.init();
    mockPage.url.pathname = '/uac-uvc';
    const { container } = render(NavShell);
    await tick();
    const desktopNav = container.querySelector('nav[aria-label="Calculator navigation"]')!;
    const desktopSelected = desktopNav.querySelectorAll('[aria-selected="true"]');
    expect(desktopSelected).toHaveLength(1);
    expect(desktopSelected[0].textContent).toMatch(/UAC/i);
  });

  it('T-11 desktop tablist has overflow-x-auto via .tablist-scroll class', () => {
    // Source-string assertion — the .tablist-scroll class is applied to the inner
    // <div role="tablist"> so overflow-x lives there and not on the outer <nav>.
    expect(navShellSource).toContain('class="tablist-scroll flex gap-2"');
    // The CSS rule itself is in the <style> block.
    expect(navShellSource).toMatch(/\.tablist-scroll\s*\{[^}]*overflow-x:\s*auto/);
  });

  it('T-12 mask-image fade is gated on .is-overflowing class', () => {
    // Source-string assertion — fade only applies under .is-overflowing
    expect(navShellSource).toMatch(/\.tablist-scroll\.is-overflowing\s*\{[^}]*mask-image:\s*linear-gradient/);
    // The class is bound conditionally in markup
    expect(navShellSource).toContain('class:is-overflowing={isOverflowing}');
  });
});
```

**Notes:**
- **`desktopVisibleCalculators` cannot be imported directly** because NavShell is a `.svelte` file. The render-based assertions on tab count + label cover the requirement equivalently (NAV-ALL-TEST-02: "asserts it equals the full registry order regardless of `favorites.current` state").
- **T-07/T-08/T-09 cover the three favorite-state vectors** (4 default, 2 reduced, 0 empty) called out in NAV-ALL-TEST-02.
- **T-10 covers D-03** (desktop active tab always lit, even when route is non-favorited on mobile). Useful regression guard if anyone later "fixes" the divergence to harmonize bars.
- **T-11/T-12 are source-string assertions** for A1 + A3 because the dynamic ResizeObserver behavior cannot fire in jsdom (test-setup.ts mock is no-op). These confirm the wiring is in place; the runtime behavior is covered by E2E.
- **T-05 (existing mobile non-favorited active route, line 129)** still passes after the rename because the mobile nav's `aria-selected="false"` count assertion is unaffected. **T-04 (line 119)** uses `selectedTabs.length).toBeGreaterThanOrEqual(1)` which works on either bar — but post-Phase 45 the desktop nav will ALWAYS have one selected tab (5 always rendered), so T-04 may need its assertion refined to "exactly one per nav bar" if the planner wants tightening; otherwise it remains green as-is.

---

## 3. Playwright NAV-ALL-TEST-01 — Recommended File: `e2e/desktop-full-nav.spec.ts`

### E2E spec inventory (verified by `ls e2e/`)

| File | Pattern | Reusable for NAV-ALL-TEST-01? |
|------|---------|-------------------------------|
| `e2e/navigation.spec.ts` | High-level layout sanity (banner role, theme toggle, hamburger) | NO — it's the v1.2 layout-shape spec, mixing concerns would muddy it |
| `e2e/favorites-nav.spec.ts` | Viewport-loop add/remove/persist E2E with hamburger interaction | **YES — canonical pattern, mirror exactly** |
| `e2e/favorites-nav-a11y.spec.ts` | Axe sweep of open hamburger drawer (light + dark) | Pattern reused for NAV-ALL-TEST-03, not for TEST-01 |
| `e2e/mobile-nav-clearance.spec.ts` | Viewport-specific layout assertion | Adjacent reference for viewport setup |

**Recommendation:** Create a new file `e2e/desktop-full-nav.spec.ts`. **Do NOT extend `favorites-nav.spec.ts`** — that file's pattern asserts "the favorites bar matches the favorites set," and Phase 45's desktop assertion is the *opposite* (desktop bar IS NOT favorites-driven). Mixing them obscures intent. New file is cleaner and easier to delete if Phase 45 is ever reverted.

### Draft NAV-ALL-TEST-01 spec

```typescript
// e2e/desktop-full-nav.spec.ts
// NAV-ALL-TEST-01: Desktop top toolbar renders the full registry (5 calculators)
// regardless of favorites state. Mobile bottom bar still tracks favorites.
// Pattern source: e2e/favorites-nav.spec.ts (viewport loop, addInitScript clear, hamburger toggle).

import { test, expect } from '@playwright/test';

test.describe('Desktop full-nav divergence (Phase 45)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('nicu:favorites');
      localStorage.removeItem('nicu:disclaimer-accepted');
    });
  });

  test('NAV-ALL-TEST-01a: desktop @1280 renders all 5 calculators (default favorites = 4)', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/morphine-wean');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});

    const desktopNav = page.locator('nav[aria-label="Calculator navigation"]').first();
    const tabs = desktopNav.getByRole('tab');
    await expect(tabs).toHaveCount(5);
    await expect(tabs.nth(0)).toContainText('Morphine');
    await expect(tabs.nth(1)).toContainText('Formula');
    await expect(tabs.nth(2)).toContainText('GIR');
    await expect(tabs.nth(3)).toContainText('Feeds');
    await expect(tabs.nth(4)).toContainText('UAC/UVC');
  });

  test('NAV-ALL-TEST-01b: un-favorite Feeds via hamburger → desktop still 5, mobile 3', async ({
    page
  }) => {
    // Start at desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/morphine-wean');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});

    // Open hamburger and un-favorite Feeds
    await page.getByRole('button', { name: 'Open calculator menu' }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /remove feeds from favorites/i }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });

    // Desktop unchanged: still 5
    const desktopNav = page.locator('nav[aria-label="Calculator navigation"]').first();
    await expect(desktopNav.getByRole('tab')).toHaveCount(5);
    await expect(desktopNav.getByRole('tab', { name: /feeds/i })).toBeVisible();

    // Resize to mobile and verify the bottom bar reflects 3 favorites
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileNav = page.locator('nav[aria-label="Calculator navigation"]').last();
    await expect(mobileNav.getByRole('tab')).toHaveCount(3);
    await expect(mobileNav.getByRole('tab', { name: /feeds/i })).toHaveCount(0);
  });

  test('NAV-ALL-TEST-01c: zero favorites → desktop still renders all 5', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: [] }));
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/morphine-wean');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});

    const desktopNav = page.locator('nav[aria-label="Calculator navigation"]').first();
    await expect(desktopNav.getByRole('tab')).toHaveCount(5);
  });

  test('NAV-ALL-TEST-01d: narrow desktop @768 — all 5 tabs rendered, container scrolls horizontally', async ({
    page
  }) => {
    // 768 = Tailwind md breakpoint, the narrowest viewport that shows the desktop nav.
    await page.setViewportSize({ width: 768, height: 800 });
    await page.goto('/uac-uvc');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});

    const desktopNav = page.locator('nav[aria-label="Calculator navigation"]').first();
    await expect(desktopNav.getByRole('tab')).toHaveCount(5);

    // The active tab (UAC/UVC, the 5th tab) auto-scrolls into view per A2.
    const activeTab = desktopNav.getByRole('tab', { name: /uac/i });
    // Element should be in the visible scroll viewport (not clipped beyond the right edge).
    await expect(activeTab).toBeInViewport();
  });
});
```

**Notes on the draft:**
- Pattern matches `favorites-nav.spec.ts` exactly (`addInitScript`, hamburger toggle, `.first()`/`.last()` nav selector).
- TEST-01a covers the primary requirement; TEST-01b covers the verbatim wording in REQUIREMENTS.md ("toggle a non-favorite calculator off via hamburger, assert it remains in the desktop top bar but disappears from mobile bottom bar at 375"); TEST-01c covers the zero-favorites edge; TEST-01d is a bonus check covering A2 (auto-scroll-into-view at narrow desktop).
- `expect(activeTab).toBeInViewport()` is Playwright 1.43+ — verified `^1.58.2` in package.json (CLAUDE.md).

---

## 4. Playwright NAV-ALL-TEST-03 Axe Spec — Recommended File: `e2e/desktop-full-nav-a11y.spec.ts`

### Pattern source

`e2e/fortification-a11y.spec.ts` (verified read above, lines 1-122) is the cleanest analog. It uses the `for (const theme of ['light', 'dark'] as const)` parameterized pattern at lines 91-115 (added in Phase 44 for KEND-TEST-03) — same shape applies here.

### Draft NAV-ALL-TEST-03 spec

```typescript
// e2e/desktop-full-nav-a11y.spec.ts
// NAV-ALL-TEST-03: Axe sweep of the desktop top toolbar with all 5 tabs rendered,
// in light + dark themes. Verifies no contrast regressions from added calculator labels.
// Pattern source: e2e/fortification-a11y.spec.ts (for-theme loop, no-transition class, axe analyze).

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Desktop full-nav accessibility (NAV-ALL-TEST-03)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    // Default favorites (4) — desktop still renders all 5 regardless, but keeps the page in
    // the canonical state.
    await page.addInitScript(() => {
      localStorage.removeItem('nicu:favorites');
      localStorage.removeItem('nicu:disclaimer-accepted');
    });
    // Land on /uac-uvc so the 5th tab is the active one (worst case for the auto-scroll
    // affordance + scroll-fade interaction).
    await page.goto('/uac-uvc');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`desktop top toolbar has no axe violations (${theme})`, async ({ page }) => {
      await page.evaluate((t) => {
        document.documentElement.classList.add('no-transition');
        document.documentElement.classList.toggle('dark', t === 'dark');
        document.documentElement.classList.toggle('light', t === 'light');
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      if (theme === 'dark') await page.waitForTimeout(250);

      // Confirm desktop nav is rendered with all 5 tabs before scanning
      const desktopNav = page.locator('nav[aria-label="Calculator navigation"]').first();
      await expect(desktopNav.getByRole('tab')).toHaveCount(5);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }

  // NAV-ALL-TEST-03 narrow-desktop variant: at 768 px the tablist scrolls and the fade is visible.
  // Verify axe still passes (tab focus order, contrast of clipped tabs, etc.).
  for (const theme of ['light', 'dark'] as const) {
    test(`desktop top toolbar @768 (overflow + fade visible) has no axe violations (${theme})`, async ({
      page
    }) => {
      await page.setViewportSize({ width: 768, height: 800 });
      await page.evaluate((t) => {
        document.documentElement.classList.add('no-transition');
        document.documentElement.classList.toggle('dark', t === 'dark');
        document.documentElement.classList.toggle('light', t === 'light');
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      if (theme === 'dark') await page.waitForTimeout(250);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
```

**Notes:**
- Mirrors `fortification-a11y.spec.ts:91-115` Kendamil parameterized pattern exactly — same `no-transition` class, same `waitForTimeout(250)` for dark, same `withTags(['wcag2a', 'wcag2aa'])`.
- Includes a bonus 768px sweep because the new fade overlay surface ONLY exists at narrow widths — the 1280px sweep alone would never exercise the `.is-overflowing` mask CSS.
- Loads `/uac-uvc` (not `/morphine-wean`) so the auto-scrolled-into-view active-tab state is also under axe scrutiny.

---

## 5. Edge-Case Watch-List

| # | Concern | Risk | Recommended Handling | Confidence |
|---|---------|------|----------------------|------------|
| EC-1 | Does `bind:this={tablistEl}` survive across re-renders when favorites change? | LOW. The desktop tablist's children change when registry order changes (it doesn't, registry is `readonly`); favorites changes only re-render the *mobile* `<nav>` siblings. The desktop `<div>` element itself is stable across favorites mutations. | No special handling needed. `bind:this` is a normal Svelte 5 binding; it tracks the same element across reactive updates as long as the element is not unmounted. The tablist div is unconditionally rendered (it's inside `hidden md:flex` which is a CSS-only toggle). | HIGH (verified by reading the file structure) |
| EC-2 | Does Svelte 5 `$effect` cleanup work for `ResizeObserver`? | LOW. Svelte 5 docs explicitly support returning a teardown function from `$effect`. | The `return () => ro.disconnect()` pattern in Edit 8 is canonical. | HIGH ([CITED: svelte.dev/docs/svelte/$effect — "If a function is returned from the effect, it will be called immediately before the effect re-runs, and again before it is destroyed."]) |
| EC-3 | Reduced-motion: query `matchMedia` once or live-listen? | LOW. The user's reduced-motion preference rarely changes mid-session, and `scrollIntoView` only fires on route change. Querying at scrollIntoView-time (Edit 7) is sufficient. The existing `app.css:147-151` `@media (prefers-reduced-motion: reduce)` rule disables CSS transitions globally; consistency wins. | Query inside the `$effect` body each time it runs (per Edit 7). No `matchMedia.addEventListener('change', ...)` listener — that would be over-engineering and add cleanup complexity. | HIGH (matches `NumericInput.svelte:6-9` pattern verified above) |
| EC-4 | `mask-image` cross-theme behavior | LOW. The mask uses `transparent` as the terminal color, not a token-based color. The tab elements beneath the mask retain their theme-aware colors (they're the painted layer; the mask only adjusts alpha). No theme-specific override needed. | Use the verbatim CSS in Edit 9. | HIGH (verified by reading app.css; no global mask resets exist) |
| EC-5 | Existing global CSS conflict with `mask-image` | NONE. `grep -rn "mask-image\|mask:" src/` returned 0 results in `src/`; only references are in `test-setup.ts` (irrelevant) and `e2e/` test files. No reset, no conflict. | Proceed with Edit 9 as written. | HIGH (verified by grep) |
| EC-6 | `ResizeObserver` not implemented in jsdom | NONE for runtime. `src/test-setup.ts:5-11` already provides a no-op shim. The `update()` synchronous call inside the effect still works (reads `scrollWidth/clientWidth`, both available in jsdom even though they return 0). The `observe()` callback never fires, so `isOverflowing` stays `false` in tests — but T-11/T-12 use source-string assertions and are not affected. | No test-setup change needed. | HIGH (verified by reading `src/test-setup.ts`) |
| EC-7 | `$effect` running on first mount when `tablistEl` is `null` | LOW. Both effects (Edits 7 and 8) check `if (!tablistEl) return;` before any work. Svelte 5 `$effect` runs after DOM commit, so by the time it executes, `bind:this={tablistEl}` has already populated. The null check is defensive — required because `tablistEl` is typed as `HTMLElement \| null` and TypeScript demands the narrowing. | Pattern is already in the draft; no change. | HIGH |
| EC-8 | Tab-key focus on a clipped tab interferes with auto-scroll | NONE. UA-default focus-driven scroll fires from a user gesture (Tab key); the route-change `$effect` fires from a route mutation. They are independent triggers and neither cancels the other. `scrollIntoView({inline: 'nearest'})` is a no-op when target is already visible (which it will be after focus-scroll). | No interference handling needed. | HIGH (per UI-SPEC §A2 "Interaction with Tab-key focus" and CSSOM View spec) |
| EC-9 | Will `class:is-overflowing={isOverflowing}` cause a hydration warning? | NONE. The initial value of `isOverflowing` is `false` (declared at Edit 6); the SSR/CSR initial render output matches. The first observer callback fires after mount, AFTER hydration. | No SSR-mismatch handling. (Note: this app uses `adapter-static` SPA mode, so SSR proper isn't even running — the prerender at build time outputs the false-state HTML, hydration matches.) | HIGH (verified against CLAUDE.md adapter-static stack) |
| EC-10 | Does the existing T-04 test (line 119) break under Phase 45? | LOW. T-04 asserts `selectedTabs.length).toBeGreaterThanOrEqual(1)` for `/gir`. Post-Phase 45, with default favorites, both bars render GIR → 2 selected tabs total → `>= 1` still passes. **No regression.** | Leave T-04 as-is. Optional: tighten to "exactly 2 (one per bar)" if planner wants stricter assertion, but not required. | HIGH (verified by reading the existing test) |

---

## 6. Project Constraints (from CLAUDE.md + CONTEXT.md)

These are upstream locked decisions the planner must honor:

- **Tech stack** (CLAUDE.md): SvelteKit 2 + Svelte 5 + TS + Tailwind 4 + Vite + pnpm. No new runtime dependencies. **CLAUDE.md says "Package Manager: npm" but the rest of CLAUDE.md and PROJECT context are pnpm — verified: pnpm 10.33.0 is the actual stack. Treat the `## Project Configuration` "npm" line as a stale stub.**
- **No new dependencies** (CLAUDE.md): `scrollIntoView`, `mask-image`, `ResizeObserver`, `matchMedia` are all native browser APIs — no install needed.
- **OKLCH-only colors** (DESIGN.md via UI-SPEC): every color reference uses `var(--color-*)`. Edit 9's CSS uses `var(--color-border)` for scrollbar; the mask uses `transparent` (the only acceptable non-OKLCH value, since it's not a color but an alpha state).
- **Mobile-first 48 px touch targets** (CLAUDE.md, NAV-ALL-03): preserved verbatim — `min-h-[48px]` on every tab is unchanged.
- **GSD workflow** (CLAUDE.md): file edits must be inside a GSD command. This phase is run via `/gsd-execute-phase 45` after planning.
- **Phase 41 D-04 ARIA contract is preserved** (CONTEXT.md D-05): `role="tablist" / role="tab" / aria-selected`, NOT `role="navigation" / aria-current="page"`. The ROADMAP's success-criterion-3 mention of `aria-current="page"` is explicitly superseded.
- **HamburgerMenu.svelte is not modified** (CONTEXT.md D-09).
- **`favorites.svelte.ts` is not modified** (CONTEXT.md non-goal).
- **`registry.ts` is not modified** (CONTEXT.md non-goal).

---

## 7. Phase Requirements → Implementation Mapping

| Req ID | Description | Edit(s) | Test(s) |
|--------|-------------|---------|---------|
| NAV-ALL-01 | Desktop nav renders every registered calculator | Edits 2, 4 | T-07, T-08, T-09 (vitest); NAV-ALL-TEST-01a, 01c, 01d (Playwright) |
| NAV-ALL-02 | Mobile bottom bar unchanged from v1.13 | Edits 1, 3 (rename only) | T-08 mobile assertion (vitest); NAV-ALL-TEST-01b mobile assertion (Playwright) |
| NAV-ALL-03 | Desktop preserves all v1.13 visual contracts | NONE — desktop `<a>` block at lines 59-73 is preserved verbatim | T-07 label/order; existing T-04 active-route; NAV-ALL-TEST-03 axe |
| NAV-ALL-04 | Hamburger button visible on desktop | NONE — header at lines 36-47 is unchanged (hamburger is in the always-visible header, not gated on `md:` anything) | Implicit: existing `e2e/navigation.spec.ts:23` asserts hamburger visible at any viewport — re-runs in CI |
| NAV-ALL-05 | Desktop layout reflows gracefully at 768/1024/1280 | Edits 5, 6, 7, 8, 9 (scroll + fade + auto-scroll) | NAV-ALL-TEST-01d narrow-desktop check; NAV-ALL-TEST-03 narrow-desktop axe |
| NAV-ALL-TEST-01 | Playwright @1280 + @375 verifying divergence | n/a (test) | New file: `e2e/desktop-full-nav.spec.ts` (4 tests as drafted in §3) |
| NAV-ALL-TEST-02 | Vitest covers `desktopVisibleCalculators` derived | n/a (test) | New tests in `NavShell.test.ts` (T-07..T-12 as drafted in §2) |
| NAV-ALL-TEST-03 | Playwright axe sweep desktop @1280 light + dark | n/a (test) | New file: `e2e/desktop-full-nav-a11y.spec.ts` (4 tests as drafted in §4) |

**Coverage:** 8 of 8 requirements addressed. ✓

---

## 8. Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 + @testing-library/svelte (component); Playwright 1.58.2 + @axe-core/playwright (E2E) |
| Config files | `vite.config.ts` (vitest section: `environment: 'jsdom'`, `setupFiles: ['src/test-setup.ts']`); `playwright.config.ts` |
| Quick run command (per file) | `pnpm vitest run src/lib/shell/NavShell.test.ts` |
| Full unit suite | `pnpm vitest run` |
| Playwright E2E suite | `pnpm playwright test` |
| Per-spec Playwright | `pnpm playwright test e2e/desktop-full-nav.spec.ts` |
| Type check | `pnpm svelte-check` |

### Phase Requirements → Test Map

| Req ID | Test Type | File | Automated Command | File Exists? |
|--------|-----------|------|-------------------|-------------|
| NAV-ALL-01 | unit (component) | `src/lib/shell/NavShell.test.ts` (extend) | `pnpm vitest run src/lib/shell/NavShell.test.ts` | ✅ extend |
| NAV-ALL-02 | unit (component) | same | same | ✅ extend |
| NAV-ALL-03 | unit + e2e | NavShell.test.ts + desktop-full-nav-a11y.spec.ts | unit + `pnpm playwright test e2e/desktop-full-nav-a11y.spec.ts` | ✅ extend / ❌ new |
| NAV-ALL-04 | e2e | existing `e2e/navigation.spec.ts` | `pnpm playwright test e2e/navigation.spec.ts` | ✅ existing |
| NAV-ALL-05 | e2e | desktop-full-nav.spec.ts (TEST-01d) + desktop-full-nav-a11y.spec.ts (768 sweep) | playwright | ❌ new |
| NAV-ALL-TEST-01 | e2e | `e2e/desktop-full-nav.spec.ts` | `pnpm playwright test e2e/desktop-full-nav.spec.ts` | ❌ new |
| NAV-ALL-TEST-02 | unit | `src/lib/shell/NavShell.test.ts` | `pnpm vitest run src/lib/shell/NavShell.test.ts` | ✅ extend |
| NAV-ALL-TEST-03 | e2e + axe | `e2e/desktop-full-nav-a11y.spec.ts` | `pnpm playwright test e2e/desktop-full-nav-a11y.spec.ts` | ❌ new |

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/lib/shell/NavShell.test.ts && pnpm svelte-check`
- **Per wave merge:** `pnpm vitest run && pnpm playwright test e2e/desktop-full-nav.spec.ts e2e/desktop-full-nav-a11y.spec.ts`
- **Phase gate:** Full vitest + full Playwright + svelte-check 0/0 + `pnpm build`

### Wave 0 Gaps
- [ ] `e2e/desktop-full-nav.spec.ts` — covers NAV-ALL-TEST-01 + NAV-ALL-05
- [ ] `e2e/desktop-full-nav-a11y.spec.ts` — covers NAV-ALL-TEST-03

No framework install needed — Vitest, Playwright, AxeBuilder, jest-dom matchers, ResizeObserver shim, matchMedia shim all already present and verified.

---

## 9. Architecture Patterns

### Recommended Project Structure
No structural change. The single source-of-truth file is `src/lib/shell/NavShell.svelte`. Tests live in:
```
src/lib/shell/
├── NavShell.svelte         # MODIFIED (9 edits)
├── NavShell.test.ts        # EXTENDED (T-07..T-12)
├── HamburgerMenu.svelte    # UNCHANGED
└── registry.ts             # UNCHANGED

e2e/
├── desktop-full-nav.spec.ts        # NEW (NAV-ALL-TEST-01)
├── desktop-full-nav-a11y.spec.ts   # NEW (NAV-ALL-TEST-03)
├── favorites-nav.spec.ts           # UNCHANGED (regression check)
├── favorites-nav-a11y.spec.ts      # UNCHANGED (regression check)
└── navigation.spec.ts              # UNCHANGED (regression check, NAV-ALL-04 implicitly verified)
```

### Pattern 1: Module-scope const + reactive `$derived` symmetry

The new `desktopVisibleCalculators` mirrors the existing `byId` Map pattern:
```typescript
// Static, registry-driven, never reactive:
const byId = new Map<string, CalculatorEntry>(CALCULATOR_REGISTRY.map((c) => [c.id, c]));
const desktopVisibleCalculators: readonly CalculatorEntry[] = [...CALCULATOR_REGISTRY];

// Reactive, favorites-driven:
const mobileVisibleCalculators = $derived(
  favorites.current.map((id) => byId.get(id)).filter((c): c is CalculatorEntry => c !== undefined)
);
```
Both patterns exist side-by-side in the same script block. The `readonly` type annotation prevents accidental mutation downstream.

### Pattern 2: Effect with explicit dependency + cleanup

```typescript
$effect(() => {
  const _path = page.url.pathname; // explicit dependency
  // ... effect body
});

$effect(() => {
  // ... setup
  return () => cleanup();  // teardown function
});
```

Both patterns are first-class Svelte 5 idioms verified in Svelte docs.

---

## 10. Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Detect "is the active tab visible in the scroll container" | Manual `getBoundingClientRect()` math | `Element.scrollIntoView({inline: 'nearest'})` — does the no-op-when-visible logic for free |
| Detect overflow on resize/font-load/theme-toggle | `window.addEventListener('resize', ...)` + manual reflow callbacks | `ResizeObserver` — covers all three triggers natively, single observer instance |
| Right-edge gradient fade | Absolutely-positioned `<div>` overlay with `pointer-events: none` and a per-theme background gradient | CSS `mask-image` with `transparent` terminal — automatic theme-agnosticism, preserves tab interactivity, fewer DOM nodes |
| Reduced-motion respect for JS-driven animation | Subscribe to `matchMedia.addEventListener('change', ...)` and cache the value | Query `matchMedia('(prefers-reduced-motion: reduce)').matches` at the moment of animation — preference rarely changes mid-session |
| Tab focus-driven scroll-into-view | Custom `focusin` handler that calls `scrollIntoView` | UA-default behavior: focusing an `<a>` inside `overflow: auto` already scrolls it into view |

---

## 11. Common Pitfalls

### Pitfall 1: Renaming `visibleCalculators` without updating both `<nav>` blocks
**What goes wrong:** TypeScript catches it (Svelte 5 with `<script lang="ts">` triggers compile error in `{#each visibleCalculators ...}` if the const doesn't exist).
**How to avoid:** Edit 1 + Edit 3 + Edit 4 are **atomic** — must land in the same task. If only Edit 1 lands, the build fails.
**Warning signs:** `pnpm svelte-check` reports `Cannot find name 'visibleCalculators'`.

### Pitfall 2: Putting `tablist-scroll` on the outer `<nav>` instead of the inner `<div>`
**What goes wrong:** The outer `<nav class="ml-4 hidden gap-2 md:flex">` is a flex container. Adding `overflow-x-auto` to it would clip the inner row's hover/focus rings vertically because flexbox + overflow-x has subtle interaction with vertical descenders.
**How to avoid:** Apply the scroll class to the **inner `<div role="tablist">`** (per Edit 5). UI-SPEC AUTO-6 documents this.
**Warning signs:** Focus rings or `border-b-2` underlines appear clipped at the top/bottom of tabs.

### Pitfall 3: Forgetting `-webkit-mask-image` prefix
**What goes wrong:** Safari < 15.4 silently ignores unprefixed `mask-image`. Clinical users on iPad Safari would see no fade.
**How to avoid:** Edit 9's CSS includes both `mask-image` and `-webkit-mask-image`. Keep both.
**Warning signs:** Visual QA on iPad Safari shows no fade at narrow widths.

### Pitfall 4: `bind:this` to a typed-as-`HTMLElement` ref but not narrowing in the effect
**What goes wrong:** TypeScript reports `Object is possibly 'null'`.
**How to avoid:** The `if (!tablistEl) return;` guard at the top of both effects (Edits 7 + 8) is required, not optional. After the guard, TS narrows to `HTMLElement`.
**Warning signs:** `pnpm svelte-check` reports a null-narrowing error.

### Pitfall 5: Putting the `$effect` cleanup outside the returned function
**What goes wrong:** `ResizeObserver` is never disconnected when the component unmounts → memory leak across SPA navigation.
**How to avoid:** `return () => ro.disconnect();` — the function returned from `$effect` is the teardown.
**Warning signs:** Chrome DevTools Memory profile shows growing observer count after repeated tab navigation.

---

## 12. Sources

### Primary (HIGH confidence)
- `src/lib/shell/NavShell.svelte` (read in full, lines 1-131)
- `src/lib/shell/NavShell.test.ts` (read in full, lines 1-157)
- `src/lib/shell/registry.ts` (read in full, lines 1-60)
- `src/lib/shell/HamburgerMenu.svelte` (read in full, lines 1-199)
- `src/lib/shared/favorites.svelte.ts` (read in full, lines 1-126)
- `src/test-setup.ts` (read in full, lines 1-143) — confirms ResizeObserver + matchMedia mocks
- `src/app.css` (read in full, lines 1-283) — confirms no `mask-image` conflicts, confirms reduced-motion global rule at lines 147-151
- `e2e/favorites-nav.spec.ts` (read in full) — pattern source for NAV-ALL-TEST-01
- `e2e/favorites-nav-a11y.spec.ts` (read in full) — supporting axe pattern
- `e2e/fortification-a11y.spec.ts` (read in full) — pattern source for NAV-ALL-TEST-03
- `e2e/navigation.spec.ts` (read in full) — confirms NAV-ALL-04 already covered
- `.planning/phases/45-desktop-full-nav-divergence/45-CONTEXT.md` (D-01..D-09 — locked)
- `.planning/phases/45-desktop-full-nav-divergence/45-UI-SPEC.md` (A1, A2, A3 + AUTO-1..AUTO-10)
- `.planning/REQUIREMENTS.md` (NAV-ALL-01..05, NAV-ALL-TEST-01..03)

### Secondary (HIGH confidence — referenced existing patterns)
- `src/lib/shared/components/NumericInput.svelte:1-9` — reduced-motion `matchMedia` query pattern
- `src/lib/shared/components/InputDrawer.svelte:164` — `@media (prefers-reduced-motion: no-preference)` CSS gate pattern
- `src/lib/shared/components/InputDrawer.test.ts:83-92` — source-string test pattern for reduced-motion gating
- Svelte 5 `$effect` cleanup behavior — [CITED: svelte.dev/docs/svelte/$effect "If a function is returned from the effect, it will be called immediately before the effect re-runs, and again before it is destroyed."]

### Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| (none) | All claims in this research are verified by direct file reads or existing-pattern analogs in the codebase. | — | — |

---

## 13. Open Questions

**(none)**

Every decision is locked in CONTEXT.md or UI-SPEC.md, and every line being modified is concrete and quoted above. The planner can write `<action>` blocks by splicing the verbatim before/after text directly.

---

## 14. Metadata

**Confidence breakdown:**
- Per-edit anchors: HIGH — full file read, no ambiguity
- Test extension patterns: HIGH — both vitest and Playwright analogs read in full
- Edge-case handling: HIGH — every case verified against codebase or Svelte docs
- E2E spec recommendations: HIGH — pattern source files identified and quoted
- CSS interactions: HIGH — full app.css reviewed, no conflicts

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (stable surface; only changes if SvelteKit major version bumps or registry expands beyond 5 entries)

---

## RESEARCH COMPLETE
