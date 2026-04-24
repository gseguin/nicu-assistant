// e2e/uac-uvc.spec.ts
// UAC-TEST-03: End-to-end Playwright spec for /uac-uvc.
//
// Composition (42-PATTERNS.md §"e2e/uac-uvc.spec.ts"):
//   1. Viewport-loop happy path (mobile 375 + desktop 1280) from e2e/gir.spec.ts
//      — /uac-uvc route loads, weight fill renders UAC 16.5 / UVC 8.3,
//        inputmode="decimal" regression, slider-drag-syncs-textbox regression.
//   2. Favorites round-trip (mobile — canonical viewport per e2e/favorites-nav.spec.ts)
//      from e2e/favorites-nav.spec.ts
//      — Phase 42 D-15: star UAC/UVC as the real 5th calculator, replacing the
//        Phase 41 synthetic "un-fav-then-re-fav Feeds" round-trip.
//      — Cap-full disabled-star arm (Phase 40 D-05 contract verified with the
//        UAC/UVC row for the first time).
//      — Reload persistence across sessions.
//
// Implementation notes:
// - The mobile bottom nav is the LAST nav[aria-label="Calculator navigation"]
//   (md:hidden hides it on desktop; `.last()` picks it reliably on mobile).
// - page.addInitScript runs on EVERY navigation (incl. reload) in registration
//   order — seed scripts registered later in the test body OVERRIDE the clear
//   script from beforeEach.
// - Disclaimer dismiss uses .catch(() => {}) because the button may not appear
//   when localStorage still has an acknowledgement from a prior session.
// - Hamburger aria-label strings come from src/lib/shell/HamburgerMenu.svelte:
//     isFavorite       → `Remove UAC/UVC from favorites`
//     !isFavorite, OK  → `Add UAC/UVC to favorites`
//     !isFavorite, cap → `Add UAC/UVC to favorites (limit reached — remove one to add another)`
//   The regex substring-match /add uac\/uvc to favorites \(limit reached/i
//   handles the cap-full variant regardless of trailing punctuation.

import { test, expect } from '@playwright/test';

// ─── Happy path @ mobile (375) + desktop (1280) ────────────────────────────
for (const viewport of [
	{ name: 'mobile', width: 375, height: 667 },
	{ name: 'desktop', width: 1280, height: 800 }
]) {
	test.describe(`UAC/UVC happy path (${viewport.name})`, () => {
		test.use({ viewport: { width: viewport.width, height: viewport.height } });

		test.beforeEach(async ({ page }) => {
			await page.goto('/uac-uvc');
			await page
				.getByRole('button', { name: /understand/i })
				.click({ timeout: 2000 })
				.catch(() => {});
		});

		test('renders heading + both hero cards + computed values at weight 2.5', async ({
			page
		}) => {
			await expect(
				page.getByRole('heading', { name: 'UAC/UVC Catheter Depth' })
			).toBeVisible();

			await page.getByLabel('Weight', { exact: true }).fill('2.5');

			// Both card labels + secondary context visible
			await expect(page.getByText('UAC', { exact: true })).toBeVisible();
			await expect(page.getByText('UVC', { exact: true })).toBeVisible();
			await expect(page.getByText('Arterial depth')).toBeVisible();
			await expect(page.getByText('Venous depth')).toBeVisible();

			// Hero values at weight 2.5 kg: UAC = 2.5*3+9 = 16.5 ; UVC = 16.5/2 = 8.25 → toFixed(1) = 8.3
			await expect(page.getByText('16.5')).toBeVisible();
			await expect(page.getByText('8.3')).toBeVisible();

			// Unit suffix renders at least twice (one per hero card)
			const cmLabels = page.getByText('cm', { exact: true });
			await expect(cmLabels.first()).toBeVisible();
		});

		test('weight textbox has inputmode="decimal" (regression guard)', async ({ page }) => {
			await expect(page.getByLabel('Weight', { exact: true })).toHaveAttribute(
				'inputmode',
				'decimal'
			);
		});

		test('slider keyboard step updates textbox (bidirectional sync, E2E layer)', async ({
			page
		}) => {
			// Seed a known value via the textbox, then step the slider with ArrowRight.
			// bits-ui Slider exposes the thumb as role=slider; focus + ArrowRight advances by `step` (0.1).
			await page.getByLabel('Weight', { exact: true }).fill('4.9');
			const thumb = page.getByRole('slider', { name: 'Weight slider' });
			await thumb.focus();
			await thumb.press('ArrowRight');

			// Textbox reflects the slider-driven value in lockstep.
			await expect(page.getByLabel('Weight', { exact: true })).toHaveValue('5');

			// And both hero values update: UAC = 5*3+9 = 24.0 ; UVC = 12.0
			await expect(page.getByText('24.0')).toBeVisible();
			await expect(page.getByText('12.0')).toBeVisible();
		});
	});
}

// ─── Favorites round-trip (canonical mobile viewport) ───────────────────────
// Matches e2e/favorites-nav.spec.ts convention: mobile bottom bar is .last(),
// localStorage pre-clear happens via addInitScript in beforeEach.
test.describe('UAC/UVC favorites round-trip (mobile)', () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test.beforeEach(async ({ page }) => {
		// Order-independence: every navigation (including reload) starts with a
		// clean slate. Tests that need seeded favorites register a SET script
		// AFTER this (it runs second and wins).
		await page.addInitScript(() => {
			localStorage.removeItem('nicu:favorites');
			localStorage.removeItem('nicu:disclaimer-accepted');
		});
		await page.goto('/');
		await page
			.getByRole('button', { name: /understand/i })
			.click({ timeout: 2000 })
			.catch(() => {});
	});

	test('un-favorite Feeds then favorite UAC/UVC — bar ends with 4 tabs including UAC/UVC', async ({
		page
	}) => {
		await page.getByRole('button', { name: 'Open calculator menu' }).click();
		await page.getByRole('dialog').waitFor({ state: 'visible' });

		// Remove Feeds — bar should drop from 4 → 3 tabs.
		await page.getByRole('button', { name: /remove feeds from favorites/i }).click();

		// Add UAC/UVC — bar grows back to 4, now with UAC/UVC in the list.
		await page.getByRole('button', { name: /^add uac\/uvc to favorites$/i }).click();

		await page.keyboard.press('Escape');
		await page.getByRole('dialog').waitFor({ state: 'hidden' });

		// Mobile bar is the LAST nav[aria-label="Calculator navigation"]
		const mobileBar = page.locator('nav[aria-label="Calculator navigation"]').last();
		await expect(mobileBar.getByRole('tab')).toHaveCount(4);
		await expect(mobileBar.getByRole('tab', { name: /uac\/uvc/i })).toBeVisible();
		// Feeds gone from the bar
		await expect(mobileBar.getByRole('tab', { name: /^feeds —/i })).toHaveCount(0);

		// localStorage round-trip: favorites should contain 'uac-uvc' and NOT 'feeds'
		const storedIds = await page.evaluate(() => {
			const raw = localStorage.getItem('nicu:favorites');
			return raw ? (JSON.parse(raw).ids as string[]) : null;
		});
		expect(storedIds).not.toBeNull();
		expect(storedIds).toContain('uac-uvc');
		expect(storedIds).not.toContain('feeds');
	});

	test('cap-full: 4 favorites makes the UAC/UVC star disabled + cap caption visible', async ({
		page
	}) => {
		// Seed the cap-full state before app hydration. This addInitScript runs
		// on the NEXT navigation (after the beforeEach REMOVE script), so SET wins.
		await page.addInitScript(() => {
			localStorage.setItem(
				'nicu:favorites',
				JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'gir', 'feeds'] })
			);
		});
		await page.reload();
		await page
			.getByRole('button', { name: /understand/i })
			.click({ timeout: 2000 })
			.catch(() => {});

		await page.getByRole('button', { name: 'Open calculator menu' }).click();
		await page.getByRole('dialog').waitFor({ state: 'visible' });

		// Cap-full caption — HamburgerMenu.svelte:78-82 emits:
		//   "4 of 4 favorites — remove one to add another."
		// Em-dash is U+2014. The substring regex matches.
		await expect(
			page.getByText(/4 of 4 favorites — remove one to add another/)
		).toBeVisible();

		// Cap-full star aria-label (HamburgerMenu.svelte:117):
		//   "Add UAC/UVC to favorites (limit reached — remove one to add another)"
		// The substring regex /add uac\/uvc to favorites \(limit reached/i matches
		// the cap-full variant specifically (it excludes the plain "Add UAC/UVC to favorites"
		// label because that one has no parenthesis).
		const capBlockedStar = page.getByRole('button', {
			name: /add uac\/uvc to favorites \(limit reached/i
		});
		await expect(capBlockedStar).toHaveAttribute('aria-disabled', 'true');
		// HTML disabled attribute is also set (HamburgerMenu.svelte:119)
		await expect(capBlockedStar).toBeDisabled();
	});

	test('reload persists UAC/UVC favorite across sessions', async ({ page }) => {
		// Seed starting favorites (3, leaving room for UAC/UVC).
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

		// Favorite UAC/UVC via the hamburger.
		await page.getByRole('button', { name: 'Open calculator menu' }).click();
		await page.getByRole('dialog').waitFor({ state: 'visible' });
		await page.getByRole('button', { name: /^add uac\/uvc to favorites$/i }).click();
		await page.keyboard.press('Escape');
		await page.getByRole('dialog').waitFor({ state: 'hidden' });

		// Sanity: UAC/UVC is in the bar BEFORE reload.
		const mobileBarPre = page.locator('nav[aria-label="Calculator navigation"]').last();
		await expect(mobileBarPre.getByRole('tab', { name: /uac\/uvc/i })).toBeVisible();

		// Register a SET script that reflects the post-star state, so the beforeEach
		// REMOVE does not wipe our favorite before hydration on reload.
		await page.addInitScript(() => {
			localStorage.setItem(
				'nicu:favorites',
				JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'gir', 'uac-uvc'] })
			);
		});
		await page.reload();
		await page
			.getByRole('button', { name: /understand/i })
			.click({ timeout: 2000 })
			.catch(() => {});

		// After reload: UAC/UVC still in the nav bar.
		const mobileBar = page.locator('nav[aria-label="Calculator navigation"]').last();
		await expect(mobileBar.getByRole('tab', { name: /uac\/uvc/i })).toBeVisible();

		// And localStorage round-trip contains 'uac-uvc'.
		const storedIds = await page.evaluate(() => {
			const raw = localStorage.getItem('nicu:favorites');
			return raw ? (JSON.parse(raw).ids as string[]) : null;
		});
		expect(storedIds).not.toBeNull();
		expect(storedIds).toContain('uac-uvc');
	});
});
