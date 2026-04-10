import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Feeds Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/feeds');

		await page
			.getByRole('heading', { name: 'Feed Advance Calculator' })
			.waitFor({ state: 'visible' });

		// Dismiss the disclaimer modal if it appears
		await page
			.getByRole('button', { name: /understand|acknowledge/i })
			.click({ timeout: 2000 })
			.catch(() => {});
	});

	test('feeds page has no axe violations in light mode', async ({ page }) => {
		await page.evaluate(() => {
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light');
			document.documentElement.setAttribute('data-theme', 'light');
		});

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});

	test('feeds page has no axe violations in dark mode', async ({ page }) => {
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

	test('feeds page has no axe violations with focus visible', async ({ page }) => {
		// Tab through elements to trigger focus ring on interactive elements
		await page.keyboard.press('Tab');

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});
});
