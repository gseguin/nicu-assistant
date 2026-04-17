import { test, expect } from '@playwright/test';

test.describe('Navigation (v1.2 restructure)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/morphine-wean');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });

  test('top title bar shows app name, info, and theme toggle', async ({ page }) => {
    // Use the banner landmark (NavShell header has role="banner" via <header>)
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();
    await expect(header.getByText('NICU Assist')).toBeVisible();
    await expect(header.getByRole('button', { name: /about/i })).toBeVisible();
    await expect(header.getByRole('button', { name: /switch to/i })).toBeVisible();
  });

  test('mobile bottom nav has only calculator tabs filling full width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // The bottom nav is the last nav element
    const bottomNav = page.locator('nav[aria-label="Calculator navigation"]').last();
    await expect(bottomNav).toBeVisible();

    const tabs = bottomNav.getByRole('tab');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toContainText('Morphine Wean');
    await expect(tabs.nth(1)).toContainText('Formula');
    await expect(tabs.nth(2)).toContainText('GIR');
    await expect(tabs.nth(3)).toContainText('Feeds');

    await expect(bottomNav.getByRole('button', { name: /about/i })).toHaveCount(0);
    await expect(bottomNav.getByRole('button', { name: /switch to/i })).toHaveCount(0);
  });

  test('switching between calculators preserves navigation', async ({ page }) => {
    await expect(page).toHaveURL(/morphine-wean/);

    await page
      .getByRole('tab', { name: /formula/i })
      .first()
      .click();
    await expect(page).toHaveURL(/formula/);

    await page
      .getByRole('tab', { name: /morphine/i })
      .first()
      .click();
    await expect(page).toHaveURL(/morphine-wean/);
  });

  test('desktop layout shows all controls in top bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const header = page.getByRole('banner');
    await expect(header.getByRole('tab', { name: /morphine/i })).toBeVisible();
    await expect(header.getByRole('tab', { name: /formula/i })).toBeVisible();
    await expect(header.getByText('NICU Assist')).toBeVisible();
  });

  test('theme toggle switches between light and dark mode', async ({ page }) => {
    await page.getByRole('button', { name: /switch to/i }).click();
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
      true
    );

    await page.getByRole('button', { name: /switch to/i }).click();
    expect(await page.evaluate(() => !document.documentElement.classList.contains('dark'))).toBe(
      true
    );
  });

  test('info button opens the about sheet', async ({ page }) => {
    await page.getByRole('button', { name: /about/i }).click();
    await expect(page.getByRole('dialog').getByText('Morphine Wean Calculator')).toBeVisible();
  });
});
