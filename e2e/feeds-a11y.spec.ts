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

  test('feeds bedside light mode - no axe violations', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    });

    await page.getByLabel('Weight').fill('1.94');
    await expect(page.getByText('Trophic').first()).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('feeds bedside dark mode - no axe violations', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('no-transition');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(250);

    await page.getByLabel('Weight').fill('1.94');
    await expect(page.getByText('Trophic').first()).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('feeds full-nutrition light mode - no axe violations', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    });

    await page.getByRole('tab', { name: /Full Nutrition/i }).click();
    await page.getByLabel('Weight').fill('1.74');
    await page.locator('#feeds-dex1-pct').fill('10');
    await page.locator('#feeds-ml1-hr').fill('56');
    await expect(page.getByText('TOTAL KCAL/KG/DAY')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('feeds full-nutrition dark mode - no axe violations', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('no-transition');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(250);

    await page.getByRole('tab', { name: /Full Nutrition/i }).click();
    await page.getByLabel('Weight').fill('1.74');
    await page.locator('#feeds-dex1-pct').fill('10');
    await page.locator('#feeds-ml1-hr').fill('56');
    await expect(page.getByText('TOTAL KCAL/KG/DAY')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('feeds with focus ring visible - no axe violations', async ({ page }) => {
    await page.getByLabel('Weight').fill('1.94');
    await expect(page.getByText('Trophic').first()).toBeVisible();

    // Render the identity focus ring so axe can see it
    await page.getByLabel('Weight').focus();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('feeds bedside with advisory rendered - no axe violations', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    });

    // Weight below 500g triggers ELBW advisory
    await page.getByLabel('Weight').fill('0.4');
    await expect(page.getByText(/Weight below 500 g/)).toBeVisible();

    await page.addStyleTag({
      content: '*, *::before, *::after { transition: none !important; animation: none !important; }'
    });
    await page.waitForTimeout(250);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
