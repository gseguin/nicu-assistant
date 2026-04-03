import { test, expect } from '@playwright/test';

test.describe('Morphine Wean Calculator', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/morphine-wean');
		await page
			.getByRole('button', { name: /understand/i })
			.click({ timeout: 2000 })
			.catch(() => {});
	});

	test('pre-fills default values from config', async ({ page }) => {
		await expect(page.getByLabel('Dosing weight')).toHaveValue('3.1');
		await expect(page.getByLabel('Max morphine dose')).toHaveValue('0.04');
		await expect(page.getByLabel('Decrease per step')).toHaveValue('10');
	});

	test('displays 10-step weaning schedule with defaults', async ({ page }) => {
		await expect(page.getByText(/Step 1 — Starting dose/)).toBeVisible();
		// Check a few key steps are present (avoid strict mode with Step 10 matching Step 1)
		const scheduleRegion = page.locator('[aria-label="Weaning schedule"]');
		await expect(scheduleRegion.locator('[data-step-index]')).toHaveCount(10);
	});

	test('summary card shows total reduction percentage', async ({ page }) => {
		// Linear mode with defaults: 90% total reduction
		const summary = page.locator('.bg-\\[var\\(--color-accent-light\\)\\]');
		await expect(summary).toBeVisible();
		await expect(summary).toContainText('90.0%');
		await expect(summary).toContainText('Total reduction');
	});

	test('reduction amounts show percentage alongside mg', async ({ page }) => {
		const scheduleRegion = page.locator('[aria-label="Weaning schedule"]');
		// Step 2 shows reduction with percentage
		await expect(scheduleRegion).toContainText('-0.0124 mg (10.0%)');
	});

	test('no error-colored elements in schedule', async ({ page }) => {
		const scheduleRegion = page.locator('[aria-label="Weaning schedule"]');
		const errorElements = await scheduleRegion.locator('[class*="color-error"]').count();
		expect(errorElements).toBe(0);
	});

	test('switching to compounding mode changes total reduction', async ({ page }) => {
		await page.getByRole('tab', { name: 'Compounding' }).click();
		await page.waitForTimeout(300);
		// Compounding total reduction is ~61.3%
		const summary = page.locator('.bg-\\[var\\(--color-accent-light\\)\\]');
		await expect(summary).toContainText(/6[0-2]\.\d%/);
	});

	test('clear inputs resets to default values', async ({ page }) => {
		// Change a value first
		await page.getByLabel('Dosing weight').fill('7.5');
		// Clear resets to defaults, not empty
		await page.getByRole('button', { name: 'Clear inputs' }).click();
		await expect(page.getByLabel('Dosing weight')).toHaveValue('3.1');
		await expect(page.getByLabel('Max morphine dose')).toHaveValue('0.04');
		await expect(page.getByLabel('Decrease per step')).toHaveValue('10');
	});

	test('custom inputs produce correct starting dose', async ({ page }) => {
		await page.getByLabel('Dosing weight').fill('5');
		await page.getByLabel('Max morphine dose').fill('0.08');
		await page.getByLabel('Decrease per step').fill('20');
		// Starting dose = 5 * 0.08 = 0.4000
		const scheduleRegion = page.locator('[aria-label="Weaning schedule"]');
		await expect(scheduleRegion).toContainText('0.4000');
	});

	test('mode tabs have correct ARIA attributes', async ({ page }) => {
		const tablist = page.getByRole('tablist', { name: 'Weaning mode' });
		await expect(tablist).toBeVisible();

		const linearTab = page.getByRole('tab', { name: 'Linear' });
		await expect(linearTab).toHaveAttribute('aria-selected', 'true');

		const compoundingTab = page.getByRole('tab', { name: 'Compounding' });
		await expect(compoundingTab).toHaveAttribute('aria-selected', 'false');
	});

	test('schedule has aria-live region for screen readers', async ({ page }) => {
		const schedule = page.locator('[aria-label="Weaning schedule"]');
		await expect(schedule).toHaveAttribute('aria-live', 'polite');
	});
});
