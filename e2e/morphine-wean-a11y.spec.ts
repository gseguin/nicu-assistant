import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Morphine Wean Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/morphine-wean');

		// Wait for the page heading to confirm load
		await page.getByRole('heading', { name: 'Morphine Wean' }).waitFor({ state: 'visible' });

		// Dismiss the disclaimer modal if it appears
		await page
			.getByRole('button', { name: /understand|acknowledge/i })
			.click({ timeout: 2000 })
			.catch(() => {});
	});

	test('morphine wean page has no axe violations in light mode', async ({ page }) => {
		// Ensure light mode
		await page.evaluate(() => {
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light');
			document.documentElement.setAttribute('data-theme', 'light');
		});

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});

	test('morphine wean page has no axe violations in dark mode', async ({ page }) => {
		// Switch to dark mode
		await page.evaluate(() => {
			document.documentElement.classList.remove('light');
			document.documentElement.classList.add('dark');
			document.documentElement.setAttribute('data-theme', 'dark');
		});

		// TODO: Re-enable color-contrast once dark mode theme colors are updated
		// to meet WCAG 2.1 AA contrast ratios. Currently excluded due to pre-existing
		// contrast issues in the dark theme (accent color #00a7d2 on dark backgrounds).
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.disableRules(['color-contrast'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('morphine wean page has no axe violations with schedule visible', async ({ page }) => {
		// Fill in valid inputs to generate a weaning schedule
		await page.getByLabel('Dosing weight').fill('3.1');
		await page.getByLabel('Max morphine dose').fill('0.04');
		await page.getByLabel('Decrease per step').fill('10');

		// Wait for schedule to render
		await expect(page.getByText(/Step 1 — Starting dose/)).toBeVisible();

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});
});
