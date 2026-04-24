// e2e/disclaimer-banner.spec.ts
// Phase 42.1-03 D-15: replaces the legacy DisclaimerModal e2e (renamed via git mv
// from e2e/disclaimer.spec.ts to preserve history). Covers the new top-of-content
// DisclaimerBanner component:
//   - Banner visible on fresh install
//   - Dismiss + reload persists hidden state via _v2 localStorage key
//   - v1 -> v2 migration leaves banner hidden for users who acknowledged the modal
//   - "More" link opens AboutSheet at the Disclaimer row
//   - Keyboard (focus + Enter) dismisses the banner

import { test, expect } from '@playwright/test';

const KEY_V1 = 'nicu_assistant_disclaimer_v1';
const KEY_V2 = 'nicu_assistant_disclaimer_v2';

test.describe('Disclaimer Banner (D-12, D-14, D-15)', () => {
  test('shows banner on first visit', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/morphine-wean');

    const banner = page.getByRole('region', { name: /clinical use disclaimer/i });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/clinical decision support/i);
    await expect(banner).toContainText(/verify all values/i);
  });

  test('dismiss + reload keeps banner hidden (v2 persistence)', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/morphine-wean');

    const banner = page.getByRole('region', { name: /clinical use disclaimer/i });
    await expect(banner).toBeVisible();

    await page.getByRole('button', { name: /dismiss disclaimer/i }).click();
    await expect(banner).toHaveCount(0);

    const v2 = await page.evaluate((k) => localStorage.getItem(k), KEY_V2);
    expect(v2).toBe('true');

    await page.reload();
    await expect(page.getByRole('region', { name: /clinical use disclaimer/i })).toHaveCount(0);
  });

  test('v1 -> v2 migration: pre-existing v1 acknowledgment hides banner and writes v2', async ({
    page
  }) => {
    await page.addInitScript((k) => {
      localStorage.clear();
      localStorage.setItem(k, 'true');
    }, KEY_V1);
    await page.goto('/morphine-wean');

    // Wait for the route to hydrate so onMount + disclaimer.init() (which runs
    // the v1->v2 migration) has fired. Without this wait the next localStorage
    // probe can race the migration write.
    await page.getByRole('heading', { name: /morphine/i }).first().waitFor({ state: 'visible' });
    await page.waitForFunction(
      (k) => localStorage.getItem(k) === 'true',
      KEY_V2,
      { timeout: 5000 }
    );

    // Banner stays hidden — clinicians who already acknowledged the modal don't see it again.
    await expect(
      page.getByRole('region', { name: /clinical use disclaimer/i })
    ).toHaveCount(0);

    // Migration wrote v2 alongside the existing v1 (audit trail preserved).
    const v2 = await page.evaluate((k) => localStorage.getItem(k), KEY_V2);
    expect(v2).toBe('true');
    const v1 = await page.evaluate((k) => localStorage.getItem(k), KEY_V1);
    expect(v1).toBe('true');
  });

  test('"More" link opens AboutSheet showing the Disclaimer row', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/morphine-wean');

    const banner = page.getByRole('region', { name: /clinical use disclaimer/i });
    await expect(banner).toBeVisible();

    await banner.getByRole('button', { name: /^more$/i }).click();

    // AboutSheet is a bits-ui Dialog labelled by 'about-title'. The Disclaimer row
    // is rendered as an <h3> with id 'about-disclaimer-heading'.
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { name: /disclaimer/i })).toBeVisible();
    await expect(sheet).toContainText(/does not replace clinical judgment/i);
  });

  test('keyboard activation: focus dismiss button + Enter dismisses', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/morphine-wean');

    const banner = page.getByRole('region', { name: /clinical use disclaimer/i });
    await expect(banner).toBeVisible();

    const dismiss = page.getByRole('button', { name: /dismiss disclaimer/i });
    await dismiss.focus();
    await page.keyboard.press('Enter');

    await expect(banner).toHaveCount(0);
    const v2 = await page.evaluate((k) => localStorage.getItem(k), KEY_V2);
    expect(v2).toBe('true');
  });
});
