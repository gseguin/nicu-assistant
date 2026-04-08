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

	test('fortification page has no axe violations in light mode', async ({ page }) => {
		// Ensure light mode
		await page.evaluate(() => {
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light');
			document.documentElement.setAttribute('data-theme', 'light');
		});

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});

	test('fortification page has no axe violations in dark mode', async ({ page }) => {
		// Switch to dark mode. Disable theme transitions so axe reads the final
		// computed colors rather than mid-transition interpolations.
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

	test('fortification page has no axe violations with results visible', async ({ page }) => {
		// Ensure light mode
		await page.evaluate(() => {
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light');
			document.documentElement.setAttribute('data-theme', 'light');
		});

		// Default state (Breast milk / 180 mL / Neocate Infant / 24 kcal/oz / Teaspoons)
		// already produces a visible fortification result — wait for the hero output.
		await expect(page.getByText('Amount to Add')).toBeVisible();

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});
});
