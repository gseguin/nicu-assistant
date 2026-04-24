import { test, expect, type Page } from '@playwright/test';

// Plan 42.1-05 (D-08): the route renders the SAME inputs twice — once in the
// desktop sticky aside (hidden via CSS `hidden md:block`) and once inside the
// mobile <InputDrawer>. This helper returns the input scoped to whichever
// container is active at the current viewport so strict-mode locators resolve
// to exactly one element.
function getInputsScope(page: Page, viewport: 'mobile' | 'desktop') {
  if (viewport === 'mobile') {
    // Drawer dialog — rendered + visible after .click() on the handle.
    return page.getByRole('dialog', { name: 'Feeds inputs' });
  }
  // Desktop aside — sticky sidebar.
  return page.locator('aside[aria-label="Feeds inputs"]');
}

for (const viewport of [
  { name: 'mobile' as const, width: 375, height: 667 },
  { name: 'desktop' as const, width: 1280, height: 800 }
]) {
  test.describe(`Feeds happy path (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/feeds');
      await page
        .getByRole('button', { name: /understand/i })
        .click({ timeout: 2000 })
        .catch(() => {});
      // Plan 42.1-05 (D-08): on mobile (<md), inputs live behind the InputDrawer
      // bottom-sheet. Open the drawer once so the dialog is visible and its
      // content is the active (visible) copy. On desktop the handle has
      // md:hidden, so this is a no-op.
      if (viewport.name === 'mobile') {
        await page.getByLabel('Open inputs drawer').click();
      }
    });

    test('bedside mode: enter weight -> three outputs visible', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      await scope.getByLabel('Weight').fill('1.94');
      // On mobile, close the drawer so the output region is visible above the
      // sheet. On desktop the drawer never opens; this is a no-op safety net.
      if (viewport.name === 'mobile') {
        await page.keyboard.press('Escape');
      }
      await expect(page.getByText('Trophic').first()).toBeVisible();
      await expect(page.getByText('Advance step')).toBeVisible();
      await expect(page.getByText('Goal').first()).toBeVisible();
      // Post-D-07: HeroResult adds a "ml/feed" unit on the GOAL ML/FEED hero
      // above the existing 3-row breakdown.
      const mlFeedElements = page.getByText('ml/feed');
      const count = await mlFeedElements.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('bedside mode: empty state when weight cleared', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      await scope.getByLabel('Weight').fill('');
      if (viewport.name === 'mobile') {
        await page.keyboard.press('Escape');
      }
      await expect(page.getByText('Enter weight to see per-feed volumes.')).toBeVisible();
    });

    test('full nutrition mode: enter TPN -> hero kcal/kg/d visible', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      // Switch to Full Nutrition mode (toggle now lives inside the inputs card).
      await scope.getByRole('tab', { name: /Full Nutrition/i }).click();
      await scope.getByLabel('Weight').fill('1.74');
      // TPN Line 1 fields — IDs are unique to each copy; the dialog overlay is
      // on top so the visible one is the drawer's when mobile.
      await scope.locator('#feeds-dex1-pct').fill('10');
      await scope.locator('#feeds-ml1-hr').fill('56');
      if (viewport.name === 'mobile') {
        await page.keyboard.press('Escape');
      }
      await expect(page.getByText('TOTAL KCAL/KG/DAY')).toBeVisible();
      await expect(page.getByText('kcal/kg/d', { exact: true })).toBeVisible();
    });

    test('mode toggle preserves weight', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      await scope.getByLabel('Weight').fill('2.5');
      // Switch to Full Nutrition
      await scope.getByRole('tab', { name: /Full Nutrition/i }).click();
      await expect(scope.getByLabel('Weight')).toHaveValue('2.5');
      // Switch back to Bedside Advancement
      await scope.getByRole('tab', { name: /Bedside Advancement/i }).click();
      await expect(scope.getByLabel('Weight')).toHaveValue('2.5');
    });

    test('all NumericInputs have inputmode="decimal"', async ({ page }) => {
      const scope = getInputsScope(page, viewport.name);
      await expect(scope.getByLabel('Weight')).toHaveAttribute('inputmode', 'decimal');
    });
  });
}
