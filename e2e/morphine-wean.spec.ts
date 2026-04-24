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
    await expect(page.getByLabel('Dosing weight', { exact: true })).toHaveValue('3');
    await expect(page.getByLabel('Max morphine dose', { exact: true })).toHaveValue('0.04');
    await expect(page.getByLabel('Decrease per step', { exact: true })).toHaveValue('10');
  });

  test('displays 10-step weaning schedule with defaults', async ({ page }) => {
    await expect(page.getByText(/Step 1: Starting dose/)).toBeVisible();
    // Check a few key steps are present (avoid strict mode with Step 10 matching Step 1)
    const scheduleRegion = page.locator('[aria-label="Weaning schedule"]');
    await expect(scheduleRegion.locator('[data-step-index]')).toHaveCount(10);
  });

  test('summary card shows total reduction percentage', async ({ page }) => {
    // Defaults: 90% total reduction (formatPercent → 2 decimals)
    const summary = page.getByTestId('morphine-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('90.00%');
    await expect(summary).toContainText('Total reduction');
  });

  test('reduction amounts show percentage alongside mg', async ({ page }) => {
    const scheduleRegion = page.locator('[aria-label="Weaning schedule"]');
    // Step 2 shows reduction via formatMg + formatPercent (3-decimal mg, 2-decimal %).
    await expect(scheduleRegion).toContainText('-0.012 mg (10.00%)');
  });

  test('no error-colored elements in schedule', async ({ page }) => {
    const scheduleRegion = page.locator('[aria-label="Weaning schedule"]');
    const errorElements = await scheduleRegion.locator('[class*="color-error"]').count();
    expect(errorElements).toBe(0);
  });

  test('does not render a weaning mode toggle', async ({ page }) => {
    await expect(page.getByRole('tablist', { name: 'Weaning mode' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Linear' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Compounding' })).toHaveCount(0);
  });

  test('clear inputs resets to default values', async ({ page }) => {
    // Change a value first
    await page.getByLabel('Dosing weight', { exact: true }).fill('7.5');
    // Clear resets to defaults, not empty
    await page.getByRole('button', { name: 'Clear inputs' }).click();
    await expect(page.getByLabel('Dosing weight', { exact: true })).toHaveValue('3');
    await expect(page.getByLabel('Max morphine dose', { exact: true })).toHaveValue('0.04');
    await expect(page.getByLabel('Decrease per step', { exact: true })).toHaveValue('10');
  });

  test('custom inputs produce correct starting dose', async ({ page }) => {
    await page.getByLabel('Dosing weight', { exact: true }).fill('5');
    await page.getByLabel('Max morphine dose', { exact: true }).fill('0.08');
    await page.getByLabel('Decrease per step', { exact: true }).fill('20');
    // Starting dose = 5 * 0.08 = 0.400 (formatMg → 3 decimals)
    const scheduleRegion = page.locator('[aria-label="Weaning schedule"]');
    await expect(scheduleRegion).toContainText('0.400');
  });

  test('schedule has aria-live region for screen readers', async ({ page }) => {
    const schedule = page.locator('[aria-label="Weaning schedule"]');
    await expect(schedule).toHaveAttribute('aria-live', 'polite');
  });
});
