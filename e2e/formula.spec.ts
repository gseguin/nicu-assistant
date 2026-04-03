import { test, expect } from '@playwright/test';

test.describe('Formula Calculator', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/formula');
		await page
			.getByRole('button', { name: /understand/i })
			.click({ timeout: 2000 })
			.catch(() => {});
	});

	test('renders formula page with mode tabs', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Formula Recipe' })).toBeVisible();
		await expect(page.getByRole('tab', { name: /Modified Formula/i })).toBeVisible();
		await expect(page.getByRole('tab', { name: /Breast Milk Fortifier/i })).toBeVisible();
	});

	test('shows empty state when no brand selected', async ({ page }) => {
		await expect(page.getByText(/Choose a formula brand above to see the recipe/)).toBeVisible();
	});

	test('brand selector shows placeholder', async ({ page }) => {
		await expect(page.getByText(/Select Brand/)).toBeVisible();
	});
});
