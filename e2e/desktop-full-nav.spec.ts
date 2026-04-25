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
