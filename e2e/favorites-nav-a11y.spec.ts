// e2e/favorites-nav-a11y.spec.ts
// FAV-TEST-04: Axe accessibility sweep of the open hamburger menu in light + dark themes.
// Pattern source: gir-a11y.spec.ts (axe import + light/dark sweep pattern).

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Favorites hamburger — accessibility (FAV-TEST-04)', () => {
	test.beforeEach(async ({ page }) => {
		// D-11: pre-clear favorites + disclaimer for order-independence
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
		// Open hamburger and wait for dialog to be visible
		await page.getByRole('button', { name: 'Open calculator menu' }).click();
		await page.getByRole('dialog').waitFor({ state: 'visible' });
	});

	test('open hamburger has no axe violations in light mode', async ({ page }) => {
		// Ensure light mode (remove dark class if present)
		await page.evaluate(() => {
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light');
			document.documentElement.setAttribute('data-theme', 'light');
		});

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});

	test('open hamburger has no axe violations in dark mode', async ({ page }) => {
		await page.evaluate(() => {
			document.documentElement.classList.add('no-transition');
			document.documentElement.classList.remove('light');
			document.documentElement.classList.add('dark');
			document.documentElement.setAttribute('data-theme', 'dark');
		});
		await page.waitForTimeout(250);

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});
});
