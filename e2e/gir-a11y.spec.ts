import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('GIR Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/gir');

		await page.getByRole('heading', { name: 'Glucose Infusion Rate' }).waitFor({ state: 'visible' });

		// Dismiss the disclaimer modal if it appears
		await page
			.getByRole('button', { name: /understand|acknowledge/i })
			.click({ timeout: 2000 })
			.catch(() => {});
	});

	test('gir page has no axe violations in light mode', async ({ page }) => {
		await page.evaluate(() => {
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light');
			document.documentElement.setAttribute('data-theme', 'light');
		});

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});

	test('gir page has no axe violations in dark mode', async ({ page }) => {
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

	test('gir page has no axe violations with focus ring visible', async ({ page }) => {
		await page.getByLabel('Weight').fill('3.1');
		await page.getByLabel('Dextrose').fill('10');
		await page.getByLabel('Fluid order').fill('80');

		// Render the identity focus ring so axe can see it
		await page.getByLabel('Weight').focus();

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		expect(results.violations).toEqual([]);
	});

	test('gir page has no axe violations with dextrose advisory rendered in light mode', async ({ page }) => {
		await page.evaluate(() => {
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light');
			document.documentElement.setAttribute('data-theme', 'light');
		});

		await page.getByLabel('Weight').fill('3.1');
		await page.getByLabel('Dextrose').fill('15');
		await page.getByLabel('Fluid order').fill('80');

		await expect(page.getByText(/requires central venous access/i)).toBeVisible();

		await page.addStyleTag({
			content:
				'*, *::before, *::after { transition: none !important; animation: none !important; }'
		});
		await page.waitForTimeout(250);

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
		expect(results.violations).toEqual([]);
	});

	test('gir page has no axe violations with selected bucket in light mode', async ({ page }) => {
		await page.evaluate(() => {
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light');
			document.documentElement.setAttribute('data-theme', 'light');
		});

		await page.getByLabel('Weight').fill('3.1');
		await page.getByLabel('Dextrose').fill('10');
		await page.getByLabel('Fluid order').fill('80');

		// Select a glucose bucket (first radio in the titration radiogroup)
		const radiogroup = page.getByRole('radiogroup', { name: /glucose range titration helper/i }).first();
		await radiogroup.getByRole('radio').first().click();

		await page.addStyleTag({
			content:
				'*, *::before, *::after { transition: none !important; animation: none !important; }'
		});
		await page.waitForTimeout(250);

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
		expect(results.violations).toEqual([]);
	});

	test('gir page has no axe violations with selected bucket in dark mode', async ({ page }) => {
		await page.evaluate(() => {
			document.documentElement.classList.add('no-transition');
			document.documentElement.classList.remove('light');
			document.documentElement.classList.add('dark');
			document.documentElement.setAttribute('data-theme', 'dark');
		});
		await page.waitForTimeout(250);

		await page.getByLabel('Weight').fill('3.1');
		await page.getByLabel('Dextrose').fill('10');
		await page.getByLabel('Fluid order').fill('80');

		const radiogroup = page.getByRole('radiogroup', { name: /glucose range titration helper/i }).first();
		await radiogroup.getByRole('radio').first().click();

		await page.addStyleTag({
			content:
				'*, *::before, *::after { transition: none !important; animation: none !important; }'
		});
		await page.waitForTimeout(250);

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
		expect(results.violations).toEqual([]);
	});
});
