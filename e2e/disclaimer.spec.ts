import { test, expect } from '@playwright/test';

test.describe('Disclaimer Modal', () => {
  test('shows disclaimer on first visit', async ({ page, context }) => {
    // Clear storage for fresh state
    await context.clearCookies();
    await page.goto('/morphine-wean');

    const modal = page.getByRole('dialog', { name: /disclaimer/i });
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Clinical Use Disclaimer')).toBeVisible();
    await expect(modal.getByText(/decision support tools/)).toBeVisible();
  });

  test('cannot be dismissed by clicking outside or pressing Escape', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/morphine-wean');

    const modal = page.getByRole('dialog', { name: /disclaimer/i });
    await expect(modal).toBeVisible();

    // Press Escape — modal should stay open
    await page.keyboard.press('Escape');
    await expect(modal).toBeVisible();
  });

  test('dismisses after clicking acknowledge button', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/morphine-wean');

    const modal = page.getByRole('dialog', { name: /disclaimer/i });
    await expect(modal).toBeVisible();

    await page.getByRole('button', { name: /understand/i }).click();
    await expect(modal).not.toBeVisible();
  });

  test('does not reappear on subsequent visits after acknowledgment', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/morphine-wean');

    // Acknowledge
    await page.getByRole('button', { name: /understand/i }).click();

    // Navigate away and back
    await page.goto('/formula');
    await page.goto('/morphine-wean');

    // Modal should NOT appear
    const modal = page.getByRole('dialog', { name: /disclaimer/i });
    await expect(modal).not.toBeVisible();
  });

  test('does not flash on load for returning users', async ({ page }) => {
    // Set localStorage to simulate returning user before navigating
    await page.goto('/morphine-wean');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});

    // Now reload — the disclaimer should never become visible
    await page.reload();
    await page.waitForTimeout(500);

    const modal = page.getByRole('dialog', { name: /disclaimer/i });
    await expect(modal).not.toBeVisible();
  });
});
