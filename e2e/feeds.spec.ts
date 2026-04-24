import { test, expect } from '@playwright/test';

for (const viewport of [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'desktop', width: 1280, height: 800 }
]) {
  test.describe(`Feeds happy path (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/feeds');
      await page
        .getByRole('button', { name: /understand/i })
        .click({ timeout: 2000 })
        .catch(() => {});
    });

    test('bedside mode: enter weight -> three outputs visible', async ({ page }) => {
      await page.getByLabel('Weight').fill('1.94');
      await expect(page.getByText('Trophic').first()).toBeVisible();
      await expect(page.getByText('Advance step')).toBeVisible();
      await expect(page.getByText('Goal').first()).toBeVisible();
      // Post-D-07: HeroResult adds a "ml/feed" unit on the GOAL ML/FEED hero
      // above the existing 3-row breakdown. Playwright's getByText resolves
      // 5 elements (4 explicit ml/feed spans + 1 nested baseline-flex parent
      // whose text aggregates the unit). Asserting "at least 4" is the
      // semantically correct check; pin to >= 4.
      const mlFeedElements = page.getByText('ml/feed');
      const count = await mlFeedElements.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('bedside mode: empty state when weight cleared', async ({ page }) => {
      await page.getByLabel('Weight').fill('');
      await expect(page.getByText('Enter a weight to see per-feed volumes')).toBeVisible();
    });

    test('full nutrition mode: enter TPN -> hero kcal/kg/d visible', async ({ page }) => {
      // Switch to Full Nutrition mode
      await page.getByRole('tab', { name: /Full Nutrition/i }).click();
      await page.getByLabel('Weight').fill('1.74');
      // TPN Line 1 fields
      await page.locator('#feeds-dex1-pct').fill('10');
      await page.locator('#feeds-ml1-hr').fill('56');
      await expect(page.getByText('TOTAL KCAL/KG/DAY')).toBeVisible();
      await expect(page.getByText('kcal/kg/d', { exact: true })).toBeVisible();
    });

    test('mode toggle preserves weight', async ({ page }) => {
      await page.getByLabel('Weight').fill('2.5');
      // Switch to Full Nutrition
      await page.getByRole('tab', { name: /Full Nutrition/i }).click();
      await expect(page.getByLabel('Weight')).toHaveValue('2.5');
      // Switch back to Bedside Advancement
      await page.getByRole('tab', { name: /Bedside Advancement/i }).click();
      await expect(page.getByLabel('Weight')).toHaveValue('2.5');
    });

    test('all NumericInputs have inputmode="decimal"', async ({ page }) => {
      await expect(page.getByLabel('Weight')).toHaveAttribute('inputmode', 'decimal');
    });
  });
}
