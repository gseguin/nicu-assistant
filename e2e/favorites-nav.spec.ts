// e2e/favorites-nav.spec.ts
// FAV-TEST-03: Favorites-driven navigation — full add/remove/persist E2E flow.
// Pattern source: feeds.spec.ts (viewport loop) + disclaimer.spec.ts (localStorage pre-clear).
//
// Implementation notes:
// - page.addInitScript scripts run on EVERY navigation (including reload) in registration order.
//   The beforeEach registers a REMOVE script. Tests that need a specific non-default state must
//   register a SET script in the test body (before reload) — it runs AFTER the REMOVE, so SET wins.
// - FAV-TEST-03-3 (persist) verifies via localStorage read rather than reload, because a reload
//   would re-trigger the beforeEach addInitScript and clear the state.
// - Desktop viewport (1280px) hides the mobile bottom nav (md:hidden). Use .first() for the
//   desktop top nav; .last() for the mobile bottom nav. Both share aria-label="Calculator navigation".

import { test, expect } from '@playwright/test';

const viewports = [
	{ name: 'mobile', width: 375, height: 667 },
	{ name: 'desktop', width: 1280, height: 800 }
];

for (const vp of viewports) {
	test.describe(`Favorites nav — ${vp.name} (${vp.width}x${vp.height})`, () => {
		test.use({ viewport: { width: vp.width, height: vp.height } });

		// On mobile (< 768px), the bottom nav is visible (last nav).
		// On desktop (>= 768px), the top nav in the header is used (first nav).
		const isDesktop = vp.width >= 768;

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

		test('FAV-TEST-03-1: un-favorite Feeds → bar shows 3 tabs (Morphine/Formula/GIR)', async ({
			page
		}) => {
			// Open hamburger
			await page.getByRole('button', { name: 'Open calculator menu' }).click();
			await page.getByRole('dialog').waitFor({ state: 'visible' });

			// Un-favorite Feeds
			await page.getByRole('button', { name: /remove feeds from favorites/i }).click();

			// Close hamburger (Esc)
			await page.keyboard.press('Escape');
			await page.getByRole('dialog').waitFor({ state: 'hidden' });

			// Pick the correct nav bar: first() = desktop top nav, last() = mobile bottom nav
			const nav = isDesktop
				? page.locator('nav[aria-label="Calculator navigation"]').first()
				: page.locator('nav[aria-label="Calculator navigation"]').last();
			await expect(nav.getByRole('tab')).toHaveCount(3);
			await expect(nav.getByRole('tab', { name: /morphine wean/i })).toBeVisible();
			await expect(nav.getByRole('tab', { name: /formula/i })).toBeVisible();
			await expect(nav.getByRole('tab', { name: /gir/i })).toBeVisible();
			await expect(nav.getByRole('tab', { name: /feeds/i })).toHaveCount(0);
		});

		test('FAV-TEST-03-2: re-favorite Feeds → bar shows 4 tabs in registry order', async ({
			page
		}) => {
			// Plan 01-04 (D-19/D-20/D-21): registry alphabetized; recover() preserves
			// stored order verbatim, but toggle() on add still re-sorts to registry
			// order (alphabetical post-D-19). Pre-state mirrors the
			// post-un-favorite-Feeds state: 3 of the 4 alphabetical defaults.
			await page.addInitScript(() => {
				localStorage.setItem(
					'nicu:favorites',
					JSON.stringify({ v: 1, ids: ['formula', 'gir', 'morphine-wean'] })
				);
			});
			await page.reload();
			await page
				.getByRole('button', { name: /understand/i })
				.click({ timeout: 2000 })
				.catch(() => {});

			// Open hamburger and re-add Feeds
			await page.getByRole('button', { name: 'Open calculator menu' }).click();
			await page.getByRole('dialog').waitFor({ state: 'visible' });
			await page.getByRole('button', { name: /add feeds to favorites/i }).click();
			await page.keyboard.press('Escape');
			await page.getByRole('dialog').waitFor({ state: 'hidden' });

			// Bar shows 4 tabs in registry order (alphabetical post-D-19).
			const nav = isDesktop
				? page.locator('nav[aria-label="Calculator navigation"]').first()
				: page.locator('nav[aria-label="Calculator navigation"]').last();
			const tabs = nav.getByRole('tab');
			await expect(tabs).toHaveCount(4);
			await expect(tabs.nth(0)).toContainText('Feeds');
			await expect(tabs.nth(1)).toContainText('Formula');
			await expect(tabs.nth(2)).toContainText('GIR');
			await expect(tabs.nth(3)).toContainText('Morphine');
		});

		test('FAV-TEST-03-3: favorites persist to localStorage after un-favorite', async ({
			page
		}) => {
			// Un-favorite Feeds via hamburger
			await page.getByRole('button', { name: 'Open calculator menu' }).click();
			await page.getByRole('dialog').waitFor({ state: 'visible' });
			await page.getByRole('button', { name: /remove feeds from favorites/i }).click();
			await page.keyboard.press('Escape');
			await page.getByRole('dialog').waitFor({ state: 'hidden' });

			// Verify bar shows 3 tabs immediately (reactive)
			const nav = isDesktop
				? page.locator('nav[aria-label="Calculator navigation"]').first()
				: page.locator('nav[aria-label="Calculator navigation"]').last();
			await expect(nav.getByRole('tab')).toHaveCount(3);
			await expect(nav.getByRole('tab', { name: /feeds/i })).toHaveCount(0);

			// Verify localStorage was persisted (would survive a reload)
			const stored = await page.evaluate(() => localStorage.getItem('nicu:favorites'));
			const parsed = JSON.parse(stored ?? '{}');
			expect(parsed.ids).not.toContain('feeds');
			expect(parsed.ids).toHaveLength(3);
		});

		test('FAV-TEST-03-4: navigate to un-favorited route → no tab is active (NAV-FAV-03)', async ({
			page
		}) => {
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

			// Navigate to /feeds via hamburger
			await page.getByRole('button', { name: 'Open calculator menu' }).click();
			await page.getByRole('dialog').waitFor({ state: 'visible' });
			await page.getByRole('link', { name: /feeds/i }).click();
			await page.waitForURL(/\/feeds/);

			// Bar shows 3 tabs (feeds not rendered)
			const nav = isDesktop
				? page.locator('nav[aria-label="Calculator navigation"]').first()
				: page.locator('nav[aria-label="Calculator navigation"]').last();
			await expect(nav.getByRole('tab')).toHaveCount(3);

			// No tab is active (aria-selected=true must not appear on any tab)
			const allTabs = nav.getByRole('tab');
			const count = await allTabs.count();
			for (let i = 0; i < count; i++) {
				await expect(allTabs.nth(i)).toHaveAttribute('aria-selected', 'false');
			}
		});
	});
}
